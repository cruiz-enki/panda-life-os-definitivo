/**
 * **Feature** — Componentes (parts) del módulo **Insights**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { Activity, Battery, Brain, CheckSquare, CreditCard as CreditCardIcon, Flame, Heart, NotebookPen, Pill, Repeat, Salad, Scale, Sparkles, TrendingUp, Trophy, Wallet, Zap } from "lucide-react";
import { useAppState } from "@/lib/storage";
import { useFinance } from "@/hooks/use-finance";
import { useHealth } from "@/hooks/use-health";
import { formatMXN, monthKey } from "@/lib/finance-types";
import {
  adherenceByMedication,
  bestWeekday,
  buildDailyBuckets,
  buildHealthBuckets,
  computeHealthTotals,
  computeTotals,
  correlationEnergyProductivity,
  describeCorrelation,
  energyDimensionAverages,
  habitConsistency,
  learningsByCategory,
  notesByImportance,
  productivityStreak,
  recentLearnings,
  tasksByList,
} from "@/lib/insights";

const RANGES = [
  { value: 7, label: "7 días" },
  { value: 14, label: "14 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
] as const;

export function InsightsPage() {
  const { state } = useAppState();
  const { cards, expenses, msiPlans, budgets } = useFinance();
  const { body, meals, medications, medLogs } = useHealth();
  const [days, setDays] = useState<number>(30);

  // ===== Salud =====
  const healthBuckets = useMemo(
    () => buildHealthBuckets(body, meals, medications, medLogs, days),
    [body, meals, medications, medLogs, days],
  );
  const healthTotals = useMemo(() => computeHealthTotals(healthBuckets), [healthBuckets]);
  const medAdherence = useMemo(
    () => adherenceByMedication(medications, medLogs, days),
    [medications, medLogs, days],
  );

  // ===== Finanzas =====
  const finance = useMemo(() => {
    const mKey = monthKey();
    const monthExp = expenses.filter((e) => e.date.startsWith(mKey));
    const totalSpent = monthExp.filter((e) => e.kind === "expense").reduce((a, e) => a + Number(e.amount), 0);
    const totalIncome = monthExp.filter((e) => e.kind === "income").reduce((a, e) => a + Number(e.amount), 0);
    const balance = totalIncome - totalSpent;

    const totalLimit = cards.reduce((a, c) => a + Number(c.credit_limit), 0);
    const totalDebt = cards.reduce((a, c) => a + Number(c.current_balance), 0);
    const usagePct = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

    const msiCommitted = msiPlans
      .filter((m) => m.status === "active")
      .reduce((a, m) => a + Number(m.monthly_amount) * (m.months - m.paid_months), 0);
    const msiMonthly = msiPlans
      .filter((m) => m.status === "active")
      .reduce((a, m) => a + Number(m.monthly_amount), 0);

    // Por categoría del mes
    const byCat = new Map<string, number>();
    for (const e of monthExp) {
      if (e.kind !== "expense") continue;
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));
    }
    const topCats = [...byCat.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Presupuestos del mes
    const monthBudgets = budgets.filter((b) => b.month === mKey);
    const budgetStatus = monthBudgets.map((b) => {
      const spent = b.category
        ? (byCat.get(b.category) ?? 0)
        : totalSpent;
      const pct = b.amount > 0 ? (spent / Number(b.amount)) * 100 : 0;
      return { label: b.category ?? "General", spent, amount: Number(b.amount), pct };
    });

    return { totalSpent, totalIncome, balance, totalLimit, totalDebt, usagePct, msiCommitted, msiMonthly, topCats, budgetStatus };
  }, [cards, expenses, msiPlans, budgets]);


  const buckets = useMemo(() => buildDailyBuckets(state, days), [state, days]);
  const totals = useMemo(() => computeTotals(buckets), [buckets]);
  const corr = useMemo(() => correlationEnergyProductivity(buckets), [buckets]);
  const corrDesc = describeCorrelation(corr);
  const best = useMemo(() => bestWeekday(buckets), [buckets]);
  const lists = useMemo(() => tasksByList(state).slice(0, 6), [state]);
  const habits = useMemo(() => habitConsistency(state, days), [state, days]);
  const learnCats = useMemo(() => learningsByCategory(state), [state]);
  const energyDims = useMemo(() => energyDimensionAverages(state, days), [state, days]);
  const noteImp = useMemo(() => notesByImportance(state.notes), [state.notes]);
  const streak = useMemo(() => productivityStreak(buckets), [buckets]);
  const lastLearn = useMemo(() => recentLearnings(state, 5), [state]);

  const scatter = useMemo(
    () =>
      buckets
        .filter((b) => b.energyAvg !== null)
        .map((b) => ({ x: b.energyAvg as number, y: b.tasksCompleted + b.habitsCompleted, label: b.label })),
    [buckets],
  );

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Insights</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Tu sistema, en datos 📊</h1>
          <p className="mt-2 text-muted-foreground">Detecta patrones entre energía, hábitos y productividad.</p>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-secondary border border-border">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === r.value ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Kpi icon={<CheckSquare className="w-4 h-4" />} label="Tareas" value={totals.tasksCompleted} color="oklch(0.78 0.18 150)" />
        <Kpi icon={<Repeat className="w-4 h-4" />} label="Hábitos" value={totals.habitsCompleted} color="oklch(0.75 0.2 50)" />
        <Kpi icon={<Brain className="w-4 h-4" />} label="Aprendizajes" value={totals.learnings} color="oklch(0.7 0.22 295)" />
        <Kpi icon={<NotebookPen className="w-4 h-4" />} label="Notas" value={totals.notes} color="oklch(0.7 0.18 220)" />
        <Kpi icon={<Sparkles className="w-4 h-4" />} label="XP ganado" value={totals.totalXp} color="oklch(0.78 0.18 80)" />
        <Kpi icon={<Flame className="w-4 h-4" />} label="Racha misiones" value={`${streak}d`} color="oklch(0.7 0.2 25)" />
      </section>

      {/* ===== FINANZAS ===== */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Finanzas del mes</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Kpi
            icon={<TrendingUp className="w-4 h-4" />}
            label="Balance"
            value={formatMXN(finance.balance)}
            color={finance.balance >= 0 ? "oklch(0.78 0.18 150)" : "oklch(0.7 0.2 25)"}
          />
          <Kpi icon={<Wallet className="w-4 h-4" />} label="Gastado" value={formatMXN(finance.totalSpent)} color="oklch(0.7 0.2 25)" />
          <Kpi icon={<Sparkles className="w-4 h-4" />} label="Ingresos" value={formatMXN(finance.totalIncome)} color="oklch(0.78 0.18 150)" />
          <Kpi
            icon={<CreditCardIcon className="w-4 h-4" />}
            label="Deuda total"
            value={formatMXN(finance.totalDebt)}
            color="oklch(0.75 0.2 50)"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <CreditCardIcon className="w-3.5 h-3.5" /> Uso de crédito
            </div>
            <div className="font-display text-3xl font-bold">{finance.usagePct.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatMXN(finance.totalDebt)} / {formatMXN(finance.totalLimit)}
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mt-3">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(finance.usagePct, 100)}%`,
                  background:
                    finance.usagePct >= 80
                      ? "oklch(0.7 0.2 25)"
                      : finance.usagePct >= 50
                      ? "oklch(0.78 0.18 80)"
                      : "oklch(0.78 0.18 150)",
                }}
              />
            </div>
            <div className="text-xs mt-2 text-muted-foreground">{cards.length} tarjeta{cards.length === 1 ? "" : "s"} activas</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <Repeat className="w-3.5 h-3.5" /> Meses sin intereses
            </div>
            <div className="font-display text-3xl font-bold">{formatMXN(finance.msiCommitted)}</div>
            <div className="text-xs text-muted-foreground mt-1">comprometido en MSI</div>
            <div className="border-t border-border my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mensualidad</span>
              <span className="font-semibold">{formatMXN(finance.msiMonthly)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-3">Top gastos del mes</h3>
            {finance.topCats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin gastos registrados este mes.</p>
            ) : (
              <div className="space-y-2">
                {finance.topCats.map((c) => {
                  const pct = finance.totalSpent > 0 ? (c.amount / finance.totalSpent) * 100 : 0;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{formatMXN(c.amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {finance.budgetStatus.length > 0 && (
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold mb-4">Presupuestos del mes</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {finance.budgetStatus.map((b, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate">{b.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatMXN(b.spent)} / {formatMXN(b.amount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(b.pct, 100)}%`,
                          background:
                            b.pct >= 100
                              ? "oklch(0.7 0.2 25)"
                              : b.pct >= 80
                              ? "oklch(0.78 0.18 80)"
                              : "oklch(0.78 0.18 150)",
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{b.pct.toFixed(0)}% usado</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== SALUD ===== */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Salud · últimos {days} días</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Kpi
            icon={<Scale className="w-4 h-4" />}
            label="Peso actual"
            value={healthTotals.weightLatest != null ? `${healthTotals.weightLatest} kg` : "—"}
            color="oklch(0.78 0.18 220)"
          />
          <Kpi
            icon={<TrendingUp className="w-4 h-4" />}
            label={`Δ peso ${days}d`}
            value={
              healthTotals.weightDelta == null
                ? "—"
                : `${healthTotals.weightDelta > 0 ? "+" : ""}${healthTotals.weightDelta} kg`
            }
            color={
              healthTotals.weightDelta == null
                ? "oklch(0.65 0.02 200)"
                : healthTotals.weightDelta <= 0
                ? "oklch(0.78 0.18 150)"
                : "oklch(0.7 0.2 25)"
            }
          />
          <Kpi
            icon={<Pill className="w-4 h-4" />}
            label="Adherencia meds"
            value={`${healthTotals.adherenceAvgPct}%`}
            color={
              healthTotals.adherenceAvgPct >= 80
                ? "oklch(0.78 0.18 150)"
                : healthTotals.adherenceAvgPct >= 50
                ? "oklch(0.78 0.18 80)"
                : "oklch(0.7 0.2 25)"
            }
          />
          <Kpi
            icon={<Salad className="w-4 h-4" />}
            label="Calidad alimentaria"
            value={`${healthTotals.mealsScoreAvg}/100`}
            color={
              healthTotals.mealsScoreAvg >= 70
                ? "oklch(0.78 0.18 150)"
                : healthTotals.mealsScoreAvg >= 40
                ? "oklch(0.78 0.18 80)"
                : "oklch(0.7 0.2 25)"
            }
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Evolución de peso</h3>
            {healthBuckets.every((b) => b.weight === null) ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Registra tu peso para ver la tendencia.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthBuckets} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                    <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="oklch(0.65 0.02 200)" fontSize={10} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} kg`} />
                    <Line type="monotone" dataKey="weight" stroke="oklch(0.78 0.18 220)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Composición</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">% Grasa</span>
                <span className="font-display font-bold">{healthTotals.bodyFatLatest ?? "—"}{healthTotals.bodyFatLatest != null ? "%" : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Masa muscular</span>
                <span className="font-display font-bold">{healthTotals.muscleMassLatest ?? "—"}{healthTotals.muscleMassLatest != null ? " kg" : ""}</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Días con registro</span>
                <span className="font-semibold">{healthTotals.daysTrackedBody}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Comidas registradas</span>
                <span className="font-semibold">{healthTotals.mealsTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saludables / Chatarra</span>
                <span className="font-semibold">
                  <span className="text-primary">{healthTotals.healthyMeals}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-destructive">{healthTotals.junkMeals}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Adherencia diaria · medicación</h3>
              <span className="text-xs text-muted-foreground">
                {healthTotals.medsTakenTotal}/{healthTotals.medsExpectedTotal} dosis
              </span>
            </div>
            {healthTotals.medsExpectedTotal === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                Activa medicamentos diarios para medir adherencia.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthBuckets} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" vertical={false} />
                    <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="oklch(0.65 0.02 200)" fontSize={10} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="adherencePct" radius={[6, 6, 0, 0]}>
                      {healthBuckets.map((b, i) => (
                        <Cell
                          key={i}
                          fill={
                            b.adherencePct >= 80
                              ? "oklch(0.78 0.18 150)"
                              : b.adherencePct >= 50
                              ? "oklch(0.78 0.18 80)"
                              : "oklch(0.7 0.2 25)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Por medicamento</h3>
            {medAdherence.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin medicamentos activos.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {medAdherence.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="inline-flex items-center gap-2 truncate">
                        <span>{m.emoji}</span>
                        <span className="font-medium truncate">{m.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {m.taken}/{m.expected}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${m.pct}%`,
                          background:
                            m.pct >= 80
                              ? "oklch(0.78 0.18 150)"
                              : m.pct >= 50
                              ? "oklch(0.78 0.18 80)"
                              : "oklch(0.7 0.2 25)",
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{m.pct}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Comidas por día</h3>
            {healthTotals.mealsTotal === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Registra comidas para ver el desglose.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthBuckets} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" vertical={false} />
                    <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="oklch(0.65 0.02 200)" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="healthyMeals" stackId="m" fill="oklch(0.78 0.18 150)" name="Saludable" />
                    <Bar dataKey="regularMeals" stackId="m" fill="oklch(0.78 0.15 70)" name="Regular" />
                    <Bar dataKey="junkMeals" stackId="m" fill="oklch(0.7 0.2 25)" name="Chatarra" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Producción diaria */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Producción diaria</h2>
            <span className="text-xs text-muted-foreground">{totals.daysActive} / {buckets.length} días activos</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" vertical={false} />
                <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={10} interval="preserveStartEnd" />
                <YAxis stroke="oklch(0.65 0.02 200)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.28 0.02 200 / 0.3)" }} />
                <Bar dataKey="tasksCompleted" stackId="a" fill="oklch(0.78 0.18 150)" name="Tareas" radius={[0, 0, 0, 0]} />
                <Bar dataKey="habitsCompleted" stackId="a" fill="oklch(0.75 0.2 50)" name="Hábitos" radius={[0, 0, 0, 0]} />
                <Bar dataKey="learningsCount" stackId="a" fill="oklch(0.7 0.22 295)" name="Aprendizajes" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Mejor día y correlación */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <Trophy className="w-3.5 h-3.5" /> Tu mejor día
            </div>
            <div className="font-display text-3xl font-bold">{best?.name ?? "—"}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {best ? `${best.score} acciones promedio por día` : "Sin datos suficientes"}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Energía ↔ Productividad
            </div>
            <div className="font-display text-3xl font-bold">
              {corr === null ? "—" : (corr >= 0 ? "+" : "") + corr.toFixed(2)}
            </div>
            <div className={`text-sm mt-1 ${corrDesc.tone === "good" ? "text-primary" : corrDesc.tone === "warn" ? "text-destructive" : "text-muted-foreground"}`}>
              {corrDesc.label}
            </div>
          </div>
        </section>

        {/* Scatter energía vs producción */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Energía vs acciones del día</h2>
          {scatter.length < 3 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Registra al menos 3 días de energía para ver la nube.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                  <XAxis type="number" dataKey="x" name="Energía" domain={[0, 10]} stroke="oklch(0.65 0.02 200)" fontSize={11} />
                  <YAxis type="number" dataKey="y" name="Acciones" stroke="oklch(0.65 0.02 200)" fontSize={11} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatter} fill="oklch(0.78 0.18 150)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Cada punto = un día. Eje X: energía media (1-10). Eje Y: tareas + hábitos completados.
          </p>
        </section>

        {/* Energía por dimensión */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Energía por dimensión</h2>
          <div className="space-y-3">
            {energyDims.map((d) => (
              <div key={d.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-semibold">{d.value ?? "—"}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${((d.value ?? 0) / 10) * 100}%`,
                      background: d.key === "pain" ? "oklch(0.7 0.2 25)" : "oklch(0.78 0.18 150)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tareas por lista */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Top listas</h2>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas todavía.</p>
          ) : (
            <div className="space-y-3">
              {lists.map((l) => {
                const total = l.completed + l.pending;
                const ratio = total ? l.completed / total : 0;
                return (
                  <div key={l.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="inline-flex items-center gap-2">
                        <span>{l.emoji}</span>
                        <span className="font-medium">{l.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{l.completed}/{total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${ratio * 100}%`, background: l.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Consistencia de hábitos */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Consistencia de hábitos ({days}d)</h2>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tienes hábitos activos.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habits.map((h) => ({ name: `${h.habit.emoji} ${h.habit.name}`, rate: Math.round(h.rate * 100), hits: h.hits30 }))} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="oklch(0.65 0.02 200)" fontSize={10} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="oklch(0.65 0.02 200)" fontSize={11} width={140} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                    {habits.map((h, i) => (
                      <Cell key={i} fill={h.rate >= 0.7 ? "oklch(0.78 0.18 150)" : h.rate >= 0.4 ? "oklch(0.78 0.18 80)" : "oklch(0.7 0.2 25)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Aprendizajes por categoría */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Aprendizajes por categoría</h2>
          {learnCats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin aprendizajes registrados.</p>
          ) : (
            <div className="space-y-2">
              {learnCats.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm">{c.label}</span>
                  <span className="font-display font-bold text-primary">{c.count}</span>
                </div>
              ))}
            </div>
          )}
          {lastLearn.length > 0 && (
            <>
              <div className="border-t border-border my-4" />
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recientes</h3>
              <ul className="space-y-1.5">
                {lastLearn.map((l) => (
                  <li key={l.id} className="text-sm flex justify-between gap-2">
                    <span className="truncate">{l.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(l.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Línea de XP */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--xp)]" /> XP ganado por día
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={10} interval="preserveStartEnd" />
                <YAxis stroke="oklch(0.65 0.02 200)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="xpEarned" stroke="oklch(0.78 0.18 80)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Notas por importancia */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Notas por importancia</h2>
          {noteImp.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
          ) : (
            <div className="space-y-2">
              {noteImp.map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <span className="text-sm">{n.label}</span>
                  <span className="font-display font-bold">{n.count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border my-4" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            Total notas: <span className="font-semibold text-foreground">{state.notes.length}</span>
          </div>
        </section>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-10 inline-flex items-center gap-2 w-full justify-center">
        <Battery className="w-3.5 h-3.5" /> Los datos se actualizan en tiempo real al completar tareas, hábitos y check-ins.
      </p>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "oklch(0.21 0.018 200)",
  border: "1px solid oklch(0.28 0.02 200)",
  borderRadius: 12,
  fontSize: 12,
};

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground" style={{ color }}>
        {icon} {label}
      </div>
      <div className="font-display text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
