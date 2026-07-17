/**
 * Hook del módulo **Finanzas**: tarjetas, gastos, ingresos, planes MSI,
 * pagos y presupuestos. Carga paralela con TanStack Query.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type {
  CreditCard,
  FinanceExpense,
  MsiPlan,
  CardPayment,
  FinanceBudget,
  FinanceCategory,
} from "@/lib/finance-types";

/**
 * Devuelve todos los datos financieros del usuario más mutaciones
 * CRUD. Es la fuente de verdad para snapshots de gamificación.
 */
export function useFinance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["finance", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [c, e, m, p, b, cat] = await Promise.all([
        supabase.from("credit_cards").select("*").order("created_at"),
        supabase.from("finance_expenses").select("*").order("date", { ascending: false }).limit(2000),
        supabase.from("msi_plans").select("*").order("start_date", { ascending: false }),
        supabase.from("card_payments").select("*").order("date", { ascending: false }),
        supabase.from("finance_budgets").select("*"),
        supabase.from("finance_categories").select("*").order("name"),
      ]);
      return {
        cards: (c.data ?? []) as unknown as CreditCard[],
        expenses: ((e.data ?? []) as unknown as FinanceExpense[]).map(normalizeExpense),
        msiPlans: ((m.data ?? []) as unknown as MsiPlan[]).map(normalizeMsi),
        payments: ((p.data ?? []) as unknown as CardPayment[]).map(normalizePayment),
        budgets: ((b.data ?? []) as unknown as FinanceBudget[]).map(normalizeBudget),
        categories: (cat.data ?? []) as unknown as FinanceCategory[],
      };
    },
  });

  const cards = data?.cards ?? [];
  const expenses = data?.expenses ?? [];
  const msiPlans = data?.msiPlans ?? [];
  const payments = data?.payments ?? [];
  const budgets = data?.budgets ?? [];
  const categories = data?.categories ?? [];

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["finance", userId] });
  }, [qc, userId]);

  // ===== TARJETAS =====
  const createCard = async (input: Omit<CreditCard, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("credit_cards").insert([{ ...input, user_id: user.id } as any]);
    if (!error) await refresh();
    return error;
  };

  const updateCard = async (id: string, patch: Partial<CreditCard>) => {
    const { error } = await supabase.from("credit_cards").update(patch as any).eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("credit_cards").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== GASTOS =====
  const createExpense = async (input: Omit<FinanceExpense, "id">, opts?: { skipBalanceUpdate?: boolean }) => {
    if (!user) return;
    const { error } = await supabase.from("finance_expenses").insert([{ ...input, user_id: user.id } as any]);
    if (!error) {
      if (!opts?.skipBalanceUpdate && input.card_id && input.payment_method === "credit" && input.kind === "expense" && input.expense_type !== "msi_charge") {
        const card = cards.find((c) => c.id === input.card_id);
        if (card) {
          await supabase
            .from("credit_cards")
            .update({ current_balance: Number(card.current_balance) + input.amount } as any)
            .eq("id", card.id);
        }
      }
      await refresh();
    }
    return error;
  };

  const updateExpense = async (id: string, patch: Partial<FinanceExpense>) => {
    const { error } = await supabase.from("finance_expenses").update(patch as any).eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const deleteExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    const { error } = await supabase.from("finance_expenses").delete().eq("id", id);
    if (!error) {
      if (exp && exp.card_id && exp.payment_method === "credit" && exp.kind === "expense" && exp.expense_type !== "msi_charge") {
        const card = cards.find((c) => c.id === exp.card_id);
        if (card) {
          await supabase
            .from("credit_cards")
            .update({ current_balance: Math.max(0, Number(card.current_balance) - exp.amount) } as any)
            .eq("id", card.id);
        }
      }
      await refresh();
    }
    return error;
  };

  // ===== MSI =====
  const createMsiPlan = async (
    input: Omit<MsiPlan, "id" | "monthly_amount" | "paid_months"> & { paid_months?: number },
    opts?: { skipBalanceUpdate?: boolean },
  ) => {
    if (!user) return;
    const monthly_amount = Number((input.total_amount / input.months).toFixed(2));
    const { error } = await supabase.from("msi_plans").insert([{
      ...input,
      monthly_amount,
      paid_months: input.paid_months ?? 0,
      user_id: user.id,
    } as any]);
    if (!error) {
      if (!opts?.skipBalanceUpdate && input.card_id) {
        const card = cards.find((c) => c.id === input.card_id);
        if (card) {
          const remaining = (input.months - (input.paid_months ?? 0)) * monthly_amount;
          await supabase
            .from("credit_cards")
            .update({ current_balance: Number(card.current_balance) + remaining } as any)
            .eq("id", card.id);
        }
      }
      await refresh();
    }
    return error;
  };

  const updateMsiPlan = async (id: string, patch: Partial<MsiPlan>) => {
    const { error } = await supabase.from("msi_plans").update(patch as any).eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const deleteMsiPlan = async (id: string) => {
    const plan = msiPlans.find((m) => m.id === id);
    const { error } = await supabase.from("msi_plans").delete().eq("id", id);
    if (!error) {
      if (plan && plan.card_id) {
        const remaining = (plan.months - plan.paid_months) * plan.monthly_amount;
        const card = cards.find((c) => c.id === plan.card_id);
        if (card) {
          await supabase
            .from("credit_cards")
            .update({ current_balance: Math.max(0, Number(card.current_balance) - remaining) } as any)
            .eq("id", card.id);
        }
      }
      await refresh();
    }
    return error;
  };

  // ===== PAGOS A TARJETA =====
  const createPayment = async (input: Omit<CardPayment, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("card_payments").insert([{ ...input, user_id: user.id } as any]);
    if (!error) {
      const card = cards.find((c) => c.id === input.card_id);
      if (card) {
          await supabase
            .from("credit_cards")
            .update({ current_balance: Math.max(0, Number(card.current_balance) - input.amount) } as any)
            .eq("id", card.id);
      }
      await refresh();
    }
    return error;
  };

  const deletePayment = async (id: string) => {
    const pay = payments.find((p) => p.id === id);
    const { error } = await supabase.from("card_payments").delete().eq("id", id);
    if (!error) {
      if (pay) {
        const card = cards.find((c) => c.id === pay.card_id);
        if (card) {
          await supabase
            .from("credit_cards")
            .update({ current_balance: Number(card.current_balance) + pay.amount } as any)
            .eq("id", card.id);
        }
      }
      await refresh();
    }
    return error;
  };

  // ===== PRESUPUESTOS =====
  const upsertBudget = async (input: Omit<FinanceBudget, "id">) => {
    if (!user) return;
    const { error } = await supabase
      .from("finance_budgets")
      .upsert({ ...input, user_id: user.id } as any, { onConflict: "user_id,category,month" });
    if (!error) await refresh();
    return error;
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from("finance_budgets").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  // ===== CATEGORÍAS =====
  const createCategory = async (input: Omit<FinanceCategory, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("finance_categories").insert([{ ...input, user_id: user.id } as any]);
    if (!error) await refresh();
    return error;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("finance_categories").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  return {
    cards,
    expenses,
    msiPlans,
    payments,
    budgets,
    categories,
    loading: isLoading,
    refresh,
    createCard,
    updateCard,
    deleteCard,
    createExpense,
    updateExpense,
    deleteExpense,
    createMsiPlan,
    updateMsiPlan,
    deleteMsiPlan,
    createPayment,
    deletePayment,
    upsertBudget,
    deleteBudget,
    createCategory,
    deleteCategory,
  };
}

function normalizeExpense(e: FinanceExpense): FinanceExpense {
  return { ...e, amount: Number(e.amount) };
}
function normalizeMsi(m: MsiPlan): MsiPlan {
  return {
    ...m,
    total_amount: Number(m.total_amount),
    monthly_amount: Number(m.monthly_amount),
  };
}
function normalizePayment(p: CardPayment): CardPayment {
  return { ...p, amount: Number(p.amount) };
}
function normalizeBudget(b: FinanceBudget): FinanceBudget {
  return { ...b, amount: Number(b.amount) };
}
