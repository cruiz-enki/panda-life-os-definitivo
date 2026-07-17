/**
 * **Ruta** — Finanzas personales: tarjetas, gastos, MSI, presupuestos.
 */
import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/features/finance/parts";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finanzas — ENKI Life OS" },
      { name: "description", content: "Control de tarjetas, gastos, MSI y presupuestos" },
    ],
  }),
  component: FinancePage,
});
