import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type MoodLog = {
  id: string;
  user_id: string;
  logged_at: string;
  mood: string;
  intensity: number;
  tags: string[];
  note: string | null;
};

export const MOOD_OPTIONS = [
  { key: "great", emoji: "🤩", label: "Excelente" },
  { key: "good", emoji: "🙂", label: "Bien" },
  { key: "meh", emoji: "😐", label: "Neutro" },
  { key: "low", emoji: "😔", label: "Bajo" },
  { key: "bad", emoji: "😩", label: "Mal" },
];

export const MOOD_TAGS = [
  "enfocado", "disperso", "energético", "cansado", "ansioso", "tranquilo",
  "motivado", "abrumado", "creativo", "irritable", "agradecido", "solo",
  "conectado", "estresado", "descansado", "hambriento", "activo", "sedentario",
];

export function useMood() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["mood-logs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_logs" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("logged_at", { ascending: false })
        .limit(200);
      return (data ?? []) as unknown as MoodLog[];
    },
  });

  const logs = data ?? [];
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["mood-logs", userId] }), [qc, userId]);

  const add = async (input: { mood: string; intensity?: number; tags?: string[]; note?: string }) => {
    if (!userId) return;
    const payload = {
      user_id: userId,
      mood: input.mood,
      intensity: input.intensity ?? 3,
      tags: input.tags ?? [],
      note: input.note ?? null,
    };
    const { error } = await supabase.from("mood_logs" as never).insert(payload as never);
    if (!error) refresh();
    return error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("mood_logs" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  // Correlación simple: promedio de mood ordinal por tag en los últimos 30 días
  const moodScore = (m: string) => ({ great: 5, good: 4, meh: 3, low: 2, bad: 1 })[m] ?? 3;
  const last30 = logs.filter((l) => Date.now() - new Date(l.logged_at).getTime() < 30 * 86400000);
  const avgMood30 = last30.length ? last30.reduce((s, l) => s + moodScore(l.mood), 0) / last30.length : 0;
  const tagStats = (() => {
    const acc: Record<string, { sum: number; count: number }> = {};
    for (const l of last30) {
      for (const t of l.tags) {
        acc[t] = acc[t] ?? { sum: 0, count: 0 };
        acc[t].sum += moodScore(l.mood);
        acc[t].count += 1;
      }
    }
    return Object.entries(acc)
      .filter(([, v]) => v.count >= 2)
      .map(([tag, v]) => ({ tag, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.count - a.count);
  })();

  return { logs, isLoading, add, remove, refresh, avgMood30, tagStats };
}
