/**
 * Hook del sistema **Battle Pass**: gestiona temporadas, niveles, misiones,
 * racha (streak) y desbloqueos del usuario. Centraliza la lectura/escritura
 * en Supabase usando TanStack Query e invalidación de caché.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todayCDMX } from "@/lib/date-utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { useAppState } from "../lib/storage";

/**
 * Temporada activa del Battle Pass (rango de fechas + identificador).
 */
export type Season = {
  id: string;
  name: string;
  objective: string;
  focus: string;
  emoji: string;
  starts_on: string;
  ends_on: string;
  active: boolean;
  motivational_messages: string[];
};

/**
 * Nivel del Battle Pass con su umbral de XP y recompensas.
 */
export type BPLevel = {
  id: string;
  season_id: string;
  level: number;
  xp_required: number;
  reward_text: string;
  reward_emoji: string;
  reward_id: string | null;
};

/**
 * Misión del Battle Pass (diaria, semanal o de temporada).
 */
export type BPMission = {
  id: string;
  season_id: string;
  title: string;
  description: string;
  emoji: string;
  mission_type: "daily" | "secondary" | "challenge";
  xp: number;
  target: number;
  active: boolean;
};

/**
 * Misión del Battle Pass (diaria, semanal o de temporada).
 */
export type BPMissionProgress = {
  id: string;
  mission_id: string;
  period_key: string;
  progress: number;
  claimed: boolean;
};

/**
 * Registro de un nivel/recompensa desbloqueada por el usuario.
 */
export type BPUnlock = {
  id: string;
  season_id: string;
  level: number;
  unlocked_at: string;
  redemption_id: string | null;
};

/**
 * Racha del usuario: días consecutivos cumpliendo misiones.
 */
export type BPStreak = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

type BPData = {
  seasons: Season[];
  levels: BPLevel[];
  missions: BPMission[];
  progress: BPMissionProgress[];
  unlocks: BPUnlock[];
  streak: BPStreak | null;
};

const todayKey = () => todayCDMX();
const periodKey = (m: BPMission) => (m.mission_type === "daily" ? todayKey() : "season");

async function fetchBattlePass(userId: string): Promise<BPData> {
  const { data: s } = await supabase
    .from("battle_pass_seasons")
    .select("*")
    .order("starts_on", { ascending: false });
  const seasons = (s ?? []) as Season[];
  const active = seasons.find((x) => x.active) ?? seasons[0];
  if (!active) {
    return { seasons, levels: [], missions: [], progress: [], unlocks: [], streak: null };
  }
  const [lvR, mR, pR, uR, stR] = await Promise.all([
    supabase.from("battle_pass_levels").select("*").eq("season_id", active.id).order("level"),
    supabase.from("battle_pass_missions").select("*").eq("season_id", active.id).eq("active", true),
    supabase.from("battle_pass_mission_progress").select("*").eq("user_id", userId),
    supabase.from("battle_pass_unlocks").select("*").eq("user_id", userId).eq("season_id", active.id),
    supabase.from("battle_pass_streaks").select("*").eq("user_id", userId).eq("season_id", active.id).maybeSingle(),
  ]);
  return {
    seasons,
    levels: (lvR.data ?? []) as BPLevel[],
    missions: (mR.data ?? []) as BPMission[],
    progress: (pR.data ?? []) as BPMissionProgress[],
    unlocks: (uR.data ?? []) as BPUnlock[],
    streak: stR.data
      ? { current_streak: stR.data.current_streak, longest_streak: stR.data.longest_streak, last_active_date: stR.data.last_active_date }
      : { current_streak: 0, longest_streak: 0, last_active_date: null },
  };
}

const EMPTY: BPData = { seasons: [], levels: [], missions: [], progress: [], unlocks: [], streak: null };

/**
 * Hook principal del Battle Pass. Devuelve temporada, niveles,
 * misiones, progreso, racha y mutaciones para reclamar recompensas
 * y actualizar progreso.
 */
