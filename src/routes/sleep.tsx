/**
 * **Ruta** — Sleep tracking: hora de dormir, despertar, calidad, deuda de sueño.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Moon, Sun, TrendingDown, Star, Trash2 } from "lucide-react";
import { useSleep } from "@/hooks/use-sleep";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/sleep")({
  head: () => ({
    meta: [
      { title: "Sueño · Panda's LIFE OS" },
      { name: "description", content: "Registra tu sueño, calidad y monitorea tu deuda semanal." },
    ],
  }),
  component: SleepPage,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtHM(min: number) {
  const h = Math.floor(min / 60); const m = Math.round(min % 60);
  return `${h}h ${m}m`;
}

function SleepPage() {
  const { logs, upsert, remove, avgQuality, avgDurationMin, sleepDebtMin } = useSleep();
  const [date, setDate] = useState(todayISO());
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");

  const durationMin = useMemo(() => {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let start = bh * 60 + bm;
    let end = wh * 60 + wm;
    if (end <= start) end += 24 * 60;
    return end - start;
  }, [bedtime, wakeTime]);

  const save = async () => {
    const bedDate = new Date(`${date}T${bedtime}:00`);
    // Si te dormiste después de las 6pm, cuenta como día anterior
    const [bh] = bedtime.split(":").map(Number);
    if (bh >= 18) bedDate.setDate(bedDate.getDate() - 1);
    const wakeDate = new Date(`${date}T${wakeTime}:00`);
    await upsert({
      date,
      bedtime: bedDate.toISOString(),
      wake_time: wakeDate.toISOString(),
      duration_minutes: durationMin,
      quality,
      notes: notes.trim() || null,
    });
    setNotes("");
  };

  const chartData = useMemo(() => {
    return logs.slice(0, 14).reverse().map((l) => ({
      date: l.date.slice(5),
      horas: (l.duration_minutes ?? 0) / 60,
      calidad: l.quality ?? null,
    }));
  }, [logs]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Moon className="w-7 h-7 text-indigo-500" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Sueño</h1>
          <p className="text-sm text-muted-foreground">Registra cada mañana. Sin datos suficientes, no hay diagnóstico.</p>
        </div>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Moon className="w-3 h-3" /> Promedio 7d</div>
          <div className="font-display text-2xl font-bold">{avgDurationMin ? fmtHM(avgDurationMin) : "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Star className="w-3 h-3" /> Calidad 7d</div>
          <div className="font-display text-2xl font-bold">{avgQuality ? avgQuality.toFixed(1) : "—"}<span className="text-sm text-muted-foreground">/5</span></div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="w-3 h-3" /> Deuda 7d</div>
          <div className="font-display text-2xl font-bold text-amber-600">{sleepDebtMin ? fmtHM(sleepDebtMin) : "0m"}</div>
        </Card>
      </div>

      {/* Tap ahora (NFC / botón rápido) */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-sm">Tap ahora</h2>
            <p className="text-xs text-muted-foreground">Marca el momento exacto. Ideal para NFC tags.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TapNowButton kind="bedtime" />
          <TapNowButton kind="wake" />
        </div>
      </Card>

      {/* Form */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Registrar noche</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Fecha (despertar)</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Moon className="w-3 h-3" /> Dormí a</Label>
            <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Sun className="w-3 h-3" /> Desperté</Label>
            <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Duración</Label>
            <div className="h-10 flex items-center font-display text-xl font-bold">{fmtHM(durationMin)}</div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Calidad</Label>
          <div className="flex gap-2 mt-1">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`w-10 h-10 rounded-lg border transition ${quality === q ? "bg-indigo-500 text-white border-indigo-500" : "bg-transparent hover:bg-muted"}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Ruido, café tarde, pesadillas...?" rows={2} />
        </div>

        <Button onClick={save} className="w-full">Guardar</Button>
      </Card>

      {/* Gráfica */}
      {chartData.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Últimos 14 días</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: "horas", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 11 }} label={{ value: "calidad", angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="horas" stroke="#6366f1" strokeWidth={2} dot />
                <Line yAxisId="right" type="monotone" dataKey="calidad" stroke="#f59e0b" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Historial */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Historial ({logs.length})</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay registros.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(0, 30).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{l.date}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.duration_minutes ? fmtHM(l.duration_minutes) : "—"} · calidad {l.quality ?? "—"}/5
                    {l.source !== "manual" && <span className="ml-2 px-1.5 py-0.5 bg-secondary rounded text-[10px]">{l.source}</span>}
                  </div>
                  {l.notes && <div className="text-xs text-muted-foreground mt-1 truncate">{l.notes}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Apple Shortcuts hint */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground">
          <strong>Apple Shortcuts:</strong> Puedes crear un atajo de iOS que envíe tu sueño al endpoint público de la app cada mañana. Pídeme la config si la quieres activar (necesita un secret nuevo).
        </p>
      </Card>
    </div>
  );
}
