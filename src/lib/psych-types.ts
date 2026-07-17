/**
 * Tipos y catálogos del módulo de **Psicología**: sesiones, checkins,
 * tareas terapéuticas, emociones y triggers comunes.
 */
export type PsychSession = {
  id: string;
  date: string;
  psychologist: string;
  main_topic: string;
  subtopics: string[];
  insight: string;
  agreements: string;
  impact: number; // 1-5
  next_session: string | null;
  is_private: boolean;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export type PsychCheckin = {
  id: string;
  date: string;
  anxiety: number; // 0-5
  stress: number; // 0-5
  dominant_emotion: string;
  trigger: string;
  dominant_thought: string;
  is_private: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PsychTaskStatus = "pending" | "in_progress" | "completed";

export type PsychTask = {
  id: string;
  session_id: string | null;
  title: string;
  description: string;
  status: PsychTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  is_private: boolean;
  created_at?: string;
  updated_at?: string;
};

export const EMOTIONS = [
  { value: "calma", label: "Calma", emoji: "😌" },
  { value: "alegria", label: "Alegría", emoji: "😊" },
  { value: "ansiedad", label: "Ansiedad", emoji: "😰" },
  { value: "tristeza", label: "Tristeza", emoji: "😔" },
  { value: "enojo", label: "Enojo", emoji: "😠" },
  { value: "miedo", label: "Miedo", emoji: "😨" },
  { value: "frustracion", label: "Frustración", emoji: "😤" },
  { value: "esperanza", label: "Esperanza", emoji: "🌱" },
  { value: "gratitud", label: "Gratitud", emoji: "🙏" },
  { value: "vacio", label: "Vacío", emoji: "🌫️" },
] as const;

export const COMMON_TRIGGERS = [
  "Trabajo", "Dinero", "Pareja", "Familia", "Salud", "Redes sociales", "Soledad", "Sueño",
];
