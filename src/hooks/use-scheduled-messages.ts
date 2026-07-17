import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ScheduledChannel = "telegram" | "email" | "push" | "inapp" | "whatsapp";

export type ScheduledMessage = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  channels: ScheduledChannel[];
  scheduled_at: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  delivery_log: Record<string, { ok: boolean; error?: string }>;
  sent_at: string | null;
  inapp_read_at: string | null;
  created_at: string;
};

export function useScheduledMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["scheduled-messages", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("scheduled_messages" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("scheduled_at", { ascending: false })
        .limit(200);
      return (data ?? []) as unknown as ScheduledMessage[];
    },
  });

  const messages = data ?? [];
  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: ["scheduled-messages", userId] }),
    [qc, userId],
  );

  const create = async (input: {
    title: string;
    body: string;
    channels: ScheduledChannel[];
    scheduled_at: string;
  }) => {
    if (!userId) return "not-authenticated";
    const { error } = await supabase.from("scheduled_messages" as never).insert({
      user_id: userId,
      title: input.title,
      body: input.body,
      channels: input.channels,
      scheduled_at: input.scheduled_at,
    } as never);
    if (!error) refresh();
    return error?.message;
  };

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("scheduled_messages" as never)
      .update({ status: "cancelled" } as never)
      .eq("id", id);
    if (!error) refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("scheduled_messages" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("scheduled_messages" as never)
      .update({ inapp_read_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (!error) refresh();
  };

  const inbox = messages.filter(
    (m) => m.status === "sent" && m.channels.includes("inapp"),
  );
  const unreadInapp = inbox.filter((m) => !m.inapp_read_at).length;

  return { messages, inbox, unreadInapp, loading: isLoading, refresh, create, cancel, remove, markRead };
}
