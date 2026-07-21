/**
 * Sistema de **gamificación profundo**: misiones fijas, quests semanales
 * rotativas y avatar evolutivo por nivel. Funciones puras de evaluación
 * sobre `AppState`.
 */
import type { AppState } from "./storage-types";
import { todayCDMX } from "@/lib/date-utils";

// ===== Fixed Missions (Hitos/Logros) =====
export type FixedMissionCategory = "habits" | "tasks" | "notes" | "energy" | "learning" | "level" | "meta" | "finance" | "health" | "home";

export type FixedMission = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: FixedMissionCategory;
  xp: number; // bonus al desbloquear
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (s: AppState) => boolean;
};

const todayISO = () => todayCDMX();

export const FIXED_MISSIONS: FixedMission[] = [
  // Hábitos
  { id: "habit-first", name: "Primer paso", description: "Completa tu primer hábito", emoji: "👣", category: "habits", xp: 20, rarity: "common",
    check: (s) => s.habits.some((h) => h.history.length >= 1) },
  { id: "habit-streak-7", name: "Una semana firme", description: "Mantén una racha de 7 días en un hábito", emoji: "🔥", category: "habits", xp: 50, rarity: "rare",
    check: (s) => s.habits.some((h) => h.streak >= 7) },
  { id: "habit-streak-30", name: "Mes de hierro", description: "Racha de 30 días en un hábito", emoji: "⚡", category: "habits", xp: 200, rarity: "epic",
    check: (s) => s.habits.some((h) => h.streak >= 30) },
  { id: "habit-streak-100", name: "Centenario", description: "Racha de 100 días en un hábito", emoji: "💎", category: "habits", xp: 1000, rarity: "legendary",
    check: (s) => s.habits.some((h) => h.streak >= 100) },
  { id: "habit-all-today", name: "Día perfecto", description: "Completa todos tus hábitos en un día", emoji: "🌟", category: "habits", xp: 40, rarity: "rare",
    check: (s) => s.habits.length >= 3 && s.habits.every((h) => h.lastCompleted === todayISO()) },
  { id: "habit-collector", name: "Coleccionista", description: "Crea 5 hábitos diferentes", emoji: "🎯", category: "habits", xp: 30, rarity: "common",
    check: (s) => s.habits.length >= 5 },

  // Tareas
  { id: "task-first", name: "Manos a la obra", description: "Completa tu primera tarea", emoji: "✅", category: "tasks", xp: 15, rarity: "common",
    check: (s) => s.tasks.some((t) => t.status === "completed") },
  { id: "task-10", name: "Productivo", description: "Completa 10 tareas", emoji: "📈", category: "tasks", xp: 40, rarity: "common",
    check: (s) => s.tasks.filter((t) => t.status === "completed").length >= 10 },
  { id: "task-50", name: "Imparable", description: "Completa 50 tareas", emoji: "🚀", category: "tasks", xp: 150, rarity: "rare",
    check: (s) => s.tasks.filter((t) => t.status === "completed").length >= 50 },
  { id: "task-200", name: "Máquina", description: "Completa 200 tareas", emoji: "🤖", category: "tasks", xp: 500, rarity: "epic",
    check: (s) => s.tasks.filter((t) => t.status === "completed").length >= 200 },
  { id: "task-streak-7", name: "Constancia", description: "Racha de 7 días completando tareas", emoji: "📅", category: "tasks", xp: 60, rarity: "rare",
    check: (s) => s.productivity.streak >= 7 },
  { id: "task-streak-30", name: "Disciplina absoluta", description: "Racha de 30 días con tareas completadas", emoji: "🏆", category: "tasks", xp: 300, rarity: "epic",
    check: (s) => s.productivity.streak >= 30 },
  { id: "task-high-priority", name: "Cazador de prioridades", description: "Completa 10 tareas de alta prioridad", emoji: "🎯", category: "tasks", xp: 80, rarity: "rare",
    check: (s) => s.tasks.filter((t) => t.status === "completed" && t.priority === "high").length >= 10 },

  // Notas
  { id: "note-first", name: "Primera idea", description: "Captura tu primera nota", emoji: "💡", category: "notes", xp: 10, rarity: "common",
    check: (s) => s.notes.length >= 1 },
  { id: "note-25", name: "Pensador", description: "Captura 25 notas", emoji: "📝", category: "notes", xp: 50, rarity: "rare",
    check: (s) => s.notes.length >= 25 },
  { id: "note-linker", name: "Conectador", description: "Enlaza 5 notas entre sí", emoji: "🔗", category: "notes", xp: 40, rarity: "rare",
    check: (s) => s.notes.filter((n) => n.linkedNoteIds.length > 0).length >= 5 },
  { id: "note-money", name: "Cazador de oportunidades", description: "Marca 3 notas con potencial $", emoji: "💰", category: "notes", xp: 60, rarity: "rare",
    check: (s) => s.notes.filter((n) => n.importance === "money").length >= 3 },

  // Energía
  { id: "energy-first", name: "Autoconsciente", description: "Registra tu energía por primera vez", emoji: "🔋", category: "energy", xp: 15, rarity: "common",
    check: (s) => s.energy.length >= 1 },
  { id: "energy-7", name: "Semana sintonizada", description: "Registra energía 7 días", emoji: "📊", category: "energy", xp: 40, rarity: "rare",
    check: (s) => s.energy.length >= 7 },
  { id: "energy-30", name: "Maestro del cuerpo", description: "Registra energía 30 días", emoji: "🧘", category: "energy", xp: 150, rarity: "epic",
    check: (s) => s.energy.length >= 30 },
  { id: "energy-peak", name: "Pico máximo", description: "Día con energía promedio ≥ 9", emoji: "⚡", category: "energy", xp: 50, rarity: "rare",
    check: (s) => s.energy.some((e) => (e.physical + e.mental + e.emotional) / 3 >= 9) },

  // Aprendizajes
  { id: "learn-first", name: "Mente curiosa", description: "Registra tu primer aprendizaje", emoji: "🧠", category: "learning", xp: 15, rarity: "common",
    check: (s) => s.learnings.length >= 1 },
  { id: "learn-10", name: "Estudioso", description: "Acumula 10 aprendizajes", emoji: "📚", category: "learning", xp: 50, rarity: "rare",
    check: (s) => s.learnings.length >= 10 },
  { id: "learn-50", name: "Erudito", description: "Acumula 50 aprendizajes", emoji: "🎓", category: "learning", xp: 200, rarity: "epic",
    check: (s) => s.learnings.length >= 50 },

  // Niveles
  { id: "level-5", name: "Despertando", description: "Alcanza el nivel 5", emoji: "🌱", category: "level", xp: 30, rarity: "common",
    check: (s) => Math.floor(Math.sqrt(s.xp / 50)) + 1 >= 5 },
  { id: "level-10", name: "Equilibrio", description: "Alcanza el nivel 10", emoji: "🌿", category: "level", xp: 80, rarity: "rare",
    check: (s) => Math.floor(Math.sqrt(s.xp / 50)) + 1 >= 10 },
  { id: "level-20", name: "Ascenso", description: "Alcanza el nivel 20", emoji: "🌳", category: "level", xp: 250, rarity: "epic",
    check: (s) => Math.floor(Math.sqrt(s.xp / 50)) + 1 >= 20 },
  { id: "level-50", name: "Leyenda Panda", description: "Alcanza el nivel 50", emoji: "🐼", category: "level", xp: 1000, rarity: "legendary",
    check: (s) => Math.floor(Math.sqrt(s.xp / 50)) + 1 >= 50 },

  // Meta
  { id: "meta-balanced", name: "Vida balanceada", description: "Tienes hábitos, tareas, notas, energía y aprendizajes activos", emoji: "⚖️", category: "meta", xp: 100, rarity: "epic",
    check: (s) => s.habits.length > 0 && s.tasks.length > 0 && s.notes.length > 0 && s.energy.length > 0 && s.learnings.length > 0 },

  // Finanzas
  { id: "fin-first-card", name: "Primera tarjeta", description: "Registra tu primera tarjeta de crédito", emoji: "💳", category: "finance", xp: 20, rarity: "common",
    check: (s) => (s.finance?.cardsCount ?? 0) >= 1 },
  { id: "fin-first-expense", name: "Primer gasto registrado", description: "Captura tu primer movimiento financiero", emoji: "🧾", category: "finance", xp: 15, rarity: "common",
    check: (s) => (s.finance?.expensesCount ?? 0) >= 1 },
  { id: "fin-expense-25", name: "Detallista", description: "Registra 25 movimientos", emoji: "📒", category: "finance", xp: 50, rarity: "rare",
    check: (s) => (s.finance?.expensesCount ?? 0) >= 25 },
  { id: "fin-expense-100", name: "Contador personal", description: "Registra 100 movimientos", emoji: "📊", category: "finance", xp: 150, rarity: "epic",
    check: (s) => (s.finance?.expensesCount ?? 0) >= 100 },
  { id: "fin-first-budget", name: "Plan en marcha", description: "Crea tu primer presupuesto", emoji: "🎯", category: "finance", xp: 30, rarity: "common",
    check: (s) => (s.finance?.budgetsCount ?? 0) >= 1 },
  { id: "fin-budgets-on-track", name: "Bajo control", description: "Mantén 3+ presupuestos dentro del límite", emoji: "🟢", category: "finance", xp: 80, rarity: "rare",
    check: (s) => (s.finance?.budgetsOnTrack ?? 0) >= 3 },
  { id: "fin-low-utilization", name: "Crédito sano", description: "Mantén tu utilización máxima por debajo del 30%", emoji: "💚", category: "finance", xp: 80, rarity: "rare",
    check: (s) => (s.finance?.cardsCount ?? 0) > 0 && (s.finance?.maxUtilization ?? 1) < 0.3 },
  { id: "fin-payment-made", name: "Pago realizado", description: "Registra tu primer pago a una tarjeta", emoji: "💵", category: "finance", xp: 25, rarity: "common",
    check: (s) => (s.finance?.paymentsThisWeekCount ?? 0) >= 1 || (s.finance?.totalBalance ?? 1) === 0 && (s.finance?.cardsCount ?? 0) > 0 },
  { id: "fin-msi-tracker", name: "Maestro del MSI", description: "Lleva control de 3+ planes de meses sin intereses", emoji: "📅", category: "finance", xp: 60, rarity: "rare",
    check: (s) => (s.finance?.activeMsiCount ?? 0) >= 3 },
  { id: "fin-positive-month", name: "Mes en verde", description: "Tus ingresos del mes superan tus gastos", emoji: "📈", category: "finance", xp: 120, rarity: "epic",
    check: (s) => (s.finance?.monthIncome ?? 0) > 0 && (s.finance?.monthIncome ?? 0) > (s.finance?.monthExpenses ?? 0) },
  { id: "fin-debt-free", name: "Cero deudas", description: "Llega a saldo 0 en todas tus tarjetas", emoji: "🕊️", category: "finance", xp: 300, rarity: "epic",
    check: (s) => (s.finance?.cardsCount ?? 0) > 0 && (s.finance?.totalBalance ?? 1) === 0 },

  // Salud
  { id: "health-first-body", name: "Primer pesaje", description: "Registra tu primera medición corporal", emoji: "⚖️", category: "health", xp: 20, rarity: "common",
    check: (s) => (s.health?.bodyEntriesCount ?? 0) >= 1 },
  { id: "health-body-10", name: "Seguimiento serio", description: "Registra 10 mediciones corporales", emoji: "📏", category: "health", xp: 60, rarity: "rare",
    check: (s) => (s.health?.bodyEntriesCount ?? 0) >= 10 },
  { id: "health-body-30", name: "Cuerpo en datos", description: "Registra 30 mediciones corporales", emoji: "📊", category: "health", xp: 200, rarity: "epic",
    check: (s) => (s.health?.bodyEntriesCount ?? 0) >= 30 },
  { id: "health-first-meal", name: "Primera comida", description: "Registra tu primera comida", emoji: "🍽️", category: "health", xp: 10, rarity: "common",
    check: (s) => (s.health?.mealsCount ?? 0) >= 1 },
  { id: "health-meals-50", name: "Foodie consciente", description: "Registra 50 comidas", emoji: "🥗", category: "health", xp: 80, rarity: "rare",
    check: (s) => (s.health?.mealsCount ?? 0) >= 50 },
  { id: "health-clean-week", name: "Semana limpia", description: "10+ comidas saludables esta semana sin chatarra", emoji: "🌱", category: "health", xp: 120, rarity: "epic",
    check: (s) => (s.health?.healthyMealsThisWeek ?? 0) >= 10 && (s.health?.junkMealsThisWeek ?? 0) === 0 },
  { id: "health-first-med", name: "Tratamiento al día", description: "Registra tu primer medicamento", emoji: "💊", category: "health", xp: 15, rarity: "common",
    check: (s) => (s.health?.activeMedsCount ?? 0) >= 1 },
  { id: "health-adherence-80", name: "Disciplinado con la salud", description: "Adherencia ≥80% a tus medicamentos esta semana", emoji: "🎯", category: "health", xp: 100, rarity: "rare",
    check: (s) => (s.health?.activeMedsCount ?? 0) > 0 && (s.health?.medAdherenceWeekPct ?? 0) >= 0.8 },
  { id: "health-adherence-100", name: "Adherencia perfecta", description: "100% de tus tomas en la semana", emoji: "✨", category: "health", xp: 200, rarity: "epic",
    check: (s) => (s.health?.activeMedsCount ?? 0) > 0 && (s.health?.medAdherenceWeekPct ?? 0) >= 1 },

  // Hogar
  { id: "home-first-task", name: "Hogar en marcha", description: "Crea tu primera tarea del hogar", emoji: "🏠", category: "home", xp: 15, rarity: "common",
    check: (s) => (s.home?.totalTasks ?? 0) >= 1 },
  { id: "home-first-completion", name: "Primera limpieza", description: "Completa tu primera tarea del hogar", emoji: "🧹", category: "home", xp: 20, rarity: "common",
    check: (s) => (s.home?.totalCompletions ?? 0) >= 1 },
  { id: "home-day-perfect", name: "Día del hogar perfecto", description: "Completa todas las tareas del hogar de un día", emoji: "🌟", category: "home", xp: 60, rarity: "rare",
    check: (s) => (s.home?.dayComplete ?? false) && (s.home?.todayTotal ?? 0) >= 1 },
  { id: "home-week-perfect", name: "Semana impecable", description: "Termina todas tus tareas semanales del hogar", emoji: "🏆", category: "home", xp: 150, rarity: "epic",
    check: (s) => (s.home?.weekComplete ?? false) && (s.home?.weeklyTasksTotal ?? 0) >= 1 },
  { id: "home-completions-50", name: "Casa cuidada", description: "Acumula 50 tareas del hogar completadas", emoji: "🛋️", category: "home", xp: 80, rarity: "rare",
    check: (s) => (s.home?.totalCompletions ?? 0) >= 50 },
  { id: "home-completions-200", name: "Maestro del hogar", description: "Acumula 200 tareas del hogar completadas", emoji: "👑", category: "home", xp: 300, rarity: "epic",
    check: (s) => (s.home?.totalCompletions ?? 0) >= 200 },

  // Victorias
  { id: "wins-10", name: "Coleccionista de victorias", description: "Registra 10 victorias diarias", emoji: "🏅", category: "meta", xp: 100, rarity: "rare",
    check: (s) => (s.dailyWins?.length ?? 0) >= 10 },
  { id: "wins-50", name: "Triunfador nato", description: "Registra 50 victorias diarias", emoji: "🎖️", category: "meta", xp: 500, rarity: "epic",
    check: (s) => (s.dailyWins?.length ?? 0) >= 50 },
];

