/**
 * **Componente** — Formulario CRUD de tarjeta financiera.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/hooks/use-finance";
import { CARD_COLORS, type CardStatus, type CreditCard } from "@/lib/finance-types";
import { Plus, Pencil } from "lucide-react";

const ICONS = ["💳", "🏦", "💎", "🌟", "🔥", "⚡", "🎯", "👑", "🦾", "🧊"];

export function CardForm({ existing, trigger }: { existing?: CreditCard; trigger?: React.ReactNode }) {
  const { createCard, updateCard, deleteCard } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<CreditCard, "id">>({
    name: existing?.name || "",
    bank: existing?.bank || "",
    last_four: existing?.last_four || "",
    credit_limit: existing?.credit_limit || 0,
    current_balance: existing?.current_balance || 0,
    cut_day: existing?.cut_day || 1,
    payment_day: existing?.payment_day || 20,
    min_payment: existing?.min_payment || 0,
    no_interest_payment: existing?.no_interest_payment || 0,
    color: existing?.color || CARD_COLORS[0],
    icon: existing?.icon || "💳",
    status: (existing?.status || "active") as CardStatus,
    nip_code: existing?.nip_code || "",
    clabe: existing?.clabe || "",
  });

  // Sincronizar el formulario si los props cambian (importante para que se reflejen cambios tras editar)
  useEffect(() => {
    if (existing && open) {
      setForm({
        name: existing.name || "",
        bank: existing.bank || "",
        last_four: existing.last_four || "",
        credit_limit: Number(existing.credit_limit) || 0,
        current_balance: Number(existing.current_balance) || 0,
        cut_day: Number(existing.cut_day) || 1,
        payment_day: Number(existing.payment_day) || 20,
        min_payment: Number(existing.min_payment) || 0,
        no_interest_payment: Number(existing.no_interest_payment) || 0,
        color: existing.color || CARD_COLORS[0],
        icon: existing.icon || "💳",
        status: (existing.status || "active") as CardStatus,
        nip_code: existing.nip_code || "",
        clabe: existing.clabe || "",
      });
    }
  }, [existing, open]);

  const submit = async () => {
    if (!form.name.trim()) return;
    
    // Forzamos la conversión a números de los campos que vienen de inputs type="number"
    const submission = { 
      ...form,
      credit_limit: Number(form.credit_limit),
      current_balance: Number(form.current_balance),
      cut_day: Number(form.cut_day),
      payment_day: Number(form.payment_day),
      min_payment: Number(form.min_payment),
      no_interest_payment: Number(form.no_interest_payment)
    };

    if (existing) {
      const result = await updateCard(existing.id, submission);
      if (result) {
        console.error("Error al actualizar tarjeta:", result);
        alert("No se pudieron guardar los cambios. Revisa tu conexión.");
      }
    } else {
      await createCard(submission);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva tarjeta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar tarjeta" : "Nueva tarjeta de crédito"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Platinum" />
            </div>
            <div>
              <Label>Banco</Label>
              <Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="BBVA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Últimos 4</Label>
              <Input maxLength={4} value={form.last_four} onChange={(e) => setForm({ ...form, last_four: e.target.value })} placeholder="1234" />
            </div>
            <div>
              <Label>Límite de crédito</Label>
              <Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Saldo actual (deuda)</Label>
            <Input type="number" value={form.current_balance} onChange={(e) => setForm({ ...form, current_balance: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Día de corte</Label>
              <Input type="number" min={1} max={31} value={form.cut_day} onChange={(e) => setForm({ ...form, cut_day: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Día de pago</Label>
              <Input type="number" min={1} max={31} value={form.payment_day} onChange={(e) => setForm({ ...form, payment_day: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pago mínimo</Label>
              <Input type="number" value={form.min_payment} onChange={(e) => setForm({ ...form, min_payment: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Pago sin intereses</Label>
              <Input type="number" value={form.no_interest_payment} onChange={(e) => setForm({ ...form, no_interest_payment: Number(e.target.value) })} />
            </div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl border border-dashed border-primary/20">
            <Label className="flex items-center gap-2 mb-2 text-xs text-primary/70">
              <Plus className="w-3 h-3" /> NIP de Seguridad (Opcional)
            </Label>
            <Input 
              type="password" 
              maxLength={4} 
              value={form.nip_code || ""} 
              onChange={(e) => setForm({ ...form, nip_code: e.target.value.replace(/\D/g, "") })} 
              placeholder="Ej. 1234"
              className="bg-background/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              Se guardará de forma privada. Útil para consultas rápidas en cajeros.
            </p>
          </div>
          <div>
            <Label>CLABE interbancaria (18 dígitos)</Label>
            <Input
              inputMode="numeric"
              maxLength={18}
              value={form.clabe || ""}
              onChange={(e) => setForm({ ...form, clabe: e.target.value.replace(/\D/g, "").slice(0, 18) })}
              placeholder="014975000000000000"
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1 px-1">
              Dato público, útil para recibir transferencias.
            </p>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, icon: i })}
                  className={`w-9 h-9 rounded-lg text-lg ${form.icon === i ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CardStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} className="flex-1">
              {existing ? "Guardar" : "Crear tarjeta"}
            </Button>
            {existing && (
              <Button
                variant="destructive"
                type="button"
                onClick={async () => {
                  if (confirm("¿Eliminar esta tarjeta?")) {
                    await deleteCard(existing.id);
                    setOpen(false);
                  }
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CardEditButton({ card }: { card: CreditCard }) {
  return (
    <CardForm
      existing={card}
      trigger={
        <Button size="sm" variant="ghost">
          <Pencil className="w-4 h-4" />
        </Button>
      }
    />
  );
}
