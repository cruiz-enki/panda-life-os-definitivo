/**
 * **Ruta** — Sistema de premios canjeables con XP y Monedas Panda.
 */
import { createFileRoute } from "@tanstack/react-router";
import { RewardsPage } from "@/features/rewards/parts";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Misiones · Panda's LIFE OS" },
      { name: "description", content: "Tu avatar evolutivo, misiones fijas y temporales, y tienda de premios personalizada." },
    ],
  }),
  component: RewardsPage,
});
