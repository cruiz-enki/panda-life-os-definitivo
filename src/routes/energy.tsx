/**
 * **Ruta** — Registro diario de energía (físico, mental, emocional, sueño, dolor).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useAppState, avgEnergy } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Battery, TrendingUp, Brain, Heart, Dumbbell, Moon, Activity } from "lucide-react";
import { HealthHeader } from "@/components/health/HealthHeader";

export const Route = createFileRoute("/energy")({
  head: () => ({
    meta: [
      { title: "Energía · Pandus Maximus" },
      { name: "description", content: "Registra y analiza tu energía física, mental y emocional." },
    ],
  }),
  component: EnergyPage,
});

function Slider({ label, value, onChange, icon, color, minLabel = "vacío", maxLabel = "pleno" }: { label: string; value: number; onChange: (n: number) => void; icon: React.ReactNode; color: string; minLabel?: string; maxLabel?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color }}>
          {icon} {label}
        </span>
        <span className="font-display text-2xl font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function EnergyPage() {
  const { state, today, logEnergy } = useAppState();
  const [date, setDate] = useState(today);
  const existing = state.energy.find((e) => e.date === date);
  const [physical, setPhysical] = useState(existing?.physical ?? 7);
  const [mental, setMental] = useState(existing?.mental ?? 7);
  const [emotional, setEmotional] = useState(existing?.emotional ?? 7);
  const [sleep, setSleep] = useState(existing?.sleep ?? 7);
  const [pain, setPain] = useState(existing?.pain ?? 1);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  // Re-sync sliders when date changes (load existing entry for that day)
  useEffect(() => {
    const e = state.energy.find((x) => x.date === date);
    setPhysical(e?.physical ?? 7);
    setMental(e?.mental ?? 7);
    setEmotional(e?.emotional ?? 7);
    setSleep(e?.sleep ?? 7);
    setPain(e?.pain ?? 1);
    setNotes(e?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const last14 = useMemo(() => {
    const days: { date: string; label: string; avg: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const e = state.energy.find((x) => x.date === d);
      days.push({
        date: d,
        label: new Date(d).toLocaleDateString("es-ES", { day: "numeric" }),
        avg: e ? Number(avgEnergy(e)!.toFixed(1)) : null,
      });
    }
    return days;
  }, [state.energy]);

  const validEntries = state.energy.length;
  const overallAvg = validEntries
    ? state.energy.reduce((acc, e) => acc + avgEnergy(e)!, 0) / validEntries
    : null;
  const trend = (() => {
    const recent = last14.filter((d) => d.avg !== null).slice(-7);
    const prev = last14.filter((d) => d.avg !== null).slice(-14, -7);
    if (recent.length < 2 || prev.length < 2) return null;
    const r = recent.reduce((a, d) => a + d.avg!, 0) / recent.length;
    const p = prev.reduce((a, d) => a + d.avg!, 0) / prev.length;
    return r - p;
  })();

  const handleSave = () => {
    logEnergy({ date, physical, mental, emotional, sleep, pain, notes });
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Energía</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Cómo te sientes hoy ⚡</h1>
        <p className="mt-2 text-muted-foreground">Registra tres dimensiones para alimentar tus recomendaciones diarias.</p>
      </header>

      <HealthHeader />

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <h2 className="font-display text-xl font-semibold">Check-in</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Fecha</label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:border-primary outline-none"
              />
            </div>
          </div>
          {date !== today && (
            <p className="text-xs text-muted-foreground mb-4">
              Editando registro del {new Date(date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
          <div className="space-y-6">
            <Slider label="Física" value={physical} onChange={setPhysical} icon={<Dumbbell className="w-4 h-4" />} color="oklch(0.78 0.18 50)" />
            <Slider label="Mental" value={mental} onChange={setMental} icon={<Brain className="w-4 h-4" />} color="oklch(0.7 0.22 295)" />
            <Slider label="Emocional" value={emotional} onChange={setEmotional} icon={<Heart className="w-4 h-4" />} color="oklch(0.78 0.18 150)" />
            <Slider label="Sueño" value={sleep} onChange={setSleep} icon={<Moon className="w-4 h-4" />} color="oklch(0.72 0.15 240)" minLabel="terrible" maxLabel="reparador" />
            <Slider label="Dolor" value={pain} onChange={setPain} icon={<Activity className="w-4 h-4" />} color="oklch(0.7 0.2 25)" minLabel="sin dolor" maxLabel="máximo" />
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="¿Qué influyó hoy?"
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none text-sm"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform"
            >
              {existing ? "Actualizar registro" : "Guardar registro"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Battery className="w-3.5 h-3.5" /> Promedio
              </div>
              <div className="font-display text-3xl font-bold mt-2">{overallAvg ? overallAvg.toFixed(1) : "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">/ 10 ({validEntries} días)</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" /> Tendencia 7d
              </div>
              <div className={`font-display text-3xl font-bold mt-2 ${trend === null ? "" : trend >= 0 ? "text-primary" : "text-destructive"}`}>
                {trend === null ? "—" : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">vs semana previa</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Últimos 14 días</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last14} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 200)" />
                  <XAxis dataKey="label" stroke="oklch(0.65 0.02 200)" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="oklch(0.65 0.02 200)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.018 200)",
                      border: "1px solid oklch(0.28 0.02 200)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="oklch(0.78 0.18 150)"
                    strokeWidth={3}
                    dot={{ fill: "oklch(0.78 0.18 150)", r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
