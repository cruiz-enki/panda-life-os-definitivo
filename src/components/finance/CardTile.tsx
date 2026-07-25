/**
 * **Componente** — Tile/tarjeta visual de una tarjeta financiera con saldo y utilización.
 */
import { Link } from "@tanstack/react-router";
import { formatMXN, nextCutDate, nextPaymentDate, daysUntil, cardBalanceBreakdown, type CreditCard, type FinanceExpense, type MsiPlan } from "@/lib/finance-types";
import { CardEditButton } from "./CardForm";
import { InitialBalanceWizard } from "./InitialBalanceWizard";
import { CardNipSafety } from "./CardNipSafety";

export function CardTile({ card, expenses, msiPlans }: { card: CreditCard; expenses: FinanceExpense[]; msiPlans: MsiPlan[] }) {
  const { nextCutCharge, msiCommitted } = cardBalanceBreakdown(card, expenses, msiPlans);
  const effectiveDebt = Math.max(card.current_balance, msiCommitted + nextCutCharge);
  const used = card.credit_limit > 0 ? (effectiveDebt / card.credit_limit) * 100 : 0;
  const available = Math.max(0, card.credit_limit - effectiveDebt);
  const cutD = nextCutDate(card.cut_day);
  const payD = nextPaymentDate(card.payment_day);
  const daysCut = daysUntil(cutD);
  const daysPay = daysUntil(payD);

  const usageColor = used >= 80 ? "bg-red-500" : used >= 50 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div
      className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]"
      style={{ background: `linear-gradient(135deg, ${card.color}, color-mix(in oklab, ${card.color} 60%, black))` }}
    >
      {/* Edit button — absolute, sits above the link overlay */}
      <div className="absolute top-3 right-3 z-20">
        <CardEditButton card={card} />
      </div>

      {/* Full-card click overlay that navigates to detail */}
      <Link
        to="/finance/cards/$cardId"
        params={{ cardId: card.id }}
        className="absolute inset-x-0 top-0 bottom-20 z-10"
        aria-label={`Ver detalle de ${card.name}`}
      />

      <div className="relative z-0">
        <div className="flex items-start justify-between pr-10">
          <div>
            <div className="text-xs opacity-80">{card.bank || "Banco"}</div>
            <div className="font-display font-bold text-lg flex items-center gap-2">
              <span>{card.icon}</span> {card.name}
            </div>
          </div>
        </div>

        <div className="mt-4 text-2xl font-mono tracking-widest opacity-90">····{card.last_four || "0000"}</div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="opacity-70">Disponible</div>
          <div className="font-bold">{formatMXN(available)}</div>
        </div>
        <div>
          <div className="opacity-70">Deuda</div>
          <div className="font-bold">{formatMXN(effectiveDebt)}</div>
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] opacity-90 bg-white/10 rounded-lg px-2 py-1">
        <span>Próx. corte: <b>{formatMXN(nextCutCharge)}</b></span>
        <span>MSI futuros: <b>{formatMXN(msiCommitted)}</b></span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
        <div className={`h-full ${usageColor} transition-all`} style={{ width: `${Math.min(100, used)}%` }} />
      </div>
      <div className="mt-1 text-[10px] opacity-80">{used.toFixed(0)}% usado de {formatMXN(card.credit_limit)}</div>

      <div className="mt-3 flex justify-between text-[11px]">
        <div>
          <div className="opacity-70">Corta en</div>
          <div className="font-bold">{daysCut} días</div>
        </div>
        <div className="text-right">
          <div className="opacity-70">Paga en</div>
          <div className={`font-bold ${daysPay <= 3 ? "text-yellow-300" : ""}`}>{daysPay} días</div>
        </div>
      </div>

      <div className="relative z-20 mt-4">
        <InitialBalanceWizard
          card={card}
          trigger={
            <button className="w-full rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              Cargar saldo inicial
            </button>
          }
        />
      </div>

      <div className="relative z-20">
        <CardNipSafety card={card} />
      </div>
      </div>
    </div>
  );
}
