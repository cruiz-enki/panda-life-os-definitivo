/**
 * Hook del módulo de **Ejercicio**: rutinas, sesiones, ejercicios y récords.
 * Cachea todo con TanStack Query y centraliza las mutaciones.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { todayCDMX } from "@/lib/date-utils";
import type {
  Exercise, Routine, RoutineExercise,
  WorkoutScheduleEntry, WorkoutLog, WorkoutExerciseLog, ExerciseUserPref,
} from "../lib/exercise-types";

/**
 * Devuelve rutinas, sesiones registradas, ejercicios disponibles y
 * mutaciones para CRUD + finalizar/iniciar sesiones.
 */
export function useExercise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["exercise", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [ex, ro, re, sc, lo, el, pr] = await Promise.all([
        supabase.from("exercises" as never).select("*").order("name"),
        supabase.from("routines" as never).select("*").order("name"),
        supabase.from("routine_exercises" as never).select("*").order("sort_order"),
        supabase.from("workout_schedule" as never).select("*").eq("user_id", userId!),
        supabase.from("workout_logs" as never).select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(500),
        supabase.from("workout_exercise_logs" as never).select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(2000),
        supabase.from("exercise_user_prefs" as never).select("*").eq("user_id", userId!),
      ]);
      return {
        exercises: (ex.data ?? []) as unknown as Exercise[],
        routines: (ro.data ?? []) as unknown as Routine[],
        routineExercises: (re.data ?? []) as unknown as RoutineExercise[],
        schedule: (sc.data ?? []) as unknown as WorkoutScheduleEntry[],
        logs: (lo.data ?? []) as unknown as WorkoutLog[],
        exerciseLogs: (el.data ?? []) as unknown as WorkoutExerciseLog[],
        prefs: (pr.data ?? []) as unknown as ExerciseUserPref[],
      };
    },
  });

  const exercises = data?.exercises ?? [];
  const routines = data?.routines ?? [];
  const routineExercises = data?.routineExercises ?? [];
  const schedule = data?.schedule ?? [];
  const logs = data?.logs ?? [];
  const exerciseLogs = data?.exerciseLogs ?? [];
  const prefs = data?.prefs ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["exercise", userId] });
  }, [qc, userId]);

  const today = todayCDMX();

  const todayRoutine = useMemo(() => {
    if (!routines.length) return null;
    const dow = new Date().getDay();
    const override = schedule.find((s) => s.scheduled_date === today);
    if (override) {
      if (override.is_rest) return { rest: true as const, routine: null };
      const r = routines.find((x) => x.id === override.routine_id) ?? null;
      return { rest: false as const, routine: r };
    }
    const weekly = schedule.find((s) => s.day_of_week === dow);
    if (!weekly) return null;
    if (weekly.is_rest) return { rest: true as const, routine: null };
    const r = routines.find((x) => x.id === weekly.routine_id) ?? null;
    return { rest: false as const, routine: r };
  }, [routines, schedule, today]);

  const exercisesForRoutine = useCallback((routineId: string) => {
    const items = routineExercises
      .filter((re) => re.routine_id === routineId)
      .sort((a, b) => a.sort_order - b.sort_order);
    return items.map((re) => ({
      ...re,
      exercise: exercises.find((e) => e.id === re.exercise_id) ?? null,
    }));
  }, [routineExercises, exercises]);

  const prefFor = useCallback((exerciseId: string) => {
    return prefs.find((p) => p.exercise_id === exerciseId) ?? null;
  }, [prefs]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - (day - 1));
    return logs.filter((l) => l.completed && new Date(l.date) >= start).length;
  }, [logs]);

  const streak = useMemo(() => {
    const completedDates = new Set(logs.filter(l => l.completed).map(l => l.date));
    let s = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().slice(0,10);
      const dow = d.getDay();
      const restDay = schedule.some(sc => sc.scheduled_date === iso ? sc.is_rest : (sc.day_of_week === dow && sc.is_rest));
      if (completedDates.has(iso) || restDay) { s++; d.setDate(d.getDate()-1); }
      else break;
    }
    return s;
  }, [logs, schedule]);

  // ===== Mutations - Library (owner) =====
  const upsertExercise = async (input: Partial<Exercise> & { id?: string }) => {
    if (input.id) {
      const { error } = await supabase.from("exercises" as never).update(input as never).eq("id", input.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("exercises" as never).insert(input as never);
    if (!error) await refresh();
    return error;
  };
  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("exercises" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const upsertRoutine = async (input: Partial<Routine> & { id?: string }) => {
    if (input.id) {
      const { error } = await supabase.from("routines" as never).update(input as never).eq("id", input.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("routines" as never).insert({ ...input, created_by: user?.id } as never);
    if (!error) await refresh();
    return error;
  };
  const deleteRoutine = async (id: string) => {
    const { error } = await supabase.from("routines" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const addExerciseToRoutine = async (routineId: string, exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    const sort = (routineExercises.filter(r => r.routine_id === routineId).length) + 1;
    const { error } = await supabase.from("routine_exercises" as never).insert({
      routine_id: routineId,
      exercise_id: exerciseId,
      sort_order: sort,
      sets: ex?.default_sets ?? 3,
      reps: ex?.default_reps ?? "10",
      rest_seconds: 60,
    } as never);
    if (!error) await refresh();
    return error;
  };
  const removeExerciseFromRoutine = async (id: string) => {
    const { error } = await supabase.from("routine_exercises" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };
  const updateRoutineExercise = async (id: string, patch: Partial<RoutineExercise>) => {
    const { error } = await supabase.from("routine_exercises" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  };
  const reorderRoutineExercise = async (id: string, direction: "up" | "down") => {
    const item = routineExercises.find(r => r.id === id);
    if (!item) return;
    const siblings = routineExercises
      .filter(r => r.routine_id === item.routine_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex(s => s.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    await Promise.all([
      supabase.from("routine_exercises" as never).update({ sort_order: other.sort_order } as never).eq("id", item.id),
      supabase.from("routine_exercises" as never).update({ sort_order: item.sort_order } as never).eq("id", other.id),
    ]);
    await refresh();
  };

  // ===== Schedule (per-user) =====
  const setWeeklySlot = async (dow: number, routineId: string | null, isRest: boolean) => {
    if (!user) return;
    const existing = schedule.find(s => s.day_of_week === dow);
    if (existing) {
      const { error } = await supabase.from("workout_schedule" as never).update({
        routine_id: isRest ? null : routineId,
        is_rest: isRest,
      } as never).eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("workout_schedule" as never).insert({
      user_id: user.id,
      day_of_week: dow,
      routine_id: isRest ? null : routineId,
      is_rest: isRest,
    } as never);
    if (!error) await refresh();
    return error;
  };
  const clearWeeklySlot = async (dow: number) => {
    const existing = schedule.find(s => s.day_of_week === dow);
    if (!existing) return;
    await supabase.from("workout_schedule" as never).delete().eq("id", existing.id);
    await refresh();
  };
  const setDateOverride = async (date: string, routineId: string | null, isRest: boolean) => {
    if (!user) return;
    const existing = schedule.find(s => s.scheduled_date === date);
    if (existing) {
      await supabase.from("workout_schedule" as never).update({
        routine_id: isRest ? null : routineId, is_rest: isRest,
      } as never).eq("id", existing.id);
      await refresh();
      return;
    }
    await supabase.from("workout_schedule" as never).insert({
      user_id: user.id, scheduled_date: date,
      routine_id: isRest ? null : routineId, is_rest: isRest,
    } as never);
    await refresh();
  };
  const clearDateOverride = async (date: string) => {
    const existing = schedule.find(s => s.scheduled_date === date);
    if (!existing) return;
    await supabase.from("workout_schedule" as never).delete().eq("id", existing.id);
    await refresh();
  };

  // ===== Logs =====
  const startWorkout = async (routineId: string, energyBefore?: number) => {
    if (!user) return null;
    const { data, error } = await supabase.from("workout_logs" as never).insert({
      user_id: user.id, routine_id: routineId, date: today,
      completed: false, energy_before: energyBefore ?? null,
    } as never).select().single();
    if (error) return null;
    await refresh();
    return data as unknown as WorkoutLog;
  };

  const deleteWorkoutLog = async (id: string) => {
    await supabase.from("workout_exercise_logs" as never).delete().eq("workout_log_id", id);
    const { error } = await supabase.from("workout_logs" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const toggleExerciseLog = async (workoutLogId: string, exerciseId: string) => {
    if (!user) return 0;
    const existing = exerciseLogs.find(el => el.workout_log_id === workoutLogId && el.exercise_id === exerciseId);
    const ex = exercises.find(e => e.id === exerciseId);
    if (existing) {
      await supabase.from("workout_exercise_logs" as never).delete().eq("id", existing.id);
      await refresh();
      return -(existing.xp_awarded || 0);
    }
    const xp = ex?.xp_reward ?? 5;
    await supabase.from("workout_exercise_logs" as never).insert({
      user_id: user.id, workout_log_id: workoutLogId, exercise_id: exerciseId,
      completed: true, xp_awarded: xp,
    } as never);
    await refresh();
    const { titoReact } = await import("@/lib/tito-react");
    titoReact("exercise", ex ? { text: `${ex.name} ✅ +${xp} XP` } : {});
    return xp;
  };

  const updateExerciseLog = async (workoutLogId: string, exerciseId: string, setsDone: number) => {
    if (!user) return;
    const existing = exerciseLogs.find(el => el.workout_log_id === workoutLogId && el.exercise_id === exerciseId);
    if (existing) {
      await supabase.from("workout_exercise_logs" as never).update({
        sets_done: setsDone,
        completed: setsDone >= 1
      } as never).eq("id", existing.id);
    } else {
      const ex = exercises.find(e => e.id === exerciseId);
      const xp = ex?.xp_reward ?? 5;
      await supabase.from("workout_exercise_logs" as never).insert({
        user_id: user.id, workout_log_id: workoutLogId, exercise_id: exerciseId,
        completed: setsDone >= 1, sets_done: setsDone, xp_awarded: xp,
      } as never);
    }
    await refresh();
  };

  const finishWorkout = async (workoutLogId: string, payload: {
    difficulty?: number; energy_after?: number; notes?: string;
  }) => {
    const log = logs.find(l => l.id === workoutLogId);
    if (!log) return 0;
    const r = routines.find(x => x.id === log.routine_id);
    const bonus = r?.xp_bonus ?? 0;
    await supabase.from("workout_logs" as never).update({
      completed: true,
      difficulty: payload.difficulty ?? null,
      energy_after: payload.energy_after ?? null,
      notes: payload.notes ?? "",
      xp_awarded: bonus,
      updated_at: new Date().toISOString()
    } as never).eq("id", workoutLogId);
    await refresh();
    return bonus;
  };

  const logSingleExercise = async (exerciseId: string, payload: {
    sets_done?: number;
    reps_done?: string;
    difficulty?: number;
    energy_before?: number;
    energy_after?: number;
    notes?: string;
    date?: string;
  }) => {
    if (!user) return 0;
    const ex = exercises.find(e => e.id === exerciseId);
    const xp = ex?.xp_reward ?? 5;
    const { data: wl, error: wlErr } = await supabase.from("workout_logs" as never).insert({
      user_id: user.id,
      routine_id: null,
      date: payload.date ?? today,
      completed: true,
      difficulty: payload.difficulty ?? null,
      energy_before: payload.energy_before ?? null,
      energy_after: payload.energy_after ?? null,
      notes: payload.notes ?? "",
      xp_awarded: 0,
    } as never).select().single();
    if (wlErr || !wl) return 0;
    await supabase.from("workout_exercise_logs" as never).insert({
      user_id: user.id,
      workout_log_id: (wl as { id: string }).id,
      exercise_id: exerciseId,
      completed: true,
      sets_done: payload.sets_done ?? 0,
      reps_done: payload.reps_done ?? "",
      notes: payload.notes ?? "",
      xp_awarded: xp,
    } as never);
    await refresh();
    return xp;
  };

  const setPref = async (exerciseId: string, status: "normal" | "modify" | "avoid", notes = "") => {
    if (!user) return;
    const existing = prefs.find(p => p.exercise_id === exerciseId);
    if (existing) {
      await supabase.from("exercise_user_prefs" as never).update({ status, notes } as never).eq("id", existing.id);
    } else {
      await supabase.from("exercise_user_prefs" as never).insert({
        user_id: user.id, exercise_id: exerciseId, status, notes,
      } as never);
    }
    await refresh();
  };

  return {
    loading: isLoading,
    exercises, routines, routineExercises, schedule, logs, exerciseLogs, prefs,
    today, todayRoutine, completedThisWeek, streak,
    exercisesForRoutine, prefFor,
    upsertExercise, deleteExercise,
    upsertRoutine, deleteRoutine,
    addExerciseToRoutine, removeExerciseFromRoutine, updateRoutineExercise, reorderRoutineExercise,
    setWeeklySlot, clearWeeklySlot, setDateOverride, clearDateOverride,
    startWorkout, deleteWorkoutLog, toggleExerciseLog, updateExerciseLog, finishWorkout, logSingleExercise,
    setPref,
    refresh,
  };
}
