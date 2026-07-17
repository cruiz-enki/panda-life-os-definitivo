/**
 * **Componente** — Formulario de pago a tarjeta de crédito.
 */
import { useState } from "react";
import { todayCDMX } from "@/lib/date-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { formatMXN, type PaymentMethod, PAYMENT_METHOD_LABELS } from "@/lib/finance-types";
import { CreditCard as CardIcon } from "lucide-react";

export function PaymentForm({ cardId }: { cardId?: string }) {
  const { cards, createPayment } = useFinance();
  const [open, setOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(cardId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayCDMX());
  const [method, setMethod] = useState<PaymentMethod>("transfer");

  const card = cards.find((c) => c.id === selectedCard);

  const submit = async () => {
    if (!selectedCard) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await createPayment({
      card_id: selectedCard,
      amount: amt,
      date,
      payment_method: method,
      note: "",
    });
    setAmount("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CardIcon className="w-4 h-4 mr-2" />
          Pagar tarjeta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago a tarjeta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tarjeta</Label>
            <Select value={selectedCard} onValueChange={setSelectedCard}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name} — debes {formatMXN(c.current_balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {card && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setAmount(String(card.min_payment))}>
                Mínimo {formatMXN(card.min_payment)}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAmount(String(card.no_interest_payment))}>
                Sin int. {formatMXN(card.no_interest_payment)}
              </Button>
              <Button variant="secondary" size="sm" className="col-span-2" onClick={() => setAmount(String(card.current_balance))}>
                Total {formatMXN(card.current_balance)}
              </Button>
            </div>
          )}
          <div>
            <Label>Monto</Label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).filter((m) => m !== "credit").map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={submit} className="w-full">
            Registrar pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
