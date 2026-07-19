/**
 * **Componente** — Panel visual de composición corporal.
 * Muestra KPIs, sparklines, composición actual (kg y %) y progreso a peso objetivo
 * a partir del histórico `health_body_entries`.
 */
import { useMemo } from "react";
import type { BodyEntry } from "@/lib/health-types";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Scale, Flame, Droplets, Activity, HeartPulse, Target } from "lucide-react";

type Props = { entries: BodyEntry[] };

type NumKey = keyof BodyEntry;

function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1]; }

function fmt(n: number | null | undefined, digits = 1, suffix = "") {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Number(n).toFixed(digits)}${suffix}`;
}

function deltaOf(series: (number | null)[], daysBack: number) {
  const filtered = series.filter((v) => v != null) as number[];
  if (filtered.length < 2) return null;
  const current = filtered[filtered.length - 1];
  const idx = Math.max(0, filtered.length - 1 - daysBack);
  const prev = filtered[idx];
  return current - prev;
}

function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8" />;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeltaBadge({ value, invert = false, unit = "" }: { value: number | null; invert?: boolean; unit?: string }) {
  if (value == null || Math.abs(value) < 0.01) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        <Minus className="w-3 h-3" /> sin cambio
      </span>
    );
  }
  const good = invert ? value < 0 : value > 0;
  const color = good ? "text-emerald-400" : "text-rose-400";
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? "+" : ""}{value.toFixed(1)}{unit}
    </span>
  );
}

function Tile({
  icon, label, value, unit, delta, invert = false, spark, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  delta: number | null;
  invert?: boolean;
  spark: number[];
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold leading-none">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <DeltaBadge value={delta} invert={invert} unit={unit ? ` ${unit}` : ""} />
      <Spark data={spark} color={color} />
    </div>
  );
}

export function BodyOverview({ entries }: Props) {
  const data = useMemo(() => {
    return [...entries]
      .filter((e) => e.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  if (data.length === 0) return null;

  const latest = last(data)!;
  const first = data[0];

  const series = (k: NumKey) => data.map((e) => (e[k] as number | null) ?? null);
  const clean = (k: NumKey) => (series(k).filter((v) => v != null) as number[]);

  const weightSeries = clean("weight");
  const bfSeries = clean("body_fat");
  const muscleSeries = clean("muscle_mass");
  const waterSeries = clean("total_body_water");
  const visceralSeries = clean("visceral_fat");
  const bmrSeries = clean("bmr");
  const bmiSeries = clean("bmi");
  const metAgeSeries = clean("metabolic_age");

  const deltaWeight = deltaOf(series("weight"), 30);
  const deltaBF = deltaOf(series("body_fat"), 30);
  const deltaMuscle = deltaOf(series("muscle_mass"), 30);
  const deltaWater = deltaOf(series("total_body_water"), 30);
  const deltaVisceral = deltaOf(series("visceral_fat"), 30);
  const deltaBMR = deltaOf(series("bmr"), 30);
  const deltaBMI = deltaOf(series("bmi"), 30);
  const deltaMetAge = deltaOf(series("metabolic_age"), 30);

  const totalWeightDelta =
    latest.weight != null && first.weight != null ? latest.weight - first.weight : null;

  // Peso objetivo: usa target_weight del último registro que lo tenga
  const target = [...data].reverse().find((e) => e.target_weight != null)?.target_weight ?? null;

  const progressPct = (() => {
    if (target == null || first.weight == null || latest.weight == null) return null;
    const total = first.weight - target; // meta: bajar
    const done = first.weight - latest.weight;
    if (total === 0) return null;
    return Math.max(0, Math.min(100, (done / total) * 100));
  })();

  // Composición en kg (masa grasa, músculo, agua, ósea, proteína)
  const composition = [
    { label: "Grasa", kg: latest.fat_mass, color: "oklch(0.7 0.2 25)" },
    { label: "Músculo", kg: latest.total_muscle_mass ?? latest.lean_body_weight, color: "oklch(0.72 0.15 240)" },
    { label: "Agua", kg: latest.total_body_water, color: "oklch(0.75 0.15 200)" },
    { label: "Proteína", kg: latest.protein_mass, color: "oklch(0.78 0.18 150)" },
    { label: "Hueso", kg: latest.bone_mass, color: "oklch(0.78 0.05 80)" },
  ].filter((c) => c.kg != null) as { label: string; kg: number; color: string }[];

  const compTotal = composition.reduce((a, c) => a + c.kg, 0) || latest.weight || 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 mb-6 shadow-card">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Última medición</p>
          <h2 className="font-display text-lg font-semibold">
            {new Date(latest.date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Total mediciones</div>
          <div className="font-display text-lg font-semibold">{data.length}</div>
        </div>
      </div>

      {/* Hero peso + progreso */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 mb-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-primary">
              <Scale className="w-3 h-3" /> Peso actual
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-5xl font-bold leading-none">{fmt(latest.weight, 1)}</span>
              <span className="text-lg text-muted-foreground">kg</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <DeltaBadge value={deltaWeight} invert unit=" kg" />
              <span className="text-[10px] text-muted-foreground">30d</span>
              {totalWeightDelta != null && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <DeltaBadge value={totalWeightDelta} invert unit=" kg" />
                  <span className="text-[10px] text-muted-foreground">total</span>
                </>
              )}
            </div>
          </div>

          {target != null && (
            <div className="min-w-[180px] flex-1 max-w-xs">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> Meta</span>
                <span>{fmt(target, 1)} kg</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                  style={{ width: `${progressPct ?? 0}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {progressPct != null ? `${progressPct.toFixed(0)}% del camino` : "—"} · faltan {fmt(latest.weight! - target, 1)} kg
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile
          icon={<Flame className="w-3.5 h-3.5" />}
          label="% Grasa"
          value={fmt(latest.body_fat, 1)}
          unit="%"
          delta={deltaBF}
          invert
          spark={bfSeries}
          color="oklch(0.7 0.2 25)"
        />
        <Tile
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Músculo"
          value={fmt(latest.muscle_mass, 1)}
          unit="kg"
          delta={deltaMuscle}
          spark={muscleSeries}
          color="oklch(0.72 0.15 240)"
        />
        <Tile
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Agua"
          value={fmt(latest.total_body_water, 1)}
          unit="%"
          delta={deltaWater}
          spark={waterSeries}
          color="oklch(0.75 0.15 200)"
        />
        <Tile
          icon={<HeartPulse className="w-3.5 h-3.5" />}
          label="Visceral"
          value={fmt(latest.visceral_fat, 0)}
          delta={deltaVisceral}
          invert
          spark={visceralSeries}
          color="oklch(0.7 0.18 40)"
        />
        <Tile
          icon={<Scale className="w-3.5 h-3.5" />}
          label="IMC"
          value={fmt(latest.bmi, 1)}
          delta={deltaBMI}
          invert
          spark={bmiSeries}
          color="oklch(0.78 0.15 70)"
        />
        <Tile
          icon={<Flame className="w-3.5 h-3.5" />}
          label="BMR"
          value={fmt(latest.bmr, 0)}
          unit="kcal"
          delta={deltaBMR}
          spark={bmrSeries}
          color="oklch(0.78 0.18 30)"
        />
        <Tile
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Edad met."
          value={fmt(latest.metabolic_age, 0)}
          unit="años"
          delta={deltaMetAge}
          invert
          spark={metAgeSeries}
          color="oklch(0.7 0.22 295)"
        />
        <Tile
          icon={<Scale className="w-3.5 h-3.5" />}
          label="Peso"
          value={fmt(latest.weight, 1)}
          unit="kg"
          delta={deltaWeight}
          invert
          spark={weightSeries}
          color="oklch(0.78 0.18 150)"
        />
      </div>

      {/* Composición corporal en kg */}
      {composition.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Composición corporal</h3>
            <span className="text-[10px] text-muted-foreground">Total {compTotal.toFixed(1)} kg</span>
          </div>
          {/* Barra apilada */}
          <div className="h-3 rounded-full overflow-hidden flex mb-3 bg-secondary">
            {composition.map((c) => (
              <div
                key={c.label}
                title={`${c.label}: ${c.kg.toFixed(1)} kg`}
                style={{ width: `${(c.kg / compTotal) * 100}%`, background: c.color }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {composition.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-secondary/30 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-base font-bold">{c.kg.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">kg</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {((c.kg / compTotal) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {latest.body_type && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Tipo de cuerpo:</span>
          <span className="font-semibold">{latest.body_type}</span>
          {latest.notes && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-muted-foreground">{latest.notes}</span>
            </>
          )}
        </div>
      )}
    </section>
  );
}
