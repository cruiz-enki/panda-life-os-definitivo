/**
 * Vinculación de hábitos con métricas reales.
 * Un hábito con `linkedMetric` + `targetValue` se auto-completa cuando
 * el valor del día alcanza la meta.
 */
import type { Habit, HabitLinkedMetric } from "./storage-types";

export const HABIT_METRIC_OPTIONS: Array<{
  value: HabitLinkedMetric;
  label: string;
  unit: string;
  defaultTarget: number;
  hint: string;
}> = [
  { value: "water_ml", label: "Agua bebida", unit: "ml", defaultTarget: 2000, hint: "Suma /log de agua del día" },
  { value: "exercise_any", label: "Ejercicio (cualquiera)", unit: "sesión", defaultTarget: 1, hint: "Cualquier workout registrado hoy" },
  { value: "protein_g", label: "Proteína", unit: "g", defaultTarget: 100, hint: "Suma de proteína de comidas de hoy" },
  { value: "sleep_hours", label: "Sueño", unit: "h", defaultTarget: 7, hint: "Horas de la última sesión de sueño" },
  { value: "meds_am", label: "Meds AM", unit: "toma", defaultTarget: 1, hint: "Slot AM tomado hoy" },
  { value: "meds_pm", label: "Meds PM", unit: "toma", defaultTarget: 1, hint: "Slot PM tomado hoy" },
];

export function metricLabel(m?: HabitLinkedMetric | null): string {
  if (!m) return "";
  return HABIT_METRIC_OPTIONS.find((o) => o.value === m)?.label ?? m;
}

export function metricUnit(m?: HabitLinkedMetric | null): string {
  if (!m) return "";
  return HABIT_METRIC_OPTIONS.find((o) => o.value === m)?.unit ?? "";
}

export type MetricValues = Partial<Record<HabitLinkedMetric, number>>;

/** Progreso 0-1 del hábito según su métrica; null si no está vinculado. */
export function habitProgress(h: Habit, values: MetricValues): number | null {
  if (!h.linkedMetric || !h.targetValue || h.targetValue <= 0) return null;
  const v = values[h.linkedMetric] ?? 0;
  return Math.min(1, v / h.targetValue);
}

/**
 * Recorre hábitos diarios con métrica vinculada y, si el valor del día
 * alcanza la meta y aún no está marcado hoy, dispara `toggle(id, today)`.
 */
export function autoSyncHabits(
  habits: Habit[],
  values: MetricValues,
  today: string,
  toggle: (id: string, date: string) => void,
) {
  for (const h of habits) {
    if (h.frequency !== "daily") continue;
    if (!h.linkedMetric || !h.targetValue || h.targetValue <= 0) continue;
    const v = values[h.linkedMetric] ?? 0;
    const done = h.history.includes(today);
    if (v >= h.targetValue && !done) {
      toggle(h.id, today);
    }
  }
}
