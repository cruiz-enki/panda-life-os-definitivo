/**
 * **Ruta** — Laboratorios (config crítica; componente en `labs.lazy.tsx`).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/labs")({
  head: () => ({
    meta: [
      { title: "Laboratorios · ENKI LIFE OS" },
      { name: "description", content: "Módulo de seguimiento de resultados de laboratorio." },
    ],
  }),
});
