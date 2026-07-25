/**
 * Tipos y helpers del módulo **Finanzas**: tarjetas, gastos, ingresos,
 * planes MSI, pagos, presupuestos y categorías.
 */

export type CardStatus = "active" | "paused" | "cancelled";
export type PaymentMethod = "cash" | "debit" | "transfer" | "credit" | "mercadopago" | "other";
export type ExpenseKind = "expense" | "income";
export type ExpenseType = "normal" | "msi" | "msi_charge";
export type MsiStatus = "active" | "finished" | "cancelled";

export type CreditCard = {
  id: string;
  name: string;
  bank: string;
  last_four: string;
  credit_limit: number;
  current_balance: number;
  cut_day: number;
  payment_day: number;
  min_payment: number;
  no_interest_payment: number;
  color: string;
  icon: string;
  status: CardStatus;
  nip_code?: string;
  clabe?: string;
};

export type FinanceExpense = {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  payment_method: PaymentMethod;
  card_id: string | null;
  note: string;
  tags: string[];
  kind: ExpenseKind;
  expense_type: ExpenseType;
  msi_plan_id: string | null;
};

export type MsiPlan = {
  id: string;
  card_id: string | null;
  description: string;
  total_amount: number;
  months: number;
  monthly_amount: number;
  start_date: string;
  category: string;
  note: string;
  paid_months: number;
  status: MsiStatus;
};

export type CardPayment = {
  id: string;
  card_id: string;
  amount: number;
  date: string;
  payment_method: PaymentMethod;
  note: string;
};

export type FinanceBudget = {
  id: string;
  category: string | null; // null = general
  amount: number;
  month: string; // 'YYYY-MM'
};

export type FinanceCategory = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: ExpenseKind;
};

// Categorías default sugeridas
export const DEFAULT_CATEGORIES: { name: string; emoji: string; kind: ExpenseKind }[] = [
  { name: "Comida personal", emoji: "🍽️", kind: "expense" },
  { name: "Comida familia", emoji: "🍝", kind: "expense" },
  { name: "Transporte", emoji: "🚗", kind: "expense" },
  { name: "Salud", emoji: "💊", kind: "expense" },
  { name: "Casa", emoji: "🏠", kind: "expense" },
  { name: "Mascotas", emoji: "🐾", kind: "expense" },
  { name: "Gaby", emoji: "💖", kind: "expense" },
  { name: "Consentirme", emoji: "✨", kind: "expense" },
  { name: "Suscripciones", emoji: "📺", kind: "expense" },
  { name: "Deudas", emoji: "💳", kind: "expense" },
  { name: "Ahorro", emoji: "🐷", kind: "expense" },
  { name: "Otros", emoji: "📦", kind: "expense" },
  { name: "Salario", emoji: "💼", kind: "income" },
  { name: "Freelance", emoji: "💻", kind: "income" },
  { name: "Otros ingresos", emoji: "💰", kind: "income" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Débito",
  transfer: "Transferencia",
  credit: "Tarjeta de crédito",
  mercadopago: "MercadoPago",
  other: "Otro",
};

export const CARD_COLORS = [
  "oklch(0.65 0.20 260)", // azul
  "oklch(0.65 0.22 25)",  // rojo
  "oklch(0.7 0.20 145)",  // verde
  "oklch(0.75 0.18 80)",  // amarillo/dorado
  "oklch(0.6 0.22 320)",  // morado
  "oklch(0.55 0.05 250)", // gris azulado
  "oklch(0.5 0.10 30)",   // bronce
  "oklch(0.7 0.20 200)",  // turquesa
];

/**
 * Formatea un número como pesos mexicanos (`$1,234.56`).
 */
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Calcula la próxima fecha de corte de la tarjeta a partir de hoy
export function nextCutDate(cutDay: number, from: Date = new Date()): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  // último día del mes para clamp
  const lastDayThisMonth = new Date(year, month + 1, 0).getDate();
  const dayThisMonth = Math.min(cutDay, lastDayThisMonth);
  const candidate = new Date(year, month, dayThisMonth, 23, 59, 59);
  if (candidate >= from) return candidate;
  const lastDayNextMonth = new Date(year, month + 2, 0).getDate();
  const dayNext = Math.min(cutDay, lastDayNextMonth);
  return new Date(year, month + 1, dayNext, 23, 59, 59);
}

