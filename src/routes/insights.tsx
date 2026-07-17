/**
 * **Ruta** — Insights y analítica del estado de la app.
 */
import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/features/insights/parts";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · Panda's LIFE OS" },
      { name: "description", content: "Estadísticas de productividad, energía y correlaciones para optimizar tu sistema." },
    ],
  }),
  component: InsightsPage,
});
