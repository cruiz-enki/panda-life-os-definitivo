/**
 * **Ruta** — Notas, ideas, proyectos.
 */
import { createFileRoute } from "@tanstack/react-router";
import { NotesPage } from "@/features/notes/parts";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notas · Panda's LIFE OS" },
      { name: "description", content: "Tu second brain: captura ideas, organiza aprendizajes y conviértelos en acción." },
    ],
  }),
  component: NotesPage,
});
