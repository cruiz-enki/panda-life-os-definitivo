/**
 * **Skins de Pandus Maximus** — atuendos desbloqueables por nivel + posturas por hora/evento.
 *
 * Cada skin agrega accesorios en overlay (emoji-based) sobre el sprite base
 * de Pandus Maximus. La postura activa se resuelve dinámicamente a partir de la hora
 * del día y (opcionalmente) el tipo de reacción en curso.
 */
import type { TitoReactionType } from "@/lib/tito-react";

const LS_SKIN = "tito:skin";

export type TitoSkinAccessory = {
  emoji: string;
  /** Posición en % relativa al bounding box del sprite. */
  top: string;
  left: string;
  size?: string;      // tailwind text-* clase o valor CSS
  rotate?: number;    // grados
  filter?: string;    // ej. drop-shadow
  z?: number;
};

export type TitoSkin = {
  id: string;
  label: string;
  description: string;
  minLevel: number;   // nivel requerido
  bg?: string;        // tailwind gradient para el chip
  aura?: string;      // color CSS para halo alrededor de Pandus Maximus
  accessories: TitoSkinAccessory[];
};

/**
 * Catálogo de skins. `recluta` siempre disponible.
 */
export const TITO_SKINS: TitoSkin[] = [
  {
    id: "recluta",
    label: "Recluta",
    description: "Uniforme básico. Todos empezamos aquí.",
    minLevel: 1,
    bg: "from-stone-400 to-stone-600",
    accessories: [],
  },
  {
    id: "legionario",
    label: "Legionario",
    description: "Casco de bronce y escudo. La disciplina se nota.",
    minLevel: 5,
    bg: "from-emerald-500 to-emerald-700",
    aura: "rgba(16, 185, 129, .35)",
    accessories: [
      { emoji: "⛑️", top: "-8%", left: "42%", size: "text-2xl", rotate: -6, z: 3 },
      { emoji: "🛡️", top: "48%", left: "-12%", size: "text-xl", rotate: -10, z: 3 },
    ],
  },
  {
    id: "gladiador",
    label: "Gladiador",
    description: "Red y tridente. Nadie te vence en la arena.",
    minLevel: 15,
    bg: "from-amber-500 to-red-700",
    aura: "rgba(239, 68, 68, .35)",
    accessories: [
      { emoji: "🔱", top: "10%", left: "78%", size: "text-2xl", rotate: 12, z: 3 },
      { emoji: "🩸", top: "35%", left: "8%", size: "text-sm", rotate: 0, z: 2 },
      { emoji: "🥉", top: "-6%", left: "38%", size: "text-lg", z: 3 },
    ],
  },
  {
    id: "senador",
    label: "Senador",
    description: "Corona de laurel y toga. Poder y palabra.",
    minLevel: 30,
    bg: "from-yellow-400 to-amber-600",
    aura: "rgba(250, 204, 21, .4)",
    accessories: [
      { emoji: "🌿", top: "-12%", left: "22%", size: "text-2xl", rotate: -18, z: 3 },
      { emoji: "🌿", top: "-12%", left: "58%", size: "text-2xl", rotate: 18, z: 3 },
      { emoji: "📜", top: "55%", left: "-8%", size: "text-lg", rotate: -8, z: 3 },
    ],
  },
  {
    id: "general-invierno",
    label: "General de Invierno",
    description: "Capa de piel y espada helada. Frío por fuera, fuego por dentro.",
    minLevel: 45,
    bg: "from-sky-400 to-indigo-700",
    aura: "rgba(96, 165, 250, .45)",
    accessories: [
      { emoji: "❄️", top: "-4%", left: "72%", size: "text-sm", z: 2 },
      { emoji: "🎖️", top: "48%", left: "18%", size: "text-lg", z: 3 },
      { emoji: "⚔️", top: "38%", left: "82%", size: "text-2xl", rotate: 45, z: 3, filter: "drop-shadow(0 0 4px rgba(147,197,253,.9))" },
      { emoji: "🧣", top: "62%", left: "40%", size: "text-2xl", z: 3 },
    ],
  },
  {
    id: "cesar",
    label: "César",
    description: "Corona de oro. Emperador del hábito.",
    minLevel: 60,
    bg: "from-yellow-300 via-amber-400 to-orange-600",
    aura: "rgba(251, 191, 36, .55)",
    accessories: [
      { emoji: "👑", top: "-14%", left: "40%", size: "text-3xl", z: 4, filter: "drop-shadow(0 0 6px rgba(251,191,36,.9))" },
      { emoji: "🏛️", top: "60%", left: "-10%", size: "text-lg", rotate: -6, z: 2 },
      { emoji: "⚜️", top: "50%", left: "85%", size: "text-xl", z: 3 },
    ],
  },
];

