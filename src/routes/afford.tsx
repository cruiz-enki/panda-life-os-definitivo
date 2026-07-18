/**
 * **Ruta** — "¿Puedo permitirme esto?": calculadora de impacto.
 * Simula un gasto de contado o a MSI y muestra el impacto en:
 * - Próximo corte de la tarjeta
 * - Cashflow proyectado 30 días
 * - Retraso en meta de ahorro
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { useCashflow } from "@/hooks/use-cashflow";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import { formatMXN, cardBalanceBreakdown } from "@/lib/finance-types";

export const Route = createFileRoute("/afford")({
  head: () => ({
    meta: [
      { title: "¿Puedo permitirme esto? — ENKI Life OS" },
      { name: "description", content: "Calcula el impacto de una compra en tu cashflow y metas" },
    ],
  }),
  component: AffordPage,
});

function AffordPage() {
  const { cards, expenses, msiPlans } = useFinance();
  const { summary } = useCashflow();
  const { goals } = useSavingsGoals();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<"cash" | "msi">("cash");
  const [months, setMonths] = useState<number>(3);
  const [cardId, setCardId] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("");

  const card = cards.find((c) => c.id === cardId);
  const goal = goals.find((g) => g.id === goalId);

  const analysis = useMemo(() => {
    if (amount <= 0) return null;
    const monthlyMsi = method === "msi" ? amount / months : 0;

    // Impacto en próximo corte
    let nextCutImpact = 0;
    let cardAfterCharge: number | null = null;
    let utilization: number | null = null;
    if (card) {
      const b = cardBalanceBreakdown(card, expenses, msiPlans);
      if (method === "cash") nextCutImpact = amount;
      else nextCutImpact = monthlyMsi;
      cardAfterCharge = b.nextCutCharge + nextCutImpact;
      utilization = (Number(card.current_balance) + (method === "cash" ? amount : amount)) / Number(card.credit_limit);
    }

    // Impacto en cashflow 30 días
    const cashflowImpact = method === "cash" ? amount : monthlyMsi;
    const netAfter = summary.d30.net - cashflowImpact;

    // Impacto en meta de ahorro (semanas de retraso)
    let goalDelayWeeks: number | null = null;
    if (goal) {
      const monthlyContribution = Number(goal.monthly_contribution ?? 0);
      if (monthlyContribution > 0) {
        const delayMonths = (method === "cash" ? amount : amount) / monthlyContribution;
        goalDelayWeeks = Math.ceil(delayMonths * 4.33);
      }
    }

    // Veredicto simple
    let verdict: "ok" | "careful" | "danger" = "ok";
    if (netAfter < 0) verdict = "danger";
    else if (netAfter < amount * 0.3 || (utilization ?? 0) > 0.5) verdict = "careful";

    return {
      monthlyMsi,
      nextCutImpact,
      cardAfterCharge,
      utilization,
      cashflowImpact,
      netAfter,
      goalDelayWeeks,
      verdict,
    };
  }, [amount, method, months, card, expenses, msiPlans, summary, goal]);

  return (
    <div className="container max-w-3xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" /> ¿Puedo permitirme esto?
        </h1>
        <p className="text-sm text-muted-foreground">
          Simula el impacto de una compra antes de hacerla.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Monto (MXN)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Método</Label>
            <Select value={method} onValueChange={(v: any) => setMethod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Contado</SelectItem>
                <SelectItem value="msi">MSI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === "msi" && (
            <div>
              <Label>Meses</Label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 6, 9, 12, 18, 24].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} meses</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Tarjeta (opcional)</Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {cards.filter((c) => c.status === "active").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ····{c.last_four}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Meta afectada (opcional)</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {analysis && (
        <>
          <Card className={`p-4 border-2 ${
            analysis.verdict === "danger" ? "border-red-500/50" :
            analysis.verdict === "careful" ? "border-yellow-500/50" :
            "border-emerald-500/50"
          }`}>
            <div className="flex items-center gap-2">
              {analysis.verdict === "ok" ? (
                <><CheckCircle2 className="h-5 w-5 text-emerald-500" /><span className="font-semibold text-emerald-500">Puedes permitírtelo</span></>
              ) : analysis.verdict === "careful" ? (
                <><AlertCircle className="h-5 w-5 text-yellow-500" /><span className="font-semibold text-yellow-500">Con cuidado</span></>
              ) : (
                <><AlertCircle className="h-5 w-5 text-red-500" /><span className="font-semibold text-red-500">Te descuadra</span></>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {method === "cash"
                ? `Sale ${formatMXN(amount)} de tu bolsillo este mes.`
                : `Sale ${formatMXN(analysis.monthlyMsi)} mensuales durante ${months} meses.`}
            </p>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {card && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Impacto en {card.name}</div>
                <div className="text-lg font-semibold mt-1">
                  Próximo corte: {formatMXN(analysis.cardAfterCharge ?? 0)}
                </div>
                <div className="text-xs mt-1">
                  Suma {formatMXN(analysis.nextCutImpact)} al próximo estado de cuenta
                </div>
                {analysis.utilization !== null && (
                  <Badge variant={analysis.utilization > 0.5 ? "destructive" : "secondary"} className="mt-2">
                    Uso {(analysis.utilization * 100).toFixed(0)}%
                  </Badge>
                )}
              </Card>
            )}

            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Cashflow 30 días</div>
              <div className={`text-lg font-semibold mt-1 ${analysis.netAfter < 0 ? "text-red-500" : ""}`}>
                {formatMXN(analysis.netAfter)}
              </div>
              <div className="text-xs mt-1">
                Antes: {formatMXN(summary.d30.net)} → después: {formatMXN(analysis.netAfter)}
              </div>
            </Card>

            {goal && analysis.goalDelayWeeks !== null && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Meta "{goal.name}"</div>
                <div className="text-lg font-semibold mt-1">
                  +{analysis.goalDelayWeeks} semanas
                </div>
                <div className="text-xs mt-1">de retraso en llegar a la meta</div>
              </Card>
            )}

            {method === "msi" && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Compromiso a futuro</div>
                <div className="text-lg font-semibold mt-1">
                  {formatMXN(amount)} en {months}m
                </div>
                <div className="text-xs mt-1">
                  {formatMXN(analysis.monthlyMsi)} / mes · congela flujo hasta {addMonths(months)}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function addMonths(m: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
}