export function useBattlePass() {
  const { user } = useAuth();
  const { state, addBonusXp } = useAppState();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data = EMPTY, isLoading } = useQuery({
    queryKey: ["battle-pass", userId],
    queryFn: () => fetchBattlePass(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { seasons, levels, missions, progress, unlocks, streak } = data;
  const loading = isLoading;

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ["battle-pass", userId] }),
    [qc, userId],
  );

  const activeSeason = useMemo(() => seasons.find((s) => s.active) ?? seasons[0] ?? null, [seasons]);

  // XP de la temporada = XP global ganado desde el inicio (simple: usamos XP global actual menos snapshot al unirse).
  // MVP: usamos XP global directo. El Battle Pass "lee" el XP global.
  const seasonXp = state.xp;

  const sortedLevels = useMemo(() => [...levels].sort((a, b) => a.level - b.level), [levels]);
  const currentLevel = useMemo(() => {
    let lvl = 0;
    for (const l of sortedLevels) if (seasonXp >= l.xp_required) lvl = l.level;
    return lvl;
  }, [sortedLevels, seasonXp]);
  const nextLevel = useMemo(() => sortedLevels.find((l) => l.level > currentLevel) ?? null, [sortedLevels, currentLevel]);
  const prevXp = useMemo(() => {
    const cur = sortedLevels.find((l) => l.level === currentLevel);
    return cur?.xp_required ?? 0;
  }, [sortedLevels, currentLevel]);
  const progressPct = useMemo(() => {
    if (!nextLevel) return 1;
    const span = nextLevel.xp_required - prevXp;
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, (seasonXp - prevXp) / span));
  }, [nextLevel, prevXp, seasonXp]);

  const motivational = useMemo(() => {
    const list = activeSeason?.motivational_messages ?? [];
    if (list.length === 0) return "¡Sigue así!";
    const idx = (currentLevel + new Date().getDate()) % list.length;
    return list[idx] ?? list[0];
  }, [activeSeason, currentLevel]);

  // Misiones con progreso
  const missionsWithProgress = useMemo(() => {
    return missions.map((m) => {
      const pk = periodKey(m);
      const row = progress.find((p) => p.mission_id === m.id && p.period_key === pk);
      return {
        mission: m,
        progress: row?.progress ?? 0,
        claimed: row?.claimed ?? false,
        completed: (row?.progress ?? 0) >= m.target,
        period_key: pk,
      };
    });
  }, [missions, progress]);

  const bumpStreak = useCallback(async () => {
    if (!userId || !activeSeason) return;
    const today = todayKey();
    if (streak?.last_active_date === today) return;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    const newCurrent = streak?.last_active_date === yKey ? (streak.current_streak + 1) : 1;
    const newLongest = Math.max(newCurrent, streak?.longest_streak ?? 0);
    await supabase.from("battle_pass_streaks").upsert({
      user_id: userId, season_id: activeSeason.id,
      current_streak: newCurrent, longest_streak: newLongest, last_active_date: today,
    }, { onConflict: "user_id,season_id" });
    await invalidate();
    if (newCurrent > 0 && newCurrent % 7 === 0) {
      addBonusXp(50);
      toast(`🔥 ¡Racha de ${newCurrent} días!`, { description: "+50 XP de bonus" });
    }
  }, [userId, activeSeason, streak, addBonusXp, invalidate]);

  const incrementMission = useCallback(async (missionId: string) => {
    if (!userId) return;
    const m = missions.find((x) => x.id === missionId);
    if (!m) return;
    const pk = periodKey(m);
    const row = progress.find((p) => p.mission_id === m.id && p.period_key === pk);
    const next = Math.min(m.target, (row?.progress ?? 0) + 1);
    await supabase
      .from("battle_pass_mission_progress")
      .upsert({ user_id: userId, mission_id: m.id, period_key: pk, progress: next, claimed: row?.claimed ?? false }, { onConflict: "user_id,mission_id,period_key" });
    await invalidate();
    if (next >= m.target && activeSeason) {
      await bumpStreak();
    }
  }, [userId, missions, progress, activeSeason, invalidate, bumpStreak]);

  const claimMission = useCallback(async (missionId: string) => {
    if (!userId) return;
    const entry = missionsWithProgress.find((m) => m.mission.id === missionId);
    if (!entry || !entry.completed || entry.claimed) return;
    await supabase
      .from("battle_pass_mission_progress")
      .upsert({ user_id: userId, mission_id: missionId, period_key: entry.period_key, progress: entry.progress, claimed: true }, { onConflict: "user_id,mission_id,period_key" });
    await invalidate();
    addBonusXp(entry.mission.xp);
    toast(`🎯 ${entry.mission.title}`, { description: `+${entry.mission.xp} XP` });
  }, [userId, missionsWithProgress, addBonusXp, invalidate]);

  const claimLevel = useCallback(async (level: BPLevel) => {
    if (!userId || !activeSeason) return;
    if (seasonXp < level.xp_required) return;
    if (unlocks.some((u) => u.level === level.level)) return;

    let redemptionId: string | null = null;
    if (level.reward_id) {
      const { data: r } = await supabase.from("rewards_shop").select("*").eq("id", level.reward_id).maybeSingle();
      if (r) {
        const { data: red } = await supabase.from("reward_redemptions").insert({
          user_id: userId, reward_id: r.id, reward_name: r.name, reward_emoji: r.emoji,
          cost: 0, xp_at_unlock: seasonXp, notes: `Battle Pass nivel ${level.level}`,
        }).select().single();
        redemptionId = red?.id ?? null;
      }
    }
    await supabase.from("battle_pass_unlocks").insert({
      user_id: userId, season_id: activeSeason.id, level: level.level, redemption_id: redemptionId,
    });
    await invalidate();
    toast(`🎖️ ¡Nivel ${level.level} desbloqueado!`, { description: `${level.reward_emoji} ${level.reward_text}` });
  }, [userId, activeSeason, seasonXp, unlocks, invalidate]);

  return {
    loading,
    seasons,
    activeSeason,
    levels: sortedLevels,
    currentLevel,
    nextLevel,
    progressPct,
    seasonXp,
    motivational,
    missions: missionsWithProgress,
    unlocks,
    streak,
    incrementMission,
    claimMission,
    claimLevel,
    refetch: invalidate,
  };
}
