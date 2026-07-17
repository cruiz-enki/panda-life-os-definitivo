/**
 * **Insights & analítica**: cálculo puro de métricas a partir de `AppState`.
 * Sin side-effects: ideal para usar dentro de `useMemo` en componentes.
 */
import type { AppState, Task, EnergyEntry, Habit, Learning, Note } from "./storage-types";
import { avgEnergy } from "./storage";

export type DayBucket = {
  date: string; // YYYY-MM-DD
  label: string; // "12 abr"
  tasksCompleted: number;
  habitsCompleted: number;
  learningsCount: number;
  notesCreated: number;
  energyAvg: number | null;
  xpEarned: number;
};

// Zona horaria fija: Ciudad de México
const TZ = "America/Mexico_City";
const tzFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayKey = (d: Date | string): string => {
  const dt = typeof d === "string" ? new Date(d) : d;
  // en-CA produce YYYY-MM-DD ya formateado en la TZ deseada
  return tzFormatter.format(dt);
};

const currentDayKey = (): string => tzFormatter.format(new Date());

const daysAgoKey = (daysAgo: number): string => {
  // Usamos mediodía UTC del día actual local CDMX como ancla estable y restamos días.
  const todayLocal = currentDayKey();
  const anchor = new Date(`${todayLocal}T12:00:00.000Z`);
  return tzFormatter.format(new Date(anchor.getTime() - daysAgo * 86400000));
};

const fmtLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

/**
 * Agrega el estado en buckets diarios (uno por día, últimos `days`).
 */
export function buildDailyBuckets(state: AppState, days = 30): DayBucket[] {
  const buckets: DayBucket[] = [];
  const tasksByDay = new Map<string, Task[]>();
  for (const t of state.tasks) {
    if (t.status !== "completed" || !t.completedAt) continue;
    const k = dayKey(t.completedAt);
    if (!tasksByDay.has(k)) tasksByDay.set(k, []);
    tasksByDay.get(k)!.push(t);
  }
  const habitHits = new Map<string, number>();
  const habitXp = new Map<string, number>();
  for (const h of state.habits) {
    for (const d of h.history ?? []) {
      habitHits.set(d, (habitHits.get(d) ?? 0) + 1);
      habitXp.set(d, (habitXp.get(d) ?? 0) + (h.points ?? 10));
    }
  }
  const learnByDay = new Map<string, number>();
  for (const l of state.learnings) {
    learnByDay.set(l.date, (learnByDay.get(l.date) ?? 0) + 1);
  }
  const notesByDay = new Map<string, number>();
  for (const n of state.notes) {
    const k = dayKey(n.createdAt);
    notesByDay.set(k, (notesByDay.get(k) ?? 0) + 1);
  }
  const energyByDay = new Map<string, EnergyEntry>();
  for (const e of state.energy) energyByDay.set(e.date, e);

  for (let i = days - 1; i >= 0; i--) {
    const iso = daysAgoKey(i);
    const tasks = tasksByDay.get(iso) ?? [];
    const tasksXp = tasks.reduce((acc, t) => {
      const base = t.xpReward ?? (t.priority === "high" ? 30 : t.priority === "medium" ? 20 : 10);
      return acc + base;
    }, 0);
    const e = energyByDay.get(iso);
    buckets.push({
      date: iso,
      label: fmtLabel(iso),
      tasksCompleted: tasks.length,
      habitsCompleted: habitHits.get(iso) ?? 0,
      learningsCount: learnByDay.get(iso) ?? 0,
      notesCreated: notesByDay.get(iso) ?? 0,
      energyAvg: e ? Number(avgEnergy(e)!.toFixed(2)) : null,
      xpEarned: tasksXp + (habitXp.get(iso) ?? 0) + (learnByDay.get(iso) ?? 0) * 15,
    });
  }
  return buckets;
}

export type Totals = {
  tasksCompleted: number;
  habitsCompleted: number;
  learnings: number;
  notes: number;
  totalXp: number;
  daysActive: number;
};

/**
 * Totales agregados a partir de los buckets diarios.
 */
export function computeTotals(buckets: DayBucket[]): Totals {
  const t: Totals = {
    tasksCompleted: 0,
    habitsCompleted: 0,
    learnings: 0,
    notes: 0,
    totalXp: 0,
    daysActive: 0,
  };
  for (const b of buckets) {
    t.tasksCompleted += b.tasksCompleted;
    t.habitsCompleted += b.habitsCompleted;
    t.learnings += b.learningsCount;
    t.notes += b.notesCreated;
    t.totalXp += b.xpEarned;
    if (b.tasksCompleted + b.habitsCompleted + b.learningsCount + b.notesCreated > 0) t.daysActive++;
  }
  return t;
}

