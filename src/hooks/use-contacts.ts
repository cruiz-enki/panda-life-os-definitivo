import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  tags: string[] | null;
  birthday: string | null;
  anniversary: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  how_we_met: string | null;
  last_contact_at: string | null;
  next_contact_at: string | null;
  cadence_days: number | null;
  importance: number;
  notes: string | null;
  pending_topics: string[] | null;
};

export type ContactInteraction = {
  id: string;
  user_id: string;
  contact_id: string;
  occurred_at: string;
  kind: string;
  summary: string | null;
  notes: string | null;
  next_agenda: string | null;
  mood: number | null;
};

export type GiftIdea = {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  notes: string | null;
  url: string | null;
  price: number | null;
  currency: string | null;
  occasion: string | null;
  target_date: string | null;
  status: string;
};

export function useContacts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const contactsQ = useQuery({
    queryKey: ["contacts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("name");
      return (data ?? []) as unknown as Contact[];
    },
  });

  const interactionsQ = useQuery({
    queryKey: ["contact-interactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_interactions" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("occurred_at", { ascending: false })
        .limit(500);
      return (data ?? []) as unknown as ContactInteraction[];
    },
  });

  const giftsQ = useQuery({
    queryKey: ["gift-ideas", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("gift_ideas" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as GiftIdea[];
    },
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["contacts", userId] });
    qc.invalidateQueries({ queryKey: ["contact-interactions", userId] });
    qc.invalidateQueries({ queryKey: ["gift-ideas", userId] });
  }, [qc, userId]);

  const upsertContact = async (input: Partial<Contact> & { name: string }) => {
    if (!userId) return;
    const payload = { ...input, user_id: userId };
    const { error } = await supabase.from("contacts" as never).upsert(payload as never);
    if (!error) refresh();
    return error;
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from("contacts" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  const addInteraction = async (input: Partial<ContactInteraction> & { contact_id: string }) => {
    if (!userId) return;
    const payload = { ...input, user_id: userId };
    const { error } = await supabase.from("contact_interactions" as never).insert(payload as never);
    if (!error) {
      // actualizar last_contact_at del contacto
      await supabase
        .from("contacts" as never)
        .update({ last_contact_at: input.occurred_at ?? new Date().toISOString().slice(0, 10) } as never)
        .eq("id", input.contact_id);
      refresh();
    }
    return error;
  };

  const removeInteraction = async (id: string) => {
    const { error } = await supabase.from("contact_interactions" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  const upsertGift = async (input: Partial<GiftIdea> & { title: string }) => {
    if (!userId) return;
    const payload = { ...input, user_id: userId };
    const { error } = await supabase.from("gift_ideas" as never).upsert(payload as never);
    if (!error) refresh();
    return error;
  };

  const removeGift = async (id: string) => {
    const { error } = await supabase.from("gift_ideas" as never).delete().eq("id", id);
    if (!error) refresh();
  };

  return {
    contacts: contactsQ.data ?? [],
    interactions: interactionsQ.data ?? [],
    gifts: giftsQ.data ?? [],
    isLoading: contactsQ.isLoading,
    upsertContact,
    removeContact,
    addInteraction,
    removeInteraction,
    upsertGift,
    removeGift,
    refresh,
  };
}

// Utilidades
export function daysUntilAnnualDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const target = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    target.setFullYear(now.getFullYear() + 1);
  }
  return Math.round((target.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
}

export function isContactDue(c: Contact): boolean {
  if (c.next_contact_at) return new Date(c.next_contact_at) <= new Date();
  if (c.cadence_days && c.last_contact_at) {
    const last = new Date(c.last_contact_at);
    const due = new Date(last.getTime() + c.cadence_days * 86400000);
    return due <= new Date();
  }
  return false;
}
