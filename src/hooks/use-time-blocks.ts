import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type TimeBlock = {
  id: string;
  user_id: string;
  date: string;
  start_time: string; // HH:MM:SS
  end_time: string;
  category: string;
  identity_area: string | null;
  project: string | null;
  note: string | null;
};

export const TIME_CATEGORIES = [
  { key: "deep-work", label: "Deep Work", color: "#6366f1" },
  { key: "admin", label: "Admin / Correo", color: "#94a3b8" },
  { key: "reuniones", label: "Reuniones", color: "#f59e0b" },
  { key: "ejercicio", label: "Ejercicio", color: "#10b981" },
  { key: "familia", label: "Familia", color: "#ec4899" },
  { key: "descanso", label: "Descanso", color: "#8b5cf6" },
  { key: "ocio", label: "Ocio", color: "#06b6d4" },
  { key: "aprendizaje", label: "Aprendizaje", color: "#84cc16" },
  { key: "otro", label: "Otro", color: "#64748b" },
];

export const categoryMeta = (key: string) =>
  TIME_CATEGORIES.find((c) => c.key === key) ?? TIME_CATEGORIES[TIME_CATEGORIES.length - 1];

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

export function useTimeBlocks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["time-blocks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("time_blocks" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("date", { ascending: false })
        .order("start_time", { ascending: true })
        .limit(500);
      return (data ?? []) as unknown as TimeBlock[];
    },
  });

  const blocks = data ?? [];
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["time-blocks", userId] }), [qc, userId]);

  const add = async (input: Omit<TimeBlock, "id" | "user_id">) => {
    if (!userId) return;
    const { error } = await supabase.from("time_blocks" as never).insert({ ...input, user_id: userId } as never);
    if (!error) refresh();
    return error;
  };

  const update = async (id: string, patch: Partial<Omit<TimeBlock, "id" | "user_id">>) => {
    const { error } = await supabase.from("time_blocks" as never).update(patch as never).eq("id", id);
    if (!error) refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("time_blocks" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  // Métricas: totales por categoría últimos 7 días
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const last7 = blocks.filter((b) => b.date >= weekAgo && b.date <= today);
  const totalsByCategory = last7.reduce<Record<string, number>>((acc, b) => {
    const min = minutesBetween(b.start_time, b.end_time);
    acc[b.category] = (acc[b.category] ?? 0) + min;
    return acc;
  }, {});

  return { blocks, isLoading, add, update, remove, refresh, minutesBetween, totalsByCategory };
}