// Pearson correlation entre energía y productividad (tareas + hábitos)
/**
 * Coeficiente de correlación (Pearson) entre energía y productividad.
 */
export function correlationEnergyProductivity(buckets: DayBucket[]): number | null {
  const pairs = buckets
    .filter((b) => b.energyAvg !== null)
    .map((b) => [b.energyAvg as number, b.tasksCompleted + b.habitsCompleted] as const);
  if (pairs.length < 4) return null;
  const n = pairs.length;
  const sumX = pairs.reduce((a, p) => a + p[0], 0);
  const sumY = pairs.reduce((a, p) => a + p[1], 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pairs) {
    num += (x - meanX) * (y - meanY);
    dx += (x - meanX) ** 2;
    dy += (y - meanY) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/**
 * Convierte un coeficiente de correlación en etiqueta y tono semántico.
 */
export function describeCorrelation(r: number | null): { label: string; tone: "good" | "warn" | "neutral" } {
  if (r === null) return { label: "Datos insuficientes", tone: "neutral" };
  if (r >= 0.5) return { label: "Fuerte correlación positiva", tone: "good" };
  if (r >= 0.2) return { label: "Correlación moderada positiva", tone: "good" };
  if (r > -0.2) return { label: "Sin correlación clara", tone: "neutral" };
  if (r > -0.5) return { label: "Correlación negativa moderada", tone: "warn" };
  return { label: "Correlación negativa fuerte", tone: "warn" };
}

// Mejor día de la semana según productividad media
/**
 * Día de la semana con mejor score histórico de productividad.
 */
export function bestWeekday(buckets: DayBucket[]): { name: string; score: number } | null {
  const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const b of buckets) {
    const day = new Date(b.date + "T12:00:00").getDay();
    sums[day] += b.tasksCompleted + b.habitsCompleted;
    counts[day] += 1;
  }
  let best = -1, bestScore = -1;
  for (let i = 0; i < 7; i++) {
    if (counts[i] === 0) continue;
    const avg = sums[i] / counts[i];
    if (avg > bestScore) { bestScore = avg; best = i; }
  }
  if (best < 0 || bestScore <= 0) return null;
  return { name: names[best], score: Number(bestScore.toFixed(2)) };
}

export type ListBreakdown = { id: string; name: string; emoji: string; color: string; completed: number; pending: number };

/**
 * Reparto de tareas (completadas/pendientes) por lista.
 */
export function tasksByList(state: AppState): ListBreakdown[] {
  const map = new Map<string, ListBreakdown>();
  for (const l of state.taskLists) {
    map.set(l.id, { id: l.id, name: l.name, emoji: l.emoji, color: l.color, completed: 0, pending: 0 });
  }
  for (const t of state.tasks) {
    const e = map.get(t.listId);
    if (!e) continue;
    if (t.status === "completed") e.completed++; else e.pending++;
  }
  return [...map.values()].sort((a, b) => b.completed + b.pending - (a.completed + a.pending));
}

export type HabitConsistency = { habit: Habit; rate: number; hits30: number };

/**
 * Tasa de cumplimiento por hábito en los últimos `days` días.
 */
export function habitConsistency(state: AppState, days = 30): HabitConsistency[] {
  const window = new Set<string>();
  for (let i = 0; i < days; i++) window.add(daysAgoKey(i));
  return state.habits
    .map((h) => {
      const hits30 = (h.history ?? []).filter((d) => window.has(d)).length;
      return { habit: h, rate: hits30 / days, hits30 };
    })
    .sort((a, b) => b.rate - a.rate);
}

export type CategoryCount = { key: string; label: string; count: number };

/**
 * Recuento de aprendizajes por categoría.
 */
export function learningsByCategory(state: AppState): CategoryCount[] {
  const labels: Record<string, string> = {
    tech: "Tech", mindset: "Mindset", health: "Salud", creative: "Creativo", business: "Negocio", other: "Otro",
  };
  const map = new Map<string, number>();
  for (const l of state.learnings) map.set(l.category, (map.get(l.category) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

export type EnergyDimensionAvg = { key: "physical" | "mental" | "emotional" | "sleep" | "pain"; label: string; value: number | null };

/**
 * Media de cada dimensión de energía en los últimos `days` días.
 */
export function energyDimensionAverages(state: AppState, days = 30): EnergyDimensionAvg[] {
  const cutoff = new Date(`${daysAgoKey(days - 1)}T00:00:00`).getTime();
  const recent = state.energy.filter((e) => new Date(e.date + "T12:00:00").getTime() >= cutoff);
  const dims: EnergyDimensionAvg["key"][] = ["physical", "mental", "emotional", "sleep", "pain"];
  const labels: Record<EnergyDimensionAvg["key"], string> = {
    physical: "Física", mental: "Mental", emotional: "Emocional", sleep: "Sueño", pain: "Dolor",
  };
  return dims.map((k) => {
    const vals = recent.map((e) => (e[k] as number | undefined)).filter((v): v is number => typeof v === "number");
    return { key: k, label: labels[k], value: vals.length ? Number((vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1)) : null };
  });
}

// Notas por importancia
/**
 * Recuento de notas por nivel de importancia.
 */
export function notesByImportance(notes: Note[]): CategoryCount[] {
  const labels: Record<string, string> = { normal: "Normal", important: "Importante", high: "Alta", money: "Dinero" };
  const map = new Map<string, number>();
  for (const n of notes) map.set(n.importance, (map.get(n.importance) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, label: labels[key] ?? key, count })).sort((a, b) => b.count - a.count);
}

// Racha de productividad (días consecutivos con al menos 1 tarea o hábito)
/**
 * Racha actual de días con productividad > 0.
 */
export function productivityStreak(buckets: DayBucket[]): number {
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    const b = buckets[i];
    if (b.tasksCompleted + b.habitsCompleted > 0) streak++;
    else break;
  }
  return streak;
}

/**
 * Últimos `limit` aprendizajes registrados, más recientes primero.
 */
export function recentLearnings(state: AppState, limit = 5): Learning[] {
  return [...state.learnings]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

// ============= SALUD =============
import type { BodyEntry, Meal, Medication, MedicationLog } from "./health-types";

export type HealthDayBucket = {
  date: string;
  label: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  healthyMeals: number;
  regularMeals: number;
  junkMeals: number;
  mealsTotal: number;
  mealsScore: number; // 0..100
  medsTaken: number;
  medsExpected: number;
  adherencePct: number; // 0..100
};

function expectedDosesPerDay(meds: Medication[]): number {
  return meds
    .filter((m) => m.active && (m.frequency === "daily" || m.frequency === "twice_daily"))
    .reduce((acc, m) => acc + Math.max(1, m.times_per_day || 1), 0);
}

/**
 * Agrega métricas de salud (peso, hidratación…) en buckets diarios.
 */
export function buildHealthBuckets(
  body: BodyEntry[],
  meals: Meal[],
  medications: Medication[],
  medLogs: MedicationLog[],
  days = 30,
): HealthDayBucket[] {
  // Body por fecha
  const bodyByDay = new Map<string, BodyEntry>();
  for (const b of body) bodyByDay.set(b.date, b);

  // Meals por fecha
  const mealsByDay = new Map<string, Meal[]>();
  for (const m of meals) {
    if (!mealsByDay.has(m.date)) mealsByDay.set(m.date, []);
    mealsByDay.get(m.date)!.push(m);
  }

  // Logs por fecha (solo tomadas)
  const logsByDay = new Map<string, number>();
  for (const l of medLogs) {
    if (!l.taken) continue;
    logsByDay.set(l.date, (logsByDay.get(l.date) ?? 0) + 1);
  }

  const expected = expectedDosesPerDay(medications);

  // Para forward-fill de peso/composición usamos el último valor conocido
  const sortedBody = [...body].sort((a, b) => a.date.localeCompare(b.date));
  const lastKnown = (iso: string): BodyEntry | null => {
    let res: BodyEntry | null = null;
    for (const b of sortedBody) {
      if (b.date <= iso) res = b;
      else break;
    }
    return res;
  };

  const buckets: HealthDayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = daysAgoKey(i);
    const dayMeals = mealsByDay.get(iso) ?? [];
    const healthy = dayMeals.filter((m) => m.classification === "saludable").length;
    const regular = dayMeals.filter((m) => m.classification === "regular").length;
    const junk = dayMeals.filter((m) => m.classification === "chatarra").length;
    const total = dayMeals.length;
    const mealsScore = total
      ? Math.round(((healthy * 100 + regular * 60 + junk * 0) / total))
      : 0;

    const taken = logsByDay.get(iso) ?? 0;
    const adherencePct = expected > 0 ? Math.min(100, Math.round((taken / expected) * 100)) : 0;

    const bEntry = bodyByDay.get(iso) ?? lastKnown(iso);

    buckets.push({
      date: iso,
      label: fmtLabel(iso),
      weight: bEntry?.weight ?? null,
      bodyFat: bEntry?.body_fat ?? null,
      muscleMass: bEntry?.muscle_mass ?? null,
      healthyMeals: healthy,
      regularMeals: regular,
      junkMeals: junk,
      mealsTotal: total,
      mealsScore,
      medsTaken: taken,
      medsExpected: expected,
      adherencePct,
    });
  }
  return buckets;
}

export type HealthTotals = {
  weightLatest: number | null;
  weightDelta: number | null; // primer→último del rango con datos
  bodyFatLatest: number | null;
  muscleMassLatest: number | null;
  mealsTotal: number;
  healthyMeals: number;
  junkMeals: number;
  mealsScoreAvg: number; // 0..100 promedio de días con comidas
  medsTakenTotal: number;
  medsExpectedTotal: number;
  adherenceAvgPct: number; // 0..100
  daysWithMeals: number;
  daysTrackedBody: number;
};

export function computeHealthTotals(buckets: HealthDayBucket[]): HealthTotals {
  let mealsTotal = 0, healthy = 0, junk = 0;
  let scoreSum = 0, scoreCount = 0;
  let takenTotal = 0, expectedTotal = 0;
  let daysWithMeals = 0;

  const withWeight = buckets.filter((b) => b.weight !== null);
  const firstW = withWeight[0]?.weight ?? null;
  const lastW = withWeight[withWeight.length - 1]?.weight ?? null;
  const lastBodyFat = [...buckets].reverse().find((b) => b.bodyFat !== null)?.bodyFat ?? null;
  const lastMuscle = [...buckets].reverse().find((b) => b.muscleMass !== null)?.muscleMass ?? null;

  // únicos días con datos reales de body
  const uniqueBodyDays = new Set<string>();
  for (const b of buckets) {
    if (b.mealsTotal > 0) {
      daysWithMeals++;
      mealsTotal += b.mealsTotal;
      healthy += b.healthyMeals;
      junk += b.junkMeals;
      scoreSum += b.mealsScore;
      scoreCount++;
    }
    takenTotal += b.medsTaken;
    expectedTotal += b.medsExpected;
  }

  // contamos solo los días donde realmente hubo entrada body (no forward-fill)
  // necesitamos el body original — aquí simplificamos contando cambios consecutivos
  let prev: number | null = null;
  for (const b of buckets) {
    if (b.weight !== null && b.weight !== prev) {
      uniqueBodyDays.add(b.date);
    }
    if (b.weight !== null) prev = b.weight;
  }

  return {
    weightLatest: lastW,
    weightDelta: firstW !== null && lastW !== null ? Number((lastW - firstW).toFixed(2)) : null,
    bodyFatLatest: lastBodyFat,
    muscleMassLatest: lastMuscle,
    mealsTotal,
    healthyMeals: healthy,
    junkMeals: junk,
    mealsScoreAvg: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
    medsTakenTotal: takenTotal,
    medsExpectedTotal: expectedTotal,
    adherenceAvgPct: expectedTotal > 0 ? Math.round((takenTotal / expectedTotal) * 100) : 0,
    daysWithMeals,
    daysTrackedBody: uniqueBodyDays.size,
  };
}

// Adherencia por medicamento individual en el rango
export type MedAdherenceRow = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  taken: number;
  expected: number;
  pct: number; // 0..100
};

export function adherenceByMedication(
  medications: Medication[],
  medLogs: MedicationLog[],
  days = 30,
): MedAdherenceRow[] {
  const cutoff = new Date(`${daysAgoKey(days - 1)}T00:00:00`).getTime();

  const takenByMed = new Map<string, number>();
  for (const l of medLogs) {
    if (!l.taken) continue;
    const t = new Date(l.date + "T12:00:00").getTime();
    if (t < cutoff) continue;
    takenByMed.set(l.medication_id, (takenByMed.get(l.medication_id) ?? 0) + 1);
  }

  return medications
    .filter((m) => m.active)
    .map((m) => {
      const perDay =
        m.frequency === "daily" || m.frequency === "twice_daily"
          ? Math.max(1, m.times_per_day || 1)
          : 0;
      const expected = perDay * days;
      const taken = takenByMed.get(m.id) ?? 0;
      const pct = expected > 0 ? Math.min(100, Math.round((taken / expected) * 100)) : 0;
      return { id: m.id, name: m.name, emoji: m.emoji, color: m.color, taken, expected, pct };
    })
    .sort((a, b) => b.pct - a.pct);
}
