/**
 * **Ruta** `/debts` — Módulo de deudas no-tarjeta con estrategia avalancha vs
 * bola de nieve y fecha proyectada de libertad de deudas.
 */
import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, TrendingDown, CalendarDays, AlertTriangle, Zap, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { formatMXN } from "@/lib/finance-types";
import { useDebts, simulatePayoff, DEBT_KIND_META, type Debt, type DebtKind, type PayoffStrategy } from "@/hooks/use-debts";

export const Route = createFileRoute("/debts")({
  head: () => ({
    meta: [
      { title: "Deudas · Panda's LIFE OS" },
      { name: "description", content: "Estrategia de pago de deudas: avalancha vs bola de nieve y fecha de libertad de deudas." },
    ],
  }),
  component: DebtsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>Reintentar</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">No encontrado.</div>,
});

function formatMonthsHuman(m: number) {
  if (!isFinite(m)) return "∞";
  if (m < 12) return `${m} meses`;
  const years = Math.floor(m / 12);
  const months = m % 12;
  return months === 0 ? `${years} años` : `${years}a ${months}m`;
}

function DebtDialog({
  trigger,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  initial?: Partial<Debt>;
  onSubmit: (data: Omit<Debt, "id" | "user_id" | "created_at" | "updated_at">) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    kind: (initial?.kind ?? "personal_loan") as DebtKind,
    creditor: initial?.creditor ?? "",
    original_amount: initial?.original_amount ?? 0,
    current_balance: initial?.current_balance ?? 0,
    interest_rate: initial?.interest_rate ?? 0,
    monthly_payment: initial?.monthly_payment ?? 0,
    payment_day: initial?.payment_day ?? 1,
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    emoji: initial?.emoji ?? "💸",
    note: initial?.note ?? "",
  });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Ponle un nombre");
    const err = await onSubmit({
      ...form,
      currency: "MXN",
      status: initial?.status ?? "active",
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      creditor: form.creditor || null,
      note: form.note || null,
    } as any);
    if (err) toast.error(err.message);
    else {
      toast.success("Guardado");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar deuda" : "Nueva deuda"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div>
              <Label>Emoji</Label>
              <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Préstamo BBVA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as DebtKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEBT_KIND_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.emoji} {m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acreedor</Label>
              <Input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} placeholder="BBVA / Tío Juan" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Monto original</Label>
              <Input type="number" value={form.original_amount} onChange={(e) => setForm({ ...form, original_amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Saldo actual</Label>
              <Input type="number" value={form.current_balance} onChange={(e) => setForm({ ...form, current_balance: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Tasa anual %</Label>
              <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Pago mensual</Label>
              <Input type="number" value={form.monthly_payment} onChange={(e) => setForm({ ...form, monthly_payment: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Día de pago</Label>
              <Input type="number" min={1} max={31} value={form.payment_day} onChange={(e) => setForm({ ...form, payment_day: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Inicio</Label>
              <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Fin contractual</Label>
              <Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
          </div>
          <Button onClick={submit} className="w-full">Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DebtsPage() {
  const { debts, totals, createDebt, updateDebt, deleteDebt } = useDebts();
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const [extra, setExtra] = useState(0);

  const active = debts.filter((d) => d.status === "active");

  const sim = useMemo(() => simulatePayoff(active, strategy, extra), [active, strategy, extra]);
  const simAvalanche = useMemo(() => simulatePayoff(active, "avalanche", extra), [active, extra]);
  const simSnowball = useMemo(() => simulatePayoff(active, "snowball", extra), [active, extra]);

  const chartData = sim.months.slice(0, 240).map((m) => ({
    date: m.date,
    saldo: Math.round(m.totalBalance),
  }));

  const priorityList = useMemo(() => {
    const sorted = [...active];
    sorted.sort((a, b) =>
      strategy === "avalanche" ? b.interest_rate - a.interest_rate : a.current_balance - b.current_balance,
    );
    return sorted;
  }, [active, strategy]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Deudas</h1>
          <p className="text-sm text-muted-foreground">Préstamos, hipoteca, auto y familia — plan hacia la libertad</p>
        </div>
        <DebtDialog
          trigger={<Button><Plus className="w-4 h-4 mr-1" /> Nueva deuda</Button>}
          onSubmit={createDebt}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Deuda total</div>
          <div className="text-xl font-bold">{formatMXN(totals.totalBalance)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Pago mensual</div>
          <div className="text-xl font-bold">{formatMXN(totals.totalMonthly)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Tasa promedio ponderada</div>
          <div className="text-xl font-bold">{totals.weightedRate.toFixed(2)}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Libre en</div>
          <div className="text-xl font-bold flex items-center gap-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            {formatMonthsHuman(sim.monthsToFreedom)}
          </div>
          {sim.freedomDate && (
            <div className="text-[11px] text-muted-foreground">{sim.freedomDate}</div>
          )}
        </CardContent></Card>
      </div>

      {!sim.feasible && active.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              Tus pagos mínimos actuales <b>no cubren los intereses</b>. La deuda está creciendo. Sube el pago mensual o agrega dinero extra abajo.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estrategia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Estrategia de pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStrategy("avalanche")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                strategy === "avalanche" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-bold">Avalancha</span>
              </div>
              <p className="text-xs text-muted-foreground">Ataca primero la tasa más alta. Ahorra más intereses.</p>
              <div className="mt-2 text-xs">
                <div>Libre en <b>{formatMonthsHuman(simAvalanche.monthsToFreedom)}</b></div>
                <div>Intereses: <b>{formatMXN(simAvalanche.totalInterestPaid)}</b></div>
              </div>
            </button>
            <button
              onClick={() => setStrategy("snowball")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                strategy === "snowball" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Snowflake className="w-4 h-4 text-sky-500" />
                <span className="font-bold">Bola de nieve</span>
              </div>
              <p className="text-xs text-muted-foreground">Ataca primero el saldo más chico. Victorias rápidas, motivación.</p>
              <div className="mt-2 text-xs">
                <div>Libre en <b>{formatMonthsHuman(simSnowball.monthsToFreedom)}</b></div>
                <div>Intereses: <b>{formatMXN(simSnowball.totalInterestPaid)}</b></div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <div>
              <Label>Pago extra mensual (MXN)</Label>
              <Input
                type="number"
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Dinero adicional que dirigirás al objetivo prioritario.
              </p>
            </div>
            <div className="text-xs text-muted-foreground pb-2">
              Ahorro vs solo mínimos:
              {simAvalanche.monthsToFreedom !== Infinity && simSnowball.monthsToFreedom !== Infinity && (
                <div className="font-bold text-foreground">
                  Δ {Math.abs(simSnowball.totalInterestPaid - simAvalanche.totalInterestPaid).toFixed(0)} MXN
                </div>
              )}
            </div>
          </div>

          {priorityList.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Orden sugerido
              </div>
              <ol className="space-y-1">
                {priorityList.map((d, i) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-secondary/40">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-lg">{d.emoji}</span>
                    <span className="flex-1 font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.interest_rate}% · {formatMXN(d.current_balance)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfica */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Camino a $0</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatMXN(Number(v))} />
                <ReferenceLine y={0} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                <Legend />
                <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de deudas */}
      <div className="space-y-2">
        {debts.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            Sin deudas registradas. Agrega la primera para ver tu plan.
          </CardContent></Card>
        )}
        {debts.map((d) => {
          const meta = DEBT_KIND_META[d.kind];
          const progress = d.original_amount > 0
            ? ((d.original_amount - d.current_balance) / d.original_amount) * 100
            : 0;
          return (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{d.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{d.name}</span>
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      {d.status !== "active" && <Badge className="text-[10px]">{d.status}</Badge>}
                    </div>
                    {d.creditor && <div className="text-xs text-muted-foreground">{d.creditor}</div>}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Saldo</div>
                        <div className="font-bold">{formatMXN(d.current_balance)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tasa anual</div>
                        <div className="font-bold">{d.interest_rate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pago</div>
                        <div className="font-bold">{formatMXN(d.monthly_payment)}</div>
                      </div>
                    </div>
                    {d.original_amount > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-gradient-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {progress.toFixed(0)}% pagado de {formatMXN(d.original_amount)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <DebtDialog
                      initial={d}
                      trigger={<Button size="icon" variant="ghost"><Pencil className="w-4 h-4" /></Button>}
                      onSubmit={(patch) => updateDebt(d.id, patch)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${d.name}"?`)) deleteDebt(d.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
