/**
 * Hook del módulo **Identidad Personal**: valores, principios y rasgos
 * que definen al usuario. Calcula un score con desglose por dimensión.
 */
import { useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/storage";
import { useHealth } from "@/hooks/use-health";
import { todayCDMX } from "@/lib/date-utils";
import {
  type IdentityProfile,
  type IdentityArea,
  type IdentityAreaScore,
  type IdentityJournalEntry,
  type IdentityWeeklyReflection,
  type IdentityScoreBreakdown,
  type IdentityScoreSnapshot,
  IDENTITY_AREAS,
  SCORE_WEIGHTS,
  currentMonthKey,
  currentWeekKey,
} from "../lib/identity-types";

/**
 * Devuelve valores, principios, rasgos y un breakdown de score
 * (memoizado) además de mutaciones CRUD.
 */
export function useIdentity() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;
  const { state } = useAppState();
  const { medications, medLogs, body } = useHealth();

  const { data, isLoading } = useQuery({
    queryKey: ["identity", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [p, a, j, r, s] = await Promise.all([
        supabase.from("identity_profile").select("*").eq("user_id", userId!).maybeSingle(),
        supabase.from("identity_areas").select("*").eq("user_id", userId!).order("month", { ascending: false }),
        supabase.from("identity_journal").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(200),
        supabase.from("identity_weekly_reflection").select("*").eq("user_id", userId!).order("week_key", { ascending: false }).limit(20),
        supabase.from("identity_score_snapshots").select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(60),
      ]);
      return {
        profile: (p.data ?? null) as unknown as IdentityProfile | null,
        areas: (a.data ?? []) as unknown as IdentityAreaScore[],
        journal: (j.data ?? []) as unknown as IdentityJournalEntry[],
        reflections: (r.data ?? []) as unknown as IdentityWeeklyReflection[],
        snapshots: (s.data ?? []) as unknown as IdentityScoreSnapshot[],
      };
    },
  });

  const profile = data?.profile ?? null;
  const areas = data?.areas ?? [];
  const journal = data?.journal ?? [];
  const reflections = data?.reflections ?? [];
  const snapshots = data?.snapshots ?? [];
  const loading = isLoading;

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["identity", userId] });
  }, [qc, userId]);

  // ===== PROFILE =====
  const saveProfile = async (input: Partial<Omit<IdentityProfile, "id" | "user_id">>) => {
    if (!user) return;
    if (profile) {
      const { error } = await supabase.from("identity_profile").update(input).eq("id", profile.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("identity_profile").insert({
      user_id: user.id,
      desired_identity: input.desired_identity ?? "",
      core_values: input.core_values ?? [],
      active_areas: input.active_areas ?? IDENTITY_AREAS.map((a) => a.id),
    });
    if (!error) await refresh();
    return error;
  };

  // ===== WHEEL =====
  const setAreaScore = async (area: IdentityArea, score: number, month?: string, notes?: string) => {
    if (!user) return;
    const m = month ?? currentMonthKey();
    const existing = areas.find((x) => x.area === area && x.month === m);
    if (existing) {
      const { error } = await supabase.from("identity_areas").update({ score, notes: notes ?? existing.notes }).eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("identity_areas").insert({ user_id: user.id, area, score, month: m, notes: notes ?? "" });
    if (!error) await refresh();
    return error;
  };

  const currentWheel = useMemo(() => {
    const m = currentMonthKey();
    return IDENTITY_AREAS.map((def) => {
      const found = areas.find((a) => a.area === def.id && a.month === m);
      return { ...def, score: found?.score ?? 0, notes: found?.notes ?? "" };
    });
  }, [areas]);

  const wheelHistory = useMemo(() => {
    const months = Array.from(new Set(areas.map((a) => a.month))).sort().slice(-6);
    return months.map((m) => {
      const monthAreas = IDENTITY_AREAS.map((def) => {
        const found = areas.find((a) => a.area === def.id && a.month === m);
        return { area: def.id, label: def.label, score: found?.score ?? 0 };
      });
      const avg = monthAreas.reduce((s, a) => s + a.score, 0) / monthAreas.length;
      return { month: m, areas: monthAreas, avg };
    });
  }, [areas]);

  // ===== JOURNAL =====
  const upsertJournal = async (input: Partial<Omit<IdentityJournalEntry, "id" | "user_id">> & { date: string }) => {
    if (!user) return;
    const existing = journal.find((j) => j.date === input.date);
    if (existing) {
      const { error } = await supabase.from("identity_journal").update(input).eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("identity_journal").insert({
      user_id: user.id,
      date: input.date,
      did_well: input.did_well ?? "",
      did_not_well: input.did_not_well ?? "",
      learned: input.learned ?? "",
      energy: input.energy ?? null,
      emotion: input.emotion ?? "",
      alignment: input.alignment ?? 5,
      insight: input.insight ?? "",
    });
    if (!error) await refresh();
    return error;
  };

  const deleteJournal = async (id: string) => {
    const { error } = await supabase.from("identity_journal").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const todayJournal = useMemo(() => journal.find((j) => j.date === todayCDMX()) ?? null, [journal]);

  // ===== SCORE =====
  const computeScore = useCallback((): { total: number; breakdown: IdentityScoreBreakdown } => {
    const today = todayCDMX();

    const habitsTotal = state.habits.length;
    const habitsDone = state.habits.filter((h) => h.lastCompleted === today).length;
    const habitsScore = habitsTotal === 0 ? 50 : Math.round((habitsDone / habitsTotal) * 100);

    const activeMeds = medications.filter((m) => m.active);
    const todayLogs = medLogs.filter((l) => l.date === today && l.taken);
    const expectedDoses = activeMeds.reduce((s, m) => s + (m.times_per_day || 1), 0);
    const adherence = expectedDoses === 0 ? 70 : Math.min(100, Math.round((todayLogs.length / expectedDoses) * 100));
    const recentBody = body[0] ? 30 : 0;
    const healthScore = Math.min(100, Math.round(adherence * 0.7 + recentBody));

    const fin = state.finance;
    let financeScore = 50;
    if (fin) {
      const utilOk = fin.maxUtilization < 0.3 ? 100 : fin.maxUtilization < 0.7 ? 60 : 20;
      const budgetOk = fin.budgetsTotal === 0 ? 60 : Math.round((fin.budgetsOnTrack / fin.budgetsTotal) * 100);
      financeScore = Math.round(utilOk * 0.5 + budgetOk * 0.5);
    }

    const last7 = journal.slice(0, 7);
    const journalScore = last7.length === 0 ? 50 : Math.round((last7.reduce((s, j) => s + j.alignment, 0) / last7.length) * 10);

    const wheelAvg = currentWheel.reduce((s, a) => s + a.score, 0) / currentWheel.length;
    const wheelScore = Math.round(wheelAvg * 10);

    const breakdown: IdentityScoreBreakdown = {
      habits: habitsScore,
      health: healthScore,
      finance: financeScore,
      journal: journalScore,
      wheel: wheelScore,
    };

    const total = Math.round(
      breakdown.habits * SCORE_WEIGHTS.habits +
      breakdown.health * SCORE_WEIGHTS.health +
      breakdown.finance * SCORE_WEIGHTS.finance +
      breakdown.journal * SCORE_WEIGHTS.journal +
      breakdown.wheel * SCORE_WEIGHTS.wheel,
    );

    return { total, breakdown };
  }, [state, medications, medLogs, body, journal, currentWheel]);

  const score = useMemo(() => computeScore(), [computeScore]);

  // Persistir snapshot diario
  useEffect(() => {
    if (!user || loading) return;
    const today = todayCDMX();
    const existing = snapshots.find((s) => s.date === today);
    if (existing && existing.score === score.total) return;
    const persist = async () => {
      if (existing) {
        await supabase.from("identity_score_snapshots").update({ score: score.total, breakdown: score.breakdown as never }).eq("id", existing.id);
      } else {
        await supabase.from("identity_score_snapshots").insert({ user_id: user.id, date: today, score: score.total, breakdown: score.breakdown as never });
      }
    };
    const t = setTimeout(persist, 1500);
    return () => clearTimeout(t);
  }, [user, loading, score, snapshots]);

  // ===== MIRROR (mensajes de alineación) =====
  const mirror = useMemo(() => {
    const messages: { type: "warning" | "success" | "info"; text: string }[] = [];
    const today = todayCDMX();

    if (state.habits.length > 0) {
      const done = state.habits.filter((h) => h.lastCompleted === today).length;
      if (done === 0) messages.push({ type: "warning", text: "Aún no has completado ningún hábito hoy. ¿Es eso lo que tu identidad pide?" });
      else if (done === state.habits.length) messages.push({ type: "success", text: "Completaste todos tus hábitos hoy. Estás siendo coherente." });
    }

    if (todayJournal) {
      if (todayJournal.alignment >= 8) messages.push({ type: "success", text: `Tu alineación de hoy es ${todayJournal.alignment}/10. Vas por buen camino.` });
      else if (todayJournal.alignment <= 4) messages.push({ type: "warning", text: `Tu alineación de hoy es ${todayJournal.alignment}/10. ¿Qué te está alejando?` });
    } else {
      messages.push({ type: "info", text: "No has escrito tu diario hoy. La reflexión es parte de la persona que quieres ser." });
    }

    if (state.finance && state.finance.maxUtilization > 0.7) {
      messages.push({ type: "warning", text: "Tu utilización de crédito está alta. ¿Esto está alineado con tu yo financieramente sano?" });
    }

    const wheelLow = currentWheel.filter((a) => a.score > 0 && a.score <= 4);
    if (wheelLow.length > 0) {
      messages.push({ type: "warning", text: `Áreas con baja calificación: ${wheelLow.map((a) => a.label).join(", ")}. Necesitan atención.` });
    }

    return messages;
  }, [state, currentWheel, todayJournal]);

  // ===== WEEKLY REFLECTION =====
  const generateWeeklyReflection = async () => {
    if (!user) return { error: "no-user" };
    const weekKey = currentWeekKey();
    const last7Journal = journal.slice(0, 7);
    const snapshot = {
      week_key: weekKey,
      score: score.total,
      breakdown: score.breakdown,
      wheel: currentWheel.map((a) => ({ area: a.label, score: a.score })),
      journal_entries: last7Journal.map((j) => ({
        date: j.date,
        did_well: j.did_well,
        did_not_well: j.did_not_well,
        learned: j.learned,
        emotion: j.emotion,
        energy: j.energy,
        alignment: j.alignment,
        insight: j.insight,
      })),
      habits_completed_week: state.habits.reduce((s, h) => s + h.history.filter((d) => {
        const dd = new Date(d);
        const now = new Date();
        return now.getTime() - dd.getTime() < 7 * 86400000;
      }).length, 0),
      desired_identity: profile?.desired_identity ?? "",
      core_values: profile?.core_values ?? [],
    };

    const { data, error } = await supabase.functions.invoke("ai-identity-reflection", { body: { snapshot } });
    if (error) return { error: error.message };
    const result = data as { analysis: string; patterns: string; recommendations: string };
    const existing = reflections.find((r) => r.week_key === weekKey);
    if (existing) {
      await supabase.from("identity_weekly_reflection").update({ ...result, ai_generated: true }).eq("id", existing.id);
    } else {
      await supabase.from("identity_weekly_reflection").insert({
        user_id: user.id,
        week_key: weekKey,
        ...result,
        ai_generated: true,
      });
    }
    await refresh();
    return { error: null };
  };

  const generateMirrorFeedback = async () => {
    if (!user) return { error: "no-user", feedback: "" };
    const snapshot = {
      score: score.total,
      breakdown: score.breakdown,
      desired_identity: profile?.desired_identity ?? "",
      core_values: profile?.core_values ?? [],
      wheel: currentWheel.map((a) => ({ area: a.label, score: a.score })),
      today_journal: todayJournal,
      habits_today: state.habits.map((h) => ({ name: h.name, done: h.lastCompleted === todayCDMX() })),
    };
    const { data, error } = await supabase.functions.invoke("ai-identity-mirror", { body: { snapshot } });
    if (error) return { error: error.message, feedback: "" };
    return { error: null, feedback: (data as { feedback: string }).feedback };
  };

  return {
    profile, areas, journal, reflections, snapshots, loading,
    refresh, saveProfile,
    setAreaScore, currentWheel, wheelHistory,
    upsertJournal, deleteJournal, todayJournal,
    score, mirror,
    generateWeeklyReflection, generateMirrorFeedback,
  };
}