export const RARITY_META: Record<FixedMission["rarity"], { label: string; color: string; ring: string }> = {
  common: { label: "Común", color: "oklch(0.7 0.05 220)", ring: "ring-muted" },
  rare: { label: "Raro", color: "oklch(0.7 0.18 220)", ring: "ring-primary/40" },
  epic: { label: "Épico", color: "oklch(0.75 0.2 50)", ring: "ring-[oklch(0.75_0.2_50)]/50" },
  legendary: { label: "Legendario", color: "oklch(0.82 0.17 90)", ring: "ring-[oklch(0.82_0.17_90)]/60" },
};

// ===== Quests semanales =====
export type QuestKind =
  | "complete_tasks"
  | "complete_high_priority"
  | "habit_completions"
  | "log_energy_days"
  | "add_notes"
  | "add_learnings"
  | "log_expenses"
  | "make_card_payment"
  | "stay_under_budget"
  | "log_body_entries"
  | "log_healthy_meals"
  | "med_adherence"
  | "home_completions"
  | "home_day_complete"
  | "home_week_complete";

export type Quest = {
  id: string;
  kind: QuestKind;
  title: string;
  description: string;
  emoji: string;
  target: number;
  xp: number;
};

const QUEST_POOL: Quest[] = [
  { id: "q-tasks-10", kind: "complete_tasks", title: "Despeja la lista", description: "Completa 10 tareas esta semana", emoji: "✅", target: 10, xp: 80 },
  { id: "q-tasks-20", kind: "complete_tasks", title: "Demoledor", description: "Completa 20 tareas esta semana", emoji: "🪓", target: 20, xp: 150 },
  { id: "q-high-3", kind: "complete_high_priority", title: "Cazador alpha", description: "Completa 3 tareas de alta prioridad", emoji: "🎯", target: 3, xp: 100 },
  { id: "q-high-5", kind: "complete_high_priority", title: "Sin miedo", description: "Completa 5 tareas de alta prioridad", emoji: "🔥", target: 5, xp: 180 },
  { id: "q-habits-15", kind: "habit_completions", title: "Hábitos en marcha", description: "Logra 15 check-ins de hábitos", emoji: "🔁", target: 15, xp: 90 },
  { id: "q-habits-25", kind: "habit_completions", title: "Constructor", description: "Logra 25 check-ins de hábitos", emoji: "🏗️", target: 25, xp: 150 },
  { id: "q-energy-5", kind: "log_energy_days", title: "Sintonización", description: "Registra tu energía 5 días", emoji: "🔋", target: 5, xp: 70 },
  { id: "q-energy-7", kind: "log_energy_days", title: "Semana completa", description: "Registra tu energía los 7 días", emoji: "📊", target: 7, xp: 120 },
  { id: "q-notes-5", kind: "add_notes", title: "Captura ideas", description: "Crea 5 notas nuevas", emoji: "💡", target: 5, xp: 60 },
  { id: "q-learn-3", kind: "add_learnings", title: "Mente fresca", description: "Registra 3 aprendizajes", emoji: "🧠", target: 3, xp: 70 },
  // Finanzas
  { id: "q-fin-expenses-5", kind: "log_expenses", title: "Control financiero", description: "Registra 5 movimientos esta semana", emoji: "🧾", target: 5, xp: 70 },
  { id: "q-fin-expenses-10", kind: "log_expenses", title: "Cuentas claras", description: "Registra 10 movimientos esta semana", emoji: "📒", target: 10, xp: 130 },
  { id: "q-fin-pay-1", kind: "make_card_payment", title: "Pagar a tiempo", description: "Realiza al menos 1 pago a tarjeta", emoji: "💵", target: 1, xp: 90 },
  { id: "q-fin-pay-2", kind: "make_card_payment", title: "Adelantando deuda", description: "Realiza 2 pagos a tarjetas", emoji: "💰", target: 2, xp: 150 },
  { id: "q-fin-budget-2", kind: "stay_under_budget", title: "Disciplina presupuestal", description: "Mantén 2 presupuestos dentro del límite", emoji: "🟢", target: 2, xp: 120 },
  // Salud
  { id: "q-health-body-3", kind: "log_body_entries", title: "Cuerpo medido", description: "Registra 3 mediciones corporales", emoji: "⚖️", target: 3, xp: 80 },
  { id: "q-health-meals-10", kind: "log_healthy_meals", title: "Comer bien", description: "Registra 10 comidas saludables", emoji: "🥗", target: 10, xp: 100 },
  { id: "q-health-meals-5", kind: "log_healthy_meals", title: "Empieza limpio", description: "Registra 5 comidas saludables", emoji: "🌱", target: 5, xp: 60 },
  { id: "q-health-med-80", kind: "med_adherence", title: "Adherencia 80%", description: "Cumple 80% de tus tomas esta semana", emoji: "💊", target: 80, xp: 120 },
  // Hogar
  { id: "q-home-comp-10", kind: "home_completions", title: "Hogar al día", description: "Completa 10 tareas del hogar esta semana", emoji: "🧹", target: 10, xp: 80 },
  { id: "q-home-comp-20", kind: "home_completions", title: "Casa impecable", description: "Completa 20 tareas del hogar esta semana", emoji: "🏠", target: 20, xp: 150 },
  { id: "q-home-day-3", kind: "home_day_complete", title: "Tres días redondos", description: "Cierra 3 días con todo el hogar al 100%", emoji: "🌟", target: 3, xp: 120 },
  { id: "q-home-week", kind: "home_week_complete", title: "Semana del hogar", description: "Completa todas tus tareas semanales del hogar", emoji: "🏆", target: 1, xp: 150 },
];

