/**
 * **Ruta** — Hogar de ENKI LIFE OS: áreas, tareas y completaciones.
 */
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/parts";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Hogar · ENKI LIFE OS" },
      { name: "description", content: "Tareas del hogar integradas a tu sistema de gamificación: rutinas, semanales y bloques con XP, rachas y bonuses." },
    ],
  }),
  component: HomePage,
});
