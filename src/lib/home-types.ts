/**
 * Tipos y constantes del módulo **Hogar de ENKI LIFE OS**: áreas, tareas,
 * completaciones, XP por tipo, snapshot agregado.
 */

export type HomeTaskType = "routine" | "weekly" | "block" | "pets" | "project";
export type HomeFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "flexible";

export type HomeArea = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type HomeTask = {
  id: string;
  user_id: string;
  area_id: string | null;
  title: string;
  description: string;
  task_type: HomeTaskType;
  frequency: HomeFrequency;
  day_of_week: number | null; // 0-6 (dom..sáb)
  xp_reward: number;
  is_key: boolean;
  active: boolean;
  emoji: string;
  sort_order: number;
  scheduled_date: string | null; // Nueva columna para asignar a fechas específicas
  created_at: string;
  updated_at: string;
};

export type HomeCompletion = {
  id: string;
  user_id: string;
  task_id: string;
  completed_date: string;
  xp_awarded: number;
  notes: string;
  created_at: string;
};

// XP base por tipo de tarea (si la tarea no tiene xp_reward específico)
export const HOME_XP_DEFAULTS: Record<HomeTaskType, number> = {
  routine: 5,
  weekly: 15,
  block: 25,
  pets: 8,
  project: 40,
};

export const HOME_TYPE_META: Record<HomeTaskType, { label: string; emoji: string; description: string }> = {
  routine: { label: "Rutina diaria", emoji: "🔁", description: "Tareas que se repiten cada día" },
  weekly: { label: "Semanal", emoji: "📅", description: "Tareas que se hacen una vez por semana" },
  block: { label: "Bloque / Limpieza profunda", emoji: "🧹", description: "Limpieza completa de un área" },
  pets: { label: "Mascotas", emoji: "🐾", description: "Cuidado de mascotas" },
  project: { label: "Proyecto del hogar", emoji: "🛠️", description: "Mejoras o proyectos puntuales" },
};

// Bonuses (suman al XP global vía addBonusXp)
export const HOME_BONUS = {
  DAY_COMPLETE: 20, // todas las tareas activas del día completadas
  WEEK_COMPLETE: 100, // todas las tareas semanales + 7 días seguidos con MVD
  MVD: 5, // mínimo viable diario (al menos una tarea clave + reset)
} as const;

// Snapshot ligero del módulo Hogar para alimentar gamificación global
export type HomeSnapshot = {
  totalTasks: number;
  activeTasks: number;
  completionsTodayCount: number;
  todayTotal: number; // # tareas que tocan hoy
  todayDone: number; // # tareas de hoy completadas
  dayComplete: boolean;
  mvdMet: boolean; // hoy se cumplió mínimo viable
  weekCompletionsCount: number;
  weeklyTasksTotal: number;
  weeklyTasksDone: number;
  weekComplete: boolean;
  totalCompletions: number;
};

export function dayOfWeekLabel(d: number): string {
  return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d] ?? "—";
}
