/**
 * Hook del módulo de **Crecimiento Personal**: objetivos, hitos y
 * reflexiones. Lectura/escritura directa contra Supabase con TanStack Query.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Dream, Horizon, Goal, GoalProject, GoalAction, HorizonType, FutureLetter, LifeMetric, FutureSimulation } from "../lib/growth-types";

/**
 * Devuelve objetivos, hitos y reflexiones del usuario + mutaciones CRUD.
 */
export function useGrowth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["growth", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [d, h, g, p, a, fl, lm, fs] = await Promise.all([
        supabase.from("dreams").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("horizons").select("*").eq("user_id", userId!),
        supabase.from("goals").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("goal_projects").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("goal_actions").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
        supabase.from("future_letters").select("*").eq("user_id", userId!).order("unlock_date", { ascending: true }),
        supabase.from("life_metrics").select("*").eq("user_id", userId!).order("created_at", { ascending: true }),
        supabase.from("future_simulations").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
      ]);
      return {
        dreams: (d.data || []) as unknown as Dream[],
        horizons: (h.data || []) as unknown as Horizon[],
        goals: (g.data || []) as unknown as Goal[],
        projects: (p.data || []) as unknown as GoalProject[],
        actions: (a.data || []) as unknown as GoalAction[],
        futureLetters: (fl.data || []) as unknown as FutureLetter[],
        lifeMetrics: (lm.data || []) as unknown as LifeMetric[],
        futureSimulations: (fs.data || []) as unknown as FutureSimulation[],
      };
    },
  });

  const dreams = data?.dreams ?? [];
  const horizons = data?.horizons ?? [];
  const goals = data?.goals ?? [];
  const projects = data?.projects ?? [];
  const actions = data?.actions ?? [];
  const futureLetters = data?.futureLetters ?? [];
  const lifeMetrics = data?.lifeMetrics ?? [];
  const futureSimulations = data?.futureSimulations ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["growth", userId] });
  }, [qc, userId]);

  // Dreams CRUD
  const addDream = async (dream: Omit<Dream, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("dreams").insert({ ...dream, user_id: user.id } as any);
    if (!error) refresh();
    return error;
  };

  const updateDream = async (id: string, patch: Partial<Dream>) => {
    const { error } = await supabase.from("dreams").update(patch as any).eq("id", id);
    if (!error) refresh();
    return error;
  };

  const deleteDream = async (id: string) => {
    const { error } = await supabase.from("dreams").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  // Horizons
  const upsertHorizon = async (type: HorizonType, content: string) => {
    if (!user) return;
    const existing = horizons.find(h => h.horizon_type === type);
    if (existing) {
      const { error } = await supabase.from("horizons").update({ content }).eq("id", existing.id);
      if (!error) refresh();
      return error;
    } else {
      const { error } = await supabase.from("horizons").insert({ user_id: user.id, horizon_type: type, content });
      if (!error) refresh();
      return error;
    }
  };

  const updateHorizonStatus = async (id: string, status: Horizon["status"]) => {
    const patch: any = { status };
    if (status === 'completed') {
      patch.completed_at = new Date().toISOString();
    } else {
      patch.completed_at = null;
    }
    const { error } = await supabase.from("horizons").update(patch).eq("id", id);
    if (!error) refresh();
    return error;
  };

  // Goal Breakdown CRUD
  const addGoal = async (goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("goals").insert({ ...goal, user_id: user.id } as any);
    if (!error) refresh();
    return error;
  };

  const addProject = async (project: Omit<GoalProject, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("goal_projects").insert({ ...project, user_id: user.id } as any);
    if (!error) refresh();
    return error;
  };

  const addAction = async (action: Omit<GoalAction, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("goal_actions").insert({ ...action, user_id: user.id } as any);
    if (!error) refresh();
    return error;
  };

  const updateGoalStatus = async (id: string, status: Goal["status"]) => {
    const { error } = await supabase.from("goals").update({ status } as any).eq("id", id);
    if (!error) refresh();
    return error;
  };

  const updateProjectStatus = async (id: string, status: GoalProject["status"]) => {
    const { error } = await supabase.from("goal_projects").update({ status } as any).eq("id", id);
    if (!error) refresh();
    return error;
  };

  const updateActionStatus = async (id: string, status: GoalAction["status"]) => {
    const { error } = await supabase.from("goal_actions").update({ status } as any).eq("id", id);
    if (!error) refresh();
    return error;
  };

  // Future Letters
  const addFutureLetter = async (letter: Omit<FutureLetter, "id" | "user_id" | "is_read" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("future_letters").insert({ ...letter, user_id: user.id });
    if (!error) refresh();
    return error;
  };

  const deleteFutureLetter = async (id: string) => {
    const { error } = await supabase.from("future_letters").delete().eq("id", id);
    if (!error) refresh();
    return error;
  };

  const markLetterAsRead = async (id: string) => {
    const { error } = await supabase.from("future_letters").update({ is_read: true }).eq("id", id);
    if (!error) refresh();
    return error;
  };

  // Life Metrics
  const addLifeMetric = async (metrics: Omit<LifeMetric, "id" | "user_id" | "created_at">) => {
    if (!user) return;
    const { error } = await supabase.from("life_metrics").insert({ ...metrics, user_id: user.id });
    if (!error) refresh();
    return error;
  };

  const runFutureSimulation = async () => {
    if (!user) return;

    const { data: habitsData } = await supabase.from("habits").select("*").eq("user_id", user.id);

    const { data, error } = await supabase.functions.invoke("ai-future-simulation", {
      body: {
        metrics: lifeMetrics.slice(-5),
        habits: habitsData,
        goals: goals.filter(g => g.status !== 'completed'),
      }
    });

    if (!error && data) {
      const { error: insertError } = await supabase.from("future_simulations").insert({
        user_id: user.id,
        type: 'current_trend',
        timeframe: '1 year',
        simulation_data: data,
        ai_insight: data.ai_insight
      });
      if (!insertError) refresh();
    }

    return { data, error };
  };

  return {
    dreams, horizons, goals, projects, actions, futureLetters, lifeMetrics, futureSimulations, loading: isLoading,
    addDream, updateDream, deleteDream,
    upsertHorizon, updateHorizonStatus,
    addGoal, addProject, addAction,
    updateGoalStatus, updateProjectStatus, updateActionStatus,
    addFutureLetter, deleteFutureLetter, markLetterAsRead,
    addLifeMetric,
    runFutureSimulation,
    refresh
  };
}
