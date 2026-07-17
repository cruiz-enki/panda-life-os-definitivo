/**
 * **Ruta** — Asistente de decisiones (Cynefin, criterios, pros/contras).
 */
import { createFileRoute } from "@tanstack/react-router";
import { DecisionsPage } from "@/features/decisions/parts";

export const Route = createFileRoute("/decisions")({
  head: () => ({
    meta: [
      { title: "Tomar Decisiones · Panda's LIFE OS" },
      { name: "description", content: "Herramienta para ayudarte a tomar decisiones usando aleatoriedad, IA o análisis de pros y contras." },
    ],
  }),
  component: DecisionsPage,
});
