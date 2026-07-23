/**
 * **Sprites de Tito** — mapa priorizado de imágenes contextuales.
 *
 * Cada key apunta a un `.asset.json` (CDN). Si una key no está registrada,
 * `pickSpriteUrl` cae al sprite `default`.
 *
 * Para agregar una imagen nueva:
 *   1. `lovable-assets create --file /tmp/tito-<key>.png --filename tito-<key>.png > src/assets/tito-<key>.png.asset.json`
 *   2. Importa el JSON aquí y regístralo en `SPRITES[<key>]`.
 */
import titoDefault from "@/assets/tito.png.asset.json";
import titoBase from "@/assets/tito-base.png.asset.json";
import titoSalute from "@/assets/tito-salute.png.asset.json";
import titoSplash from "@/assets/tito-splash.png.asset.json";
import titoWorkout from "@/assets/tito-workout.png.asset.json";
import titoRun from "@/assets/tito-run.png.asset.json";
import titoEat from "@/assets/tito-eat.png.asset.json";
import titoCook from "@/assets/tito-cook.png.asset.json";
import titoCoin from "@/assets/tito-coin.png.asset.json";
import titoTask from "@/assets/tito-task.png.asset.json";
import titoHabit from "@/assets/tito-habit.png.asset.json";
import titoCoffee from "@/assets/tito-coffee.png.asset.json";
import titoSun from "@/assets/tito-sun.png.asset.json";
import titoScroll from "@/assets/tito-scroll.png.asset.json";
import titoSleep from "@/assets/tito-sleep.png.asset.json";
import titoTired from "@/assets/tito-tired.png.asset.json";
import titoVeryTired from "@/assets/tito-very-tired.png.asset.json";
import titoHungry from "@/assets/tito-hungry.png.asset.json";
import titoCheer from "@/assets/tito-cheer.png.asset.json";
import titoThink from "@/assets/tito-think.png.asset.json";
import titoSenador from "@/assets/tito-senador.png.asset.json";
import titoCesar from "@/assets/tito-cesar.png.asset.json";
import type { TitoReactionType } from "@/lib/tito-react";

export type TitoSpriteKey =
  // base moods
  | "default"
  | "base"
  | "happy"
  | "sad"
  | "hungry"
  | "tired"
  | "very-tired"
  | "sleep"
  | "think"
  | "cheer"
  // reactions
  | "salute"
  | "splash"
  | "workout"
  | "run"
  | "heart"
  | "eat"
  | "cook"
  | "coin"
  | "task"
  | "habit"
  // postures / time of day
  | "coffee"
  | "sun"
  | "scroll"
  | "moon"
  // skins
  | "gladiator"
  | "senador"
  | "cesar"
  | "general-invierno";

type SpriteAsset = { url: string };

const SPRITES: Partial<Record<TitoSpriteKey, SpriteAsset>> = {
  default: titoDefault,
  base: titoBase,
  // reactions
  salute: titoSalute,
  splash: titoSplash,
  workout: titoWorkout,
  run: titoRun,
  eat: titoEat,
  cook: titoCook,
  coin: titoCoin,
  task: titoTask,
  habit: titoHabit,
  // moods
  hungry: titoHungry,
  tired: titoTired,
  "very-tired": titoVeryTired,
  sleep: titoSleep,
  cheer: titoCheer,
  happy: titoCheer,      // reutiliza cheer para happy
  think: titoThink,
  // time of day
  coffee: titoCoffee,
  sun: titoSun,
  scroll: titoScroll,
  moon: titoSleep,       // reutiliza sleep para noche
  // skins
  senador: titoSenador,
  cesar: titoCesar,
};

export type SpriteContext = {
  reaction?: TitoReactionType | null;
  mood?: string | null;
  hour: number;
  skinId?: string | null;
};

export function pickSpriteKey(ctx: SpriteContext): TitoSpriteKey {
  // 1. Reacción activa manda (efímera, alta prioridad)
  if (ctx.reaction) {
    switch (ctx.reaction) {
      case "med":      return "salute";
      case "water":    return "splash";
      case "exercise": return "workout";
      case "mood":     return "cheer";
      case "sleep":    return "moon";
      case "task":     return "task";
      case "expense":  return "coin";
      case "meal":     return "eat";
      case "habit":    return "habit";
    }
  }

  // 2. Mood ambiental (Tamagotchi)
  if (ctx.mood === "sad")     return "tired";
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
  if (h >= 17 && h < 20) return "base";

  return "default";
}

export function pickSpriteUrl(ctx: SpriteContext): string {
  const key = pickSpriteKey(ctx);
  return (SPRITES[key] ?? SPRITES.default!)!.url;
}

export function loadedSpriteKeys(): TitoSpriteKey[] {
  return Object.keys(SPRITES) as TitoSpriteKey[];
}
