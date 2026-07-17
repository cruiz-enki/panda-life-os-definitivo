/**
 * Inventario del **Hogar**: productos y stock (despensa, baño, limpieza…).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";

/**
 * Ítem del inventario doméstico con cantidad y categoría.
 */
export type InventoryItem = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  purchase_place: string | null;
  model_number: string | null;
  serial_number: string | null;
  technical_details: any;
  notes: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Devuelve los ítems del inventario y mutaciones CRUD.
 */
export function useHomeInventory() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const key = ["home_inventory", userId] as const;

  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_inventory")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["home_inventory"] });

  const createItem = async (item: Omit<InventoryItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("home_inventory")
      .insert({ ...item, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    invalidate();
    return data;
  };

  const updateItem = async (id: string, item: Partial<InventoryItem>) => {
    const { data, error } = await supabase
      .from("home_inventory")
      .update(item)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    invalidate();
    return data;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("home_inventory").delete().eq("id", id);
    if (error) throw error;
    invalidate();
  };

  return {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    refresh: () => refetch(),
  };
}
