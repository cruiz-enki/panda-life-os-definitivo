/**
 * Inventario de **objetos mágicos** desbloqueables/compraibles con XP
 * (items con efectos sobre la app, p.ej. boosters).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { useAppState } from "../lib/storage";
import { toast } from "sonner";

/**
 * Definición de un objeto mágico disponible en la tienda.
 */
export type MagicItem = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cost_xp: number;
  effect_type: 'xp_multiplier' | 'streak_shield' | 'instant_xp' | 'energy_boost';
  effect_value: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

/**
 * Instancia poseída por el usuario (con cantidad y estado).
 */
export type InventoryItem = {
  id: string;
  item_id: string;
  quantity: number;
  is_active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  item: MagicItem;
};

/**
 * Devuelve la tienda, el inventario del usuario y mutaciones para
 * comprar/activar.
 */
export function useInventory() {
  const { user } = useAuth();
  const { state, addBonusXp } = useAppState();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["inventory", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [iData, invData] = await Promise.all([
        supabase.from("magic_items").select("*").eq("active", true),
        supabase.from("user_inventory").select("*, item:magic_items(*)").eq("user_id", userId!),
      ]);
      return {
        items: (iData.data ?? []) as MagicItem[],
        inventory: (invData.data ?? []) as any as InventoryItem[],
      };
    },
  });

  const items = data?.items ?? [];
  const inventory = data?.inventory ?? [];
  const fetchInventory = () => qc.invalidateQueries({ queryKey: ["inventory"] });

  const buyItem = async (item: MagicItem) => {
    if (!user) return;
    if (state.xp < item.cost_xp) {
      toast.error("XP insuficiente para comprar este objeto.");
      return;
    }

    addBonusXp(-item.cost_xp);

    const existing = inventory.find(i => i.item_id === item.id);

    if (existing) {
      const { error } = await supabase
        .from("user_inventory")
        .update({ quantity: existing.quantity + 1 } as any)
        .eq("id", existing.id);

      if (error) {
        addBonusXp(item.cost_xp);
        toast.error("Error al procesar la compra.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_inventory")
        .insert({
          user_id: user.id,
          item_id: item.id,
          quantity: 1
        } as any);

      if (error) {
        addBonusXp(item.cost_xp);
        toast.error("Error al procesar la compra.");
        return;
      }
    }

    toast.success(`¡Has comprado ${item.emoji} ${item.name}!`);
    fetchInventory();
  };

  const activateItem = async (inventoryId: string) => {
    const invItem = inventory.find(i => i.id === inventoryId);
    if (!invItem || invItem.quantity <= 0) return;

    const item = invItem.item;

    if (item.effect_type === 'instant_xp') {
      const amount = item.effect_value.amount || 0;
      addBonusXp(amount);

      if (invItem.quantity > 1) {
        await supabase.from("user_inventory").update({ quantity: invItem.quantity - 1 } as any).eq("id", inventoryId);
      } else {
        await supabase.from("user_inventory").delete().eq("id", inventoryId);
      }

      toast.success(`¡Has usado ${item.emoji}! +${amount} XP ganados.`);
      fetchInventory();
      return;
    }

    if (item.effect_type === 'xp_multiplier') {
      const durationHours = item.effect_value.duration_hours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);

      const { error } = await supabase
        .from("user_inventory")
        .update({
          is_active: true,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          quantity: invItem.quantity - 1
        } as any)
        .eq("id", inventoryId);

      if (error) {
        toast.error("Error al activar el objeto.");
        return;
      }

      toast.success(`¡${item.name} activado! Multiplicador x${item.effect_value.multiplier} activo por ${durationHours}h.`);
      fetchInventory();
    }
  };

  return {
    items,
    inventory,
    loading,
    buyItem,
    activateItem,
    refresh: fetchInventory,
  };
}
