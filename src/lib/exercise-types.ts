/**
 * Tipos y metadatos del módulo **Ejercicio**: niveles, grupos musculares,
 * equipamiento, rutinas y logs.
 */
export type ExerciseLevel = "beginner" | "intermediate" | "advanced";
export type MuscleGroup =
  | "piernas" | "glúteos" | "pecho" | "espalda" | "hombros"
  | "brazos" | "core" | "full_body" | "cardio";

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  level: ExerciseLevel | string;
  equipment: string;
  instructions: string;
  precautions: string;
  youtube_url: string;
  default_sets: number;
  default_reps: string;
  duration_minutes: number;
  xp_reward: number;
  emoji: string;
  active: boolean;
  image_urls?: string[];
};

export type Routine = {
  id: string;
  name: string;
  objective: string;
  duration_minutes: number;
  level: ExerciseLevel | string;
  suggested_days_per_week: number;
  xp_total: number;
  xp_bonus: number;
  emoji: string;
  color: string;
  active: boolean;
};

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  sort_order: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
};

export type WorkoutScheduleEntry = {
  id: string;
  user_id: string;
  routine_id: string | null;
  day_of_week: number | null; // 0..6 (0 = domingo)
  scheduled_date: string | null;
  is_rest: boolean;
  notes: string;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  routine_id: string | null;
  date: string;
  completed: boolean;
  difficulty: number | null;
  energy_before: number | null;
  energy_after: number | null;
  notes: string;
  xp_awarded: number;
  created_at: string;
  updated_at: string;
};

export type WorkoutExerciseLog = {
  id: string;
  user_id: string;
  workout_log_id: string;
  exercise_id: string | null;
  completed: boolean;
  sets_done: number;
  reps_done: string;
  notes: string;
  xp_awarded: number;
  created_at: string;
};

export type ExerciseUserPref = {
  id: string;
  user_id: string;
  exercise_id: string;
  status: "normal" | "modify" | "avoid";
  notes: string;
};

export const MUSCLE_GROUPS: { value: string; label: string }[] = [
  { value: "full_body", label: "Cuerpo completo" },
  { value: "piernas", label: "Piernas" },
  { value: "glúteos", label: "Glúteos" },
  { value: "pecho", label: "Pecho" },
  { value: "espalda", label: "Espalda" },
  { value: "hombros", label: "Hombros" },
  { value: "brazos", label: "Brazos" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
];

export const LEVELS: { value: ExerciseLevel; label: string }[] = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

export const EQUIPMENT: { value: string; label: string }[] = [
  { value: "none", label: "Sin equipo" },
  { value: "dumbbells", label: "Mancuernas" },
  { value: "band", label: "Banda" },
  { value: "bench", label: "Banco" },
  { value: "chair", label: "Silla" },
  { value: "mat", label: "Mat" },
  { value: "kettlebell", label: "Kettlebell" },
];

/**
 * Extrae el `videoId` de una URL de YouTube (admite formatos cortos y largos).
 */
export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
