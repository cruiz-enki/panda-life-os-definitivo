/**
 * Hook **Cashflow**: proyecta ingresos y gastos fijos a 30/60/90 días.
 * Combina income_sources, recurring_expenses, suscripciones (home_services),
 * MSI activos y pagos mínimos de tarjetas de crédito.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFinance } from "@/hooks/use-finance";
import { useServices } from "@/hooks/use-services";

export type IncomeFrequency = "monthly" | "biweekly" | "weekly" | "yearly" | "one_time";

export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  day_of_month: number | null;
  second_day_of_month: number | null;
  next_date: string | null;
  category: string | null;
  emoji: string;
  note: string | null;
  status: string;
};

export type RecurringExpense = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  day_of_month: number | null;
  category: string | null;
  emoji: string;
  note: string | null;
  status: string;
};

export type CashflowEvent = {
  date: string; // YYYY-MM-DD
  amount: number; // positivo = ingreso, negativo = gasto
  label: string;
  emoji: string;
  kind: "income" | "fixed" | "subscription" | "msi" | "card_min";
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Devuelve la próxima fecha (>= today) con ese día del mes, respetando días válidos. */
function nextDateForDay(today: Date, day: number, monthsAhead = 0): Date {
  const y = today.getFullYear();
  const m = today.getMonth() + monthsAhead;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(day, lastDay);
  const candidate = new Date(y, m, d);
  if (monthsAhead === 0 && candidate < startOfDay(today)) {
    return nextDateForDay(today, day, 1);
  }
  return candidate;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Genera fechas de un ingreso dentro de un rango. */
function incomeOccurrences(inc: IncomeSource, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  if (inc.frequency === "one_time") {
    if (inc.next_date) {
      const d = new Date(inc.next_date + "T00:00:00");
      if (d >= from && d <= to) out.push(d);
    }
    return out;
  }
  if (inc.frequency === "yearly") {
    if (inc.next_date) {
      let d = new Date(inc.next_date + "T00:00:00");
      while (d < from) d.setFullYear(d.getFullYear() + 1);
      while (d <= to) {
        out.push(new Date(d));
        d.setFullYear(d.getFullYear() + 1);
      }
    }
    return out;
  }
  if (inc.frequency === "weekly" || inc.frequency === "biweekly") {
    if (inc.next_date) {
      const step = inc.frequency === "weekly" ? 7 : 14;
      let d = new Date(inc.next_date + "T00:00:00");
      while (d < from) d.setDate(d.getDate() + step);
      while (d <= to) {
        out.push(new Date(d));
        d.setDate(d.getDate() + step);
      }
    }
    return out;
  }
  // monthly: usa day_of_month (y opcional second_day_of_month)
  const days = [inc.day_of_month, inc.second_day_of_month].filter(
    (x): x is number => typeof x === "number",
  );
  if (days.length === 0) return out;
  const cursor = new Date(from);
  cursor.setDate(1);
  const end = new Date(to);
  while (cursor <= end) {
    for (const day of days) {
      const dt = nextDateForDay(cursor, day, 0);
      if (dt >= from && dt <= to) out.push(dt);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export function useCashflow() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const { cards, msiPlans } = useFinance();
  const { services } = useServices();

  const { data, isLoading } = useQuery({
    queryKey: ["cashflow", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [i, e] = await Promise.all([
        supabase.from("income_sources" as any).select("*").order("day_of_month"),
        supabase.from("recurring_expenses" as any).select("*").order("day_of_month"),
      ]);
      return {
        incomes: ((i.data ?? []) as unknown as IncomeSource[]).map((x) => ({
          ...x,
          amount: Number(x.amount),
        })),
        recurring: ((e.data ?? []) as unknown as RecurringExpense[]).map((x) => ({
          ...x,
          amount: Number(x.amount),
        })),
      };
    },
  });

  const incomes = data?.incomes ?? [];
  const recurring = data?.recurring ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cashflow"] });

  // ===== CRUD ingresos =====
  const createIncome = async (input: Omit<IncomeSource, "id" | "user_id">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("income_sources" as any)
      .insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateIncome = async (id: string, patch: Partial<IncomeSource>) => {
    const { error } = await supabase.from("income_sources" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from("income_sources" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  // ===== CRUD gastos fijos =====
  const createRecurring = async (input: Omit<RecurringExpense, "id" | "user_id">) => {
    if (!userId) return;
    const { error } = await supabase
      .from("recurring_expenses" as any)
      .insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateRecurring = async (id: string, patch: Partial<RecurringExpense>) => {
    const { error } = await supabase.from("recurring_expenses" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteRecurring = async (id: string) => {
    const { error } = await supabase.from("recurring_expenses" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  /** Genera la línea de tiempo de eventos proyectados en los próximos N días. */
  const buildTimeline = useMemo(() => {
    return (daysAhead: number): CashflowEvent[] => {
      const today = startOfDay(new Date());
      const end = new Date(today);
      end.setDate(end.getDate() + daysAhead);

      const events: CashflowEvent[] = [];

      // Ingresos
      for (const inc of incomes) {
        if (inc.status !== "active") continue;
        for (const d of incomeOccurrences(inc, today, end)) {
          events.push({
            date: iso(d),
            amount: inc.amount,
            label: inc.name,
            emoji: inc.emoji || "💵",
            kind: "income",
          });
        }
      }

      // Gastos fijos recurrentes (mensual)
      for (const r of recurring) {
        if (r.status !== "active" || !r.day_of_month) continue;
        const cursor = new Date(today);
        cursor.setDate(1);
        while (cursor <= end) {
          const dt = nextDateForDay(cursor, r.day_of_month, 0);
          if (dt >= today && dt <= end) {
            events.push({
              date: iso(dt),
              amount: -r.amount,
              label: r.name,
              emoji: r.emoji || "📌",
              kind: "fixed",
            });
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      }

      // Suscripciones (home_services activas con due_day y monthly_cost)
      for (const s of services) {
        if (s.status !== "active" || !s.due_day || !s.monthly_cost) continue;
        const cursor = new Date(today);
        cursor.setDate(1);
        while (cursor <= end) {
          const dt = nextDateForDay(cursor, s.due_day, 0);
          if (dt >= today && dt <= end) {
            events.push({
              date: iso(dt),
              amount: -Number(s.monthly_cost),
              label: s.name,
              emoji: "🔁",
              kind: "subscription",
            });
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      }

      // MSI activos: monthly_amount se paga junto con la tarjeta (payment_day)
      for (const plan of msiPlans) {
        if (plan.status !== "active" || !plan.card_id) continue;
        const remaining = plan.months - plan.paid_months;
        if (remaining <= 0) continue;
        const card = cards.find((c) => c.id === plan.card_id);
        if (!card?.payment_day) continue;
        const cursor = new Date(today);
        cursor.setDate(1);
        let count = 0;
        while (cursor <= end && count < remaining) {
          const dt = nextDateForDay(cursor, card.payment_day, 0);
          if (dt >= today && dt <= end) {
            events.push({
              date: iso(dt),
              amount: -plan.monthly_amount,
              label: `MSI: ${plan.description}`,
              emoji: "📅",
              kind: "msi",
            });
            count++;
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      }

      // Pago mínimo de tarjetas
      for (const card of cards) {
        if (card.status !== "active" || !card.payment_day || !card.min_payment) continue;
        if (Number(card.current_balance) <= 0) continue;
        const cursor = new Date(today);
        cursor.setDate(1);
        while (cursor <= end) {
          const dt = nextDateForDay(cursor, card.payment_day, 0);
          if (dt >= today && dt <= end) {
            events.push({
              date: iso(dt),
              amount: -Number(card.min_payment),
              label: `Mín. ${card.name}`,
              emoji: "💳",
              kind: "card_min",
            });
          }
          cursor.setMonth(cursor.getMonth() + 1);
        }
      }

      events.sort((a, b) => a.date.localeCompare(b.date));
      return events;
    };
  }, [incomes, recurring, services, msiPlans, cards]);

  const summary = useMemo(() => {
    const build = (days: number) => {
      const evs = buildTimeline(days);
      const income = evs.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
      const outflow = evs.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);
      return { income, outflow, net: income + outflow, events: evs };
    };
    return {
      d30: build(30),
      d60: build(60),
      d90: build(90),
    };
  }, [buildTimeline]);

  return {
    incomes,
    recurring,
    loading: isLoading,
    createIncome,
    updateIncome,
    deleteIncome,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    buildTimeline,
    summary,
  };
}
