/**
 * **Hook** — Modos de vida. Un preset que filtra la navegación,
 * el FAB y el dashboard a un contexto (health, home, money, mind,
 * productivity) o muestra todo en `normal`.
 *
 * Persistencia: `localStorage`. Se emite un evento custom para
 * sincronizar múltiples instancias.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  Home as HomeIcon,
  Wallet,
  Brain,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

export type LifeMode = "normal" | "health" | "home" | "money" | "mind" | "productivity";

export type CategoryKey = "HEALTH" | "HOME" | "MONEY" | "INSIGHTS" | "MIND" | "PRODUCTIVITY" | "SETUP";

export interface LifeModeConfig {
  id: LifeMode;
  label: string;
  emoji: string;
  description: string;
  icon: typeof Heart;
  /** Categorías que aparecen en la nav (barra lateral + móvil). */
  categories: CategoryKey[];
  /**
   * Allowlist de rutas visibles/permitidas dentro de las categorías + top items.
   * `null` = permite todo (modo normal).
   * Se compara por `pathname` exacto — los prefijos comunes se listan explícitamente.
   */
  paths: Set<string> | null;
  /** Etiquetas del FAB permitidas. `null` = todo. */
  fabLabels: Set<string> | null;
  /** Tarjetas rápidas del dashboard cuando se está en este modo. */
  dashTiles: { to: string; label: string; emoji: string; hint?: string }[];
}

const commonTop = ["/", "/log", "/calendar", "/tasks", "/chat"];

export const LIFE_MODES: Record<LifeMode, LifeModeConfig> = {
  normal: {
    id: "normal",
    label: "Normal",
    emoji: "🌐",
    description: "Todos los módulos disponibles",
    icon: LayoutGrid,
    categories: ["HEALTH", "HOME", "MONEY", "INSIGHTS", "MIND", "PRODUCTIVITY", "SETUP"],
    paths: null,
    fabLabels: null,
    dashTiles: [],
  },
  health: {
    id: "health",
    label: "Health",
    emoji: "❤️",
    description: "Sueño, comida, ejercicio, mood",
    icon: Heart,
    categories: ["HEALTH"],
    paths: new Set([
      ...commonTop,
      "/health",
      "/meals",
      "/exercise",
      "/energy",
      "/sleep",
      "/mood",
      "/labs",
      "/psychology",
    ]),
    fabLabels: new Set(["Registrar", "Calendario", "Tareas", "Notas", "Coach IA"]),
    dashTiles: [
      { to: "/sleep", label: "Sueño", emoji: "🌙" },
      { to: "/mood", label: "Mood", emoji: "🙂" },
      { to: "/energy", label: "Energía", emoji: "🔋" },
      { to: "/meals", label: "Comida", emoji: "🍽️" },
      { to: "/exercise", label: "Ejercicio", emoji: "🏋️" },
      { to: "/health", label: "Salud", emoji: "❤️" },
    ],
  },
  home: {
    id: "home",
    label: "Home",
    emoji: "🏠",
    description: "Casa, servicios, mantenimiento",
    icon: HomeIcon,
    categories: ["HOME"],
    paths: new Set([
      ...commonTop,
      "/home",
      "/services",
      "/maintenance",
      "/vehicles",
      "/inventory",
      "/family",
      "/contacts",
    ]),
    fabLabels: new Set(["Registrar", "Calendario", "Tareas", "Notas"]),
    dashTiles: [
      { to: "/home", label: "Limpieza", emoji: "🧹" },
      { to: "/maintenance", label: "Mantenimiento", emoji: "🛠️" },
      { to: "/services", label: "Servicios", emoji: "🧾" },
      { to: "/vehicles", label: "Vehículos", emoji: "🚗" },
      { to: "/inventory", label: "Inventario", emoji: "📦" },
      { to: "/family", label: "Hocicos", emoji: "🐾" },
    ],
  },
  money: {
    id: "money",
    label: "Money",
    emoji: "💰",
    description: "Finanzas, patrimonio, deudas",
    icon: Wallet,
    categories: ["MONEY"],
    paths: new Set([
      ...commonTop,
      "/net-worth",
      "/cashflow",
      "/debts",
      "/savings",
      "/money-tools",
      "/bank-import",
      "/finance-insights",
      "/afford",
      "/month-close",
      "/finance",
      "/subscriptions",
      "/money-setup",
    ]),
    fabLabels: new Set(["Registrar", "Gasto", "Calendario", "Notas"]),
    dashTiles: [
      { to: "/log", label: "Registrar gasto", emoji: "💸", hint: "?tab=expense" },
      { to: "/net-worth", label: "Patrimonio", emoji: "📊" },
      { to: "/cashflow", label: "Cashflow", emoji: "🔁" },
      { to: "/debts", label: "Deudas", emoji: "⚖️" },
      { to: "/savings", label: "Ahorro", emoji: "🎯" },
      { to: "/subscriptions", label: "Suscripciones", emoji: "🔄" },
      { to: "/finance-insights", label: "Insights IA", emoji: "✨" },
      { to: "/finance", label: "Tarjetas", emoji: "💳" },
    ],
  },
  mind: {
    id: "mind",
    label: "Mind",
    emoji: "🧠",
    description: "Identidad, futuro, introspección",
    icon: Brain,
    categories: ["MIND", "INSIGHTS"],
    paths: new Set([
      ...commonTop,
      "/identity",
      "/future",
      "/goals",
      "/decisions",
      "/introspection",
      "/notes",
      "/scheduled",
      "/insights",
      "/rewards",
      "/skill-tree",
      "/content",
      "/learnings-history",
      "/wishlist",
    ]),
    fabLabels: new Set(["Registrar", "Notas", "Coach IA", "Calendario"]),
    dashTiles: [
      { to: "/identity", label: "Identidad", emoji: "🎯" },
      { to: "/future", label: "Futuro", emoji: "✨" },
      { to: "/goals", label: "Metas", emoji: "🧭" },
      { to: "/introspection", label: "Introspección", emoji: "👁️" },
      { to: "/decisions", label: "Decisiones", emoji: "⚖️" },
      { to: "/notes", label: "Notas", emoji: "📝" },
      { to: "/scheduled", label: "Al futuro", emoji: "📮" },
      { to: "/insights", label: "Insights", emoji: "📈" },
    ],
  },
  productivity: {
    id: "productivity",
    label: "Productivity",
    emoji: "⚡",
    description: "Tareas, hábitos, tiempo, proyectos",
    icon: Sparkles,
    categories: ["PRODUCTIVITY"],
    paths: new Set([
      ...commonTop,
      "/pomodoro",
      "/habits",
      "/time",
      "/locations",
      "/projects",
      "/notes",
      "/scheduled",
    ]),
    fabLabels: new Set(["Registrar", "Calendario", "Tareas", "Notas", "Hábitos"]),
    dashTiles: [
      { to: "/tasks", label: "Tareas", emoji: "✅" },
      { to: "/habits", label: "Hábitos", emoji: "🔁" },
      { to: "/pomodoro", label: "Pomodoro", emoji: "🍅" },
      { to: "/time", label: "Tiempo", emoji: "⏱️" },
      { to: "/projects", label: "Proyectos", emoji: "🗂️" },
      { to: "/notes", label: "Notas", emoji: "📝" },
      { to: "/calendar", label: "Calendario", emoji: "📅" },
      { to: "/scheduled", label: "Al futuro", emoji: "📮" },
    ],
  },
};

