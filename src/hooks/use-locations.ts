import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type LocationCheckin = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  place_id: string | null;
  visited_at: string;
  note: string | null;
  rating: number | null;
  created_at: string;
};

export const LOCATION_CATEGORIES = [
  { key: "ciudad", label: "Ciudad / País", color: "#3b82f6", emoji: "🌍" },
  { key: "restaurante", label: "Restaurante", color: "#f59e0b", emoji: "🍽️" },
  { key: "hogar", label: "Hogar / Estancia", color: "#10b981", emoji: "🏠" },
  { key: "momento", label: "Momento / Hito", color: "#ec4899", emoji: "✨" },
] as const;

export const categoryMeta = (key: string) =>
  LOCATION_CATEGORIES.find((c) => c.key === key) ?? LOCATION_CATEGORIES[0];

export function useLocations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["location-checkins", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("location_checkins" as never)
        .select("*")
        .eq("user_id", userId!)
        .order("visited_at", { ascending: false })
        .limit(1000);
      return (data ?? []) as unknown as LocationCheckin[];
    },
  });

  const checkins = data ?? [];
  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: ["location-checkins", userId] }),
    [qc, userId],
  );

  const add = async (input: Omit<LocationCheckin, "id" | "user_id" | "created_at">) => {
    if (!userId) return "No auth";
    const { error } = await supabase
      .from("location_checkins" as never)
      .insert({ ...input, user_id: userId } as never);
    if (!error) refresh();
    return error?.message;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("location_checkins" as never).delete().eq("id", id);
    if (!error) refresh();
    return error?.message;
  };

  const update = async (id: string, patch: Partial<Omit<LocationCheckin, "id" | "user_id">>) => {
    const { error } = await supabase
      .from("location_checkins" as never)
      .update(patch as never)
      .eq("id", id);
    if (!error) refresh();
    return error?.message;
  };

  // Métricas
  const uniqueCities = new Set(
    checkins.filter((c) => c.category === "ciudad").map((c) => c.name.toLowerCase()),
  ).size;
  const totalsByCategory = checkins.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return { checkins, isLoading, add, update, remove, refresh, uniqueCities, totalsByCategory };
}
