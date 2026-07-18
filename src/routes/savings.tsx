/**
 * **Ruta** — Metas de ahorro: fondo de emergencia + sinking funds.
 * Sub-cuentas mentales (viaje, tenencia, regalos, seguros anuales…).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PiggyBank, Plus, Trash2, Pencil, ShieldCheck, TrendingUp, Target } from "lucide-react";
import { useSavingsGoals, GOAL_KIND_META, type SavingsGoal, type SavingsGoalKind } from "@/hooks/use-savings-goals";
import { useCashflow } from "@/hooks/use-cashflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Ahorro · ENKI LIFE OS" },
      { name: "description", content: "Fondo de emergencia y metas de ahorro con sub-cuentas mentales" },
    ],
  }),
  component: SavingsPage,
});

function SavingsPage() {
  const { goals, totals, createGoal, updateGoal, deleteGoal, addContribution } = useSavingsGoals();
  const { recurringExpenses, subscriptions } = useCashflow();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contribOpen, setContribOpen] = useState<SavingsGoal | null>(null);

  // Gastos fijos mensuales estimados (para "meses de gastos")
  const monthlyFixed = useMemo(() => {
    const rec = (recurringExpenses ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
    const subs = (subscriptions ?? []).reduce((s, r: any) => s + Number(r.monthly_cost || 0), 0);
    return rec + subs;
  }, [recurringExpenses, subscriptions]);

  const emergency = useMemo(() => goals.find((g) => g.kind === "emergency" && g.status === "active"), [goals]);
  const emergencyTarget = emergency?.months_of_expenses ? monthlyFixed * emergency.months_of_expenses : (emergency?.target_amount ?? 0);
  const emergencyProgress = emergencyTarget > 0 ? Math.min(1, (emergency?.current_amount ?? 0) / emergencyTarget) : 0;
  const monthsCovered = monthlyFixed > 0 && emergency ? emergency.current_amount / monthlyFixed : 0;

  const sinkingFunds = goals.filter((g) => g.kind !== "emergency" && g.status === "active");

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <PiggyBank className="w-4 h-4" /> Ahorro
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Metas 🐷</h1>
          <p className="text-muted-foreground mt-1">Fondo de emergencia y sub-cuentas mentales para lo que viene.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nueva meta</Button></DialogTrigger>
          <GoalForm
            initial={editing}
            monthlyFixed={monthlyFixed}
            onSubmit={async (data) => {
              const err = editing ? await updateGoal(editing.id, data) : await createGoal(data);
              if (err) toast.error(err.message);
              else { toast.success(editing ? "Actualizada" : "Guardada"); setOpen(false); setEditing(null); }
            }}
          />
        </Dialog>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Ahorrado</div>
          <div className="text-2xl font-semibold">{formatMXN(totals.current)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Meta total</div>
          <div className="text-2xl font-semibold">{formatMXN(totals.target)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Aporte mensual</div>
          <div className="text-2xl font-semibold">{formatMXN(totals.monthly)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Metas activas</div>
          <div className="text-2xl font-semibold">{totals.count}</div>
        </Card>
      </div>

      {/* Fondo de emergencia */}
      <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Fondo de emergencia</h2>
          </div>
          {!emergency && (
            <Button size="sm" variant="outline" onClick={() => { setEditing({ kind: "emergency", months_of_expenses: 3 } as any); setOpen(true); }}>
              Configurar
            </Button>
          )}
        </div>
        {!emergency ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes fondo de emergencia. Objetivo típico: 3–6 meses de tus gastos fijos.
            {monthlyFixed > 0 && <> Tu piso mensual estimado es <b>{formatMXN(monthlyFixed)}</b>.</>}
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-3xl font-bold">{formatMXN(emergency.current_amount)}</div>
                <div className="text-xs text-muted-foreground">
                  de {formatMXN(emergencyTarget)}
                  {emergency.months_of_expenses ? ` · meta ${emergency.months_of_expenses} meses` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{monthsCovered.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">meses cubiertos</div>
              </div>
            </div>
            <Progress value={emergencyProgress * 100} className="h-2 mb-3" />
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => setContribOpen(emergency)}>
                <Plus className="w-3 h-3 mr-1" /> Aportar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(emergency); setOpen(true); }}>
                <Pencil className="w-3 h-3 mr-1" /> Ajustar meta
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Sinking funds */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" /> Sub-cuentas mentales
        </h2>
        {sinkingFunds.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Crea metas para viajes, tenencia, regalos de diciembre, seguros anuales…
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sinkingFunds.map((g) => {
              const pct = g.target_amount > 0 ? Math.min(1, g.current_amount / g.target_amount) : 0;
              const missing = Math.max(0, g.target_amount - g.current_amount);
              const monthsLeft = g.target_date
                ? Math.max(0, monthsBetween(new Date(), new Date(g.target_date + "T00:00:00")))
                : null;
              const suggested = monthsLeft && monthsLeft > 0 ? missing / monthsLeft : g.monthly_contribution;
              return (
                <div key={g.id} className="p-4 rounded-lg border border-border/40 bg-background/30">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {GOAL_KIND_META[g.kind]?.label}
                          {g.target_date && ` · ${new Date(g.target_date).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{Math.round(pct * 100)}%</Badge>
                  </div>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="font-medium">{formatMXN(g.current_amount)}</span>
                    <span className="text-muted-foreground text-xs">de {formatMXN(g.target_amount)}</span>
                  </div>
                  <Progress value={pct * 100} className="h-2 mb-3" />
                  {suggested > 0 && (
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Sugerido: {formatMXN(suggested)}/mes
                      {monthsLeft != null && ` (${monthsLeft} meses)`}
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" onClick={() => setContribOpen(g)}>
                      <Plus className="w-3 h-3 mr-1" /> Aportar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(g); setOpen(true); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!confirm(`¿Eliminar meta "${g.name}"?`)) return;
                      await deleteGoal(g.id);
                      toast.success("Eliminada");
                    }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Aportar */}
      <Dialog open={!!contribOpen} onOpenChange={(o) => !o && setContribOpen(null)}>
        {contribOpen && (
          <ContributionForm
            goal={contribOpen}
            onSubmit={async (amount, note) => {
              const err = await addContribution(contribOpen.id, amount, note);
              if (err) toast.error(err.message);
              else { toast.success(`+${formatMXN(amount)} a ${contribOpen.name}`); setContribOpen(null); }
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function GoalForm({
  initial, monthlyFixed, onSubmit,
}: { initial: Partial<SavingsGoal> | null; monthlyFixed: number; onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    kind: (initial?.kind ?? "other") as SavingsGoalKind,
    target_amount: initial?.target_amount?.toString() ?? "",
    current_amount: initial?.current_amount?.toString() ?? "0",
    monthly_contribution: initial?.monthly_contribution?.toString() ?? "",
    target_date: initial?.target_date ?? "",
    emoji: initial?.emoji ?? "🎯",
    note: initial?.note ?? "",
    months_of_expenses: initial?.months_of_expenses?.toString() ?? "3",
  });

  const isEmergency = form.kind === "emergency";
  const effectiveTarget = isEmergency && monthlyFixed > 0 && form.months_of_expenses
    ? monthlyFixed * Number(form.months_of_expenses)
    : Number(form.target_amount) || 0;

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial?.id ? "Editar meta" : "Nueva meta"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nombre</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Viaje Japón 2026" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.kind} onValueChange={(v) => {
            const meta = GOAL_KIND_META[v as SavingsGoalKind];
            setForm({ ...form, kind: v as SavingsGoalKind, emoji: meta?.emoji ?? form.emoji });
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(GOAL_KIND_META) as SavingsGoalKind[]).map((k) => (
                <SelectItem key={k} value={k}>{GOAL_KIND_META[k].emoji} {GOAL_KIND_META[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Emoji</Label>
          <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        </div>

        {isEmergency ? (
          <div className="col-span-2">
            <Label>Meses de gastos objetivo</Label>
            <Input
              type="number" step="0.5" min="1"
              value={form.months_of_expenses}
              onChange={(e) => setForm({ ...form, months_of_expenses: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Gastos fijos estimados: <b>{formatMXN(monthlyFixed)}</b>/mes ·
              Meta: <b>{formatMXN(effectiveTarget)}</b>
            </p>
          </div>
        ) : (
          <div className="col-span-2">
            <Label>Meta ($)</Label>
            <Input type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
          </div>
        )}

        <div>
          <Label>Ya ahorrado ($)</Label>
          <Input type="number" step="0.01" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
        </div>
        <div>
          <Label>Aporte mensual ($)</Label>
          <Input type="number" step="0.01" value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Fecha objetivo (opcional)</Label>
          <Input type="date" value={form.target_date ?? ""} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Nota</Label>
          <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </div>
      <Button
        disabled={!form.name}
        onClick={() =>
          onSubmit({
            name: form.name,
            kind: form.kind,
            target_amount: isEmergency ? effectiveTarget : (Number(form.target_amount) || 0),
            current_amount: Number(form.current_amount) || 0,
            monthly_contribution: Number(form.monthly_contribution) || 0,
            target_date: form.target_date || null,
            emoji: form.emoji || "🎯",
            note: form.note || null,
            months_of_expenses: isEmergency ? (Number(form.months_of_expenses) || null) : null,
          })
        }
      >
        Guardar
      </Button>
    </DialogContent>
  );
}

function ContributionForm({ goal, onSubmit }: { goal: SavingsGoal; onSubmit: (amount: number, note?: string) => void }) {
  const [amount, setAmount] = useState(goal.monthly_contribution?.toString() ?? "");
  const [note, setNote] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Aportar a {goal.emoji} {goal.name}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Monto ($)</Label>
          <Input type="number" step="0.01" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Nota (opcional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Aguinaldo, etc." />
        </div>
        <Button disabled={!Number(amount)} onClick={() => onSubmit(Number(amount), note || undefined)}>
          Aportar {amount ? formatMXN(Number(amount)) : ""}
        </Button>
      </div>
    </DialogContent>
  );
}
