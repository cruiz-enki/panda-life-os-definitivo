/**
 * **Ruta** — Tareas con listas, prioridades, recurrencia y subtareas.
 */
import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/tasks/parts";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tareas · Panda's LIFE OS" },
      { name: "description", content: "Gestión inteligente de tareas, listas, etiquetas y prioridades con recomendaciones diarias." },
    ],
  }),
  component: TasksPage,
});
