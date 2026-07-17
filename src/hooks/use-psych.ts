/**
 * Hook del módulo de **Psicología**: terapias, sesiones, traumas, patrones
 * de pensamiento y herramientas de regulación emocional.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { PsychSession, PsychCheckin, PsychTask } from "../lib/psych-types";

/**
 * Devuelve todas las entidades psicológicas del usuario y mutaciones CRUD.
 */
export function usePsych() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["psych", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [s, c, t] = await Promise.all([
        supabase.from("psych_sessions" as never).select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(500),
        supabase.from("psych_checkins" as never).select("*").eq("user_id", userId!).order("date", { ascending: false }).limit(500),
        supabase.from("psych_tasks" as never).select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(500),
      ]);
      return {
        sessions: (s.data ?? []) as unknown as PsychSession[],
        checkins: (c.data ?? []) as unknown as PsychCheckin[],
        tasks: (t.data ?? []) as unknown as PsychTask[],
      };
    },
  });

  const sessions = data?.sessions ?? [];
  const checkins = data?.checkins ?? [];
  const tasks = data?.tasks ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["psych", userId] });
  }, [qc, userId]);

  // ===== SESSIONS =====
  const createSession = async (input: Omit<PsychSession, "id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("psych_sessions" as never).insert({ ...input, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  };
  const updateSession = async (id: string, patch: Partial<PsychSession>) => {
    const { error } = await supabase.from("psych_sessions" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  };
  const deleteSession = async (id: string) => {
    const { error } = await supabase.from("psych_sessions" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== CHECKINS =====
  const upsertCheckin = async (input: Omit<PsychCheckin, "id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const existing = checkins.find((c) => c.date === input.date);
    if (existing) {
      const { error } = await supabase.from("psych_checkins" as never).update(input as never).eq("id", existing.id);
      if (!error) await refresh();
      return error;
    }
    const { error } = await supabase.from("psych_checkins" as never).insert({ ...input, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  };
  const deleteCheckin = async (id: string) => {
    const { error } = await supabase.from("psych_checkins" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== TASKS =====
  const createTask = async (input: Omit<PsychTask, "id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("psych_tasks" as never).insert({ ...input, user_id: user.id } as never);
    if (!error) await refresh();
    return error;
  };
  const updateTask = async (id: string, patch: Partial<PsychTask>) => {
    const { error } = await supabase.from("psych_tasks" as never).update(patch as never).eq("id", id);
    if (!error) await refresh();
    return error;
  };
  const toggleTask = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const completed = t.status !== "completed";
    return updateTask(id, {
      status: completed ? "completed" : "pending",
      completed_at: completed ? new Date().toISOString() : null,
    });
  };
  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("psych_tasks" as never).delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  return {
    sessions, checkins, tasks, loading: isLoading, refresh,
    createSession, updateSession, deleteSession,
    upsertCheckin, deleteCheckin,
    createTask, updateTask, toggleTask, deleteTask,
  };
}
