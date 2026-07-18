/**
 * **Ruta** — Cashflow: ingresos recurrentes + gastos fijos + MSI + mínimos
 * de tarjeta proyectados a 30/60/90 días.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useCashflow, type IncomeFrequency, type CashflowEvent } from "@/hooks/use-cashflow";
import { useNetWorth } from "@/hooks/use-net-worth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMXN } from "@/lib/finance-types";
import { toast } from "sonner";

export const Route = createFileRoute("/cashflow")({
  head: () => ({
    meta: [
      { title: "Cashflow · ENKI LIFE OS" },
      { name: "description", content: "Proyección de ingresos y gastos a 30/60/90 días." },
    ],
  }),
  component: CashflowPage,
});

const FREQ_LABEL: Record<IncomeFrequency, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  yearly: "Anual",
  one_time: "Único",
};

function CashflowPage() {
  const {
    incomes,
    recurring,
    summary,
    createIncome,
    deleteIncome,
    createRecurring,
    deleteRecurring,
  } = useCashflow();
  const { totals } = useNetWorth();

  const [range, setRange] = useState<"30" | "60" | "90">("30");
  const [incOpen, setIncOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  const active = range === "30" ? summary.d30 : range === "60" ? summary.d60 : summary.d90;

  // línea de saldo acumulado partiendo del cash actual (activos líquidos como aproximación)
  const chartData = useMemo(() => {
    let running = totals.assets;
    const start = { date: "Hoy", saldo: running };
    const evs = active.events.map((e) => {
      running += e.amount;
      return { date: e.date.slice(5), saldo: Math.round(running) };
    });
    return [start, ...evs];
  }, [active.events, totals.assets]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, CashflowEvent[]>();
    for (const e of active.events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [active.events]);

  const willGoNegative = chartData.some((p) => p.saldo < 0);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Cashflow</h1>
          <p className="text-muted-foreground">Ingresos previstos − gastos fijos − MSI − mínimos.</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
          <TabsList>
            <TabsTrigger value="30">30 días</TabsTrigger>
            <TabsTrigger value="60">60 días</TabsTrigger>
            <TabsTrigger value="90">90 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Ingresos
          </p>
          <p className="text-xl font-semibold text-emerald-500">{formatMXN(active.income)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Gastos
          </p>
          <p className="text-xl font-semibold text-rose-500">{formatMXN(active.outflow)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Neto</p>
          <p className={`text-xl font-semibold ${active.net >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {formatMXN(active.net)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Saldo final estimado</p>
          <p className="text-xl font-semibold">
            {formatMXN(totals.assets + active.net)}
          </p>
        </Card>
      </div>

      {willGoNegative && (
        <Card className="p-4 mb-6 border-rose-500/40 bg-rose-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
          <div>
            <p className="font-medium text-rose-500">Alerta de liquidez</p>
            <p className="text-sm text-muted-foreground">
              Con los eventos proyectados, tu saldo podría quedar negativo antes de los {range} días.
              Revisa la línea de tiempo abajo.
            </p>
          </div>
        </Card>
      )}

      {/* Gráfica */}
      <Card className="p-4 mb-6">
        <p className="text-sm font-medium mb-3">Saldo proyectado</p>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatMXN(Number(v))} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-4 mb-6">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Línea de tiempo
        </p>
        {groupedByDate.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay eventos proyectados. Agrega ingresos y gastos fijos abajo.
          </p>
        ) : (
          <div className="space-y-3">
            {groupedByDate.map(([date, evs]) => {
              const daySum = evs.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={date} className="flex items-start justify-between border-b border-border/40 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatDay(date)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {evs.map((e, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {e.emoji} {e.label} {e.amount > 0 ? "+" : ""}
                          {formatMXN(e.amount)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${daySum >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {daySum > 0 ? "+" : ""}{formatMXN(daySum)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Ingresos */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Fuentes de ingreso</p>
          <Dialog open={incOpen} onOpenChange={setIncOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </DialogTrigger>
            <IncomeDialog
              onClose={() => setIncOpen(false)}
              onSave={async (payload) => {
                const err = await createIncome(payload);
                if (err) toast.error(err.message);
                else {
                  toast.success("Ingreso agregado");
                  setIncOpen(false);
                }
              }}
            />
          </Dialog>
        </div>
        {incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no registras ingresos.</p>
        ) : (
          <div className="space-y-2">
            {incomes.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{i.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {FREQ_LABEL[i.frequency]}
                      {i.frequency === "monthly" && i.day_of_month
                        ? ` · día ${i.day_of_month}${i.second_day_of_month ? ` y ${i.second_day_of_month}` : ""}`
                        : i.next_date
                        ? ` · desde ${i.next_date}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-500">+{formatMXN(i.amount)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const err = await deleteIncome(i.id);
                      if (err) toast.error(err.message);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Gastos fijos */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Gastos fijos recurrentes</p>
          <Dialog open={recOpen} onOpenChange={setRecOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </DialogTrigger>
            <RecurringDialog
              onClose={() => setRecOpen(false)}
              onSave={async (payload) => {
                const err = await createRecurring(payload);
                if (err) toast.error(err.message);
                else {
                  toast.success("Gasto agregado");
                  setRecOpen(false);
                }
              }}
            />
          </Dialog>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Renta, préstamos, colegiaturas, etc. Las suscripciones y pagos mínimos se toman automáticamente.
        </p>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no registras gastos fijos.</p>
        ) : (
          <div className="space-y-2">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mensual{r.day_of_month ? ` · día ${r.day_of_month}` : ""}
                      {r.category ? ` · ${r.category}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-rose-500">−{formatMXN(r.amount)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const err = await deleteRecurring(r.id);
                      if (err) toast.error(err.message);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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

function formatDay(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  if (diff === 0) return `Hoy · ${label}`;
  if (diff === 1) return `Mañana · ${label}`;
  return `en ${diff}d · ${label}`;
}

function IncomeDialog({
  onSave,
  onClose,
}: {
  onSave: (input: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as IncomeFrequency,
    day_of_month: "",
    second_day_of_month: "",
    next_date: "",
    emoji: "💵",
    category: "",
    note: "",
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva fuente de ingreso</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <div>
            <Label>Emoji</Label>
            <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input
              value={form.name}
              placeholder="Sueldo, Freelance…"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Monto (MXN)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>Frecuencia</Label>
            <Select
              value={form.frequency}
              onValueChange={(v) => setForm({ ...form, frequency: v as IncomeFrequency })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FREQ_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {form.frequency === "monthly" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Día del mes</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.day_of_month}
                onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
              />
            </div>
            <div>
              <Label>2° día (opcional)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.second_day_of_month}
                placeholder="Ej. 15 y 30"
                onChange={(e) => setForm({ ...form, second_day_of_month: e.target.value })}
              />
            </div>
          </div>
        )}

        {(form.frequency === "weekly" || form.frequency === "biweekly" || form.frequency === "yearly" || form.frequency === "one_time") && (
          <div>
            <Label>Próxima fecha</Label>
            <Input
              type="date"
              value={form.next_date}
              onChange={(e) => setForm({ ...form, next_date: e.target.value })}
            />
          </div>
        )}

        <div>
          <Label>Categoría (opcional)</Label>
          <Input
            value={form.category}
            placeholder="Salario, Proyectos…"
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div>
          <Label>Nota</Label>
          <Textarea
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              onSave({
                name: form.name,
                amount: Number(form.amount || 0),
                currency: "MXN",
                frequency: form.frequency,
                day_of_month: form.day_of_month ? Number(form.day_of_month) : null,
                second_day_of_month: form.second_day_of_month ? Number(form.second_day_of_month) : null,
                next_date: form.next_date || null,
                category: form.category || null,
                emoji: form.emoji || "💵",
                note: form.note || null,
                status: "active",
              })
            }
            disabled={!form.name || !form.amount}
          >
            Guardar
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function RecurringDialog({
  onSave,
  onClose,
}: {
  onSave: (input: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    day_of_month: "",
    emoji: "📌",
    category: "",
    note: "",
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo gasto fijo</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <div>
            <Label>Emoji</Label>
            <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input
              value={form.name}
              placeholder="Renta, Colegiatura…"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Monto (MXN)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>Día del mes</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={form.day_of_month}
              onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Categoría (opcional)</Label>
          <Input
            value={form.category}
            placeholder="Vivienda, Educación…"
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div>
          <Label>Nota</Label>
          <Textarea
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              onSave({
                name: form.name,
                amount: Number(form.amount || 0),
                currency: "MXN",
                day_of_month: form.day_of_month ? Number(form.day_of_month) : null,
                category: form.category || null,
                emoji: form.emoji || "📌",
                note: form.note || null,
                status: "active",
              })
            }
            disabled={!form.name || !form.amount}
          >
            Guardar
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