export const LIFE_MODE_ORDER: LifeMode[] = [
  "normal",
  "health",
  "home",
  "money",
  "mind",
  "productivity",
];

const STORAGE_KEY = "enki:life-mode";
const EVENT = "enki:life-mode:changed";

function readMode(): LifeMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY) as LifeMode | null;
  if (v && LIFE_MODES[v]) return v;
  return null;
}

export function useLifeMode() {
  const [mode, setModeState] = useState<LifeMode>(() => readMode() ?? "normal");
  const [hasChosen, setHasChosen] = useState<boolean>(() => readMode() !== null);

  useEffect(() => {
    const sync = () => {
      const v = readMode();
      setModeState(v ?? "normal");
      setHasChosen(v !== null);
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((m: LifeMode) => {
    window.localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
    setHasChosen(true);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  const config = LIFE_MODES[mode];

  const isPathAllowed = useCallback(
    (path: string): boolean => {
      if (!config.paths) return true;
      return config.paths.has(path);
    },
    [config],
  );

  const isCategoryVisible = useCallback(
    (cat: CategoryKey): boolean => config.categories.includes(cat),
    [config],
  );

  const isFabLabelAllowed = useCallback(
    (label: string): boolean => {
      if (!config.fabLabels) return true;
      return config.fabLabels.has(label);
    },
    [config],
  );

  return {
    mode,
    hasChosen,
    setMode,
    config,
    isPathAllowed,
    isCategoryVisible,
    isFabLabelAllowed,
  };
}
