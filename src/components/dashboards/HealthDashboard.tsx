/**
 * **Dashboard Health** — vista principal cuando el modo activo es "health".
 * Métricas: sueño 7d, mood promedio, hidratación, proteína, adherencia
 * medicación, peso y comidas de la semana.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { useHealth } from "@/hooks/use-health";
import { useSleep } from "@/hooks/use-sleep";
import { useMood, MOOD_OPTIONS } from "@/hooks/use-mood";
import { MobileCollapsibleSection } from "@/components/MobileCollapsibleSection";

function fmtHM(min: number) {
  if (!min || !Number.isFinite(min)) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function HealthDashboard() {
  const { snapshot, medications, medLogs } = useHealth();
  const { logs: sleepLogs, avgDurationMin, avgQuality, sleepDebtMin } = useSleep();
  const { logs: moodLogs, avgMood30 } = useMood();

  const lastSleep = sleepLogs[0];
  const lastMood = moodLogs[0];
  const lastMoodMeta = MOOD_OPTIONS.find((m) => m.key === lastMood?.mood);
  const avgMoodMeta = useMemo(() => {
    const rounded = Math.round(avgMood30);
    return [null, MOOD_OPTIONS[4], MOOD_OPTIONS[3], MOOD_OPTIONS[2], MOOD_OPTIONS[1], MOOD_OPTIONS[0]][rounded] ?? null;
  }, [avgMood30]);

  const waterPct = Math.min(100, (snapshot.waterToday / 2500) * 100);
  const proteinPct = Math.min(100, (snapshot.proteinToday / 120) * 100);
  const adherencePct = snapshot.medAdherenceWeekPct * 100;

  // Próxima medicación pendiente hoy
  const todayISO = new Date().toISOString().slice(0, 10);
  const takenToday = new Set(medLogs.filter((l) => l.date === todayISO && l.taken).map((l) => l.medication_id));
  const pendingMeds = medications.filter((m) => m.active && !takenToday.has(m.id)).slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Sueño - hero */}
      <Link
        to="/sleep"
        className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 hover:border-primary/50 transition-colors"
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Sueño · promedio 7d</div>
        <div className="font-display text-3xl font-bold mt-1">{fmtHM(avgDurationMin)}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>Calidad {avgQuality ? avgQuality.toFixed(1) : "—"}/5</span>
          {sleepDebtMin > 0 && (
            <>
              <span>·</span>
              <span className="text-yellow-500">Deuda {fmtHM(sleepDebtMin)}</span>
            </>
          )}
          {lastSleep && (
            <span className="ml-auto">
              Anoche: {fmtHM(lastSleep.duration_minutes ?? 0)}
            </span>
          )}
        </div>
      </Link>

      {/* Grid principal */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mood */}
        <Link to="/mood" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mood 30d</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl">{avgMoodMeta?.emoji ?? "—"}</span>
            <span className="font-display text-xl font-bold">{avgMood30 ? avgMood30.toFixed(1) : "—"}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            {lastMood ? `Último: ${lastMoodMeta?.emoji ?? ""} ${lastMoodMeta?.label ?? lastMood.mood}` : "Sin registro"}
          </div>
        </Link>

        {/* Peso */}
        <Link to="/health" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peso</div>
          <div className="flex items-baseline gap-1 mt-1">
            <div className="font-display text-xl font-bold">
              {snapshot.weightLatest != null ? `${snapshot.weightLatest.toFixed(1)}` : "—"}
            </div>
            {snapshot.weightLatest != null && <span className="text-xs text-muted-foreground">kg</span>}
            {snapshot.weightDelta30d != null && (
              <span className={`ml-auto flex items-center gap-0.5 text-[11px] font-semibold ${
                snapshot.weightDelta30d < 0 ? "text-emerald-500" : "text-yellow-500"
              }`}>
                {snapshot.weightDelta30d < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {snapshot.weightDelta30d > 0 ? "+" : ""}{snapshot.weightDelta30d.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            {snapshot.bodyFatLatest != null ? `Grasa ${snapshot.bodyFatLatest.toFixed(1)}%` : "Sin medición"}
          </div>
        </Link>

        {/* Agua */}
        <Link to="/health" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hidratación hoy</div>
          <div className="font-display text-xl font-bold mt-1">{snapshot.waterToday} <span className="text-xs text-muted-foreground">ml</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Meta 2500 ml</div>
          <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${waterPct >= 80 ? "bg-emerald-500" : waterPct >= 50 ? "bg-primary" : "bg-yellow-500"}`}
              style={{ width: `${waterPct}%` }}
            />
          </div>
        </Link>

        {/* Proteína */}
        <Link to="/meals" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proteína hoy</div>
          <div className="font-display text-xl font-bold mt-1">{Math.round(snapshot.proteinToday)} <span className="text-xs text-muted-foreground">g</span></div>
          <div className="text-[10px] text-muted-foreground mt-1">Meta 120 g</div>
          <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${proteinPct >= 80 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${proteinPct}%` }}
            />
          </div>
        </Link>
      </div>

      {/* Comidas semana */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/meals" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comidas semana</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-lg font-bold text-emerald-500">{snapshot.healthyMealsThisWeek}</span>
            <span className="text-[10px] text-muted-foreground">saludables</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {snapshot.junkMealsThisWeek} chatarra
          </div>
        </Link>

        <Link to="/health" className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors" hash="meds">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adherencia meds 7d</div>
          <div className="font-display text-xl font-bold mt-1">{adherencePct.toFixed(0)}%</div>
          <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${adherencePct >= 90 ? "bg-emerald-500" : adherencePct >= 70 ? "bg-primary" : "bg-yellow-500"}`}
              style={{ width: `${adherencePct}%` }}
            />
          </div>
        </Link>
      </div>

      {/* Medicación pendiente hoy */}
      {medications.length > 0 && (
        <MobileCollapsibleSection
          title="Medicación pendiente hoy"
          emoji="💊"
          badge={pendingMeds.length > 0 ? pendingMeds.length : undefined}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-xs font-bold text-muted-foreground uppercase tracking-widest">Estado</div>
            <Link to="/health" hash="meds" className="text-xs text-primary hover:underline">Ver plan →</Link>
          </div>

          {pendingMeds.length === 0 ? (
            <p className="text-xs text-emerald-500">✓ Todo tomado hoy</p>
          ) : (
            <ul className="space-y-1.5">
              {pendingMeds.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-xs">
                  <span className="text-base">💊</span>
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-muted-foreground">{m.dose ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </MobileCollapsibleSection>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { to: "/log", label: "Registrar", emoji: "📝" },
          { to: "/exercise", label: "Ejercicio", emoji: "🏋️" },
          { to: "/mood", label: "Mood", emoji: "🔋" },
          { to: "/psychology", label: "Psicología", emoji: "🧠" },
        ].map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-1 hover:border-primary/40 active:scale-[0.98] transition-all"
          >
            <span className="text-xl leading-none">{t.emoji}</span>
            <span className="text-[11px] font-semibold">{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
