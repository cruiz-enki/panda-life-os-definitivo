/**
 * Hook de **misiones personalizadas y tienda de premios**: el usuario
 * define sus propias quests (fijas o temporales) y premios canjeables
 * con XP o con Monedas Panda 🐼🪙.
 *
 * Incluye detección automática de misiones cumplidas (cuando son
 * `auto` con métrica conocida) y disparo de toasts al desbloquear.
 */
import { useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { useAppState } from "../lib/storage";
import { weekKey, computeQuestProgress, type Quest, type QuestKind } from "../lib/gamification";


// ===== Types =====
/**
 * Quest personalizada (semanal/mensual/única, manual o auto).
 */
export type CustomQuest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
  target: number;
  tracking: "manual" | "auto";
  metric: AutoMetric | null;
  scope: "weekly" | "monthly" | "once";
  active: boolean;
  due_date?: string | null;
};

/**
 * Misión fija personalizada (logro permanente con rareza y categoría).
 */
export type CustomFixedMission = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  emoji: string;
  xp: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "habits" | "tasks" | "notes" | "energy" | "learning" | "level" | "meta";
  metric: AutoMetric | null;
  target: number | null;
  active: boolean;
};

/**
 * Premio canjeable definido por el usuario (cuesta XP).
 */
export type Reward = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  emoji: string;
  cost: number;
  category: "treat" | "experience" | "purchase" | "time" | "other";
  active: boolean;
};

/**
 * Canje histórico de un premio.
 */
export type Redemption = {
  id: string;
  user_id: string;
  reward_id: string;
  reward_name: string;
  reward_emoji: string;
  cost: number;
  xp_at_unlock: number;
  fulfilled: boolean;
  fulfilled_at: string | null;
  notes: string | null;
  created_at: string;
};

/**
 * Métrica del estado de la app sobre la que medir progreso auto.
 */
export type AutoMetric =
  | "tasks_completed"
  | "habits_completed"
  | "notes_created"
  | "learnings_added"
  | "energy_logged"
  | "high_priority_completed";

/**
 * Etiquetas legibles para cada `AutoMetric`.
 */
export const METRIC_LABELS: Record<AutoMetric, string> = {
  tasks_completed: "Tareas completadas",
  habits_completed: "Hábitos completados",
  notes_created: "Notas creadas",
  learnings_added: "Aprendizajes añadidos",
  energy_logged: "Días de energía registrados",
  high_priority_completed: "Tareas prioritarias completadas",
};

const METRIC_TO_QUEST_KIND: Record<AutoMetric, QuestKind | null> = {
  tasks_completed: "complete_tasks",
  habits_completed: "habit_completions",
  notes_created: "add_notes",
  learnings_added: "add_learnings",
  energy_logged: "log_energy_days",
  high_priority_completed: "complete_high_priority",
};

/**
 * Calcula el progreso actual de una quest personalizada según el
 * estado de la app y su scope (semanal/mensual/única).
 */
export function computeCustomQuestProgress(
  q: CustomQuest,
  state: ReturnType<typeof useAppState>["state"],
): number {
  if (q.tracking === "manual" || !q.metric) return 0;
  const kind = METRIC_TO_QUEST_KIND[q.metric];
  if (!kind) return 0;
  const wk = weekKey();
  const fakeQuest: Quest = {
    id: q.id,
    kind,
    title: q.title,
    description: q.description,
    emoji: q.emoji,
    target: q.target,
    xp: q.xp,
  };
  // weekly: usa progreso semanal. monthly/once: usa total acumulado simplificado
  if (q.scope === "weekly") return computeQuestProgress(fakeQuest, state, wk);
  // Para monthly/once: contamos totales relevantes
  switch (q.metric) {
    case "tasks_completed":
      return state.tasks.filter((t) => t.status === "completed").length;
    case "high_priority_completed":
      return state.tasks.filter((t) => t.status === "completed" && t.priority === "high").length;
    case "habits_completed":
      return state.habits.reduce((acc, h) => acc + h.history.length, 0);
    case "notes_created":
      return state.notes.length;
    case "learnings_added":
      return state.learnings.length;
    case "energy_logged":
      return state.energy.length;
  }
}

