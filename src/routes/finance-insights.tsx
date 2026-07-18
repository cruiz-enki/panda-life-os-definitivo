/**
 * **Ruta** — Insights financieros con IA. Agrega datos de finanzas,
 * patrimonio, cashflow y deudas, los manda al AI Gateway y muestra
 * recomendaciones accionables.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, TrendingUp, Info, Trophy, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateFinanceInsights, type FinanceInsight } from "@/lib/finance-ai.functions";
import { useFinance } from "@/hooks/use-finance";
import { useCashflow } from "@/hooks/use-cashflow";
import { useNetWorth } from "@/hooks/use-net-worth";
import { useDebts } from "@/hooks/use-debts";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import { formatMXN, monthKey } from "@/lib/finance-types";

export const Route = createFileRoute("/finance-insights")({
  head: () => ({
    meta: [
      { title: "Insights financieros — ENKI Life OS" },
      { name: "description", content: "Recomendaciones con IA sobre tus finanzas personales" },
    ],
  }),
  component: FinanceInsightsPage,
});

function FinanceInsightsPage() {
  const { expenses } = useFinance();
  const { summary } = useCashflow();
  const { totals, accounts } = useNetWorth();
  const { debts } = useDebts();
  const { goals } = useSavingsGoals();
  const { cards } = useFinance();
  const generate = useServerFn(generateFinanceInsights);
  const [busy, setBusy] = useState(false);
  const [insights, setInsights] = useState<FinanceInsight[]>([]);

  const currentMonth = monthKey(new Date());
  const prevMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return monthKey(d);
  }, []);

  const payload = useMemo(() => {
    const byCat = (month: string) => {
      const m: Record<string, number> = {};
      for (const e of expenses) {
        if (e.kind !== "expense") continue;
        if (!e.date.startsWith(month)) continue;
        m[e.category] = (m[e.category] ?? 0) + Number(e.amount);
      }
      return m;
    };
    const cur = byCat(currentMonth);
    const prev = byCat(prevMonth);
    return {
      currentMonth,
      netWorth: totals.netWorth,
      assets: totals.assets,
      debts: totals.debts,
      cashflow30: {
        income: summary.d30.income,
        outflow: summary.d30.outflow,
        net: summary.d30.net,
      },
      expensesByCategoryCurrent: cur,
      expensesByCategoryPrev: prev,
      totalExpensesCurrent: Object.values(cur).reduce((s, v) => s + v, 0),
      totalExpensesPrev: Object.values(prev).reduce((s, v) => s + v, 0),
      cards: cards.map((c) => ({
        name: c.name,
        balance: Number(c.current_balance),
        limit: Number(c.credit_limit),
      })),
      debtsList: debts.filter((d) => d.status === "active").map((d) => ({
        name: d.name,
        balance: d.current_balance,
        rate: d.interest_rate,
        monthly: d.monthly_payment,
      })),
      savingsGoals: goals.map((g) => ({
        name: g.name,
        target: Number(g.target_amount),
        current: Number(g.current_amount),
      })),
    };
  }, [expenses, summary, totals, cards, debts, goals, currentMonth, prevMonth]);

  const run = async () => {
    setBusy(true);
    try {
      const res = await generate({ data: payload });
      setInsights(res.insights || []);
      if ((res.insights || []).length === 0) toast.info("La IA no devolvió insights");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar insights");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> Insights financieros
        </h1>
        <p className="text-sm text-muted-foreground">
          Análisis con IA de tus gastos, patrimonio, cashflow y deudas.
        </p>
      </div>

      {/* Snapshot de datos que se enviarán */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Patrimonio" value={formatMXN(totals.netWorth)} />
        <Stat label="Cashflow 30d" value={formatMXN(summary.d30.net)} tone={summary.d30.net < 0 ? "danger" : "ok"} />
        <Stat label="Gasto mes" value={formatMXN(payload.totalExpensesCurrent)} />
        <Stat label="Vs mes ant." value={pctDiff(payload.totalExpensesCurrent, payload.totalExpensesPrev)} />
      </div>

      <div>
        <Button onClick={run} disabled={busy || accounts.length + cards.length + debts.length === 0}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {insights.length > 0 ? "Regenerar insights" : "Generar insights"}
        </Button>
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{ins.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{ins.title}</h3>
                    <Badge variant={kindVariant(ins.kind)} className="text-[10px]">
                      {kindLabel(ins.kind)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ins.detail}</p>
                  {ins.action && (
                    <p className="text-sm mt-2 flex items-start gap-2">
                      {kindIcon(ins.kind)}
                      <span><span className="font-medium">Acción:</span> {ins.action}</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {insights.length === 0 && !busy && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Presiona "Generar insights" para que la IA analice tu situación financiera actual.
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone === "danger" ? "text-red-500" : tone === "ok" ? "text-emerald-500" : ""}`}>
        {value}
      </div>
    </Card>
  );
}

function pctDiff(cur: number, prev: number) {
  if (prev <= 0) return "—";
  const p = ((cur - prev) / prev) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(0)}%`;
}
function kindVariant(k: FinanceInsight["kind"]): "default" | "destructive" | "secondary" | "outline" {
  return k === "warning" ? "destructive" : k === "win" ? "default" : "secondary";
}
function kindLabel(k: FinanceInsight["kind"]) {
  return k === "warning" ? "Alerta" : k === "opportunity" ? "Oportunidad" : k === "win" ? "Victoria" : "Info";
}
function kindIcon(k: FinanceInsight["kind"]) {
  const cls = "h-4 w-4 mt-0.5 shrink-0";
  if (k === "warning") return <AlertTriangle className={cls} />;
  if (k === "opportunity") return <TrendingUp className={cls} />;
  if (k === "win") return <Trophy className={cls} />;
  return <Info className={cls} />;
}
