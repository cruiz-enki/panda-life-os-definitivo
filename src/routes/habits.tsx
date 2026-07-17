/**
 * **Ruta** — Hábitos diarios/semanales/mensuales.
 */
import { createFileRoute } from "@tanstack/react-router";
import { HabitsPage } from "@/features/habits/parts";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Hábitos · Panda's LIFE OS" },
      { name: "description", content: "Sistema de hábitos con rachas, puntos XP y check diario." },
    ],
  }),
  component: HabitsPage,
});
