/**
 * **Ruta** — Salud: composición corporal, comidas, medicación.
 */
import { createFileRoute } from "@tanstack/react-router";
import { HealthPage } from "@/features/health/parts";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Salud · ENKI LIFE OS" },
      { name: "description", content: "Composición corporal, alimentación y medicación. Monitorea tu bienestar físico." },
    ],
  }),
  component: HealthPage,
});
