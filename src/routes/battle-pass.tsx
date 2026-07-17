/**
 * **Ruta** — Pase de Batalla: temporadas, niveles, misiones y recompensas.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BattlePassPage } from "@/features/battle-pass/parts";

export const Route = createFileRoute("/battle-pass")({
  component: BattlePassPage,
});
