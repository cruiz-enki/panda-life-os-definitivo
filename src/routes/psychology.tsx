/**
 * **Ruta** — Psicología: sesiones, checkins, tareas terapéuticas.
 */
import { createFileRoute } from "@tanstack/react-router";
import { PsychologyPage } from "@/features/psychology/parts";

export const Route = createFileRoute("/psychology")({
  head: () => ({
    meta: [
      { title: "Psicología — ENKI LIFE OS" },
      { name: "description", content: "Registro de sesiones, seguimiento diario y conversión de insights en acciones." },
    ],
  }),
  component: PsychologyPage,
});
