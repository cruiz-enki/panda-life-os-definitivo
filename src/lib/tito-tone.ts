/**
 * **Tito's legionary tone** — helpers para firmar recordatorios (push/telegram)
 * con el estilo de Tito, el panda-legionario.
 *
 * `level`:
 *   - 1 → primer aviso, tono firme pero amable.
 *   - 2 → segundo aviso, más directo.
 *   - 3+ → insistente, sin excusas.
 */
export type TitoToneLevel = 1 | 2 | 3;

export type TitoReminderKind = "med" | "task" | "habit" | "generic";

const OPENERS: Record<TitoToneLevel, string[]> = {
  1: ["Soldado", "Legionario", "Camarada"],
  2: ["Soldado", "Escúchame bien", "Atento, legionario"],
  3: ["¡SOLDADO!", "¡ALTO!", "¡Firmes, legionario!"],
};

const CLOSERS: Record<TitoToneLevel, string[]> = {
  1: ["🛡️", "⚔️", "🐼🛡️"],
  2: ["No me hagas repetirlo. 🛡️", "El deber llama. ⚔️", "Muévete. 🐼"],
  3: [
    "Tercer aviso. Ninguna legión se rinde por pereza. 🛡️⚔️",
    "Van tres. Tito no te suelta hasta que caiga esta misión. 🐼🔥",
    "Ya ignoraste dos. Esta es la buena. ¡Ahora! ⚔️",
  ],
};

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

function verbFor(kind: TitoReminderKind, level: TitoToneLevel): string {
  if (kind === "med") return level >= 3 ? "es hora — sin excusas — de tu" : "es hora de tu";
  if (kind === "task") return level >= 3 ? "esta tarea NO puede esperar más:" : "misión pendiente:";
  if (kind === "habit") return level >= 3 ? "el hábito sigue esperando:" : "toca tu hábito:";
  return level >= 3 ? "vuelve a la formación:" : "aviso:";
}

/**
 * Devuelve `{ title, body }` firmados por Tito.
 * `seed` estabiliza la selección aleatoria (usa el id de la tarea/med).
 */
export function titoReminderMessage(params: {
  kind: TitoReminderKind;
  subject: string;      // "telmisartán", "Pagar renta", etc.
  detail?: string;      // "Vence en 15 min · 14:30"
  level: TitoToneLevel;
  seed?: string;
}): { title: string; body: string } {
  const { kind, subject, detail, level, seed = subject } = params;
  const opener = pick(OPENERS[level], seed);
  const closer = pick(CLOSERS[level], seed + level);
  const verb = verbFor(kind, level);
  const emoji = kind === "med" ? "💊" : kind === "task" ? "🎯" : kind === "habit" ? "🔁" : "🛡️";

  const title = level >= 3
    ? `🐼⚔️ ${opener}: ${subject}`
    : `🐼 ${opener}, ${verb} ${subject}`;

  const body = [
    `${emoji} ${opener}, ${verb} *${subject}*.`,
    detail ?? "",
    "",
    `— Tito ${closer}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { title, body };
}

/** Convierte el número de recordatorios ya enviados en un nivel de tono. */
export function toneLevelFromSentCount(sentCount: number): TitoToneLevel {
  if (sentCount >= 2) return 3;   // el que estamos por mandar es el 3º o más
  if (sentCount === 1) return 2;  // segundo
  return 1;                       // primero
}