// ===== Hook =====
/**
 * Hook principal. Devuelve quests, misiones, premios, canjes,
 * hidden defaults y tienda de monedas panda + todas las mutaciones.
 */
export function useRewardsCustom() {
  const { user } = useAuth();
  const { state, addBonusXp, addPandaCoins } = useAppState() as any;
  const userId = user?.id ?? null;

  const [customQuests, setCustomQuests] = useState<CustomQuest[]>([]);
  const [customFixedMissions, setCustomFixedMissions] = useState<CustomFixedMission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [hiddenDefaults, setHiddenDefaults] = useState<{ kind: string; default_id: string }[]>([]);
  const [questProgress, setQuestProgress] = useState<Record<string, { progress: number; claimed: boolean }>>({});
  const [hydrated, setHydrated] = useState(false);

  // Carga inicial via TanStack Query
  const { data: rewardsData } = useQuery({
    queryKey: ["rewards-custom", userId],
    enabled: !!userId,
    queryFn: async () => {
      const wk = weekKey();
      const [cq, ca, rw, rd, hd, qp] = await Promise.all([
        supabase.from("custom_quests").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("custom_achievements").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("rewards_shop").select("*").eq("user_id", userId!).order("cost", { ascending: true }),
        supabase.from("reward_redemptions").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(50),
        supabase.from("hidden_defaults").select("kind, default_id").eq("user_id", userId!),
        supabase.from("quest_progress").select("quest_id, progress, claimed").eq("user_id", userId!).eq("week_key", wk),
      ]);
      return {
        customQuests: (cq.data ?? []) as CustomQuest[],
        customFixedMissions: (ca.data ?? []) as CustomFixedMission[],
        rewards: (rw.data ?? []) as Reward[],
        redemptions: (rd.data ?? []) as Redemption[],
        hiddenDefaults: (hd.data ?? []) as { kind: string; default_id: string }[],
        questProgressRows: (qp.data ?? []) as { quest_id: string; progress: number; claimed: boolean }[],
      };
    },
  });

  useEffect(() => {
    if (!userId) {
      setCustomQuests([]); setCustomFixedMissions([]); setRewards([]); setRedemptions([]);
      setHiddenDefaults([]); setQuestProgress({}); setHydrated(false);
      return;
    }
    if (!rewardsData) return;
    setCustomQuests(rewardsData.customQuests);
    setCustomFixedMissions(rewardsData.customFixedMissions);
    setRewards(rewardsData.rewards);
    setRedemptions(rewardsData.redemptions);
    setHiddenDefaults(rewardsData.hiddenDefaults);
    const map: Record<string, { progress: number; claimed: boolean }> = {};
    rewardsData.questProgressRows.forEach((r) => { map[r.quest_id] = { progress: r.progress, claimed: r.claimed }; });
    setQuestProgress(map);
    setHydrated(true);
  }, [userId, rewardsData]);


  // Auto-detectar misiones fijas personalizadas desbloqueadas
  useEffect(() => {
    if (!userId || !hydrated) return;
    const autoOnes = customFixedMissions.filter((a) => a.active && a.metric && a.target);
    if (autoOnes.length === 0) return;
    (async () => {
      const { data: existing } = await supabase
        .from("achievements_unlocked")
        .select("achievement_id")
        .eq("user_id", userId)
        .like("achievement_id", "custom:%");
      const already = new Set((existing ?? []).map((r) => r.achievement_id as string));
      const toUnlock: CustomFixedMission[] = [];
      for (const a of autoOnes) {
        const id = `custom:${a.id}`;
        if (already.has(id)) continue;
        const progress = computeMetricTotal(a.metric!, state);
        if (progress >= (a.target ?? 0)) toUnlock.push(a);
      }
      if (toUnlock.length === 0) return;
      await supabase.from("achievements_unlocked").insert(
        toUnlock.map((a) => ({ user_id: userId, achievement_id: `custom:${a.id}` })),
      );
      const bonus = toUnlock.reduce((acc, a) => acc + a.xp, 0);
      if (bonus > 0) addBonusXp(bonus);
      toUnlock.forEach((a) => {
        toast(`🏆 ${a.name}`, { description: `${a.emoji} ${a.description} · +${a.xp} XP`, duration: 5000 });
      });
    })();
  }, [state, customFixedMissions, userId, hydrated, addBonusXp]);

  // ===== CRUD: custom quests =====
  const saveQuest = useCallback(async (q: Partial<CustomQuest> & { id?: string }) => {
    if (!userId) return;
    const payload = {
      user_id: userId,
      title: q.title ?? "",
      description: q.description ?? "",
      emoji: q.emoji ?? "🎯",
      xp: q.xp ?? 50,
      target: q.target ?? 1,
      tracking: q.tracking ?? "manual",
      metric: q.metric ?? null,
      scope: q.scope ?? "weekly",
      active: q.active ?? true,
      due_date: q.due_date ?? null,
    };
    if (q.id) {
      const { data, error } = await supabase.from("custom_quests").update(payload).eq("id", q.id).select().single();
      if (error) { toast.error("No se pudo actualizar"); return; }
      setCustomQuests((prev) => prev.map((x) => (x.id === q.id ? (data as CustomQuest) : x)));
      toast.success("Misión actualizada");
    } else {
      const { data, error } = await supabase.from("custom_quests").insert(payload).select().single();
      if (error) { toast.error("No se pudo crear"); return; }
      setCustomQuests((prev) => [data as CustomQuest, ...prev]);
      toast.success("Misión creada");
    }
  }, [userId]);

  const deleteQuest = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_quests").delete().eq("id", id);
    if (error) { toast.error("No se pudo borrar"); return; }
    setCustomQuests((prev) => prev.filter((x) => x.id !== id));
    toast.success("Misión eliminada");
  }, []);

  // ===== CRUD: custom fixed missions =====
  const saveFixedMission = useCallback(async (a: Partial<CustomFixedMission> & { id?: string }) => {
    if (!userId) return;
    const payload = {
      user_id: userId,
      name: a.name ?? "",
      description: a.description ?? "",
      emoji: a.emoji ?? "🏆",
      xp: a.xp ?? 100,
      rarity: a.rarity ?? "common",
      category: a.category ?? "meta",
      metric: a.metric ?? null,
      target: a.target ?? null,
      active: a.active ?? true,
    };
    if (a.id) {
      const { data, error } = await supabase.from("custom_achievements").update(payload).eq("id", a.id).select().single();
      if (error) { toast.error("No se pudo actualizar"); return; }
      setCustomFixedMissions((prev) => prev.map((x) => (x.id === a.id ? (data as CustomFixedMission) : x)));
      toast.success("Misión fija actualizada");
    } else {
      const { data, error } = await supabase.from("custom_achievements").insert(payload).select().single();
      if (error) { toast.error("No se pudo crear"); return; }
      setCustomFixedMissions((prev) => [data as CustomFixedMission, ...prev]);
      toast.success("Misión fija creada");
    }
  }, [userId]);

  const deleteFixedMission = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_achievements").delete().eq("id", id);
    if (error) { toast.error("No se pudo borrar"); return; }
    setCustomFixedMissions((prev) => prev.filter((x) => x.id !== id));
    toast.success("Misión fija eliminada");
  }, []);

  // ===== CRUD: rewards =====
  const saveReward = useCallback(async (r: Partial<Reward> & { id?: string }) => {
    if (!userId) return;
    const payload = {
      user_id: userId,
      name: r.name ?? "",
      description: r.description ?? "",
      emoji: r.emoji ?? "🎁",
      cost: r.cost ?? 100,
      category: r.category ?? "treat",
      active: r.active ?? true,
    };
    if (r.id) {
      const { data, error } = await supabase.from("rewards_shop").update(payload).eq("id", r.id).select().single();
      if (error) { toast.error("No se pudo actualizar"); return; }
      setRewards((prev) => prev.map((x) => (x.id === r.id ? (data as Reward) : x)));
      toast.success("Premio actualizado");
    } else {
      const { data, error } = await supabase.from("rewards_shop").insert(payload).select().single();
      if (error) { toast.error("No se pudo crear"); return; }
      setRewards((prev) => [...prev, data as Reward].sort((a, b) => a.cost - b.cost));
      toast.success("Premio creado");
    }
  }, [userId]);

  const deleteReward = useCallback(async (id: string) => {
    const { error } = await supabase.from("rewards_shop").delete().eq("id", id);
    if (error) { toast.error("No se pudo borrar"); return; }
    setRewards((prev) => prev.filter((x) => x.id !== id));
    toast.success("Premio eliminado");
  }, []);

  // ===== Canjear premio (resta XP del total) =====
  const redeemReward = useCallback(async (reward: Reward, currentXp: number) => {
    if (!userId) return false;
    if (currentXp < reward.cost) { toast.error("XP insuficiente"); return false; }
    const { data, error } = await supabase
      .from("reward_redemptions")
      .insert({
        user_id: userId,
        reward_id: reward.id,
        reward_name: reward.name,
        reward_emoji: reward.emoji,
        cost: reward.cost,
        xp_at_unlock: currentXp,
      })
      .select()
      .single();
    if (error) { toast.error("No se pudo canjear"); return false; }
    setRedemptions((prev) => [data as Redemption, ...prev]);
    addBonusXp(-reward.cost);
    toast.success(`${reward.emoji} ¡Premio canjeado!`, { description: `${reward.name} · -${reward.cost} XP`, duration: 5000 });
    return true;
  }, [userId, addBonusXp]);

  const markFulfilled = useCallback(async (id: string, fulfilled: boolean) => {
    const patch: { fulfilled: boolean; fulfilled_at: string | null } = {
      fulfilled,
      fulfilled_at: fulfilled ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("reward_redemptions").update(patch).eq("id", id);
    if (error) { toast.error("Error"); return; }
    setRedemptions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  // ===== Hidden defaults =====
  const toggleHidden = useCallback(async (kind: "quest" | "achievement", defaultId: string) => {
    if (!userId) return;
    const isHidden = hiddenDefaults.some((h) => h.kind === kind && h.default_id === defaultId);
    if (isHidden) {
      await supabase.from("hidden_defaults").delete().eq("user_id", userId).eq("kind", kind).eq("default_id", defaultId);
      setHiddenDefaults((prev) => prev.filter((h) => !(h.kind === kind && h.default_id === defaultId)));
    } else {
      await supabase.from("hidden_defaults").insert({ user_id: userId, kind, default_id: defaultId });
      setHiddenDefaults((prev) => [...prev, { kind, default_id: defaultId }]);
    }
  }, [userId, hiddenDefaults]);

  const isHidden = useCallback((kind: "quest" | "achievement", id: string) => {
    return hiddenDefaults.some((h) => h.kind === kind && h.default_id === id);
  }, [hiddenDefaults]);

  // ===== Manual quest progress =====
  const incrementQuestProgress = useCallback(async (questId: string, target: number, xp: number, delta = 1) => {
    if (!userId) return;
    const wk = weekKey();
    const current = questProgress[questId]?.progress ?? 0;
    const next = Math.min(target, current + delta);
    const wasCompleted = current >= target;
    const isCompleted = next >= target;
    setQuestProgress((prev) => ({ ...prev, [questId]: { progress: next, claimed: prev[questId]?.claimed ?? false } }));
    await supabase
      .from("quest_progress")
      .upsert({ user_id: userId, week_key: wk, quest_id: questId, progress: next, claimed: questProgress[questId]?.claimed ?? false }, { onConflict: "user_id,week_key,quest_id" });
    if (!wasCompleted && isCompleted) {
      toast.success("¡Misión completada!", { description: "Reclama tu recompensa" });
    }
  }, [userId, questProgress]);

  const claimCustomQuest = useCallback(async (q: CustomQuest, progress: number) => {
    if (!userId) return;
    if (progress < q.target) return;
    const wk = weekKey();
    if (questProgress[q.id]?.claimed) return;
    setQuestProgress((prev) => ({ ...prev, [q.id]: { progress, claimed: true } }));
    await supabase
      .from("quest_progress")
      .upsert({ user_id: userId, week_key: wk, quest_id: q.id, progress, claimed: true }, { onConflict: "user_id,week_key,quest_id" });
    addBonusXp(q.xp);
    toast(`🎁 ${q.title}`, { description: `${q.emoji} +${q.xp} XP`, duration: 4500 });
  }, [userId, questProgress, addBonusXp]);

  const [pandaCoinsShop, setPandaCoinsShop] = useState<any[]>([]);

  // Cargar tienda de monedas panda
  const { data: pandaShopData } = useQuery({
    queryKey: ["panda-coins-shop", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("custom_rewards_shop").select("*").eq("user_id", userId!).order("coin_cost", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!userId) { setPandaCoinsShop([]); return; }
    if (pandaShopData) setPandaCoinsShop(pandaShopData);
  }, [userId, pandaShopData]);


  const savePandaReward = useCallback(async (r: any) => {
    if (!userId) return;
    const { data, error } = await supabase.from("custom_rewards_shop").upsert({ ...r, user_id: userId }).select().single();
    if (error) { toast.error("Error al guardar"); return; }
    setPandaCoinsShop(prev => {
      const exists = prev.find(x => x.id === data.id);
      if (exists) return prev.map(x => x.id === data.id ? data : x);
      return [...prev, data].sort((a, b) => a.coin_cost - b.coin_cost);
    });
    toast.success("Premio guardado");
  }, [userId]);

  const deletePandaReward = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_rewards_shop").delete().eq("id", id);
    if (error) { toast.error("Error al borrar"); return; }
    setPandaCoinsShop(prev => prev.filter(x => x.id !== id));
    toast.success("Premio eliminado");
  }, []);

  const redeemPandaReward = useCallback(async (reward: any) => {
    if (!userId) return;
    if ((state.pandaCoins || 0) < reward.coin_cost) { toast.error("Monedas Panda insuficientes 🐼🪙"); return; }
    
    addPandaCoins(-reward.coin_cost);
    toast.success(`¡Premio "${reward.name}" canjeado! 🐼🪙`, { description: `Se han restado ${reward.coin_cost} monedas.` });
  }, [userId, state.pandaCoins, addPandaCoins]);

  return {
    customQuests,
    customFixedMissions,
    rewards,
    redemptions,
    questProgress,
    hydrated,
    saveQuest, deleteQuest,
    saveFixedMission, deleteFixedMission,
    saveReward, deleteReward,
    redeemReward, markFulfilled,
    toggleHidden, isHidden,
    incrementQuestProgress, claimCustomQuest,
    computeCustomQuestProgress: (q: CustomQuest) => computeCustomQuestProgress(q, state),
    pandaCoinsShop, savePandaReward, deletePandaReward, redeemPandaReward
  };
}

function computeMetricTotal(metric: AutoMetric, state: ReturnType<typeof useAppState>["state"]): number {
  switch (metric) {
    case "tasks_completed":
      return state.tasks.filter((t) => t.status === "completed").length;
    case "high_priority_completed":
      return state.tasks.filter((t) => t.status === "completed" && t.priority === "high").length;
    case "habits_completed":
      return state.habits.reduce((acc, h) => acc + h.history.length, 0);
    case "notes_created":
      return state.notes.length;
    case "learnings_added":
      return state.learnings.length;
    case "energy_logged":
      return state.energy.length;
  }
}
