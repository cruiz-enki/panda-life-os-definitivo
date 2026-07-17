/**
 * **Ruta** — Rutinas y entrenamientos de ejercicio (config crítica;
 * el componente vive en `exercise.lazy.tsx` para code-splitting).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/exercise")({
  head: () => ({
    meta: [
      { title: "Ejercicio · Panda's LIFE OS" },
      { name: "description", content: "Rutinas de fuerza guiadas en casa con video, seguimiento y XP." },
    ],
  }),
});
