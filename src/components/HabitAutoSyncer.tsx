/**
 * Componente invisible: se monta una vez y auto-completa hábitos con
 * `linkedMetric` cuando el valor del día alcanza la meta.
 */
import { useEffect, useMemo } from "react";
import { useAppState } from "@/lib/storage";
import { useHealth } from "@/hooks/use-health";
import { useExercise } from "@/hooks/use-exercise";
import { autoSyncHabits, type MetricValues } from "@/lib/habit-metrics";
import { todayCDMX } from "@/lib/date-utils";

export function HabitAutoSyncer() {
  const { state, toggleHabitForDate } = useAppState();
  const { snapshot, waterLogs, meals } = useHealth();
  const { logs: workoutLogs } = useExercise();

  const today = todayCDMX();

  const values: MetricValues = useMemo(() => {
    const waterMl = waterLogs.find((w) => w.date === today)?.amount_ml ?? 0;
    const proteinG = meals
      .filter((m) => m.date === today)
      .reduce((acc, m) => acc + (m.protein_grams ?? 0), 0);
    const exerciseCount = (workoutLogs ?? []).filter((l) => (l as { date?: string }).date === today).length;
    return {
      water_ml: waterMl,
      protein_g: proteinG,
      exercise_any: exerciseCount,
    };
    // snapshot referenced only to invalidate on refresh
     
  }, [waterLogs, meals, workoutLogs, today, snapshot]);

  useEffect(() => {
    if (!state.habits?.length) return;
    autoSyncHabits(state.habits, values, today, toggleHabitForDate);
  }, [state.habits, values, today, toggleHabitForDate]);

  return null;
}
