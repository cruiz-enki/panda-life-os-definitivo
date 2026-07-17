/**
 * Hook de **Salud**: composición corporal, comidas, medicación, hidratación
 * y snapshots derivados que alimentan la gamificación.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todayCDMX } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/lib/auth-context";
import type {
  BodyEntry,
  Meal,
  Medication,
  MedicationLog,
  HealthSnapshot,
  WaterLog,
} from "../lib/health-types";
import type { Symptom } from "../lib/symptom-types";

function weekRange(): { startISO: string; endISO: string } {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { startISO: start.toISOString().slice(0, 10), endISO: end.toISOString().slice(0, 10) };
}

/**
 * Devuelve datos de salud, snapshot agregado y mutaciones CRUD.
 */
export function useHealth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["health", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [b, m, meds, logs, syms, water] = await Promise.all([
        supabase.from("health_body_entries").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(500),
        supabase.from("health_meals").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(1000),
        supabase.from("health_medications").select("*").eq("user_id", userId!).order("created_at"),
        supabase.from("health_medication_logs").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(2000),
        supabase.from("health_symptoms" as never).select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(2000),
        supabase.from("health_water_logs").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(365),
      ]);
      return {
        body: (b.data ?? []) as unknown as BodyEntry[],
        meals: (m.data ?? []) as unknown as Meal[],
        medications: (meds.data ?? []) as unknown as Medication[],
        medLogs: (logs.data ?? []) as unknown as MedicationLog[],
        symptoms: (syms.data ?? []) as unknown as Symptom[],
        waterLogs: (water.data ?? []) as unknown as WaterLog[],
      };
    },
  });

  const body = data?.body ?? [];
  const meals = data?.meals ?? [];
  const medications = data?.medications ?? [];
  const medLogs = data?.medLogs ?? [];
  const symptoms = data?.symptoms ?? [];
  const waterLogs = data?.waterLogs ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["health", userId] });
  }, [qc, userId]);

  // ===== BODY =====
  const upsertBodyEntry = async (input: Partial<Omit<BodyEntry, "id">> & { date: string }) => {
    if (!user) return;
    const existing = body.find((e) => e.date === input.date);
    if (existing) {
      const { error } = await supabase.from("health_body_entries").update(input).eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("health_body_entries").insert({ ...input, user_id: user.id });
    if (!error) await refresh();
    return error;
  };

  const deleteBodyEntry = async (id: string) => {
    const { error } = await supabase.from("health_body_entries").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== MEALS =====
  const createMeal = async (input: Omit<Meal, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("health_meals").insert({ ...input, user_id: user.id });
    if (!error) await refresh();
    return error;
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from("health_meals").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== MEDICATIONS =====
  const createMedication = async (input: Omit<Medication, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("health_medications").insert({ ...input, user_id: user.id } as any);
    if (!error) await refresh();
    return error;
  };

  const updateMedication = async (id: string, patch: Partial<Medication>) => {
    const { error } = await supabase.from("health_medications").update(patch as any).eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase.from("health_medications").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== MEDICATION LOGS =====
  const logMedication = async (input: Omit<MedicationLog, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("health_medication_logs").insert({ ...input, user_id: user.id });

    if (!error && input.taken) {
      const today = todayCDMX();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const med = medications.find(m => m.id === input.medication_id);
      if (med && med.last_completed_date !== today) {
        const newMedStreak = med.last_completed_date === yesterday ? (med.streak || 0) + 1 : 1;
        await supabase.from("health_medications").update({
          streak: newMedStreak,
          last_completed_date: today
        } as any).eq("id", med.id);
      }

      const { data: profile } = await supabase.from("profiles").select("health_streak, last_health_date").eq("user_id", user.id).maybeSingle();
      if (profile && profile.last_health_date !== today) {
        const newHealthStreak = profile.last_health_date === yesterday ? (profile.health_streak || 0) + 1 : 1;
        await supabase.from("profiles").update({
          health_streak: newHealthStreak,
          last_health_date: today
        } as any).eq("id", user.id);
      }
    }

    if (!error) await refresh();

    return error;
  };

  const deleteMedicationLog = async (id: string) => {
    const { error } = await supabase.from("health_medication_logs").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== SYMPTOMS =====
  const createSymptom = async (input: Omit<Symptom, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("health_symptoms" as never).insert({ ...input, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  };

  const updateSymptom = async (id: string, patch: Partial<Symptom>) => {
    const { error } = await supabase.from("health_symptoms" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const deleteSymptom = async (id: string) => {
    const { error } = await supabase.from("health_symptoms" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== WATER =====
  const logWater = async (date: string, amount: number) => {
    if (!user) return;
    const existing = waterLogs.find((w) => w.date === date);
    if (existing) {
      const { error } = await supabase
        .from("health_water_logs")
        .update({ amount_ml: amount })
        .eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase
      .from("health_water_logs")
      .insert({ date, amount_ml: amount, user_id: user.id });
    if (!error) await refresh();
    return error;
  };

  // ===== SNAPSHOT =====
  const snapshot: HealthSnapshot = useMemo(() => {
    const { startISO, endISO } = weekRange();
    const weekMeals = meals.filter((m) => m.date >= startISO && m.date < endISO);
    const todayISO = new Date().toISOString().slice(0, 10);
    const todayMeals = meals.filter((m) => m.date === todayISO);
    const todayProtein = todayMeals.reduce((acc, m) => acc + (m.protein_grams ?? 0), 0);
    const todayWater = waterLogs.find((w) => w.date === todayISO)?.amount_ml ?? 0;

    const weekLogs = medLogs.filter((l) => l.date >= startISO && l.date < endISO && l.taken);
    const activeMeds = medications.filter((m) => m.active);

    const dailyMeds = activeMeds.filter((m) => m.frequency === "daily" || m.frequency === "twice_daily");
    const expectedPerDay = dailyMeds.reduce((acc, m) => acc + Math.max(1, m.times_per_day), 0);
    const expectedWeek = expectedPerDay * 7;
    const adherence = expectedWeek > 0 ? Math.min(1, weekLogs.length / expectedWeek) : 0;

    const sortedByDate = [...body].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sortedByDate[sortedByDate.length - 1];
    let weightDelta30d: number | null = null;
    if (latest?.weight != null) {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const prior = sortedByDate.filter((e) => e.date <= cutoff && e.weight != null).pop();
      if (prior?.weight != null) weightDelta30d = latest.weight - prior.weight;
    }

    return {
      bodyEntriesCount: body.length,
      mealsCount: meals.length,
      healthyMealsThisWeek: weekMeals.filter((m) => m.classification === "saludable").length,
      junkMealsThisWeek: weekMeals.filter((m) => m.classification === "chatarra").length,
      activeMedsCount: activeMeds.length,
      medAdherenceWeekPct: adherence,
      medsTakenThisWeekCount: weekLogs.length,
      weightLatest: latest?.weight ?? null,
      weightDelta30d,
      bodyFatLatest: latest?.body_fat ?? null,
      muscleMassLatest: latest?.muscle_mass ?? null,
      proteinToday: todayProtein,
      waterToday: todayWater,
    };
  }, [body, meals, medications, medLogs, waterLogs]);

  return {
    body,
    meals,
    medications,
    medLogs,
    symptoms,
    waterLogs,
    loading: isLoading,
    snapshot,
    refresh,
    upsertBodyEntry,
    deleteBodyEntry,
    createMeal,
    deleteMeal,
    logWater,
    createMedication,
    updateMedication,
    deleteMedication,
    logMedication,
    deleteMedicationLog,
    createSymptom,
    updateSymptom,
    deleteSymptom,
  };
}
