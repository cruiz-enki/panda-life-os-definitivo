/**
 * **Componente** — Formulario CRUD de gasto/ingreso (incluye MSI).
 */
import { useState } from "react";
import { todayCDMX } from "@/lib/date-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS, type PaymentMethod, type ExpenseKind } from "@/lib/finance-types";
import { Plus } from "lucide-react";

export function ExpenseForm({ trigger, defaultCardId }: { trigger?: React.ReactNode; defaultCardId?: string }) {
  const { cards, categories, createExpense, createMsiPlan } = useFinance();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"normal" | "msi">("normal");
  const [kind, setKind] = useState<ExpenseKind>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayCDMX());
  const [category, setCategory] = useState("Otros");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultCardId ? "credit" : "cash");
  const [cardId, setCardId] = useState<string>(defaultCardId ?? "");
  const [note, setNote] = useState("");
  const [months, setMonths] = useState(3);
  const [description, setDescription] = useState("");

  // Combina default + custom
  const allCats = [
    ...DEFAULT_CATEGORIES.filter((d) => d.kind === kind).map((d) => ({ name: d.name, emoji: d.emoji })),
    ...categories.filter((c) => c.kind === kind).map((c) => ({ name: c.name, emoji: c.emoji })),
  ];

  const reset = () => {
    setAmount("");
    setNote("");
    setDescription("");
    setMonths(3);
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    if (mode === "msi") {
      if (!cardId) return alert("Selecciona una tarjeta para MSI");
      await createMsiPlan({
        card_id: cardId,
        description: description || `MSI ${months} meses`,
        total_amount: amt,
        months,
        start_date: date,
        category,
        note,
        status: "active",
      });
    } else {
      await createExpense({
        amount: amt,
        date,
        category,
        payment_method: paymentMethod,
        card_id: paymentMethod === "credit" ? cardId || null : null,
        note,
        tags: [],
        kind,
        expense_type: "normal",
        msi_plan_id: null,
      });
    }
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo gasto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setKind("expense");
              setMode("normal");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${kind === "expense" && mode === "normal" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Gasto
          </button>
          <button
            onClick={() => {
              setKind("income");
              setMode("normal");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${kind === "income" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Ingreso
          </button>
          <button
            onClick={() => {
              setKind("expense");
              setMode("msi");
              setPaymentMethod("credit");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "msi" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            MSI
          </button>
        </div>

        <div className="space-y-3 mt-2">
          {mode === "msi" && (
            <div>
              <Label>Descripción</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Laptop nueva" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{mode === "msi" ? "Monto total" : "Monto"}</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {mode === "msi" && (
            <div>
              <Label>Número de meses</Label>
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 6, 9, 12, 18, 24].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {Number(amount) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Mensualidad: <strong>${(Number(amount) / months).toFixed(2)}</strong>
                </p>
              )}
            </div>
          )}

          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCats.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "normal" && kind === "expense" && (
            <div>
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(mode === "msi" || (mode === "normal" && paymentMethod === "credit")) && (
            <div>
              <Label>Tarjeta</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {cards.filter((c) => c.status === "active").map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name} ····{c.last_four}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Nota (opcional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <Button onClick={submit} className="w-full">
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
