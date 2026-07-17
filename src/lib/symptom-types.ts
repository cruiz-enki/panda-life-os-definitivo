/**
 * Tipos del **registro de malestares** (síntomas) — pensado para Mounjaro.
 */
export type SymptomTimeOfDay = "morning" | "afternoon" | "night";
export type SymptomDuration = "brief" | "hours" | "all_day";

export type Symptom = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  intensity: number; // 0..5
  time_of_day: SymptomTimeOfDay;
  duration: SymptomDuration;
  tags: string[];
  notes: string;
};

export const TIME_OF_DAY_LABEL: Record<SymptomTimeOfDay, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
};

export const DURATION_LABEL: Record<SymptomDuration, string> = {
  brief: "Breve",
  hours: "Horas",
  all_day: "Todo el día",
};

// Atajos de síntomas comunes (especialmente con Mounjaro)
export const COMMON_SYMPTOMS: { tag: string; label: string; emoji: string }[] = [
  { tag: "nausea", label: "Náusea", emoji: "🤢" },
  { tag: "mareo", label: "Mareo", emoji: "💫" },
  { tag: "acidez", label: "Acidez", emoji: "🔥" },
  { tag: "dolor_cabeza", label: "Dolor de cabeza", emoji: "🤕" },
  { tag: "fatiga", label: "Fatiga", emoji: "😮‍💨" },
  { tag: "estrenimiento", label: "Estreñimiento", emoji: "🚽" },
  { tag: "diarrea", label: "Diarrea", emoji: "💧" },
  { tag: "dolor_abdominal", label: "Dolor abdominal", emoji: "😣" },
  { tag: "reflujo", label: "Reflujo", emoji: "🌋" },
  { tag: "perdida_apetito", label: "Sin apetito", emoji: "🍽️" },
];

export const INTENSITY_COLOR = (n: number): string => {
  if (n <= 1) return "oklch(0.78 0.18 150)";
  if (n <= 2) return "oklch(0.78 0.15 100)";
  if (n <= 3) return "oklch(0.78 0.15 70)";
  if (n <= 4) return "oklch(0.72 0.18 40)";
  return "oklch(0.7 0.22 25)";
};
