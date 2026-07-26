/**
 * **Misiones diarias de Pandus Maximus** — 3 misiones deterministas por día basadas en
 * el estado real del usuario (hábitos, tareas, aprendizajes, daily wins).
 *
 * - Selección deterministica por hash de fecha+userId → mismas misiones todo el día.
 * - Progreso derivado del `AppState` en tiempo real.
 * - Persiste en localStorage qué misiones ya se "celebraron" y cuáles se cobraron XP.
 */
import type { AppState } from "./storage-types";
import { todayCDMX } from "./date-utils";

export type Mission = {
  id: string;
  emoji: string;
  title: string;
  hint?: string;
  xp: number;
  /** Devuelve progreso (0..1) y hecho */
  evaluate: (state: AppState) => { done: boolean; progress: number; label?: string };
};

const today = () => todayCDMX();

function habitDoneToday(state: AppState, match: (name: string, metric?: string | null) => boolean): boolean {
  const t = today();
  return state.habits.some(
    (h) => match(h.name.toLowerCase(), h.linkedMetric ?? null) && h.history?.includes(t)
  );
}

function habitProgress(state: AppState, match: (name: string, metric?: string | null) => boolean): { done: boolean; progress: number } {
  const t = today();
  const habit = state.habits.find((h) => match(h.name.toLowerCase(), h.linkedMetric ?? null));
  if (!habit) return { done: false, progress: 0 };
  const done = habit.history?.includes(t) ?? false;
  return { done, progress: done ? 1 : 0 };
}

function tasksCompletedToday(state: AppState): number {
  const t = today();
  return state.tasks.filter((task) => task.status === "completed" && task.completedAt?.slice(0, 10) === t).length;
}

function learningsToday(state: AppState): number {
  const t = today();
  return state.learnings.filter((l) => l.date === t).length;
}

function winsToday(state: AppState): number {
  const t = today();
  return (state.dailyWins ?? []).filter((w) => w.date === t).length;
}

/** Pool de misiones — Pandus Maximus rota entre estas cada día. */
export const MISSION_POOL: Mission[] = [
  {
    id: "water_2l",
    emoji: "💧",
    title: "Bebe 2 L de agua",
    hint: "Marca el hábito de agua o registra bebidas en /log.",
    xp: 30,
    evaluate: (s) =>
      ({ ...habitProgress(s, (n, m) => m === "water_ml" || /agua/.test(n)) }) as ReturnType<Mission["evaluate"]>,
  },
  {
    id: "exercise_30",
    emoji: "🏋️",
    title: "30 min de ejercicio",
    hint: "Cualquier movimiento cuenta: caminata, bici, ligas…",
    xp: 40,
    evaluate: (s) =>
      ({ ...habitProgress(s, (n, m) => m === "exercise_any" || /ejercicio|entren|gym|caminar|bici/.test(n)) }) as ReturnType<Mission["evaluate"]>,
  },
  {
    id: "meds_am",
    emoji: "💊",
    title: "Medicinas de la mañana",
    xp: 20,
    evaluate: (s) => habitProgress(s, (n, m) => m === "meds_am" || /medic.*(am|mañana)/.test(n)),
  },
  {
    id: "meds_pm",
    emoji: "🌙",
    title: "Medicinas de la noche",
    xp: 20,
    evaluate: (s) => habitProgress(s, (n, m) => m === "meds_pm" || /medic.*(pm|noche)/.test(n)),
  },
  {
    id: "sleep_7h",
    emoji: "😴",
    title: "Duerme 7 h+",
    hint: "Toca tu NFC de buró o marca el hábito de sueño.",
    xp: 35,
    evaluate: (s) => habitProgress(s, (n, m) => m === "sleep_hours" || /dorm|sueño/.test(n)),
  },
  {
    id: "meditate_10",
    emoji: "🧘",
    title: "Meditar 10 min",
    xp: 25,
    evaluate: (s) => habitProgress(s, (n) => /medit/.test(n)),
  },
  {
    id: "tasks_3",
    emoji: "✅",
    title: "Cierra 3 tareas",
    xp: 40,
    evaluate: (s) => {
      const n = tasksCompletedToday(s);
      return { done: n >= 3, progress: Math.min(1, n / 3), label: `${n}/3` };
    },
  },
  {
    id: "tasks_5",
    emoji: "🚀",
    title: "Cierra 5 tareas",
    xp: 60,
    evaluate: (s) => {
      const n = tasksCompletedToday(s);
      return { done: n >= 5, progress: Math.min(1, n / 5), label: `${n}/5` };
    },
  },
  {
    id: "learn_1",
    emoji: "🧠",
    title: "Registra 1 aprendizaje",
    xp: 25,
    evaluate: (s) => {
      const n = learningsToday(s);
      return { done: n >= 1, progress: Math.min(1, n / 1), label: n ? "✓" : "0/1" };
    },
  },
  {
    id: "win_1",
    emoji: "🏆",
    title: "Anota una victoria del día",
    hint: "Un logro chico también cuenta.",
    xp: 20,
    evaluate: (s) => {
      const n = winsToday(s);
      return { done: n >= 1, progress: Math.min(1, n / 1), label: n ? "✓" : "0/1" };
    },
  },
  {
    id: "habit_perfect",
    emoji: "🌟",
    title: "Día perfecto de hábitos",
    hint: "Completa todos tus hábitos diarios.",
    xp: 80,
    evaluate: (s) => {
      const dailies = s.habits.filter((h) => h.frequency === "daily");
      if (dailies.length === 0) return { done: false, progress: 0, label: "0/0" };
      const t = today();
      const done = dailies.filter((h) => h.history?.includes(t)).length;
      return { done: done === dailies.length, progress: done / dailies.length, label: `${done}/${dailies.length}` };
    },
  },
];

// ============ Selección determinista por fecha ============
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Escoge N misiones deterministas para (fecha, usuario). */
export function pickTodayMissions(userId: string, count = 3, date = today()): Mission[] {
  const seed = hashStr(`${date}:${userId}`);
  const pool = [...MISSION_POOL];
  const picked: Mission[] = [];
  let s = seed;
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % pool.length;
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

// ============ Persistencia (localStorage) ============
type MissionsRecord = {
  date: string;
  claimed: string[]; // ids ya recompensados con XP
};

const LS_KEY = (userId: string) => `tito:missions:${userId}`;

export function loadMissionsRecord(userId: string): MissionsRecord {
  if (typeof window === "undefined") return { date: today(), claimed: [] };
  try {
    const raw = window.localStorage.getItem(LS_KEY(userId));
    if (!raw) return { date: today(), claimed: [] };
    const parsed = JSON.parse(raw) as MissionsRecord;
    // Reset si cambió el día
    if (parsed.date !== today()) return { date: today(), claimed: [] };
    return parsed;
  } catch {
    return { date: today(), claimed: [] };
  }
}

export function saveMissionsRecord(userId: string, rec: MissionsRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY(userId), JSON.stringify(rec));
  } catch {
    /* noop */
  }
}
