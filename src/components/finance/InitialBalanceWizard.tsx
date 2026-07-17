/**
 * **Componente** — Asistente para introducir saldo inicial de tarjetas al onboarding.
 */
import { useState } from "react";
import { todayCDMX } from "@/lib/date-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN, type CreditCard } from "@/lib/finance-types";
import { Trash2, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

type MsiDraft = {
  description: string;
  total: string;
  months: string;
  paid: string;
  date: string;
};

type CashDraft = {
  description: string;
  amount: string;
  date: string;
  category: string;
};

export function InitialBalanceWizard({ card, trigger }: { card: CreditCard; trigger?: React.ReactNode }) {
  const { updateCard, createMsiPlan, createExpense } = useFinance();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [balance, setBalance] = useState(String(card.current_balance ?? 0));
  const [msi, setMsi] = useState<MsiDraft[]>([]);
  const [cash, setCash] = useState<CashDraft[]>([]);

  const reset = () => {
    setStep(1);
    setBalance(String(card.current_balance ?? 0));
    setMsi([]);
    setCash([]);
  };

  // Cálculos
  const msiCommitted = msi.reduce((s, m) => {
    const total = Number(m.total) || 0;
    const months = Number(m.months) || 1;
    const paid = Number(m.paid) || 0;
    const monthly = total / months;
    return s + Math.max(0, months - paid) * monthly;
  }, 0);

  const msiThisMonth = msi.reduce((s, m) => {
    const total = Number(m.total) || 0;
    const months = Number(m.months) || 1;
    const paid = Number(m.paid) || 0;
    if (paid >= months) return s;
    return s + total / months;
  }, 0);

  const cashTotal = cash.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const declared = Number(balance) || 0;
  const computed = msiCommitted + cashTotal;
  const priorPending = declared - msiCommitted - cashTotal;
  const diff = priorPending; // positivo = saldo de cortes anteriores; negativo = falta cargar

  const addMsi = () =>
    setMsi((p) => [
      ...p,
      { description: "", total: "", months: "12", paid: "0", date: todayCDMX() },
    ]);

  const addCash = () =>
    setCash((p) => [
      ...p,
      { description: "", amount: "", date: todayCDMX(), category: "Otros" },
    ]);

  const submit = async () => {
    setSaving(true);
    try {
      // 1. Set saldo total directo
      await updateCard(card.id, { current_balance: declared });

      // 2. Crear MSI plans (sin tocar saldo)
      for (const m of msi) {
        const total = Number(m.total) || 0;
        const months = Number(m.months) || 1;
        const paid = Number(m.paid) || 0;
        if (total <= 0) continue;
        await createMsiPlan(
          {
            card_id: card.id,
            description: m.description || `MSI ${months} meses`,
            total_amount: total,
            months,
            paid_months: paid,
            start_date: m.date,
            category: "Deudas",
            note: "",
            status: "active",
          },
          { skipBalanceUpdate: true },
        );
      }

      // 3. Crear gastos de contado del periodo (sin tocar saldo)
      for (const c of cash) {
        const amt = Number(c.amount) || 0;
        if (amt <= 0) continue;
        await createExpense(
          {
            amount: amt,
            date: c.date,
            category: c.category || "Otros",
            payment_method: "credit",
            card_id: card.id,
            note: c.description,
            tags: [],
            kind: "expense",
            expense_type: "normal",
            msi_plan_id: null,
          },
          { skipBalanceUpdate: true },
        );
      }

      toast.success("Saldo inicial cargado");
      setOpen(false);
      reset();
    } catch (e) {
      toast.error("Error al guardar");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Wallet className="w-4 h-4 mr-1" /> Cargar saldo inicial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Saldo inicial · {card.name} <span className="text-xs text-muted-foreground">paso {step}/3</span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <Label>Saldo actual según tu app del banco</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Es la deuda total que ves hoy. Después la desglosaremos en MSI y compras del periodo.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setStep(2)}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Compras a meses sin intereses vigentes</Label>
              <Button size="sm" variant="ghost" onClick={addMsi}>
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            {msi.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Si no tienes MSI activos, salta este paso.
              </p>
            )}
            {msi.map((m, i) => {
              const monthly = (Number(m.total) || 0) / (Number(m.months) || 1);
              return (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Descripción"
                      value={m.description}
                      onChange={(e) =>
                        setMsi((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMsi((p) => p.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px]">Total</Label>
                      <Input
                        type="number"
                        value={m.total}
                        onChange={(e) =>
                          setMsi((p) => p.map((x, j) => (j === i ? { ...x, total: e.target.value } : x)))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Meses</Label>
                      <Input
                        type="number"
                        value={m.months}
                        onChange={(e) =>
                          setMsi((p) => p.map((x, j) => (j === i ? { ...x, months: e.target.value } : x)))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Pagados</Label>
                      <Input
                        type="number"
                        value={m.paid}
                        onChange={(e) =>
                          setMsi((p) => p.map((x, j) => (j === i ? { ...x, paid: e.target.value } : x)))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">Fecha de la compra</Label>
                    <Input
                      type="date"
                      value={m.date}
                      onChange={(e) =>
                        setMsi((p) => p.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Mensualidad: <b>{formatMXN(monthly)}</b>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-muted-foreground border-t pt-2">
              MSI este mes: <b>{formatMXN(msiThisMonth)}</b> · Comprometido total:{" "}
              <b>{formatMXN(msiCommitted)}</b>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button onClick={() => setStep(3)}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Compras de contado del periodo actual</Label>
              <Button size="sm" variant="ghost" onClick={addCash}>
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo las compras de contado que aparecen en tu próximo corte. Si ya las cargaste o no aplica, salta.
            </p>
            {cash.map((c, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Descripción"
                    value={c.description}
                    onChange={(e) =>
                      setCash((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCash((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Monto</Label>
                    <Input
                      type="number"
                      value={c.amount}
                      onChange={(e) =>
                        setCash((p) => p.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Fecha</Label>
                    <Input
                      type="date"
                      value={c.date}
                      onChange={(e) =>
                        setCash((p) => p.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Resumen */}
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Saldo declarado</span>
                <b>{formatMXN(declared)}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span>· MSI futuros</span>
                <span>{formatMXN(msiCommitted)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>· Contado del periodo</span>
                <span>{formatMXN(cashTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>· Cortes anteriores pendientes</span>
                <span>{formatMXN(Math.max(0, priorPending))}</span>
              </div>
              <div className="border-t pt-1 flex justify-between">
                {diff >= -50 ? (
                  <span className="text-green-600">✓ Cuadra</span>
                ) : (
                  <span className="text-amber-600">
                    ⚠ Faltan {formatMXN(Math.abs(diff))} por desglosar
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Guardando…" : "Guardar todo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
