/**
 * Dispara una **reacción visual de Pandus Maximus** en el mundo real.
 *
 * Escuchado por `TitoMascot` (evento `tito:react`) que reproduce:
 * - una mini-animación específica por tipo (saludo militar, salpicón, flexión…)
 * - una ráfaga de emojis alrededor de Pandus Maximus
 * - opcionalmente, un bocadillo corto
 */
export type TitoReactionType =
  | "med"
  | "water"
  | "exercise"
  | "mood"
  | "sleep"
  | "task"
  | "expense"
  | "meal"
  | "habit";

export type TitoReactionOptions = {
  /** Texto corto que Pandus Maximus dirá (opcional). */
  text?: string;
  /** Override de emojis para la ráfaga (opcional). */
  emojis?: string[];
};

export function titoReact(type: TitoReactionType, opts: TitoReactionOptions = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tito:react", { detail: { type, ...opts } }),
  );
}