/**
 * Clave ISO de la semana actual (lun-dom) en formato `YYYY-Www`.
 */
export function weekKey(d = new Date()): string {
  // ISO week (YYYY-Www)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weekStart(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (day - 1));
  return date;
}

/**
 * Devuelve la fecha de **fin** de la semana ISO que contiene `d`.
 */
export function weekEnd(d = new Date()): Date {
  const start = weekStart(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

// Hash determinista para que las quests semanales sean estables
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Selecciona `count` quests deterministas para la semana `wk`
 * (hash estable: el set no cambia dentro de la semana).
 */
export function questsForWeek(wk: string, count = 3): Quest[] {
  const seed = hashStr(wk);
  const pool = [...QUEST_POOL];
  const picks: Quest[] = [];
  let cursor = seed;
  while (picks.length < count && pool.length > 0) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    const idx = cursor % pool.length;
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

/**
 * Calcula el progreso del usuario sobre una quest a partir del estado.
 */
export function computeQuestProgress(quest: Quest, state: AppState, wk: string): number {
  const start = weekStart(new Date());
  const end = weekEnd(new Date());
  const isThisWeek = wk === weekKey();
  if (!isThisWeek) return 0;
  switch (quest.kind) {
    case "complete_tasks":
      return state.tasks.filter((t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) < end).length;
    case "complete_high_priority":
      return state.tasks.filter((t) => t.status === "completed" && t.priority === "high" && t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) < end).length;
    case "habit_completions": {
      const startISO = start.toISOString().slice(0, 10);
      const endISO = end.toISOString().slice(0, 10);
      return state.habits.reduce((acc, h) => acc + h.history.filter((d) => d >= startISO && d < endISO).length, 0);
    }
    case "log_energy_days": {
      const startISO = start.toISOString().slice(0, 10);
      const endISO = end.toISOString().slice(0, 10);
      return state.energy.filter((e) => e.date >= startISO && e.date < endISO).length;
    }
    case "add_notes":
      return state.notes.filter((n) => new Date(n.createdAt) >= start && new Date(n.createdAt) < end).length;
    case "add_learnings":
      return state.learnings.filter((l) => l.date >= start.toISOString().slice(0, 10) && l.date < end.toISOString().slice(0, 10)).length;
    case "log_expenses":
      return state.finance?.expensesThisWeekCount ?? 0;
    case "make_card_payment":
      return state.finance?.paymentsThisWeekCount ?? 0;
    case "stay_under_budget":
      return state.finance?.budgetsOnTrack ?? 0;
    case "log_body_entries":
      // Aproximación: usamos bodyEntriesCount global; gamificación detecta nuevos hits por progreso semanal vs estado
      return state.health?.bodyEntriesCount ?? 0;
    case "log_healthy_meals":
      return state.health?.healthyMealsThisWeek ?? 0;
    case "med_adherence":
      return Math.round((state.health?.medAdherenceWeekPct ?? 0) * 100);
    case "home_completions":
      return state.home?.weekCompletionsCount ?? 0;
    case "home_day_complete":
      // 1 si hoy está completo; el almacén persiste el máx histórico, así sube a lo largo de la semana
      return state.home?.dayComplete ? 1 : 0;
    case "home_week_complete":
      return state.home?.weekComplete ? 1 : 0;
  }
}

// ===== Avatar evolution =====
export type AvatarStage = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  minLevel: number;
  gradient: string; // tailwind classes
};

export const AVATAR_STAGES: AvatarStage[] = [
  { id: "egg", name: "Huevo Panda", emoji: "🥚", description: "Tu viaje apenas comienza", minLevel: 1, gradient: "from-stone-400 to-stone-600" },
  { id: "cub", name: "Pandita", emoji: "🐼", description: "Pequeño y curioso", minLevel: 3, gradient: "from-emerald-300 to-emerald-600" },
  { id: "explorer", name: "Panda Explorador", emoji: "🌿", description: "Explorando el bosque de bambú", minLevel: 7, gradient: "from-teal-400 to-emerald-700" },
  { id: "warrior", name: "Panda Guerrero", emoji: "⚔️", description: "Disciplina forjada", minLevel: 12, gradient: "from-amber-400 to-orange-600" },
  { id: "sage", name: "Panda Sabio", emoji: "🧘", description: "Mente clara, propósito firme", minLevel: 20, gradient: "from-indigo-400 to-purple-700" },
  { id: "master", name: "Maestro Panda", emoji: "🐲", description: "Maestría en la vida", minLevel: 35, gradient: "from-rose-400 to-fuchsia-700" },
  { id: "legend", name: "Panda Legendario", emoji: "✨", description: "Una leyenda viviente", minLevel: 50, gradient: "from-yellow-300 via-amber-400 to-orange-600" },
  { id: "divine", name: "Deidad Panda", emoji: "⛩️", description: "Trascendencia absoluta", minLevel: 100, gradient: "from-blue-600 via-purple-600 to-pink-600" },
];

/**
 * Devuelve la etapa actual del avatar y la siguiente (para mostrar progreso).
 */
export function avatarForLevel(level: number): { current: AvatarStage; next: AvatarStage | null } {
  let current = AVATAR_STAGES[0];
  let next: AvatarStage | null = null;
  for (let i = 0; i < AVATAR_STAGES.length; i++) {
    if (level >= AVATAR_STAGES[i].minLevel) current = AVATAR_STAGES[i];
    else { next = AVATAR_STAGES[i]; break; }
  }
  return { current, next };
}

// ===== Rangos militares (mapeo por nivel/XP) =====
export type MilitaryRank = {
  id: string;
  name: string;
  insignia: string; // emoji/símbolo
  minLevel: number;
  gradient: string;
  description: string;
};

export const MILITARY_RANKS: MilitaryRank[] = [
  { id: "recruit",    name: "Recluta",    insignia: "🪖", minLevel: 1,  gradient: "from-stone-400 to-stone-600",       description: "El viaje comienza" },
  { id: "legionary",  name: "Legionario", insignia: "🛡️", minLevel: 5,  gradient: "from-emerald-400 to-emerald-700",   description: "Disciplina forjada" },
  { id: "centurion",  name: "Centurión",  insignia: "⚔️", minLevel: 15, gradient: "from-amber-400 to-orange-600",      description: "Al mando de tu vida" },
  { id: "tribune",    name: "Tribuno",    insignia: "🎖️", minLevel: 30, gradient: "from-indigo-400 to-purple-700",     description: "Estratega y guía" },
  { id: "caesar",     name: "César",      insignia: "👑", minLevel: 60, gradient: "from-yellow-300 via-amber-400 to-orange-600", description: "Emperador del hábito" },
];

export function rankForLevel(level: number): { current: MilitaryRank; next: MilitaryRank | null } {
  let current = MILITARY_RANKS[0];
  let next: MilitaryRank | null = null;
  for (let i = 0; i < MILITARY_RANKS.length; i++) {
    if (level >= MILITARY_RANKS[i].minLevel) current = MILITARY_RANKS[i];
    else { next = MILITARY_RANKS[i]; break; }
  }
  return { current, next };
}

// ===== Detección de misiones fijas nuevas =====
/**
 * Evalúa todas las misiones fijas y devuelve las que el usuario acaba de
 * desbloquear en este tick (no incluye las ya marcadas en `alreadyUnlocked`).
 */
export function evaluateFixedMissions(state: AppState, alreadyUnlocked: Set<string>): FixedMission[] {
  return FIXED_MISSIONS.filter((a) => !alreadyUnlocked.has(a.id) && a.check(state));
}
