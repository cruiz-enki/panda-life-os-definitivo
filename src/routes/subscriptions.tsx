/**
 * **Ruta** — Suscripciones y renovaciones: reutiliza los servicios del hogar
 * (Netflix, seguros, dominios…) y muestra próximos cargos.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Repeat, Plus, Trash2, Pencil, AlertTriangle, Calendar } from "lucide-react";
import { useServices, type HomeService } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Suscripciones · ENKI LIFE OS" },
      { name: "description", content: "Renovaciones de Netflix, seguros, dominios y más. Alertas antes del cargo." },
    ],
  }),
  component: SubscriptionsPage,
});

const SUB_CATEGORIES = [
  "Streaming",
  "Software",
  "Dominios/Hosting",
  "Seguros",
  "Gimnasio",
  "Membresía",
  "Nube",
  "Otro",
];

function daysUntilDueDay(dueDay: number | null): number | null {
  if (!dueDay) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  let target = new Date(y, m, Math.min(dueDay, lastDay));
  if (target < today) {
    const lastDayNext = new Date(y, m + 2, 0).getDate();
    target = new Date(y, m + 1, Math.min(dueDay, lastDayNext));
  }
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function SubscriptionsPage() {
  const { services, createService, updateService, deleteService } = useServices();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HomeService | null>(null);

  // Solo suscripciones (categorías filtradas). Si no hay categoría todavía se
  // ven aquí también para que el usuario pueda reclasificar.
  const subs = useMemo(
    () =>
      services
        .filter((s) => s.status === "active")
        .filter((s) => !s.category || SUB_CATEGORIES.includes(s.category)),
    [services],
  );

  const enriched = subs
    .map((s) => ({ ...s, days: daysUntilDueDay(s.due_day) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const monthlyTotal = subs.reduce((sum, s) => sum + Number(s.monthly_cost || 0), 0);
  const yearlyTotal = monthlyTotal * 12;
  const upcoming7 = enriched.filter((s) => s.days != null && s.days <= 7);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Recurrentes
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Suscripciones 🔁</h1>
          <p className="text-muted-foreground mt-1">Netflix, seguros, dominios y todo lo que se renueva solo.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nueva</Button>
          </DialogTrigger>
          <SubForm
            initial={editing}
            onSubmit={async (data) => {
              const err = editing ? await updateService(editing.id, data) : await createService(data);
              if (err) toast.error(err.message);
              else {
                toast.success(editing ? "Actualizada" : "Guardada");
                setOpen(false);
                setEditing(null);
              }
            }}
          />
        </Dialog>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Activas</div><div className="text-2xl font-semibold">{subs.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Sangrado / mes</div><div className="text-2xl font-semibold">{formatMXN(monthlyTotal)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Al año</div><div className="text-2xl font-semibold">{formatMXN(yearlyTotal)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Se cobran en 7d</div><div className="text-2xl font-semibold">{upcoming7.length}</div></Card>
      </div>

      <div className="text-xs text-muted-foreground mb-6 flex items-center gap-2">
        <Repeat className="w-3 h-3" /> Estas suscripciones ya se descuentan automáticamente en{" "}
        <Link to="/cashflow" className="underline">Cashflow</Link>.
      </div>

      {/* Desglose por categoría */}
      {subs.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="text-xs text-muted-foreground mb-2">Por categoría</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              subs.reduce<Record<string, number>>((acc, s) => {
                const key = s.category || "Sin categoría";
                acc[key] = (acc[key] ?? 0) + Number(s.monthly_cost || 0);
                return acc;
              }, {}),
            )
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}: {formatMXN(amt)}
                </Badge>
              ))}
          </div>
        </Card>
      )}

      {upcoming7.length > 0 && (
        <Card className="p-5 mb-6 border-amber-500/30 bg-amber-500/5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Cargos próximos (7 días)
          </h2>
          <div className="space-y-2">
            {upcoming7.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{s.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.provider ?? s.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-medium">{formatMXN(Number(s.monthly_cost))}</div>
                  <Badge variant={s.days! <= 2 ? "destructive" : "secondary"}>
                    {s.days === 0 ? "Hoy" : `${s.days}d`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista completa */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Todas las suscripciones
        </h2>
        {enriched.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Aún no tienes suscripciones. También puedes ver todo en{" "}
            <Link to="/services" className="underline">Servicios</Link>.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {enriched.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[s.provider, s.category].filter(Boolean).join(" · ")}
                      {s.due_day && ` · Día ${s.due_day}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatMXN(Number(s.monthly_cost))}</div>
                    {s.days != null && (
                      <div className="text-xs text-muted-foreground">
                        {s.days === 0 ? "hoy" : `en ${s.days}d`}
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm(`¿Eliminar ${s.name}?`)) return;
                      await deleteService(s.id);
                      toast.success("Eliminada");
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SubForm({ initial, onSubmit }: { initial: HomeService | null; onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    provider: initial?.provider ?? "",
    monthly_cost: initial?.monthly_cost?.toString() ?? "",
    due_day: initial?.due_day?.toString() ?? "",
    category: initial?.category ?? "Streaming",
    emoji: initial?.emoji ?? "🔁",
    status: initial?.status ?? "active",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Editar suscripción" : "Nueva suscripción"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Netflix" /></div>
        <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></div>
        <div><Label>Proveedor</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
        <div>
          <Label>Categoría</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Costo mensual (MXN)</Label><Input type="number" step="0.01" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} /></div>
        <div><Label>Día de cargo</Label><Input type="number" min="1" max="31" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} /></div>
      </div>
      <Button
        onClick={() =>
          onSubmit({
            name: form.name,
            provider: form.provider || null,
            monthly_cost: Number(form.monthly_cost) || 0,
            due_day: form.due_day ? Number(form.due_day) : null,
            category: form.category,
            emoji: form.emoji || "🔁",
            status: form.status,
          })
        }
        disabled={!form.name}
      >
        Guardar
      </Button>
    </DialogContent>
  );
}
