import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Streak, NotificationQueueRow, ModuleKey } from "@/lib/notifications-engine-types";

export type NotificationSettings = {
  global_notifications_enabled: boolean;
  timezone: string;
  preferred_morning_time: string;
  preferred_evening_time: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  allow_streak_notifications: boolean;
  allow_quest_notifications: boolean;
  allow_money_notifications: boolean;
  allow_home_notifications: boolean;
  allow_learning_notifications: boolean;
  allow_health_notifications: boolean;
  allow_motivational_notifications: boolean;
  max_daily_notifications: number;
  onesignal_player_id: string | null;
};

const DEFAULTS: NotificationSettings = {
  global_notifications_enabled: true,
  timezone: "America/Mexico_City",
  preferred_morning_time: "08:30:00",
  preferred_evening_time: "20:00:00",
  quiet_hours_start: 22,
  quiet_hours_end: 7,
  allow_streak_notifications: true,
  allow_quest_notifications: true,
  allow_money_notifications: true,
  allow_home_notifications: true,
  allow_learning_notifications: true,
  allow_health_notifications: true,
  allow_motivational_notifications: true,
  max_daily_notifications: 3,
  onesignal_player_id: null,
};

export function useNotificationsEngine() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [queue, setQueue] = useState<NotificationQueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const [prefsRes, streaksRes, queueRes] = await Promise.all([
      supabase.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", userId).order("current_streak", { ascending: false }),
      supabase
        .from("notification_queue")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (prefsRes.data) {
      setSettings({ ...DEFAULTS, ...(prefsRes.data as unknown as NotificationSettings) });
    } else {
      setSettings(DEFAULTS);
    }
    setStreaks((streaksRes.data as Streak[]) ?? []);
    setQueue((queueRes.data as NotificationQueueRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSettings = useCallback(async (patch: Partial<NotificationSettings>) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    const next = { ...(settings ?? DEFAULTS), ...patch };
    setSettings(next);
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  }, [settings]);

  const bumpStreak = useCallback(async (moduleKey: ModuleKey) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    await supabase.rpc("bump_streak", { _user_id: userId, _module_key: moduleKey });
    await load();
  }, [load]);

  return { settings, streaks, queue, loading, updateSettings, bumpStreak, reload: load };
}
