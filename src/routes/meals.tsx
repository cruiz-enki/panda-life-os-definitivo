/**
 * **Ruta** — Comidas (config crítica; componente en `meals.lazy.tsx`).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/meals")({
  head: () => ({
    meta: [
      { title: "Comida · Pandus Maximus" },
      { name: "description", content: "Meal prep, menú semanal, lista de compras y planificación de alimentación." },
    ],
  }),
});