// Próxima fecha de pago
export function nextPaymentDate(paymentDay: number, from: Date = new Date()): Date {
  return nextCutDate(paymentDay, from);
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const ms = date.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Desglose del saldo de una tarjeta: cuánto va al próximo corte vs MSI futuros
export type CardBalanceBreakdown = {
  total: number;            // deuda total guardada
  msiThisMonth: number;     // suma de mensualidades MSI activas (cae en próximo corte)
  msiCommitted: number;     // suma de mensualidades MSI futuras (incluye este mes)
  nextCutNormal: number;    // gastos de contado del periodo del próximo corte
  nextCutCharge: number;    // total a pagar en próximo corte = nextCutNormal + msiThisMonth
};

export function cardBalanceBreakdown(
  card: CreditCard,
  expenses: FinanceExpense[],
  msiPlans: MsiPlan[],
): CardBalanceBreakdown {
  const cardExp = expenses.filter((e) => e.card_id === card.id && e.kind === "expense");
  const activeMsi = msiPlans.filter((p) => p.card_id === card.id && p.status === "active");

  const msiThisMonth = activeMsi.reduce((s, p) => s + Number(p.monthly_amount), 0);
  const msiCommitted = activeMsi.reduce(
    (s, p) => s + Math.max(0, Number(p.months) - Number(p.paid_months)) * Number(p.monthly_amount),
    0,
  );

  // Próximo corte: gastos "normales" (no MSI original) cuya expensePeriod = próximo corte
  const nextCut = nextCutDate(card.cut_day);
  const nextCutKey = `${nextCut.getFullYear()}-${nextCut.getMonth()}`;
  const nextCutNormal = cardExp
    .filter((e) => e.expense_type !== "msi") // excluir compra MSI original (ya está en mensualidades)
    .filter((e) => {
      // los msi_charge ya cuentan como mensualidad → no duplicar
      if (e.expense_type === "msi_charge") return false;
      const p = expensePeriod(e.date, card.cut_day);
      return `${p.getFullYear()}-${p.getMonth()}` === nextCutKey;
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  return {
    total: Number(card.current_balance),
    msiThisMonth,
    msiCommitted,
    nextCutNormal,
    nextCutCharge: nextCutNormal + msiThisMonth,
  };
}

// Cuadre de saldo: compara declarado vs computado
export type CardReconciliation = {
  declared: number;
  msiCommitted: number;
  nextCutCharge: number;
  priorCutsPending: number; // declarado - msiCommitted - nextCutCharge
  diff: number;             // declarado - (msiCommitted + nextCutCharge + max(priorCutsPending,0))
  isBalanced: boolean;
};

export function cardReconciliation(
  card: CreditCard,
  expenses: FinanceExpense[],
  msiPlans: MsiPlan[],
): CardReconciliation {
  const b = cardBalanceBreakdown(card, expenses, msiPlans);
  const declared = b.total;
  const priorCutsPending = declared - b.msiCommitted - b.nextCutCharge;
  // Si priorCutsPending es positivo, asumimos que es saldo de cortes anteriores aún no pagado.
  // Si es negativo, faltan planes/compras por cargar (no cuadra).
  const diff = priorCutsPending < 0 ? priorCutsPending : 0;
  return {
    declared,
    msiCommitted: b.msiCommitted,
    nextCutCharge: b.nextCutCharge,
    priorCutsPending: Math.max(0, priorCutsPending),
    diff,
    isBalanced: Math.abs(diff) <= 50,
  };
}

// Determina a qué periodo (fecha de corte) pertenece un gasto según fecha y cut_day
export function expensePeriod(expenseDate: string, cutDay: number): Date {
  const d = new Date(expenseDate + "T12:00:00");
  // Si el día <= cut_day, pertenece al corte de este mes
  // Si día > cut_day, pertenece al corte del siguiente mes
  const year = d.getFullYear();
  const month = d.getMonth();
  if (d.getDate() <= cutDay) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(cutDay, lastDay));
  }
  const lastDay = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(cutDay, lastDay));
}
