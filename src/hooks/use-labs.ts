/**
 * Hook de **Análisis de Laboratorio**: doctores, resultados, marcadores y
 * objetivos de salud asociados. Carga paralela con TanStack Query.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { calculateLabStatus, type LabStudy, type LabResult, type LabIndicator } from "../lib/lab-types";

/**
 * Objetivo de salud personalizado vinculado a marcadores de laboratorio.
 */
export interface HealthGoal {
  id: string;
  user_id: string;
  indicator_name: string;
  target_value: number;
  start_value: number | null;
  current_value: number | null;
  unit: string | null;
  target_type: "min" | "max";
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

/**
 * Devuelve doctores, resultados, marcadores y objetivos + mutaciones CRUD.
 */
export function useLabs() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["labs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [s, r, i, g] = await Promise.all([
        supabase.from("lab_studies").select("*").eq("user_id", userId!).order("date", { ascending: false }),
        supabase.from("lab_results").select("*").eq("user_id", userId!),
        supabase.from("lab_indicators").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("health_goals").select("*").eq("user_id", userId!).eq("status", "active"),
      ]);
      return {
        studies: (s.data ?? []) as LabStudy[],
        results: (r.data ?? []) as LabResult[],
        indicators: (i.data ?? []) as LabIndicator[],
        goals: (g.data ?? []) as HealthGoal[],
      };
    },
  });

  const studies = data?.studies ?? [];
  const results = data?.results ?? [];
  const indicators = data?.indicators ?? [];
  const goals = data?.goals ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["labs"] });
  }, [qc]);

  const addGoal = useCallback(async (goal: Omit<HealthGoal, "id" | "user_id" | "created_at" | "updated_at" | "status">) => {
    if (!user) return { error: new Error("No user") };
    const { error } = await supabase.from("health_goals").insert({ ...goal, user_id: user.id });
    if (!error) await refresh();
    return { error };
  }, [user, refresh]);

  const deleteGoal = useCallback(async (goalId: string) => {
    const { error } = await supabase.from("health_goals").delete().eq("id", goalId);
    if (!error) await refresh();
    return { error };
  }, [refresh]);

  const createStudy = useCallback(async (
    study: Omit<LabStudy, "id" | "user_id" | "created_at" | "updated_at">,
    items: Array<Omit<LabResult, "id" | "study_id" | "user_id" | "created_at" | "updated_at">>
  ) => {
    if (!user) return { error: new Error("No user") };
    
    const { data: created, error } = await supabase
      .from("lab_studies")
      .insert({ ...study, user_id: user.id } as any)
      .select()
      .single();
      
    if (error || !created) return { error };
    
    const rows = items
      .filter((i) => i.indicator_name)
      .map((i) => ({ ...i, study_id: created.id, user_id: user.id }));
      
    if (rows.length > 0) {
      const { error: rErr } = await supabase.from("lab_results").insert(rows as any[]);
      if (rErr) return { error: rErr };
    }
    
    await refresh();
    return { error: null, study: created };
  }, [user, refresh]);

  const addResult = useCallback(async (
    result: any,
    refType: "rango" | "menor_que" | "mayor_que"
  ) => {
    if (!user) return { error: new Error("No user") };
    
    const status = calculateLabStatus(result.value, refType, result.ref_min, result.ref_max);
    
    const { error } = await supabase.from("lab_results").insert({
      ...result,
      status,
      user_id: user.id,
    } as any);
    
    if (!error) await refresh();
    return { error };
  }, [user, refresh]);

  const deleteStudy = useCallback(async (id: string) => {
    const { error } = await supabase.from("lab_studies").delete().eq("id", id);
    if (!error) await refresh();
    return { error };
  }, [refresh]);

  const deleteResult = useCallback(async (id: string) => {
    const { error } = await supabase.from("lab_results").delete().eq("id", id);
    if (!error) await refresh();
    return { error };
  }, [refresh]);

  const bulkImport = useCallback(async (data: { fecha_estudio: string; laboratorio: string; resultados: any[] }) => {
    if (!user) return { error: new Error("No user") };
    
    // 1. Create the study
    const { data: study, error: sErr } = await supabase
      .from("lab_studies")
      .insert({
        user_id: user.id,
        date: data.fecha_estudio,
        lab_name: data.laboratorio,
      } as any)
      .select()
      .single();

    if (sErr || !study) return { error: sErr };

    // 2. Prepare results mapping with synonyms support
    const indicatorNamesMap = new Map(indicators.map(i => [i.name.toLowerCase(), i]));
    
    // Common synonyms/aliases for indicator mapping
    const synonyms: Record<string, string> = {
      "glucosa": "glucosa",
      "hdl": "colesterol hdl",
      "colesterol hdl": "colesterol hdl",
      "ldl": "colesterol ldl directo",
      "colesterol ldl": "colesterol ldl directo",
      "triglicéridos": "triglicéridos",
      "tfg estimada": "tfge",
      "tfge": "tfge",
      "pcr ultrasensible": "proteína c reactiva ultrasensible",
      "hemoglobina glicosilada a1c": "hemoglobina glicosilada (hba1c)",
      "hba1c": "hemoglobina glicosilada (hba1c)",
      "ast (tgo)": "ast (tgo)",
      "alt (tgp)": "alt (tgp)",
      "tsh": "tsh",
      "t4 libre": "t4 libre",
      "vitamina d": "vitamina d",
      "colesterol total": "colesterol total",
      "colesterol no hdl": "colesterol no-hdl",
      "índice aterogénico": "índice aterogénico",
    };

    const resultsToInsert = data.resultados.map(res => {
      // Support both "indicador" and "prueba" fields from common JSON formats
      const rawName = (res.indicador || res.prueba || "").toLowerCase().trim();
      const mappedName = synonyms[rawName] || rawName;
      
      const indicator = indicatorNamesMap.get(mappedName);
      if (!indicator) {
        console.warn(`No indicator found for: ${rawName} (mapped as: ${mappedName})`);
        return null;
      }

      const status = calculateLabStatus(res.valor, indicator.ref_type as any, indicator.ref_min, indicator.ref_max);

      return {
        study_id: study.id,
        user_id: user.id,
        indicator_id: indicator.id,
        indicator_key: indicator.name.toLowerCase().replace(/\s+/g, '_'),
        indicator_name: indicator.name,
        category: indicator.category,
        value: Number(res.valor),
        unit: indicator.unit,
        ref_min: indicator.ref_min,
        ref_max: indicator.ref_max,
        result_date: data.fecha_estudio,
        status: status,
      };
    }).filter(Boolean);

    if (resultsToInsert.length > 0) {
      const { error: rErr } = await supabase.from("lab_results").insert(resultsToInsert as any[]);
      if (rErr) return { error: rErr };
    }

    await refresh();
    return { error: null };
  }, [user, indicators, refresh]);

  // Data mapping for dashboard
  const indicatorMap = useMemo(() => {
    const byStudy = new Map(studies.map((s) => [s.id, s]));
    const map = new Map<string, { 
      id: string | null;
      name: string; 
      unit: string | null; 
      category: string | null; 
      ref_min: number | null; 
      ref_max: number | null; 
      ref_type: string;
      ref_display: string | null;
      description?: string;
      high_causes?: string;
      low_causes?: string;
      control_tips?: string;
      doctor_advice?: string;
      points: Array<{ date: string; value: number | null; result: LabResult }> 
    }>();

    for (const r of results) {
      const date = r.study_id ? byStudy.get(r.study_id)?.date : (r as any).result_date;
      if (!date) continue;
      
      const key = r.indicator_id || r.indicator_key;
      const existing = map.get(key);
      const meta = indicators.find(i => i.id === r.indicator_id);
      
      if (existing) {
        existing.points.push({ date, value: r.value, result: r });
      } else {
        map.set(key, {
          id: r.indicator_id,
          name: r.indicator_name,
          unit: r.unit,
          category: r.category,
          ref_min: r.ref_min,
          ref_max: r.ref_max,
          ref_type: meta?.ref_type || "rango",
          ref_display: meta?.ref_display || null,
          description: meta?.description,
          high_causes: meta?.high_causes,
          low_causes: meta?.low_causes,
          control_tips: meta?.control_tips,
          doctor_advice: meta?.doctor_advice,
          points: [{ date, value: r.value, result: r }],
        });
      }
    }

    for (const v of map.values()) {
      v.points.sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return map;
  }, [studies, results]);

  const stats = useMemo(() => {
    const latestResults = Array.from(indicatorMap.values()).map(v => v.points[v.points.length - 1].result);
    return {
      bajo: latestResults.filter(r => r.status === "bajo").length,
      dentro: latestResults.filter(r => r.status === "dentro").length,
      alto: latestResults.filter(r => r.status === "alto").length,
      total: latestResults.length
    };
  }, [indicatorMap]);

  return {
    loading,
    studies,
    results,
    indicators,
    indicatorMap,
    goals,
    stats,
    refresh,
    createStudy,
    addResult,
    deleteStudy,
    deleteResult,
    bulkImport,
    addGoal,
    deleteGoal,
  };
}
