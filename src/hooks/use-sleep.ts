import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type SleepLog = {
  id: string;
  user_id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality: number | null;
  source: string;
  notes: string | null;
};

const IDEAL_SLEEP_MIN = 8 * 60;

export function useSleep() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["sleep-logs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("sleep_logs" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("date", { ascending: false })
        .limit(120);
      return (data ?? []) as unknown as SleepLog[];
    },
  });

  const logs = data ?? [];

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["sleep-logs", userId] }), [qc, userId]);

  const upsert = async (input: {
    date: string;
    bedtime?: string | null;
    wake_time?: string | null;
    duration_minutes?: number | null;
    quality?: number | null;
    notes?: string | null;
    source?: string;
  }) => {
    if (!userId) return;
    const payload = { ...input, user_id: userId, source: input.source ?? "manual" };
    const { error } = await supabase
      .from("sleep_logs" as never)
      .upsert(payload as never, { onConflict: "user_id,date" });
    if (!error) refresh();
    return error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("sleep_logs" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  // Métricas
  const last7 = logs.slice(0, 7);
  const avgQuality = last7.length
    ? last7.reduce((s, l) => s + (l.quality ?? 0), 0) / last7.filter((l) => l.quality).length
    : 0;
  const avgDurationMin = last7.length
    ? last7.reduce((s, l) => s + (l.duration_minutes ?? 0), 0) / last7.filter((l) => l.duration_minutes).length
    : 0;
  const sleepDebtMin = last7.reduce(
    (s, l) => s + Math.max(0, IDEAL_SLEEP_MIN - (l.duration_minutes ?? IDEAL_SLEEP_MIN)),
    0,
  );

  return { logs, isLoading, upsert, remove, refresh, avgQuality, avgDurationMin, sleepDebtMin };
}
