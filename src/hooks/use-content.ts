/**
 * Hooks para la **Bitácora de Contenido** y **Wishlist**: lectura y
 * escritura directa a Supabase con TanStack Query.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/integrations/supabase/types";

type ContentUpdate = Database["public"]["Tables"]["content_log"]["Update"];
type WishUpdate = Database["public"]["Tables"]["wishlist"]["Update"];
import type {
  ContentLogItem,
  ContentStatus,
  ContentType,
  Recommend,
  WishPriority,
  WishReason,
  WishlistItem,
  WishlistType,
} from "../lib/content-types";

type DBContent = {
  id: string;
  title: string;
  content_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  rating: number | null;
  genre: string | null;
  platform: string | null;
  notes: string | null;
  key_learnings: string | null;
  recommend: string | null;
  tags: string[] | null;
  progress_percent: number | null;
  current_position: string | null;
  created_at: string;
  updated_at: string;
};

function mapContent(r: DBContent): ContentLogItem {
  return {
    id: r.id,
    title: r.title,
    contentType: (r.content_type as ContentType) ?? "other",
    status: (r.status as ContentStatus) ?? "pending",
    startDate: r.start_date,
    endDate: r.end_date,
    rating: r.rating,
    genre: r.genre ?? "",
    platform: r.platform ?? "",
    notes: r.notes ?? "",
    keyLearnings: r.key_learnings ?? "",
    recommend: (r.recommend as Recommend | null) ?? null,
    tags: r.tags ?? [],
    progressPercent: r.progress_percent ?? 0,
    currentPosition: r.current_position ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

type DBWish = {
  id: string;
  title: string;
  item_type: string;
  priority: string;
  reason: string;
  source: string | null;
  notes: string | null;
  tags: string[] | null;
  remind_at: string | null;
  purchased: boolean;
  created_at: string;
  updated_at: string;
};

function mapWish(r: DBWish): WishlistItem {
  return {
    id: r.id,
    title: r.title,
    itemType: (r.item_type as WishlistType) ?? "other",
    priority: (r.priority as WishPriority) ?? "medium",
    reason: (r.reason as WishReason) ?? "personal",
    source: r.source ?? "",
    notes: r.notes ?? "",
    tags: r.tags ?? [],
    remindAt: r.remind_at,
    purchased: r.purchased,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Bitácora de contenido consumido (libros, pelis, series, etc.).
 * Devuelve la lista y mutaciones para crear, actualizar y borrar.
 */
export function useContentLog() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["content_log", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DBContent[]).map(mapContent);
    },
  });

  const reload = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["content_log"] });
  }, [qc]);

  const addItem = useCallback(
    async (input: Omit<ContentLogItem, "id" | "createdAt" | "updatedAt">) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("content_log")
        .insert({
          user_id: userId,
          title: input.title,
          content_type: input.contentType,
          status: input.status,
          start_date: input.startDate,
          end_date: input.endDate,
          rating: input.rating,
          genre: input.genre,
          platform: input.platform,
          notes: input.notes,
          key_learnings: input.keyLearnings,
          recommend: input.recommend,
          tags: input.tags,
          progress_percent: input.progressPercent,
          current_position: input.currentPosition,
        })
        .select("*")
        .single();
      if (error || !data) return null;
      const mapped = mapContent(data as DBContent);
      reload();
      return mapped;
    },
    [userId, reload],
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<ContentLogItem>) => {
      if (!userId) return;
      const dbPatch: ContentUpdate = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.contentType !== undefined) dbPatch.content_type = patch.contentType;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
      if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
      if (patch.rating !== undefined) dbPatch.rating = patch.rating;
      if (patch.genre !== undefined) dbPatch.genre = patch.genre;
      if (patch.platform !== undefined) dbPatch.platform = patch.platform;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;
      if (patch.keyLearnings !== undefined) dbPatch.key_learnings = patch.keyLearnings;
      if (patch.recommend !== undefined) dbPatch.recommend = patch.recommend;
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      if (patch.progressPercent !== undefined) dbPatch.progress_percent = patch.progressPercent;
      if (patch.currentPosition !== undefined) dbPatch.current_position = patch.currentPosition;

      await supabase.from("content_log").update(dbPatch).eq("id", id);
      reload();
    },
    [userId, reload],
  );

  const deleteItem = useCallback(async (id: string) => {
    await supabase.from("content_log").delete().eq("id", id);
    reload();
  }, [reload]);

  return { items, loading, addItem, updateItem, deleteItem, reload };
}

/**
 * Lista de deseos: ítems pendientes de consumir. Devuelve la lista
 * y mutaciones CRUD.
 */
export function useWishlist() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DBWish[]).map(mapWish);
    },
  });

  const reload = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["wishlist"] });
  }, [qc]);

  const addItem = useCallback(
    async (input: Omit<WishlistItem, "id" | "createdAt" | "updatedAt" | "purchased"> & { purchased?: boolean }) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("wishlist")
        .insert({
          user_id: userId,
          title: input.title,
          item_type: input.itemType,
          priority: input.priority,
          reason: input.reason,
          source: input.source,
          notes: input.notes,
          tags: input.tags,
          remind_at: input.remindAt,
          purchased: input.purchased ?? false,
        })
        .select("*")
        .single();
      if (error || !data) return null;
      const mapped = mapWish(data as DBWish);
      reload();
      return mapped;
    },
    [userId, reload],
  );

  const updateItem = useCallback(async (id: string, patch: Partial<WishlistItem>) => {
    const dbPatch: WishUpdate = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.itemType !== undefined) dbPatch.item_type = patch.itemType;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.reason !== undefined) dbPatch.reason = patch.reason;
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.remindAt !== undefined) dbPatch.remind_at = patch.remindAt;
    if (patch.purchased !== undefined) dbPatch.purchased = patch.purchased;

    await supabase.from("wishlist").update(dbPatch).eq("id", id);
    reload();
  }, [reload]);

  const deleteItem = useCallback(async (id: string) => {
    await supabase.from("wishlist").delete().eq("id", id);
    reload();
  }, [reload]);

  return { items, loading, addItem, updateItem, deleteItem, reload };
}
