/**
 * **Feature** — Componentes (parts) del módulo **Finanzas**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN, monthKey, nextCutDate, nextPaymentDate, daysUntil } from "@/lib/finance-types";
import { CardTile } from "@/components/finance/CardTile";
import { CardForm } from "@/components/finance/CardForm";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { PaymentForm } from "@/components/finance/PaymentForm";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, CreditCard as CardIcon, Trash2, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function FinancePage() {
  const f = useFinance();
  const mk = monthKey();

  // ===== Cálculos del mes (memoizados) =====
  const monthly = useMemo(() => {
    const monthExpenses = f.expenses.filter((e) => e.date.startsWith(mk));
    const totalExpense = monthExpenses.filter((e) => e.kind === "expense").reduce((s, e) => s + e.amount, 0);
    const totalIncome = monthExpenses.filter((e) => e.kind === "income").reduce((s, e) => s + e.amount, 0);
    const totalCardSpend = monthExpenses.filter((e) => e.payment_method === "credit").reduce((s, e) => s + e.amount, 0);
    const totalCashSpend = monthExpenses.filter((e) => e.kind === "expense" && e.payment_method !== "credit").reduce((s, e) => s + e.amount, 0);
    return { monthExpenses, totalExpense, totalIncome, balance: totalIncome - totalExpense, totalCardSpend, totalCashSpend };
  }, [f.expenses, mk]);
  const { monthExpenses, totalExpense, totalIncome, balance, totalCardSpend, totalCashSpend } = monthly;

  const cardTotals = useMemo(() => {
    const totalDebt = f.cards.reduce((s, c) => s + Number(c.current_balance), 0);
    const totalLimit = f.cards.reduce((s, c) => s + Number(c.credit_limit), 0);
    return { totalDebt, totalLimit, totalAvailable: Math.max(0, totalLimit - totalDebt) };
  }, [f.cards]);
  const { totalDebt, totalAvailable } = cardTotals;

  const msi = useMemo(() => {
    const activeMsi = f.msiPlans.filter((p) => p.status === "active");
    return {
      activeMsi,
      msiThisMonth: activeMsi.reduce((s, p) => s + p.monthly_amount, 0),
      msiCommitted: activeMsi.reduce((s, p) => s + (p.months - p.paid_months) * p.monthly_amount, 0),
    };
  }, [f.msiPlans]);
  const { activeMsi, msiThisMonth } = msi;

  // Próximos pagos
  const upcomingPayments = useMemo(() => {
    return f.cards
      .filter((c) => c.status === "active" && c.current_balance > 0)
      .map((c) => ({
        card: c,
        date: nextPaymentDate(c.payment_day),
        days: daysUntil(nextPaymentDate(c.payment_day)),
      }))
      .sort((a, b) => a.days - b.days);
  }, [f.cards]);

  // Alertas (memoizadas)
  const alerts = useMemo(() => {
    const out: { msg: string; level: "info" | "warn" | "danger" }[] = [];
    for (const c of f.cards) {
      const dPay = daysUntil(nextPaymentDate(c.payment_day));
      const dCut = daysUntil(nextCutDate(c.cut_day));
      if (dPay <= 3 && c.current_balance > 0) out.push({ msg: `${c.name}: pago vence en ${dPay} día${dPay !== 1 ? "s" : ""}`, level: "danger" });
      else if (dCut <= 3) out.push({ msg: `${c.name}: corta en ${dCut} día${dCut !== 1 ? "s" : ""}`, level: "warn" });
      const usage = c.credit_limit > 0 ? c.current_balance / c.credit_limit : 0;
      if (usage >= 0.9) out.push({ msg: `${c.name} está al ${(usage * 100).toFixed(0)}% del límite`, level: "danger" });
    }
    if (activeMsi.length >= 5) out.push({ msg: `Tienes ${activeMsi.length} planes MSI activos`, level: "warn" });
    return out;
  }, [f.cards, activeMsi]);


  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24 md:pb-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">Control financiero del mes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExpenseForm />
          <PaymentForm />
          <CardForm />
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Ingresos" value={formatMXN(totalIncome)} accent="text-green-500" />
        <KpiCard icon={<TrendingDown className="w-4 h-4" />} label="Gastos" value={formatMXN(totalExpense)} accent="text-red-500" />
        <KpiCard icon={<Wallet className="w-4 h-4" />} label="Balance" value={formatMXN(balance)} accent={balance >= 0 ? "text-green-500" : "text-red-500"} />
        <KpiCard icon={<CardIcon className="w-4 h-4" />} label="Deuda total" value={formatMXN(totalDebt)} accent="text-orange-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<CardIcon className="w-4 h-4" />} label="En tarjetas" value={formatMXN(totalCardSpend)} />
        <KpiCard icon={<Wallet className="w-4 h-4" />} label="Efectivo/débito" value={formatMXN(totalCashSpend)} />
        <KpiCard icon={<Sparkles className="w-4 h-4" />} label="Crédito disponible" value={formatMXN(totalAvailable)} accent="text-primary" />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="MSI este mes" value={formatMXN(msiThisMonth)} accent="text-yellow-500" />
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" /> Alertas
            </div>
            {alerts.slice(0, 6).map((a, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 ${
                  a.level === "danger"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : a.level === "warn"
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                {a.msg}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full h-auto">
          <TabsTrigger value="cards">Tarjetas</TabsTrigger>
          <TabsTrigger value="expenses">Movs</TabsTrigger>
          <TabsTrigger value="msi">MSI</TabsTrigger>
          <TabsTrigger value="budget">Presup.</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="simulator">Simular</TabsTrigger>
        </TabsList>

        {/* TARJETAS */}
        <TabsContent value="cards" className="space-y-4 mt-4">
          {f.cards.length === 0 ? (
            <EmptyState msg="Aún no tienes tarjetas. Crea la primera." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {f.cards.map((c) => (
                <CardTile key={c.id} card={c} expenses={f.expenses} msiPlans={f.msiPlans} />
              ))}
            </div>
          )}

          {upcomingPayments.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="font-bold text-sm">Próximos pagos</div>
                {upcomingPayments.slice(0, 5).map((p) => (
                  <div key={p.card.id} className="flex justify-between items-center text-sm py-1">
                    <span>{p.card.icon} {p.card.name}</span>
                    <span className={p.days <= 3 ? "text-red-500 font-bold" : "text-muted-foreground"}>
                      {formatMXN(p.card.current_balance)} · en {p.days}d
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GASTOS */}
        <TabsContent value="expenses" className="mt-4">
          <ExpensesList />
        </TabsContent>

        {/* MSI */}
        <TabsContent value="msi" className="mt-4">
          <MsiList msiCommitted={msi.msiCommitted} />
        </TabsContent>

        {/* PRESUPUESTOS */}
        <TabsContent value="budget" className="mt-4">
          <BudgetsView />
        </TabsContent>

        {/* REPORTES */}
        <TabsContent value="reports" className="mt-4">
          <ReportsView />
        </TabsContent>

        {/* SIMULADOR */}
        <TabsContent value="simulator" className="mt-4">
          <Simulator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <div className={`mt-1 font-display font-bold text-lg ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <div className="text-center py-12 text-sm text-muted-foreground">{msg}</div>;
}

// ============ LISTA DE GASTOS ============
function ExpensesList() {
  const { expenses, cards, deleteExpense } = useFinance();
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");

  const filtered = expenses.filter((e) => filter === "all" || e.kind === filter).slice(0, 100);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(["all", "expense", "income"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {f === "all" ? "Todos" : f === "expense" ? "Gastos" : "Ingresos"}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState msg="Sin movimientos aún" />}
      {filtered.map((e) => {
        const card = e.card_id ? cards.find((c) => c.id === e.card_id) : null;
        return (
          <Card key={e.id}>
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{e.category}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.date + "T12:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  {card && ` · ${card.icon} ${card.name}`}
                  {e.note && ` · ${e.note}`}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${e.kind === "income" ? "text-green-500" : "text-foreground"}`}>
                  {e.kind === "income" ? "+" : "-"}{formatMXN(e.amount)}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteExpense(e.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============ MSI ============
function MsiList({ msiCommitted }: { msiCommitted: number }) {
  const { msiPlans, cards, updateMsiPlan, deleteMsiPlan } = useFinance();
  const active = msiPlans.filter((p) => p.status === "active");
  const finished = msiPlans.filter((p) => p.status !== "active");

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total comprometido en MSI</div>
          <div className="text-2xl font-display font-bold">{formatMXN(msiCommitted)}</div>
          <div className="text-xs text-muted-foreground mt-1">{active.length} planes activos</div>
        </CardContent>
      </Card>

      {active.length === 0 && finished.length === 0 && <EmptyState msg="Sin planes MSI" />}

      {active.map((p) => {
        const card = p.card_id ? cards.find((c) => c.id === p.card_id) : null;
        const remaining = p.months - p.paid_months;
        const progress = (p.paid_months / p.months) * 100;
        return (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{p.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {card && `${card.icon} ${card.name} · `}{p.category}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMsiPlan(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div>
                  <div className="text-[10px] text-muted-foreground">Mensualidad</div>
                  <div className="font-bold text-sm">{formatMXN(p.monthly_amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Pagado</div>
                  <div className="font-bold text-sm">{p.paid_months}/{p.months}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Restantes</div>
                  <div className="font-bold text-sm">{remaining} meses</div>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMsiPlan(p.id, { paid_months: Math.min(p.months, p.paid_months + 1), status: p.paid_months + 1 >= p.months ? "finished" : "active" })}
                  disabled={p.paid_months >= p.months}
                >
                  +1 mes pagado
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateMsiPlan(p.id, { status: "cancelled" })}
                >
                  Cancelar plan
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {finished.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer">Terminados/cancelados ({finished.length})</summary>
          <div className="mt-2 space-y-1">
            {finished.map((p) => (
              <div key={p.id} className="text-xs flex justify-between p-2 bg-secondary/40 rounded">
                <span>{p.description}</span>
                <span className="text-muted-foreground">{p.status}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ============ PRESUPUESTOS ============
function BudgetsView() {
  const { budgets, expenses, upsertBudget, deleteBudget, categories } = useFinance();
  const mk = monthKey();
  const [newCat, setNewCat] = useState("");
  const [newAmt, setNewAmt] = useState("");

  const monthExpenses = expenses.filter((e) => e.date.startsWith(mk) && e.kind === "expense");
  const monthBudgets = budgets.filter((b) => b.month === mk);
  const general = monthBudgets.find((b) => b.category === null);

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const allCatNames = Array.from(new Set([
    ...categories.map((c) => c.name),
    ...monthExpenses.map((e) => e.category),
    "Comida personal", "Comida familia", "Transporte", "Salud", "Casa", "Mascotas", "Gaby", "Consentirme", "Suscripciones", "Otros",
  ]));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <Label>Presupuesto general del mes</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              placeholder="Monto"
              defaultValue={general?.amount ?? ""}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v > 0) upsertBudget({ category: null, amount: v, month: mk });
              }}
            />
          </div>
          {general && (
            <div className="mt-3">
              <BudgetBar spent={totalSpent} budget={general.amount} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="font-bold text-sm">Por categoría</div>
          <div className="flex gap-2">
            <Select value={newCat} onValueChange={setNewCat}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {allCatNames.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="$" className="w-28" value={newAmt} onChange={(e) => setNewAmt(e.target.value)} />
            <Button
              onClick={async () => {
                if (newCat && Number(newAmt) > 0) {
                  await upsertBudget({ category: newCat, amount: Number(newAmt), month: mk });
                  setNewCat("");
                  setNewAmt("");
                }
              }}
            >
              +
            </Button>
          </div>

          {monthBudgets.filter((b) => b.category).map((b) => {
            const spent = monthExpenses.filter((e) => e.category === b.category).reduce((s, e) => s + e.amount, 0);
            return (
              <div key={b.id} className="pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{b.category}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteBudget(b.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <BudgetBar spent={spent} budget={b.amount} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{formatMXN(spent)}</span>
        <span>{formatMXN(budget)}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(0)}% usado · queda {formatMXN(Math.max(0, budget - spent))}</div>
    </div>
  );
}

// ============ REPORTES ============
function ReportsView() {
  const { expenses, cards } = useFinance();
  const mk = monthKey();
  const monthExp = expenses.filter((e) => e.date.startsWith(mk) && e.kind === "expense");

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of monthExp) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthExp]);

  const byCard = useMemo(() => {
    return cards.map((c) => ({
      name: c.name,
      Usado: Number(c.current_balance),
      Disponible: Math.max(0, Number(c.credit_limit) - Number(c.current_balance)),
    }));
  }, [cards]);

  // Evolución últimos 6 meses
  const evolution = useMemo(() => {
    const arr: { month: string; gasto: number; ingreso: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const ms = expenses.filter((e) => e.date.startsWith(key));
      arr.push({
        month: d.toLocaleDateString("es-MX", { month: "short" }),
        gasto: ms.filter((e) => e.kind === "expense").reduce((s, e) => s + e.amount, 0),
        ingreso: ms.filter((e) => e.kind === "income").reduce((s, e) => s + e.amount, 0),
      });
    }
    return arr;
  }, [expenses]);

  const COLORS = ["oklch(0.7 0.18 260)", "oklch(0.65 0.22 25)", "oklch(0.7 0.20 145)", "oklch(0.75 0.18 80)", "oklch(0.6 0.22 320)", "oklch(0.55 0.05 250)", "oklch(0.7 0.20 200)"];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="font-bold text-sm mb-3">Gastos por categoría (mes)</div>
          {byCategory.length === 0 ? <EmptyState msg="Sin datos" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label={(p) => p.name}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMXN(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="font-bold text-sm mb-3">Crédito por tarjeta</div>
          {byCard.length === 0 ? <EmptyState msg="Sin tarjetas" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCard}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatMXN(v)} />
                <Legend />
                <Bar dataKey="Usado" stackId="a" fill="oklch(0.65 0.22 25)" />
                <Bar dataKey="Disponible" stackId="a" fill="oklch(0.7 0.20 145)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="font-bold text-sm mb-3">Evolución (últimos 6 meses)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evolution}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => formatMXN(v)} />
              <Legend />
              <Bar dataKey="ingreso" fill="oklch(0.7 0.20 145)" />
              <Bar dataKey="gasto" fill="oklch(0.65 0.22 25)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SIMULADOR ============
function Simulator() {
  const { cards, msiPlans, expenses } = useFinance();
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState("");
  const [type, setType] = useState<"normal" | "msi">("normal");
  const [months, setMonths] = useState(3);

  const card = cards.find((c) => c.id === cardId);
  const amt = Number(amount);

  const result = useMemo(() => {
    if (!card || !amt) return null;
    const newBalance = Number(card.current_balance) + amt;
    const newAvailable = Math.max(0, Number(card.credit_limit) - newBalance);
    const newUsage = (newBalance / card.credit_limit) * 100;

    const currentMonthlyMsi = msiPlans
      .filter((p) => p.status === "active" && p.card_id === card.id)
      .reduce((s, p) => s + p.monthly_amount, 0);
    const addedMonthly = type === "msi" ? amt / months : amt;
    const newMonthlyDebt = currentMonthlyMsi + addedMonthly;

    const mk = monthKey();
    const monthSpend = expenses.filter((e) => e.date.startsWith(mk) && e.kind === "expense").reduce((s, e) => s + e.amount, 0);

    let verdict: { msg: string; color: string } = { msg: "Parece prudente ✅", color: "text-green-500" };
    if (newUsage >= 90) verdict = { msg: "RIESGO: tarjeta casi al límite ⚠️", color: "text-red-500" };
    else if (newUsage >= 70) verdict = { msg: "Cuidado: vas a pasar el 70% del límite", color: "text-yellow-500" };
    else if (type === "msi" && months >= 12 && amt > 5000) verdict = { msg: "MSI largo: te comprometes muchos meses", color: "text-yellow-500" };

    return { newBalance, newAvailable, newUsage, addedMonthly, newMonthlyDebt, monthSpend, verdict };
  }, [card, amt, type, months, msiPlans, expenses]);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> ¿Me conviene comprar esto?</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Monto</Label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "normal" | "msi")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="msi">Meses sin intereses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tarjeta</Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {cards.filter((c) => c.status === "active").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "msi" && (
            <div>
              <Label>Meses</Label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 6, 9, 12, 18, 24].map((m) => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {result && (
          <div className="mt-4 space-y-2 p-3 rounded-lg bg-secondary/40">
            <Row label="Nuevo crédito disponible" value={formatMXN(result.newAvailable)} />
            <Row label="Nueva deuda en tarjeta" value={formatMXN(result.newBalance)} />
            <Row label="Uso del límite" value={`${result.newUsage.toFixed(1)}%`} />
            {type === "msi" && <Row label="Mensualidad agregada" value={formatMXN(result.addedMonthly)} />}
            <Row label="Total comprometido al mes en MSI" value={formatMXN(result.newMonthlyDebt)} />
            <div className={`mt-3 font-bold text-center ${result.verdict.color}`}>{result.verdict.msg}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