/**
 * Posturas contextuales: se superponen a la skin activa según hora/evento.
 * Las posturas NO se desbloquean, viven de la hora o de una reacción activa.
 */
export type TitoPostureId =
  | "morning-coffee"
  | "midday-sun"
  | "workout-sword"
  | "night-sleep"
  | "focus-scroll"
  | "neutral";

export type TitoPosture = {
  id: TitoPostureId;
  label: string;
  extras: TitoSkinAccessory[];
};

const POSTURES: Record<TitoPostureId, TitoPosture> = {
  "morning-coffee": {
    id: "morning-coffee",
    label: "Café de la mañana",
    extras: [
      { emoji: "☕", top: "58%", left: "80%", size: "text-2xl", rotate: -8, z: 4 },
      { emoji: "♨️", top: "45%", left: "88%", size: "text-xs", z: 4 },
    ],
  },
  "midday-sun": {
    id: "midday-sun",
    label: "Enfoque de mediodía",
    extras: [{ emoji: "☀️", top: "-14%", left: "78%", size: "text-lg", z: 4 }],
  },
  "workout-sword": {
    id: "workout-sword",
    label: "Entrenando",
    extras: [
      { emoji: "🗡️", top: "40%", left: "82%", size: "text-2xl", rotate: 25, z: 4 },
      { emoji: "💥", top: "12%", left: "90%", size: "text-xs", z: 4 },
    ],
  },
  "night-sleep": {
    id: "night-sleep",
    label: "A dormir",
    extras: [
      { emoji: "🌙", top: "-8%", left: "78%", size: "text-lg", z: 4 },
      { emoji: "💤", top: "8%", left: "12%", size: "text-lg", rotate: -10, z: 4 },
    ],
  },
  "focus-scroll": {
    id: "focus-scroll",
    label: "Estratega",
    extras: [{ emoji: "📜", top: "55%", left: "-8%", size: "text-lg", rotate: -8, z: 4 }],
  },
  neutral: { id: "neutral", label: "Neutral", extras: [] },
};

/**
 * Resuelve la postura activa a partir de hora y (opcional) reacción actual.
 */
export function currentPosture(hour: number, reaction?: TitoReactionType | null): TitoPosture {
  // Prioridad: reacción activa gana sobre la hora.
  if (reaction === "exercise") return POSTURES["workout-sword"];
  if (reaction === "sleep") return POSTURES["night-sleep"];
  if (reaction === "task" || reaction === "expense") return POSTURES["focus-scroll"];

  if (hour >= 23 || hour < 6) return POSTURES["night-sleep"];
  if (hour >= 6 && hour < 10) return POSTURES["morning-coffee"];
  if (hour >= 10 && hour < 13) return POSTURES["midday-sun"];
  if (hour >= 13 && hour < 16) return POSTURES["focus-scroll"];
  return POSTURES.neutral;
}

/** Skin persistida en localStorage; cae a la primera desbloqueada disponible. */
export function readStoredSkinId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_SKIN);
}

export function storeSkinId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_SKIN, id);
  window.dispatchEvent(new CustomEvent("tito:skin-change", { detail: { id } }));
}

/**
 * Resuelve la skin activa según nivel y preferencia guardada.
 * Si el usuario eligió una que aún no desbloquea, cae a la mejor disponible.
 */
export function resolveActiveSkin(level: number, preferredId?: string | null): TitoSkin {
  const unlocked = TITO_SKINS.filter((s) => level >= s.minLevel);
  if (preferredId) {
    const chosen = unlocked.find((s) => s.id === preferredId);
    if (chosen) return chosen;
  }
  return unlocked[unlocked.length - 1] ?? TITO_SKINS[0];
}
