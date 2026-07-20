/**
 * Cliente para invocar las **edge functions de IA**. Construye snapshots
 * diarios del estado de la app que la IA usa como contexto.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "./storage-types";

/**
 * Resultado de clasificación automática de una captura libre (tipo + categoría).
 */
export type Classification = {
  kind: "task" | "note" | "idea" | "learning";
  title: string;
  summary: string;
  category: "negocio" | "marketing" | "personal" | "clientes" | "contenido" | "otro";
  importance: "normal" | "important" | "high" | "money";
  priority?: "low" | "medium" | "high";
  tags: string[];
};

export async function classifyCapture(text: string): Promise<Classification> {
  const { data, error } = await supabase.functions.invoke("ai-classify-capture", {
    body: { text },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { classification: Classification }).classification;
}

/**
 * Construye el snapshot diario que se envía a la IA como contexto:
 * resumen del día (energía, tareas, hábitos…) sin volcar todo el `AppState`.
 */
export function buildDailySnapshot(state: AppState, today: string) {
  const todayEnergy = state.energy.find((e) => e.date === today);
  const completedHabitsToday = state.habits.filter((h) => h.lastCompleted === today);
  const pendingHabits = state.habits.filter((h) => h.lastCompleted !== today);
  const tasksDueToday = state.tasks.filter((t) => t.due?.slice(0, 10) === today && t.status !== "completed");
  const tasksOverdue = state.tasks.filter((t) => t.due && t.due.slice(0, 10) < today && t.status !== "completed");
  const tasksCompletedToday = state.tasks.filter((t) => t.completedAt?.slice(0, 10) === today);
  const recentLearnings = state.learnings.slice(0, 2).map((l) => ({ title: l.title, category: l.category }));

  return {
    fecha: today,
    xp_total: state.xp,
    racha_productividad: state.productivity.streak,
    energia_hoy: todayEnergy
      ? { fisica: todayEnergy.physical, mental: todayEnergy.mental, emocional: todayEnergy.emotional, sueno: todayEnergy.sleep, dolor: todayEnergy.pain }
      : null,
    habitos: {
      completados_hoy: completedHabitsToday.map((h) => h.name),
      pendientes_hoy: pendingHabits.map((h) => ({ nombre: h.name, racha: h.streak })),
      total: state.habits.length,
    },
    tareas: {
      vencidas: tasksOverdue.slice(0, 5).map((t) => ({ titulo: t.title, prioridad: t.priority })),
      hoy: tasksDueToday.slice(0, 5).map((t) => ({ titulo: t.title, prioridad: t.priority })),
      completadas_hoy: tasksCompletedToday.length,
    },
    aprendizajes_recientes: recentLearnings,
    notas_totales: state.notes.length,
  };
}

export async function generateDailySummary(state: AppState, today: string): Promise<string> {
  const snapshot = buildDailySnapshot(state, today);
  const { data, error } = await supabase.functions.invoke("ai-daily-summary", {
    body: { snapshot },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { summary: string }).summary;
}

export async function generateLearningSummary(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-summarize-learning", {
    body: { text },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { summary: string }).summary;
}

export async function decomposeTask(title: string, description?: string, context?: string): Promise<{ subtasks: string[]; reasoning?: string }> {
  const { data, error } = await supabase.functions.invoke("ai-decompose-task", {
    body: { title, description, context },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as { subtasks: string[]; reasoning?: string };
}

export type WeeklyReview = {
  headline: string;
  closed: string[];
  dragging: { title: string; reason?: string; suggestion: string }[];
  drop: { title: string; reason: string }[];
  next_week_focus: string[];
};

export function buildWeeklySnapshot(state: AppState, weekStart: string, weekEnd: string) {
  const inRange = (iso?: string | null) => !!iso && iso.slice(0, 10) >= weekStart && iso.slice(0, 10) <= weekEnd;
  const closedThisWeek = state.tasks.filter((t) => t.status === "completed" && inRange(t.completedAt));
  const openTasks = state.tasks.filter((t) => t.status !== "completed");
  const draggingOpen = openTasks.filter((t) => {
    const created = (t as { createdAt?: string }).createdAt;
    return t.due && t.due.slice(0, 10) < weekStart || (created && created.slice(0, 10) < weekStart);
  });
  const veryOld = openTasks.filter((t) => {
    const created = (t as { createdAt?: string }).createdAt;
    if (!created) return false;
    const days = Math.floor((Date.parse(weekEnd) - Date.parse(created)) / 86400000);
    return days > 21;
  });
  const listName = (id?: string) => state.taskLists.find((l) => l.id === id)?.name ?? "—";
  const slim = (t: typeof state.tasks[number]) => ({
    titulo: t.title,
    prioridad: t.priority,
    lista: listName(t.listId),
    due: t.due?.slice(0, 10) ?? null,
    creada: (t as { createdAt?: string }).createdAt?.slice(0, 10) ?? null,
  });
  return {
    rango: { desde: weekStart, hasta: weekEnd },
    cerradas_semana: closedThisWeek.slice(0, 30).map(slim),
    arrastrando: draggingOpen.slice(0, 30).map(slim),
    muy_antiguas_abiertas: veryOld.slice(0, 20).map(slim),
    totales: {
      cerradas: closedThisWeek.length,
      abiertas: openTasks.length,
      arrastrando: draggingOpen.length,
    },
  };
}

export async function generateWeeklyReview(state: AppState, weekStart: string, weekEnd: string): Promise<WeeklyReview> {
  const snapshot = buildWeeklySnapshot(state, weekStart, weekEnd);
  const { data, error } = await supabase.functions.invoke("ai-weekly-review", {
    body: { snapshot },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as WeeklyReview;
}

