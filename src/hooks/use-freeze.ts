/**
 * **Streak Freeze**: protege la racha del Battle Pass cuando el usuario
 * falla un día. Se compra con XP y tiene límites de inventario y de uso
 * mensual para evitar abuso.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/auth-context";
import { useAppState } from "../lib/storage";

/**
 * Coste en XP para comprar un Streak Freeze.
 */
export const FREEZE_COST = 500;
/**
 * Máximo de freezes que puede tener el usuario en inventario.
 */
export const MAX_INVENTORY = 2;
/**
 * Máximo de freezes que puede usar por mes.
 */
export const MAX_PER_MONTH = 2;

/**
 * Registro persistido de un freeze (comprado / usado).
 */
export type StreakFreeze = {
  id: string;
  acquired_at: string;
  used_at: string | null;
  used_for_date: string | null;
  cost_xp: number;
};

const monthKey = (d: string | Date) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Devuelve inventario, freezes usados este mes y mutaciones para
 * comprar/usar.
 */
export function useFreeze() {
  const { user } = useAuth();
  const { state, addBonusXp } = useAppState();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data: freezes = [], isLoading: loading } = useQuery({
    queryKey: ["streak_freezes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("streak_freezes")
        .select("*")
        .eq("user_id", userId!)
        .order("acquired_at", { ascending: false });
      return (data ?? []) as StreakFreeze[];
    },
  });

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["streak_freezes"] });
  }, [qc]);

  const available = useMemo(() => freezes.filter((f) => !f.used_at), [freezes]);
  const used = useMemo(() => freezes.filter((f) => f.used_at), [freezes]);
  const usedThisMonth = useMemo(() => {
    const mk = monthKey(new Date());
    return used.filter((f) => f.used_at && monthKey(f.used_at) === mk);
  }, [used]);

  const lastUsedDate = useMemo(() => {
    const sorted = [...used].sort((a, b) => (b.used_for_date ?? "").localeCompare(a.used_for_date ?? ""));
    return sorted[0]?.used_for_date ?? null;
  }, [used]);

  const buy = useCallback(async () => {
    if (!userId) return;
    if (available.length >= MAX_INVENTORY) {
      toast.error(`Inventario lleno (máx ${MAX_INVENTORY})`);
      return;
    }
    if (state.xp < FREEZE_COST) {
      toast.error(`Necesitas ${FREEZE_COST} XP`);
      return;
    }
    const { error } = await supabase.from("streak_freezes").insert({
      user_id: userId, cost_xp: FREEZE_COST,
    });
    if (error) { toast.error("No se pudo comprar"); return; }
    addBonusXp(-FREEZE_COST);
    toast.success("🧊 ¡Freeze comprado!", { description: "Listo para proteger tu racha." });
    refresh();
  }, [userId, available.length, state.xp, addBonusXp, refresh]);

  const useFreezeNow = useCallback(async (forDate: string) => {
    if (!userId) return false;
    if (available.length === 0) { toast.error("No tienes Freeze disponibles"); return false; }
    if (usedThisMonth.length >= MAX_PER_MONTH) {
      toast.error(`Límite mensual alcanzado (${MAX_PER_MONTH}/mes)`);
      return false;
    }
    if (lastUsedDate) {
      const prev = new Date(forDate);
      prev.setDate(prev.getDate() - 1);
      const prevKey = prev.toISOString().slice(0, 10);
      if (lastUsedDate === prevKey) {
        toast.error("No puedes usar Freeze dos días seguidos");
        return false;
      }
    }
    const slot = available[0];
    const { error } = await supabase
      .from("streak_freezes")
      .update({ used_at: new Date().toISOString(), used_for_date: forDate })
      .eq("id", slot.id);
    if (error) { toast.error("No se pudo activar"); return false; }
    toast.success("🧊 Racha protegida", { description: "Hoy no suma XP, pero tu racha sigue viva." });
    refresh();
    return true;
  }, [userId, available, usedThisMonth.length, lastUsedDate, refresh]);

  return {
    loading,
    freezes,
    available,
    used,
    usedThisMonth,
    canBuy: available.length < MAX_INVENTORY && state.xp >= FREEZE_COST,
    canUse: available.length > 0 && usedThisMonth.length < MAX_PER_MONTH,
    buy,
    useFreezeNow,
    refresh,
  };
}
