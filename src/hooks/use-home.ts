/**
 * Hook del módulo **Hogar**: áreas (cocina, baño…), tareas recurrentes y
 * completaciones diarias. Construye además un snapshot rico que la
 * gamificación consume.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todayCDMX } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  HOME_XP_DEFAULTS,
  type HomeArea,
  type HomeTask,
  type HomeCompletion,
  type HomeSnapshot,
} from "../lib/home-types";

function weekRange(): { startISO: string; endISO: string; start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return {
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
    start,
    end,
  };
}

function taskAppliesToday(t: HomeTask, todayDow: number, todayISO: string): boolean {
  if (!t.active) return false;
  if (t.scheduled_date) {
    return t.scheduled_date === todayISO;
  }
  switch (t.frequency) {
    case "daily":
      return true;
    case "weekly":
      return t.day_of_week == null || t.day_of_week === todayDow;
    case "biweekly":
    case "monthly":
    case "custom":
      return t.day_of_week == null || t.day_of_week === todayDow;
    case "flexible":
      return false;
    default:
      return false;
  }
}

/**
 * Devuelve áreas, tareas, completaciones, snapshot y mutaciones CRUD.
 */
export function useHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["home", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [a, t, c] = await Promise.all([
        supabase.from("home_areas" as never).select("*").eq("user_id", userId!).order("sort_order"),
        supabase.from("home_tasks" as never).select("*").eq("user_id", userId!).order("sort_order"),
        supabase.from("home_completions" as never).select("*").eq("user_id", userId!).order("completed_date", { ascending: false }).limit(2000),
      ]);
      return {
        areas: ((a.data ?? []) as unknown) as HomeArea[],
        tasks: ((t.data ?? []) as unknown) as HomeTask[],
        completions: ((c.data ?? []) as unknown) as HomeCompletion[],
      };
    },
  });

  const areas = data?.areas ?? [];
  const tasks = data?.tasks ?? [];
  const completions = data?.completions ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["home", userId] });
  }, [qc, userId]);

  // ===== Áreas =====
  const createArea = useCallback(async (input: Omit<HomeArea, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("home_areas" as never).insert({ ...input, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  }, [user, refresh]);

  const updateArea = useCallback(async (id: string, patch: Partial<HomeArea>) => {
    const { error } = await supabase.from("home_areas" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const deleteArea = useCallback(async (id: string) => {
    const { error } = await supabase.from("home_areas" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  // ===== Tareas =====
  const createTask = useCallback(async (input: Omit<HomeTask, "id" | "user_id" | "created_at" | "updated_at" | "scheduled_date">) => {
    if (!user) return;
    const xp = input.xp_reward > 0 ? input.xp_reward : HOME_XP_DEFAULTS[input.task_type];
    const { error } = await supabase.from("home_tasks" as never).insert({ ...input, xp_reward: xp, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  }, [user, refresh]);

  const updateTask = useCallback(async (id: string, patch: Partial<HomeTask>) => {
    const { error } = await supabase.from("home_tasks" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("home_tasks" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  // ===== Completaciones =====
  const completeTask = useCallback(async (taskId: string, dateISO?: string): Promise<{ xp: number; alreadyCompleted: boolean }> => {
    if (!user) return { xp: 0, alreadyCompleted: false };
    const date = dateISO ?? todayCDMX();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { xp: 0, alreadyCompleted: false };

    const existing = completions.find((c) => c.task_id === taskId && c.completed_date === date);
    if (existing) return { xp: 0, alreadyCompleted: true };

    const xp = task.xp_reward > 0 ? task.xp_reward : HOME_XP_DEFAULTS[task.task_type];

    const { error } = await supabase.from("home_completions" as never).insert({
      user_id: user.id,
      task_id: taskId,
      completed_date: date,
      xp_awarded: xp,
      notes: "",
    } as never);

    if (error) {
      console.error("[home:complete]", error);
      return { xp: 0, alreadyCompleted: false };
    }

    if (task.scheduled_date) {
      await supabase.from("home_tasks" as never).update({ scheduled_date: null } as never).eq("id", taskId);
    }

    const today = todayCDMX();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data: profile } = await supabase.from("profiles").select("cleaning_streak, last_cleaning_date").eq("user_id", user.id).maybeSingle();

    if (profile && profile.last_cleaning_date !== today) {
      const newStreak = profile.last_cleaning_date === yesterday ? (profile.cleaning_streak || 0) + 1 : 1;
      await supabase.from("profiles").update({
        cleaning_streak: newStreak,
        last_cleaning_date: today
      } as any).eq("user_id", user.id);
    }

    await refresh();
    return { xp, alreadyCompleted: false };

  }, [user, tasks, completions, refresh]);

  const scheduleTask = useCallback(async (taskId: string, date: string | null) => {
    const { error } = await supabase.from("home_tasks" as never).update({ scheduled_date: date } as never).eq("id", taskId);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const undoCompletion = useCallback(async (taskId: string, dateISO?: string) => {
    if (!user) return;
    const date = dateISO ?? todayCDMX();
    const existing = completions.find((c) => c.task_id === taskId && c.completed_date === date);
    if (!existing) return;
    const { error } = await supabase.from("home_completions" as never).delete().eq("id", existing.id);
    if (!error) await refresh();
    return error;
  }, [user, completions, refresh]);

  // ===== Snapshot =====
  const snapshot: HomeSnapshot = useMemo(() => {
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const todayDow = now.getDay();
    const { startISO, endISO } = weekRange();

    const todayTasks = tasks.filter((t) => taskAppliesToday(t, todayDow, todayISO));
    const completionsToday = completions.filter((c) => c.completed_date === todayISO);
    const todayDone = todayTasks.filter((t) => completionsToday.some((c) => c.task_id === t.id)).length;
    const dayComplete = todayTasks.length > 0 && todayDone === todayTasks.length;

    const keyDoneToday = tasks.some(
      (t) => t.is_key && t.active && completionsToday.some((c) => c.task_id === t.id),
    );
    const mvdMet = keyDoneToday;

    const weekCompletions = completions.filter((c) => c.completed_date >= startISO && c.completed_date < endISO);
    const weeklyTasksAll = tasks.filter((t) => t.active && t.task_type === "weekly");
    const weeklyTasksDone = weeklyTasksAll.filter((t) => weekCompletions.some((c) => c.task_id === t.id)).length;
    const weekComplete = weeklyTasksAll.length > 0 && weeklyTasksDone === weeklyTasksAll.length;

    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter((t) => t.active).length,
      completionsTodayCount: completionsToday.length,
      todayTotal: todayTasks.length,
      todayDone,
      dayComplete,
      mvdMet,
      weekCompletionsCount: weekCompletions.length,
      weeklyTasksTotal: weeklyTasksAll.length,
      weeklyTasksDone,
      weekComplete,
      totalCompletions: completions.length,
    };
  }, [tasks, completions]);

  const todayList = useMemo(() => {
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const todayDow = now.getDay();
    return tasks
      .filter((t) => taskAppliesToday(t, todayDow, todayISO))
      .map((t) => ({
        task: t,
        completed: completions.some((c) => c.task_id === t.id && c.completed_date === todayISO),
      }));
  }, [tasks, completions]);

  const weeklyList = useMemo(() => {
    const { startISO, endISO } = weekRange();
    return tasks
      .filter((t) => t.active && t.task_type === "weekly")
      .map((t) => ({
        task: t,
        completed: completions.some((c) => c.task_id === t.id && c.completed_date >= startISO && c.completed_date < endISO),
      }));
  }, [tasks, completions]);

  const potentialXpToday = useMemo(() => {
    return todayList
      .filter((x) => !x.completed)
      .reduce((acc, x) => acc + (x.task.xp_reward > 0 ? x.task.xp_reward : HOME_XP_DEFAULTS[x.task.task_type]), 0);
  }, [todayList]);

  return {
    loading: isLoading,
    areas,
    tasks,
    completions,
    snapshot,
    todayList,
    weeklyList,
    potentialXpToday,
    refresh,
    createArea,
    updateArea,
    deleteArea,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    undoCompletion,
    scheduleTask,
  };
}

/**
 * Tipo del API expuesto por `useHome`.
 */
export type HomeApi = ReturnType<typeof useHome>;
