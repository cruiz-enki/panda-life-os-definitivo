/**
 * **Ruleta de la vida**: genera misiones aleatorias del catálogo personal
 * del usuario y registra el historial de las ya jugadas.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "../lib/storage";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/**
 * Misión del catálogo de la ruleta (con peso y categoría).
 */
export type LifeRandomizerMission = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  xp_reward: number;
  is_default: boolean;
};

/**
 * Registro histórico de una misión jugada.
 */
export type LifeRandomizerHistory = {
  id: string;
  mission_id: string | null;
  custom_title: string | null;
  completed: boolean;
  created_at: string;
};

/**
 * Devuelve catálogo, historial y mutaciones CRUD + spin.
 */
export function useLifeRandomizer() {
  const { state, addBonusXp } = useAppState();
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const missionsQuery = useQuery({
    queryKey: ["life-randomizer-missions"],
    queryFn: async () => {
      const [defaults, quests, bp] = await Promise.all([
        supabase.from("life_randomizer_missions").select("*").eq("is_default", true),
        supabase.from("custom_quests").select("*").eq("active", true),
        supabase.from("battle_pass_missions").select("*").eq("active", true),
      ]);
      return {
        missions: (defaults.data || []) as LifeRandomizerMission[],
        customQuests: (quests.data || []) as any[],
        bpMissions: (bp.data || []) as any[],
      };
    },
  });

  const historyQuery = useQuery({
    queryKey: ["life-randomizer-history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("life_randomizer_history")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as LifeRandomizerHistory[];
    },
  });

  const missions = missionsQuery.data?.missions ?? [];
  const customQuests = missionsQuery.data?.customQuests ?? [];
  const bpMissions = missionsQuery.data?.bpMissions ?? [];
  const history = historyQuery.data ?? [];
  const loading = missionsQuery.isLoading || historyQuery.isLoading;

  const refreshMissions = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["life-randomizer-missions"] });
  }, [qc]);

  const refreshHistory = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["life-randomizer-history", userId] });
  }, [qc, userId]);

  const randomize = useCallback(async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para usar el Randomizer");
      return null;
    }

    const pool: any[] = [
      ...missions.map(m => ({ ...m, type: 'default', icon: m.icon || '🎲', xp: m.xp_reward })),
      ...customQuests.map(q => ({ ...q, type: 'custom', icon: q.emoji || '🎯', xp: q.xp })),
      ...bpMissions.map(bp => ({ ...bp, type: 'bp', icon: bp.emoji || '🔥', xp: bp.xp }))
    ];

    const pendingTasks = state.tasks.filter(t => t.status !== 'completed');

    let selection: { id?: string; title: string; icon?: string; xp: number; type: string };

    if (pendingTasks.length > 0 && Math.random() > 0.8) {
      const task = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
      selection = {
        title: task.title,
        icon: "📋",
        xp: 30,
        type: 'task'
      };
    } else if (pool.length > 0) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      selection = {
        id: item.id,
        title: item.title,
        icon: item.icon,
        xp: item.xp,
        type: item.type
      };
    } else {
      toast.error("No hay misiones disponibles");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("life_randomizer_history")
        .insert({
          user_id: user.id,
          mission_id: (selection.type === 'default') ? selection.id : null,
          custom_title: (selection.type !== 'default') ? selection.title : null,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      await refreshHistory();
      return { ...selection, historyId: (data as LifeRandomizerHistory).id };
    } catch (error) {
      console.error("Error creating history entry:", error);
      toast.error("Error al randomizar");
      return null;
    }
  }, [user, missions, customQuests, bpMissions, state.tasks, refreshHistory]);

  const completeMission = useCallback(async (historyId: string, xp: number) => {
    try {
      const { error } = await supabase
        .from("life_randomizer_history")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", historyId);

      if (error) throw error;

      await refreshHistory();
      addBonusXp(xp);
      toast.success(`¡Misión cumplida! +${xp} XP`);
      return true;
    } catch (error) {
      console.error("Error completing mission:", error);
      toast.error("Error al completar la misión");
      return false;
    }
  }, [addBonusXp, refreshHistory]);

  const addMission = useCallback(async (mission: { title: string; category?: string; icon?: string; xp?: number }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("custom_quests")
        .insert({
          user_id: user.id,
          title: mission.title,
          emoji: mission.icon || "🎯",
          xp: mission.xp || 50,
          description: mission.category || "Desde Randomizer",
          scope: "weekly",
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      await refreshMissions();
      toast.success("Misión añadida como Misión Semanal");
      return data;
    } catch (error) {
      console.error("Error adding mission:", error);
      toast.error("Error al añadir misión");
      return null;
    }
  }, [user, refreshMissions]);

  const deleteMission = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_quests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await refreshMissions();
      toast.success("Misión eliminada");
      return true;
    } catch (error) {
      console.error("Error deleting mission:", error);
      toast.error("Error al eliminar misión");
      return false;
    }
  }, [refreshMissions]);

  return {
    missions,
    customQuests,
    bpMissions,
    history,
    loading,
    randomize,
    completeMission,
    addMission,
    deleteMission,
    refreshMissions,
    refreshHistory
  };
}
