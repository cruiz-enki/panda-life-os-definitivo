/**
 * Tipos del módulo de **Identidad Personal**: áreas, perfil, scores,
 * journal y reflexiones semanales/mensuales.
 */

export type IdentityArea =
  | "finanzas"
  | "salud"
  | "negocio"
  | "mental"
  | "relaciones"
  | "proposito"
  | "ocio";

export const IDENTITY_AREAS: { id: IdentityArea; label: string; emoji: string; color: string }[] = [
  { id: "finanzas", label: "Finanzas", emoji: "💰", color: "oklch(0.75 0.15 90)" },
  { id: "salud", label: "Salud", emoji: "❤️", color: "oklch(0.7 0.2 20)" },
  { id: "negocio", label: "Negocio", emoji: "💼", color: "oklch(0.7 0.18 250)" },
  { id: "mental", label: "Mental", emoji: "🧠", color: "oklch(0.72 0.18 290)" },
  { id: "relaciones", label: "Relaciones", emoji: "🤝", color: "oklch(0.75 0.16 340)" },
  { id: "proposito", label: "Propósito", emoji: "🎯", color: "oklch(0.7 0.18 60)" },
  { id: "ocio", label: "Ocio", emoji: "🎨", color: "oklch(0.72 0.18 180)" },
];

export type IdentityProfile = {
  id: string;
  user_id: string;
  desired_identity: string;
  core_values: string[];
  active_areas: IdentityArea[];
};

export type IdentityAreaScore = {
  id: string;
  user_id: string;
  area: IdentityArea;
  score: number; // 1-10
  month: string; // YYYY-MM
  notes: string;
  updated_at: string;
};

export type IdentityJournalEntry = {
  id: string;
  user_id: string;
  date: string;
  did_well: string;
  did_not_well: string;
  learned: string;
  energy: number | null;
  emotion: string;
  alignment: number; // 1-10
  insight: string;
  updated_at: string;
};

export type IdentityWeeklyReflection = {
  id: string;
  user_id: string;
  week_key: string;
  analysis: string;
  patterns: string;
  recommendations: string;
  ai_generated: boolean;
  updated_at: string;
};

export type IdentityScoreBreakdown = {
  habits: number;
  health: number;
  finance: number;
  journal: number;
  wheel: number;
};

export type IdentityScoreSnapshot = {
  id: string;
  user_id: string;
  date: string;
  score: number;
  breakdown: IdentityScoreBreakdown;
};

export const SCORE_WEIGHTS = {
  habits: 0.25,
  health: 0.20,
  finance: 0.20,
  journal: 0.20,
  wheel: 0.15,
};

/**
 * Clave del mes actual `YYYY-MM`.
 */
export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Clave de la semana ISO actual `YYYY-Www`.
 */
export function currentWeekKey(): string {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
