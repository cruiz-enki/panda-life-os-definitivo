/**
 * Hook del módulo **Net Worth**: cuentas de activos + snapshots mensuales.
 * Combina saldo total de activos con deuda total (tarjetas de crédito) para
 * dar un único número de patrimonio.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFinance } from "@/hooks/use-finance";

export type AssetAccountKind =
  | "cash"
  | "debit"
  | "savings"
  | "investment"
  | "crypto"
  | "retirement"
  | "real_estate"
  | "other";

export type AssetAccount = {
  id: string;
  user_id: string;
  name: string;
  kind: AssetAccountKind;
  institution: string | null;
  currency: string;
  current_balance: number;
  emoji: string;
  color: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type NetWorthSnapshot = {
  id: string;
  user_id: string;
  snapshot_date: string; // YYYY-MM-DD
  assets_total: number;
  debts_total: number;
  net_worth: number;
  breakdown: any;
  note: string | null;
  created_at: string;
};

export const ASSET_KIND_META: Record<AssetAccountKind, { label: string; emoji: string }> = {
  cash: { label: "Efectivo", emoji: "💵" },
  debit: { label: "Débito", emoji: "🏦" },
  savings: { label: "Ahorro", emoji: "🐷" },
  investment: { label: "Inversión", emoji: "📈" },
  crypto: { label: "Cripto", emoji: "🪙" },
  retirement: { label: "Retiro / Afore", emoji: "🏛️" },
  real_estate: { label: "Inmueble", emoji: "🏠" },
  other: { label: "Otro", emoji: "💼" },
};

export function useNetWorth() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const { cards } = useFinance();

  const { data, isLoading } = useQuery({
    queryKey: ["net-worth", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [a, s] = await Promise.all([
        supabase.from("asset_accounts" as any).select("*").order("created_at"),
        supabase.from("net_worth_snapshots" as any).select("*").order("snapshot_date", { ascending: true }),
      ]);
      return {
        accounts: ((a.data ?? []) as unknown as AssetAccount[]).map((x) => ({
          ...x,
          current_balance: Number(x.current_balance),
        })),
        snapshots: ((s.data ?? []) as unknown as NetWorthSnapshot[]).map((x) => ({
          ...x,
          assets_total: Number(x.assets_total),
          debts_total: Number(x.debts_total),
          net_worth: Number(x.net_worth),
        })),
      };
    },
  });

  const accounts = data?.accounts ?? [];
  const snapshots = data?.snapshots ?? [];

  const totals = useMemo(() => {
    const assets = accounts
      .filter((a) => a.status === "active")
      .reduce((s, a) => s + a.current_balance, 0);
    const debts = cards.reduce((s, c) => s + Number(c.current_balance), 0);
    return {
      assets,
      debts,
      netWorth: assets - debts,
    };
  }, [accounts, cards]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["net-worth"] });

  const createAccount = async (input: Omit<AssetAccount, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase.from("asset_accounts" as any).insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateAccount = async (id: string, patch: Partial<AssetAccount>) => {
    const { error } = await supabase.from("asset_accounts" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("asset_accounts" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  const createSnapshot = async (note?: string) => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    const breakdown = {
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, kind: a.kind, balance: a.current_balance })),
      cards: cards.map((c) => ({ id: c.id, name: c.name, balance: Number(c.current_balance) })),
    };
    const { error } = await supabase.from("net_worth_snapshots" as any).upsert(
      [{
        user_id: userId,
        snapshot_date: today,
        assets_total: totals.assets,
        debts_total: totals.debts,
        net_worth: totals.netWorth,
        breakdown,
        note: note ?? null,
      } as any],
      { onConflict: "user_id,snapshot_date" }
    );
    if (!error) invalidate();
    return error;
  };

  const deleteSnapshot = async (id: string) => {
    const { error } = await supabase.from("net_worth_snapshots" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  return {
    accounts,
    snapshots,
    totals,
    loading: isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
    createSnapshot,
    deleteSnapshot,
  };
}
