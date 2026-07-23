/**
 * **Sprites de Tito** — mapa priorizado de imágenes contextuales.
 *
 * Cada "sprite key" apunta a un `.asset.json` (CDN). Si una key no está
 * registrada aún, `pickSpriteUrl` cae al sprite `default`. Así puedes ir
 * subiendo imágenes una por una y el sistema las adopta sin cambios extra.
 *
 * Para agregar una imagen nueva:
 *   1. `lovable-assets create --file /tmp/tito-<key>.png > src/assets/tito-<key>.png.asset.json`
 *   2. Importa el JSON aquí y regístralo en `SPRITES[<key>]`.
 */
import titoDefault from "@/assets/tito.png.asset.json";
import type { TitoReactionType } from "@/lib/tito-react";

export type TitoSpriteKey =
  // base moods
  | "default"
  | "happy"
  | "sad"
  | "hungry"
  | "tired"
  | "sleep"
  | "think"
  | "cheer"
  // reactions
  | "salute"    // meds
  | "splash"    // water
  | "workout"   // exercise
  | "heart"     // mood
  | "eat"       // meal
  | "coin"      // expense
  | "task"      // task complete
  | "habit"     // habit
  // postures / time of day
  | "coffee"    // 6-10am
  | "sun"       // 10am-1pm
  | "scroll"    // focus/afternoon
  | "moon"      // night
  // skins (opcional: si subes variantes con atuendo integrado)
  | "gladiator"
  | "senador"
  | "cesar"
  | "general-invierno";

type SpriteAsset = { url: string };

/**
 * Registro de assets. Solo `default` viene cargado — el resto se irá
 * llenando conforme subas las imágenes.
 */
const SPRITES: Partial<Record<TitoSpriteKey, SpriteAsset>> = {
  default: titoDefault,
  // Ejemplo (descomentar cuando subas el asset):
  // salute: (await import("@/assets/tito-salute.png.asset.json")).default,
};

export type SpriteContext = {
  reaction?: TitoReactionType | null;
  mood?: string | null;
  hour: number;
  skinId?: string | null;
};

/**
 * Devuelve la key ideal según contexto (sin considerar si está registrada).
 */
export function pickSpriteKey(ctx: SpriteContext): TitoSpriteKey {
  // 1. Reacción activa manda (efímera, alta prioridad)
  if (ctx.reaction) {
    switch (ctx.reaction) {
      case "med":      return "salute";
      case "water":    return "splash";
      case "exercise": return "workout";
      case "mood":     return "heart";
      case "sleep":    return "moon";
      case "task":     return "task";
      case "expense":  return "coin";
      case "meal":     return "eat";
      case "habit":    return "habit";
    }
  }

  // 2. Mood ambiental (Tamagotchi)
  if (ctx.mood === "sad")     return "sad";
  if (ctx.mood === "hungry")  return "hungry";
  if (ctx.mood === "tired")   return "tired";
  if (ctx.mood === "sleep")   return "sleep";
  if (ctx.mood === "cheer")   return "cheer";
  if (ctx.mood === "happy")   return "happy";
  if (ctx.mood === "think")   return "think";

  // 3. Postura por hora del día
  const h = ctx.hour;
  if (h >= 23 || h < 6) return "moon";
  if (h >= 6 && h < 10) return "coffee";
  if (h >= 10 && h < 13) return "sun";
  if (h >= 13 && h < 17) return "scroll";

  return "default";
}

/**
 * Resuelve la URL del sprite: si la key no está registrada, cae a `default`.
 */
export function pickSpriteUrl(ctx: SpriteContext): string {
  const key = pickSpriteKey(ctx);
  return (SPRITES[key] ?? SPRITES.default!)!.url;
}

/** Lista de keys que ya tienen asset cargado (para debug/vestidor). */
export function loadedSpriteKeys(): TitoSpriteKey[] {
  return Object.keys(SPRITES) as TitoSpriteKey[];
}
