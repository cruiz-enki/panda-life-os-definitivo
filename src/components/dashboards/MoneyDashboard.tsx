/**
 * **Dashboard Money** — vista principal cuando el modo activo es "money".
 * Métricas: patrimonio, gasto del mes vs presupuesto, cashflow 30d,
 * utilización de crédito, ahorro y próximos cargos.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { useNetWorth } from "@/hooks/use-net-worth";
import { useCashflow } from "@/hooks/use-cashflow";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import { formatMXN, monthKey } from "@/lib/finance-types";

export function MoneyDashboard() {
  const { cards, expenses, budgets, categories } = useFinance();
  const { totals: nw, snapshots } = useNetWorth();
  const { summary } = useCashflow();
  const { totals: savings } = useSavingsGoals();

  const currentMonth = monthKey();
  const [year, month] = currentMonth.split("-").map(Number);

  // Gasto del mes
  const monthExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        if (e.kind !== "expense") return false;
        const d = new Date(e.date + "T12:00:00");
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }),
    [expenses, year, month],
  );
  const monthSpent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthIncome = expenses
    .filter((e) => {
      if (e.kind !== "income") return false;
      const d = new Date(e.date + "T12:00:00");
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  const generalBudget = budgets.find((b) => b.category === null && b.month === currentMonth);
  const budgetTotal = generalBudget?.amount ?? budgets.filter((b) => b.month === currentMonth).reduce((s, b) => s + b.amount, 0);
  const budgetPct = budgetTotal > 0 ? (monthSpent / budgetTotal) * 100 : 0;

  // Top categoría
  const topCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    let best: { name: string; amount: number } | null = null;
    for (const [name, amount] of map) if (!best || amount > best.amount) best = { name, amount };
    return best;
  }, [monthExpenses]);
  const topCatMeta = categories.find((c) => c.name === topCat?.name);

  // Crédito
  const creditLimit = cards.reduce((s, c) => s + Number(c.credit_limit || 0), 0);
  const creditUsed = cards.reduce((s, c) => s + Number(c.current_balance || 0), 0);
  const creditPct = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  // Delta patrimonio (último snapshot vs anterior)
  const nwDelta = useMemo(() => {
    if (snapshots.length < 2) return null;
    const last = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    return last.net_worth - prev.net_worth;
  }, [snapshots]);

  // Próximos cargos (7 días)
  const upcoming = summary.d30.events.filter((e) => e.amount < 0).slice(0, 4);
  const next7Outflow = summary.d30.events
    .filter((e) => {
      const d = new Date(e.date + "T12:00:00");
      const diff = (d.getTime() - Date.now()) / 86400000;
      return e.amount < 0 && diff <= 7;
    })
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  return (
    <div className="space-y-3">
      {/* Patrimonio - hero */}
      <Link
        to="/net-worth"
        className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 hover:border-primary/50 transition-colors"
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Patrimonio neto</div>
        <div className="font-display text-3xl font-bold mt-1">{formatMXN(nw.netWorth)}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>Activos {formatMXN(nw.assets)}</span>
          <span>·</span>
          <span>Deuda {formatMXN(nw.debts)}</span>
          {nwDelta !== null && (
            <span className={`ml-auto flex items-center gap-0.5 font-semibold ${nwDelta >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {nwDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatMXN(Math.abs(nwDelta))}
            </span>
          )}
        </div>
      </Link>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Gasto del mes */}
        <Link to="/finance" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gasto del mes</div>
          <div className="font-display text-xl font-bold mt-1">{formatMXN(monthSpent)}</div>
          {budgetTotal > 0 ? (
            <>
              <div className="text-[10px] text-muted-foreground mt-1">
                de {formatMXN(budgetTotal)} · {budgetPct.toFixed(0)}%
              </div>
              <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    budgetPct >= 100 ? "bg-destructive" : budgetPct >= 80 ? "bg-yellow-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, budgetPct)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-[10px] text-muted-foreground mt-1">Sin presupuesto</div>
          )}
        </Link>

        {/* Cashflow 30d */}
        <Link to="/cashflow" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cashflow 30d</div>
          <div className={`font-display text-xl font-bold mt-1 ${summary.d30.net >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {summary.d30.net >= 0 ? "+" : ""}{formatMXN(summary.d30.net)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            +{formatMXN(summary.d30.income)} · {formatMXN(summary.d30.outflow)}
          </div>
        </Link>

        {/* Utilización crédito */}
        <Link to="/finance" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uso de crédito</div>
          <div className="flex items-baseline gap-1 mt-1">
            <div className="font-display text-xl font-bold">{creditPct.toFixed(0)}%</div>
            {creditPct >= 30 && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            {formatMXN(creditUsed)} / {formatMXN(creditLimit)}
          </div>
          <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${
                creditPct >= 50 ? "bg-destructive" : creditPct >= 30 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, creditPct)}%` }}
            />
          </div>
        </Link>

        {/* Ahorro */}
        <Link to="/savings" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ahorro</div>
          <div className="font-display text-xl font-bold mt-1">{formatMXN(savings.current)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {savings.count} metas · {(savings.progress * 100).toFixed(0)}%
          </div>
          <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, savings.progress * 100)}%` }} />
          </div>
        </Link>
      </div>

      {/* Top categoría + ingreso vs gasto */}
      <div className="grid grid-cols-2 gap-3">
        {topCat && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top categoría</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{topCatMeta?.emoji ?? "📊"}</span>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{topCat.name}</div>
                <div className="text-[11px] text-muted-foreground">{formatMXN(topCat.amount)}</div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance mes</div>
          <div className={`font-display text-lg font-bold mt-1 ${monthIncome - monthSpent >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            {monthIncome - monthSpent >= 0 ? "+" : ""}{formatMXN(monthIncome - monthSpent)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            +{formatMXN(monthIncome)} · -{formatMXN(monthSpent)}
          </div>
        </div>
      </div>

      {/* Próximos cargos */}
      <Link to="/cashflow" className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Próximos 7 días</div>
            <div className="font-display text-base font-bold">-{formatMXN(next7Outflow)}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin cargos próximos</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="text-base">{e.emoji}</span>
                <span className="flex-1 truncate">{e.label}</span>
                <span className="text-muted-foreground">
                  {new Date(e.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
                <span className="font-semibold text-destructive w-20 text-right">{formatMXN(e.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Link>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { to: "/log", label: "Gasto", emoji: "💸" },
          { to: "/debts", label: "Deudas", emoji: "⚖️" },
          { to: "/finance-insights", label: "Insights", emoji: "✨" },
          { to: "/money-setup", label: "Setup", emoji: "⚙️" },
        ].map((t) => (
          <Link
            key={t.to}
            to={t.to}
            search={t.to === "/log" ? ({ tab: "expense" } as never) : undefined}
            className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-1 hover:border-primary/40 active:scale-[0.98] transition-all"
          >
            <span className="text-xl leading-none">{t.emoji}</span>
            <span className="text-[11px] font-semibold">{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
