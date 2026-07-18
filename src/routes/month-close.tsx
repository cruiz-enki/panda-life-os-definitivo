/**
 * **Ruta** — Cierre mensual ritualizado. Muestra ingresos vs gastos vs ahorro,
 * categorías fuera de presupuesto, captura 3 aprendizajes y crea snapshot
 * de patrimonio para el mes.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarCheck, Save, Camera, BookOpen } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { useMoneyTools } from "@/hooks/use-money-tools";
import { useNetWorth } from "@/hooks/use-net-worth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatMXN, monthKey } from "@/lib/finance-types";

export const Route = createFileRoute("/month-close")({
  head: () => ({
    meta: [
      { title: "Cierre mensual — ENKI Life OS" },
      { name: "description", content: "Ritual mensual: revisar, aprender, snapshot de patrimonio" },
    ],
  }),
  component: MonthClosePage,
});

function MonthClosePage() {
  const { user } = useAuth();
  const { expenses } = useFinance();
  const { envelopeProgress } = useMoneyTools();
  const { totals, createSnapshot, snapshots } = useNetWorth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey(now));
  const [learnings, setLearnings] = useState<string[]>(["", "", ""]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      opts.push({
        value: monthKey(d),
        label: d.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      });
    }
    return opts;
  }, []);

  const kpis = useMemo(() => {
    const monthExp = expenses.filter((e) => e.date.startsWith(selectedMonth));
    const income = monthExp.filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount), 0);
    const outflow = monthExp.filter((e) => e.kind === "expense").reduce((s, e) => s + Number(e.amount), 0);
    const savings = income - outflow;
    const savingsRate = income > 0 ? savings / income : 0;
    return { income, outflow, savings, savingsRate };
  }, [expenses, selectedMonth]);

  const overspent = useMemo(() => {
    return envelopeProgress
      .filter((p) => p.envelope.month === selectedMonth && p.pctUsed > 1)
      .sort((a, b) => b.pctUsed - a.pctUsed);
  }, [envelopeProgress, selectedMonth]);

  const snapshotToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return snapshots.find((s) => s.snapshot_date === today);
  }, [snapshots]);

  const saveLearning = async (title: string) => {
    if (!user || !title.trim()) return null;
    const monthLabel = new Date(selectedMonth + "-01").toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    const { error } = await supabase.from("learnings").insert([
      {
        user_id: user.id,
        title: title.trim(),
        notes: `Aprendizaje de cierre mensual (${monthLabel})`,
        category: "Finanzas",
        date: new Date().toISOString().slice(0, 10),
      } as any,
    ]);
    return error;
  };

  const handleClose = async () => {
    setBusy(true);
    try {
      // 1. Aprendizajes
      let savedLearnings = 0;
      for (const l of learnings) {
        if (l.trim()) {
          const err = await saveLearning(l);
          if (!err) savedLearnings++;
        }
      }

      // 2. Snapshot patrimonio
      const snapErr = await createSnapshot(note.trim() || `Cierre ${selectedMonth}`);
      if (snapErr) throw snapErr;

      toast.success(`Mes cerrado. ${savedLearnings} aprendizajes guardados + snapshot creado.`);
      setLearnings(["", "", ""]);
      setNote("");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cerrar el mes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 px-4 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" /> Cierre mensual
          </h1>
          <p className="text-sm text-muted-foreground">
            Ritual: revisa, aprende, guarda snapshot.
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Ingresos" value={formatMXN(kpis.income)} tone="ok" />
        <Stat label="Gastos" value={formatMXN(kpis.outflow)} tone="danger" />
        <Stat label="Ahorro" value={formatMXN(kpis.savings)} tone={kpis.savings >= 0 ? "ok" : "danger"} />
        <Stat label="Tasa ahorro" value={`${(kpis.savingsRate * 100).toFixed(0)}%`} />
      </div>

      {/* Categorías fuera de presupuesto */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Fuera de presupuesto</h2>
        {overspent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguna categoría rebasada. 🎉</p>
        ) : (
          <div className="space-y-2">
            {overspent.map((p) => (
              <div key={p.envelope.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{p.envelope.emoji}</span>
                  <span className="font-medium">{p.envelope.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatMXN(p.spent)} / {formatMXN(p.envelope.amount)}
                  </span>
                  <Badge variant="destructive">{(p.pctUsed * 100).toFixed(0)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3 aprendizajes */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> 3 aprendizajes del mes
        </h2>
        <p className="text-xs text-muted-foreground">Se guardan en Learnings con categoría "Finanzas".</p>
        {learnings.map((l, i) => (
          <div key={i}>
            <Label className="text-xs">Aprendizaje #{i + 1}</Label>
            <Input
              value={l}
              onChange={(e) => {
                const next = [...learnings];
                next[i] = e.target.value;
                setLearnings(next);
              }}
              placeholder="Ej: gasté 40% más en salir cuando trabajo en casa"
            />
          </div>
        ))}
      </Card>

      {/* Snapshot patrimonio */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4" /> Snapshot de patrimonio
        </h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Activos</div>
            <div className="font-semibold">{formatMXN(totals.assets)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deudas</div>
            <div className="font-semibold">{formatMXN(totals.debts)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Patrimonio</div>
            <div className={`font-semibold ${totals.netWorth < 0 ? "text-red-500" : "text-emerald-500"}`}>
              {formatMXN(totals.netWorth)}
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs">Nota del snapshot (opcional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cómo llegaste hasta aquí, qué cambió este mes..."
            rows={2}
          />
        </div>
        {snapshotToday && (
          <Badge variant="outline" className="text-[10px]">Ya hay snapshot de hoy — se actualizará</Badge>
        )}
      </Card>

      <Button onClick={handleClose} disabled={busy} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" /> Cerrar {monthOptions.find((o) => o.value === selectedMonth)?.label}
      </Button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone === "danger" ? "text-red-500" : tone === "ok" ? "text-emerald-500" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
