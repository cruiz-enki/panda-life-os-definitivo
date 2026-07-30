/**
 * **Ruta** — Detalle de una tarjeta financiera (gastos, MSI, pagos).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN, nextCutDate, nextPaymentDate, daysUntil, cardBalanceBreakdown, cardReconciliation } from "@/lib/finance-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { PaymentForm } from "@/components/finance/PaymentForm";
import { CardEditButton } from "@/components/finance/CardForm";
import { InitialBalanceWizard } from "@/components/finance/InitialBalanceWizard";

export const Route = createFileRoute("/finance_/cards/$cardId")({
  component: CardDetailPage,
});

function CardDetailPage() {
  const { cardId } = Route.useParams();
  const f = useFinance();
  const card = f.cards.find((c) => c.id === cardId);

  if (f.loading) return <div className="p-6 text-center text-muted-foreground">Cargando…</div>;
  if (!card) {
    return (
      <div className="container max-w-2xl mx-auto p-6 text-center">
        <p className="text-muted-foreground mb-4">Tarjeta no encontrada</p>
        <Link to="/finance"><Button>Volver</Button></Link>
      </div>
    );
  }

  const cardExpenses = f.expenses.filter((e) => e.card_id === card.id).slice(0, 50);
  const cardMsi = f.msiPlans.filter((p) => p.card_id === card.id);
  const cardPayments = f.payments.filter((p) => p.card_id === card.id);
  const activeMsi = cardMsi.filter((p) => p.status === "active");

  const breakdown = cardBalanceBreakdown(card, f.expenses, f.msiPlans);
  const { msiThisMonth, msiCommitted, nextCutNormal, nextCutCharge } = breakdown;
  const recon = cardReconciliation(card, f.expenses, f.msiPlans);

  const effectiveDebt = Math.max(card.current_balance, msiCommitted + nextCutCharge);
  const available = Math.max(0, card.credit_limit - effectiveDebt);
  const usage = card.credit_limit > 0 ? (effectiveDebt / card.credit_limit) * 100 : 0;

  const cutDate = nextCutDate(card.cut_day);
  const payDate = nextPaymentDate(card.payment_day);

  return (
    <div className="container max-w-3xl mx-auto p-4 pb-24 md:pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/finance" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Finanzas
        </Link>
        <div className="flex gap-2">
          <InitialBalanceWizard card={card} />
          <CardEditButton card={card} />
        </div>
      </div>

      {/* Big card */}
      <div
        className="rounded-3xl p-6 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${card.color}, color-mix(in oklab, ${card.color} 50%, black))` }}
      >
        <div className="text-xs opacity-80">{card.bank || "Banco"}</div>
        <div className="text-2xl font-display font-bold">{card.icon} {card.name}</div>
        <div className="mt-4 text-2xl font-mono tracking-widest opacity-90">····{card.last_four}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-70">Disponible</div>
            <div className="text-xl font-bold">{formatMXN(available)}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Deuda total</div>
            <div className="text-xl font-bold">{formatMXN(effectiveDebt)}</div>
            {effectiveDebt > card.current_balance && (
              <div className="text-[10px] opacity-70">declarado: {formatMXN(card.current_balance)}</div>
            )}
          </div>
        </div>

        {/* {(card as any).clabe && (
          <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-sm p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] opacity-70 uppercase tracking-wide">CLABE</div>
              <div className="font-mono text-sm tracking-wider truncate">{(card as any).clabe}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText((card as any).clabe || "");
              }}
              className="shrink-0 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold"
            >
              Copiar
            </button>
          </div>
        )} */}

        {/* Desglose de saldo */}
        <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-sm p-3 space-y-2">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-[11px] opacity-80">Próximo corte</div>
              <div className="text-[10px] opacity-60">contado + MSI del mes · {daysUntil(cutDate)}d</div>
            </div>
            <div className="font-bold">{formatMXN(nextCutCharge)}</div>
          </div>
          <div className="h-px bg-white/15" />
          <div className="flex justify-between items-baseline text-xs">
            <span className="opacity-75">· Contado del periodo</span>
            <span>{formatMXN(nextCutNormal)}</span>
          </div>
          <div className="flex justify-between items-baseline text-xs">
            <span className="opacity-75">· MSI este mes</span>
            <span>{formatMXN(msiThisMonth)}</span>
          </div>
          <div className="h-px bg-white/15" />
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-[11px] opacity-80">MSI futuros comprometidos</div>
              <div className="text-[10px] opacity-60">total restante a meses</div>
            </div>
            <div className="font-bold">{formatMXN(msiCommitted)}</div>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${Math.min(100, usage)}%` }} />
        </div>
        <div className="mt-1 text-[11px] opacity-80">{usage.toFixed(0)}% de {formatMXN(card.credit_limit)}</div>
      </div>

      {/* Cuadre de saldo */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm">Cuadre de saldo</div>
            {recon.isBalanced ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cuadra
              </span>
            ) : (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Diferencia {formatMXN(Math.abs(recon.diff))}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-y-1 text-xs">
            <span className="text-muted-foreground">Deuda total</span>
            <span className="text-right font-medium">{formatMXN(recon.declared)}</span>
            <span className="text-muted-foreground">MSI futuros</span>
            <span className="text-right">{formatMXN(recon.msiCommitted)}</span>
            <span className="text-muted-foreground">Próximo corte</span>
            <span className="text-right">{formatMXN(recon.nextCutCharge)}</span>
            <span className="text-muted-foreground">Cortes anteriores pend.</span>
            <span className="text-right">{formatMXN(recon.priorCutsPending)}</span>
          </div>
          {!recon.isBalanced && (
            <p className="text-[11px] text-amber-600/90 pt-1 border-t border-border">
              Puede que falte cargar un plan MSI o una compra. Usa "Cargar saldo inicial" arriba para revisar.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <ExpenseForm defaultCardId={card.id} trigger={<Button className="flex-1">+ Gasto</Button>} />
        <PaymentForm cardId={card.id} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Pago mínimo" value={formatMXN(card.min_payment)} />
        <Mini label="Sin intereses" value={formatMXN(card.no_interest_payment)} />
        <Mini label="Próximo corte" value={`${daysUntil(cutDate)}d (${cutDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })})`} />
        <Mini label="Próximo pago" value={`${daysUntil(payDate)}d (${payDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })})`} />
      </div>

      {/* MSI */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold">Meses sin intereses</div>
            <div className="text-xs text-muted-foreground">{activeMsi.length} activos</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-center">
            <div className="bg-secondary/40 rounded-lg p-2">
              <div className="text-[10px] text-muted-foreground">Próximo corte</div>
              <div className="font-bold">{formatMXN(msiThisMonth)}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <div className="text-[10px] text-muted-foreground">Comprometido</div>
              <div className="font-bold">{formatMXN(msiCommitted)}</div>
            </div>
          </div>
          {activeMsi.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">Sin planes MSI activos</div>
          ) : (
            <div className="space-y-2">
              {activeMsi.map((p) => (
                <div key={p.id} className="text-sm p-2 bg-secondary/30 rounded-lg flex justify-between">
                  <span className="truncate">{p.description}</span>
                  <span className="text-muted-foreground">{p.paid_months}/{p.months} · {formatMXN(p.monthly_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial pagos */}
      <Card>
        <CardContent className="p-4">
          <div className="font-bold mb-2">Historial de pagos</div>
          {cardPayments.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">Sin pagos registrados</div>
          ) : (
            <div className="space-y-1">
              {cardPayments.slice(0, 10).map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span>{new Date(p.date + "T12:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="font-bold text-green-500">{formatMXN(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compras */}
      <Card>
        <CardContent className="p-4">
          <div className="font-bold mb-2">Compras recientes</div>
          {cardExpenses.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">Sin compras</div>
          ) : (
            <div className="space-y-1">
              {cardExpenses.map((e) => (
                <div key={e.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{e.category}{e.note && ` · ${e.note}`}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(e.date + "T12:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</div>
                  </div>
                  <div className="font-bold">{formatMXN(e.amount)}</div>
                  <Button size="sm" variant="ghost" onClick={() => f.deleteExpense(e.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-bold text-sm mt-0.5">{value}</div>
      </CardContent>
    </Card>
  );
}
