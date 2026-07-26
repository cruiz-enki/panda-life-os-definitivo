/**
 * **Ruta** — Introspección: landing con categorías.
 */
import { createFileRoute } from "@tanstack/react-router";
import { IntrospectionLanding } from "@/features/introspection/parts";

export const Route = createFileRoute("/introspection/")({
  head: () => ({
    meta: [
      { title: "Introspección · Pandus Maximus" },
      { name: "description", content: "Ejercicios guiados de autoconocimiento, bienestar emocional y reflexión personal." },
    ],
  }),
  component: IntrospectionLanding,
});
