/**
 * Hook **Metas de ahorro**: fondo de emergencia + sinking funds.
 * Carga metas y aportaciones; expone mutaciones CRUD y helpers de progreso.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type SavingsGoalKind =
  | "emergency" | "travel" | "gifts" | "insurance" | "tenencia"
  | "taxes" | "gadget" | "home" | "car" | "wedding" | "education" | "other";

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  kind: SavingsGoalKind;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  linked_account_id: string | null;
  emoji: string;
  color: string | null;
  note: string | null;
  priority: number;
  status: string;
  months_of_expenses: number | null;
  created_at: string;
  updated_at: string;
};

export type SavingsContribution = {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  note: string | null;
  created_at: string;
};

export const GOAL_KIND_META: Record<SavingsGoalKind, { label: string; emoji: string }> = {
  emergency: { label: "Fondo de emergencia", emoji: "🛟" },
  travel: { label: "Viaje", emoji: "✈️" },
  gifts: { label: "Regalos", emoji: "🎁" },
  insurance: { label: "Seguros", emoji: "🛡️" },
  tenencia: { label: "Tenencia / verificación", emoji: "🚗" },
  taxes: { label: "Impuestos", emoji: "🧾" },
  gadget: { label: "Gadget", emoji: "🎧" },
  home: { label: "Casa", emoji: "🏠" },
  car: { label: "Auto", emoji: "🚙" },
  wedding: { label: "Boda", emoji: "💍" },
  education: { label: "Educación", emoji: "📚" },
  other: { label: "Otro", emoji: "🎯" },
};

export function useSavingsGoals() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["savings-goals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [g, c] = await Promise.all([
        supabase.from("savings_goals" as any).select("*").order("priority", { ascending: false }),
        supabase.from("savings_contributions" as any).select("*").order("contribution_date", { ascending: false }),
      ]);
      return {
        goals: ((g.data ?? []) as unknown as SavingsGoal[]).map((x) => ({
          ...x,
          target_amount: Number(x.target_amount),
          current_amount: Number(x.current_amount),
          monthly_contribution: Number(x.monthly_contribution),
          months_of_expenses: x.months_of_expenses == null ? null : Number(x.months_of_expenses),
        })),
        contributions: ((c.data ?? []) as unknown as SavingsContribution[]).map((x) => ({
          ...x,
          amount: Number(x.amount),
        })),
      };
    },
  });

  const goals = data?.goals ?? [];
  const contributions = data?.contributions ?? [];

  const totals = useMemo(() => {
    const active = goals.filter((g) => g.status === "active");
    const target = active.reduce((s, g) => s + g.target_amount, 0);
    const current = active.reduce((s, g) => s + g.current_amount, 0);
    const monthly = active.reduce((s, g) => s + g.monthly_contribution, 0);
    return {
      target,
      current,
      monthly,
      progress: target > 0 ? current / target : 0,
      count: active.length,
    };
  }, [goals]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["savings-goals"] });

  const createGoal = async (input: Partial<SavingsGoal> & { name: string }) => {
    if (!userId) return;
    const { error } = await supabase.from("savings_goals" as any).insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateGoal = async (id: string, patch: Partial<SavingsGoal>) => {
    const { error } = await supabase.from("savings_goals" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("savings_goals" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  const addContribution = async (goalId: string, amount: number, note?: string) => {
    if (!userId) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("savings_contributions" as any).insert([{
      user_id: userId, goal_id: goalId, amount, contribution_date: today, note: note ?? null,
    } as any]);
    if (error) return error;
    const newBalance = Number(goal.current_amount) + amount;
    const err2 = await supabase.from("savings_goals" as any)
      .update({ current_amount: newBalance } as any).eq("id", goalId);
    invalidate();
    return err2.error ?? null;
  };

  const deleteContribution = async (id: string) => {
    const contrib = contributions.find((c) => c.id === id);
    const { error } = await supabase.from("savings_contributions" as any).delete().eq("id", id);
    if (error) return error;
    if (contrib) {
      const goal = goals.find((g) => g.id === contrib.goal_id);
      if (goal) {
        const newBalance = Math.max(0, Number(goal.current_amount) - contrib.amount);
        await supabase.from("savings_goals" as any).update({ current_amount: newBalance } as any).eq("id", goal.id);
      }
    }
    invalidate();
    return null;
  };

  return {
    goals,
    contributions,
    totals,
    loading: isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
  };
}
