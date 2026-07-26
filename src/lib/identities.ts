/**
 * **Identidades (Fase 3 — Notifications Engine)**
 * Catálogo base de identidades y mapeos módulo → identidad.
 */
export type IdentityKey =
  | "ceo"
  | "builder"
  | "learner"
  | "health_warrior"
  | "home_guardian"
  | "future_self"
  | "money_guardian";

export type IdentityDef = {
  key: IdentityKey;
  name: string;
  emoji: string;
  description: string;
  /** Copy de notificación push (Body) */
  body: string;
  /** Heading sugerido */
  title: string;
  /** Deep link sugerido */
  link: string;
};

export const IDENTITY_DEFS: IdentityDef[] = [
  { key: "ceo", name: "CEO", emoji: "👑", description: "Operador de sistemas y dirección.",
    title: "👑 Mensaje del CEO", body: "Los sistemas crean libertad. Una acción pequeña hoy reduce caos mañana.", link: "/projects" },
  { key: "builder", name: "Builder", emoji: "🤖", description: "Construye Pandus Maximus una mejora a la vez.",
    title: "🤖 Builder", body: "Panda se construye una mejora a la vez. Avanza 10 minutos.", link: "/projects" },
  { key: "learner", name: "Aprendiz", emoji: "📚", description: "Mente entrenada todos los días.",
    title: "📚 Aprendiz", body: "Tu mente también necesita entrenamiento diario.", link: "/learnings" },
  { key: "health_warrior", name: "Guerrero de salud", emoji: "🏋️", description: "Operación Fénix viva.",
    title: "🏋️ Guerrero de salud", body: "Operación Fénix sigue viva. Una victoria mínima cuenta.", link: "/health" },
  { key: "home_guardian", name: "Guardián del hogar", emoji: "🏠", description: "Tu casa refleja tu energía.",
    title: "🏠 Guardián del hogar", body: "Tu casa también refleja tu energía. Recupera un pequeño espacio.", link: "/home" },
  { key: "future_self", name: "Yo futuro", emoji: "🔮", description: "Voz de tu versión futura.",
    title: "🔮 Yo futuro", body: "Soy tu versión futura. Gracias por no abandonar hoy.", link: "/goals" },
  { key: "money_guardian", name: "Guardián financiero", emoji: "💰", description: "Claridad con pequeños registros.",
    title: "💰 Guardián financiero", body: "La claridad financiera se construye con pequeños registros.", link: "/finance" },
];

export const MODULE_TO_IDENTITY: Record<string, IdentityKey> = {
  learning: "learner",
  money: "money_guardian",
  home: "home_guardian",
  health: "health_warrior",
  goals: "future_self",
  projects: "builder",
};

export const IDENTITY_BY_KEY: Record<IdentityKey, IdentityDef> = Object.fromEntries(
  IDENTITY_DEFS.map((d) => [d.key, d]),
) as Record<IdentityKey, IdentityDef>;
