/**
 * Hook **Money Tools**: gestiona sobres (envelopes), reglas de auto-clasificación
 * y logs de carga mensual de gastos recurrentes.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFinance } from "@/hooks/use-finance";
import { useCashflow } from "@/hooks/use-cashflow";
import { monthKey } from "@/lib/finance-types";
import { todayCDMX } from "@/lib/date-utils";

export type BudgetEnvelope = {
  id: string;
  user_id: string;
  month: string;
  category: string;
  emoji: string;
  percent: number | null;
  amount: number;
  kind: "need" | "want" | "save";
  note: string | null;
};

export type RuleMatchType = "note_contains" | "amount_equals" | "amount_on_day";

export type ExpenseRule = {
  id: string;
  user_id: string;
  name: string;
  match_type: RuleMatchType;
  match_text: string | null;
  match_amount: number | null;
  match_day: number | null;
  set_category: string;
  set_tags: string[];
  priority: number;
  status: string;
};

export type RecurringLog = {
  id: string;
  user_id: string;
  recurring_id: string;
  month: string;
  expense_id: string | null;
  loaded_at: string;
};

export function useMoneyTools() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const currentMonth = monthKey(new Date());
  const { recurring } = useCashflow();
  const { expenses } = useFinance();

  const { data, isLoading } = useQuery({
    queryKey: ["money-tools", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [env, rules, logs] = await Promise.all([
        supabase.from("budget_envelopes" as any).select("*").order("category"),
        supabase.from("expense_rules" as any).select("*").order("priority"),
        supabase.from("recurring_expense_logs" as any).select("*"),
      ]);
      return {
        envelopes: ((env.data ?? []) as unknown as BudgetEnvelope[]).map((x) => ({
          ...x,
          amount: Number(x.amount),
          percent: x.percent === null ? null : Number(x.percent),
        })),
        rules: ((rules.data ?? []) as unknown as ExpenseRule[]).map((x) => ({
          ...x,
          match_amount: x.match_amount === null ? null : Number(x.match_amount),
        })),
        logs: (logs.data ?? []) as unknown as RecurringLog[],
      };
    },
  });

  const envelopes = data?.envelopes ?? [];
  const rules = data?.rules ?? [];
  const logs = data?.logs ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["money-tools"] });
  const invalidateFinance = () => qc.invalidateQueries({ queryKey: ["finance"] });

  // ===== ENVELOPES =====
  const upsertEnvelope = async (input: Omit<BudgetEnvelope, "id" | "user_id">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("budget_envelopes" as any)
      .upsert(
        [{ ...input, user_id: userId } as any],
        { onConflict: "user_id,month,category" },
      );
    if (!error) invalidate();
    return error;
  };
  const deleteEnvelope = async (id: string) => {
    const { error } = await supabase.from("budget_envelopes" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  /** Copia sobres de una plantilla (month='template') al mes actual. */
  const loadEnvelopeTemplate = async () => {
    if (!userId) return;
    const template = envelopes.filter((e) => e.month === "template");
    if (template.length === 0) return;
    const rows = template.map((t) => ({
      user_id: userId,
      month: currentMonth,
      category: t.category,
      emoji: t.emoji,
      percent: t.percent,
      amount: t.amount,
      kind: t.kind,
      note: t.note,
    }));
    const { error } = await supabase
      .from("budget_envelopes" as any)
      .upsert(rows as any, { onConflict: "user_id,month,category" });
    if (!error) invalidate();
    return error;
  };

  // ===== REGLAS =====
  const createRule = async (input: Omit<ExpenseRule, "id" | "user_id">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("expense_rules" as any)
      .insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateRule = async (id: string, patch: Partial<ExpenseRule>) => {
    const { error } = await supabase.from("expense_rules" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteRule = async (id: string) => {
    const { error } = await supabase.from("expense_rules" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  /** Aplica reglas a un gasto candidato. Devuelve categoría/tags si matchea. */
  const applyRules = (input: { amount: number; note: string; date: string }): {
    category?: string;
    tags?: string[];
    ruleName?: string;
  } => {
    const active = rules.filter((r) => r.status === "active").sort((a, b) => a.priority - b.priority);
    const day = Number(input.date.slice(8, 10));
    for (const r of active) {
      if (r.match_type === "note_contains" && r.match_text) {
        if (input.note.toLowerCase().includes(r.match_text.toLowerCase())) {
          return { category: r.set_category, tags: r.set_tags, ruleName: r.name };
        }
      } else if (r.match_type === "amount_equals" && r.match_amount) {
        if (Math.abs(input.amount - r.match_amount) < 0.01) {
          return { category: r.set_category, tags: r.set_tags, ruleName: r.name };
        }
      } else if (r.match_type === "amount_on_day" && r.match_amount && r.match_day) {
        if (Math.abs(input.amount - r.match_amount) < 0.01 && day === r.match_day) {
          return { category: r.set_category, tags: r.set_tags, ruleName: r.name };
        }
      }
    }
    return {};
  };

  // ===== RECURRENTES: carga mensual + detección de faltantes =====

  /** Estado de cada recurrente para el mes actual: cargado o pendiente. */
  const recurringStatus = useMemo(() => {
    return recurring
      .filter((r) => r.status === "active")
      .map((r) => {
        const log = logs.find((l) => l.recurring_id === r.id && l.month === currentMonth);
        return { recurring: r, loaded: !!log, log };
      });
  }, [recurring, logs, currentMonth]);

  const pendingRecurring = recurringStatus.filter((s) => !s.loaded);

  /** Carga un gasto recurrente al mes actual: crea finance_expense + log. */
  const loadRecurring = async (recurringId: string) => {
    if (!userId) return;
    const r = recurring.find((x) => x.id === recurringId);
    if (!r) return;
    const today = todayCDMX();
    const day = r.day_of_month ?? Number(today.slice(8, 10));
    const [y, m] = currentMonth.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const targetDay = Math.min(day, lastDay);
    const date = `${currentMonth}-${String(targetDay).padStart(2, "0")}`;

    const { data: exp, error: eErr } = await supabase
      .from("finance_expenses")
      .insert([
        {
          user_id: userId,
          amount: r.amount,
          date,
          category: r.category || "Otros",
          payment_method: "transfer",
          card_id: null,
          note: `${r.emoji || "📌"} ${r.name} (${currentMonth})`,
          tags: ["recurrente"],
          kind: "expense",
          expense_type: "normal",
        } as any,
      ])
      .select()
      .single();
    if (eErr) return eErr;

    const { error: lErr } = await supabase.from("recurring_expense_logs" as any).insert([
      {
        user_id: userId,
        recurring_id: recurringId,
        month: currentMonth,
        expense_id: (exp as any)?.id ?? null,
      } as any,
    ]);
    if (!lErr) {
      invalidate();
      invalidateFinance();
    }
    return lErr;
  };

  /** Carga TODOS los pendientes del mes de un click. */
  const loadAllPending = async () => {
    for (const s of pendingRecurring) {
      await loadRecurring(s.recurring.id);
    }
  };

  const unloadRecurring = async (logId: string, expenseId: string | null) => {
    if (expenseId) {
      await supabase.from("finance_expenses").delete().eq("id", expenseId);
    }
    await supabase.from("recurring_expense_logs" as any).delete().eq("id", logId);
    invalidate();
    invalidateFinance();
  };

  // ===== Semáforo semanal de sobres =====
  const envelopeProgress = useMemo(() => {
    const monthEnv = envelopes.filter((e) => e.month === currentMonth);
    const [y, m] = currentMonth.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const today = new Date();
    const dayOfMonth = today.getMonth() + 1 === m && today.getFullYear() === y ? today.getDate() : lastDay;
    const expectedProgress = dayOfMonth / lastDay;

    return monthEnv.map((env) => {
      const spent = expenses
        .filter(
          (e) =>
            e.kind === "expense" &&
            e.category === env.category &&
            e.date.startsWith(currentMonth),
        )
        .reduce((s, e) => s + Number(e.amount), 0);
      const pctUsed = env.amount > 0 ? spent / env.amount : 0;
      // Semáforo: verde si vas dentro del ritmo, amarillo si vas justo, rojo si vas rebasado
      let light: "green" | "yellow" | "red" = "green";
      if (pctUsed > 1) light = "red";
      else if (pctUsed > expectedProgress + 0.1) light = "yellow";
      if (pctUsed > 1.1) light = "red";
      return {
        envelope: env,
        spent,
        remaining: env.amount - spent,
        pctUsed,
        expectedProgress,
        light,
      };
    });
  }, [envelopes, expenses, currentMonth]);

  return {
    loading: isLoading,
    currentMonth,
    // envelopes
    envelopes,
    envelopeProgress,
    upsertEnvelope,
    deleteEnvelope,
    loadEnvelopeTemplate,
    // rules
    rules,
    createRule,
    updateRule,
    deleteRule,
    applyRules,
    // recurring
    recurringStatus,
    pendingRecurring,
    loadRecurring,
    loadAllPending,
    unloadRecurring,
  };
}
