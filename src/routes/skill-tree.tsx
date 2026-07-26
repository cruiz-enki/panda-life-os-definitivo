/**
 * **Ruta** — Árbol de habilidades por categorías y subcategorías.
 */
import { createFileRoute } from "@tanstack/react-router";
import { SkillTreePage } from "@/features/skill-tree/parts";

export const Route = createFileRoute("/skill-tree")({
  head: () => ({
    meta: [
      { title: "Skill Tree · Pandus Maximus" },
      { name: "description", content: "Tu mapa de habilidades y maestría personal." },
    ],
  }),
  component: SkillTreePage,
});
