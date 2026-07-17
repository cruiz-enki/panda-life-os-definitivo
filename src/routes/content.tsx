/**
 * **Ruta** — Bitácora de contenido consumido (libros, pelis, series…).
 */
import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/features/content/parts";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Bitácora · Panda's LIFE OS" },
      { name: "description", content: "Registra libros, películas, series, podcasts y más. Aprende de lo que consumes." },
    ],
  }),
  component: ContentPage,
});
