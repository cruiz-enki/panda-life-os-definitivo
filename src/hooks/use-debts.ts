/**
 * Hook del módulo **Deudas** (no-tarjeta): préstamos personales, hipoteca,
 * auto, deudas con familia. Calcula estrategias avalancha vs bola de nieve
 * y fecha proyectada de "libertad de deudas".
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type DebtKind =
  | "personal_loan"
  | "mortgage"
  | "auto"
  | "family"
  | "student"
  | "business"
  | "other";

export type Debt = {
  id: string;
  user_id: string;
  name: string;
  kind: DebtKind;
  creditor: string | null;
  currency: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number; // % anual
  monthly_payment: number;
  payment_day: number | null;
  start_date: string | null;
  end_date: string | null;
  emoji: string;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const DEBT_KIND_META: Record<DebtKind, { label: string; emoji: string }> = {
  personal_loan: { label: "Préstamo personal", emoji: "💸" },
  mortgage: { label: "Hipoteca", emoji: "🏠" },
  auto: { label: "Auto", emoji: "🚗" },
  family: { label: "Familia / amigos", emoji: "👨‍👩‍👧" },
  student: { label: "Estudiantil", emoji: "🎓" },
  business: { label: "Negocio", emoji: "🏢" },
  other: { label: "Otro", emoji: "📄" },
};

export type PayoffStrategy = "avalanche" | "snowball";

export type PayoffMonth = {
  month: number; // 0-index desde hoy
  date: string; // YYYY-MM
  totalBalance: number;
  totalInterest: number;
  totalPaid: number;
  perDebt: { id: string; balance: number; paid: number; interest: number }[];
};

export type PayoffResult = {
  months: PayoffMonth[];
  monthsToFreedom: number;
  freedomDate: string | null;
  totalInterestPaid: number;
  totalPaid: number;
  feasible: boolean; // false si el pago mínimo total no cubre intereses
};

/**
 * Simula pagos mes a mes aplicando estrategia:
 * - avalanche: ordena por tasa desc → paga extra al de mayor tasa
 * - snowball: ordena por saldo asc → paga extra al de menor saldo
 * `extraPerMonth` es dinero adicional sobre la suma de pagos mínimos.
 * Retorna hasta 600 meses (50 años) para evitar loops infinitos.
 */
export function simulatePayoff(
  debts: Debt[],
  strategy: PayoffStrategy,
  extraPerMonth = 0,
): PayoffResult {
  const active = debts
    .filter((d) => d.status === "active" && d.current_balance > 0)
    .map((d) => ({
      id: d.id,
      balance: Number(d.current_balance),
      rate: Number(d.interest_rate) / 100 / 12,
      minPayment: Number(d.monthly_payment),
    }));

  if (active.length === 0) {
    return {
      months: [],
      monthsToFreedom: 0,
      freedomDate: null,
      totalInterestPaid: 0,
      totalPaid: 0,
      feasible: true,
    };
  }

  // ¿El pago total cubre los intereses del primer mes?
  const firstInterest = active.reduce((s, d) => s + d.balance * d.rate, 0);
  const totalMin = active.reduce((s, d) => s + d.minPayment, 0);
  const feasible = totalMin + extraPerMonth > firstInterest;

  const months: PayoffMonth[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const MAX_MONTHS = 600;
  const now = new Date();

  for (let m = 0; m < MAX_MONTHS; m++) {
    // 1) Aplica interés del mes a cada deuda
    const interestByDebt = new Map<string, number>();
    for (const d of active) {
      const interest = d.balance * d.rate;
      d.balance += interest;
      interestByDebt.set(d.id, interest);
      totalInterestPaid += interest;
    }

    // 2) Presupuesto del mes: mínimos + extra
    let budget = totalMin + extraPerMonth;
    const paidByDebt = new Map<string, number>();

    // 3) Paga mínimos primero
    for (const d of active) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, budget);
      d.balance -= pay;
      budget -= pay;
      paidByDebt.set(d.id, pay);
    }

    // 4) Extra al objetivo según estrategia
    const remaining = active.filter((d) => d.balance > 0.01);
    remaining.sort((a, b) =>
      strategy === "avalanche" ? b.rate - a.rate : a.balance - b.balance,
    );
    for (const d of remaining) {
      if (budget <= 0) break;
      const extra = Math.min(budget, d.balance);
      d.balance -= extra;
      budget -= extra;
      paidByDebt.set(d.id, (paidByDebt.get(d.id) ?? 0) + extra);
    }

    const monthTotalPaid = Array.from(paidByDebt.values()).reduce((s, v) => s + v, 0);
    totalPaid += monthTotalPaid;

    const totalBalance = active.reduce((s, d) => s + Math.max(0, d.balance), 0);
    const date = new Date(now.getFullYear(), now.getMonth() + m + 1, 1);
    months.push({
      month: m,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      totalBalance,
      totalInterest: Array.from(interestByDebt.values()).reduce((s, v) => s + v, 0),
      totalPaid: monthTotalPaid,
      perDebt: active.map((d) => ({
        id: d.id,
        balance: Math.max(0, d.balance),
        paid: paidByDebt.get(d.id) ?? 0,
        interest: interestByDebt.get(d.id) ?? 0,
      })),
    });

    if (totalBalance <= 0.5) break;
    if (!feasible && m > 12) break; // corta si no es viable
  }

  const last = months[months.length - 1];
  const done = last && last.totalBalance <= 0.5;

  return {
    months,
    monthsToFreedom: done ? months.length : Infinity,
    freedomDate: done ? last.date : null,
    totalInterestPaid,
    totalPaid,
    feasible,
  };
}

export function useDebts() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["debts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("debts" as any)
        .select("*")
        .order("current_balance", { ascending: false });
      return ((data ?? []) as unknown as Debt[]).map((d) => ({
        ...d,
        original_amount: Number(d.original_amount),
        current_balance: Number(d.current_balance),
        interest_rate: Number(d.interest_rate),
        monthly_payment: Number(d.monthly_payment),
      }));
    },
  });

  const debts = data ?? [];

  const totals = useMemo(() => {
    const active = debts.filter((d) => d.status === "active");
    return {
      totalBalance: active.reduce((s, d) => s + d.current_balance, 0),
      totalMonthly: active.reduce((s, d) => s + d.monthly_payment, 0),
      count: active.length,
      weightedRate:
        active.length === 0
          ? 0
          : active.reduce((s, d) => s + d.interest_rate * d.current_balance, 0) /
            Math.max(1, active.reduce((s, d) => s + d.current_balance, 0)),
    };
  }, [debts]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["debts"] });

  const createDebt = async (input: Omit<Debt, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;
    const { error } = await supabase.from("debts" as any).insert([{ ...input, user_id: userId } as any]);
    if (!error) invalidate();
    return error;
  };
  const updateDebt = async (id: string, patch: Partial<Debt>) => {
    const { error } = await supabase.from("debts" as any).update(patch as any).eq("id", id);
    if (!error) invalidate();
    return error;
  };
  const deleteDebt = async (id: string) => {
    const { error } = await supabase.from("debts" as any).delete().eq("id", id);
    if (!error) invalidate();
    return error;
  };

  return {
    debts,
    totals,
    loading: isLoading,
    createDebt,
    updateDebt,
    deleteDebt,
  };
}
