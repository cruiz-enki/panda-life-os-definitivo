/**
 * **Ruta** — Proyectos: registro y bitácora de proyectos personales / aprendiendum / enki.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/features/projects/parts";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Proyectos · Pandus Maximus" },
      { name: "description", content: "Lleva el registro de tus proyectos personales, aprendizajes y emprendimientos con bitácora de avances." },
    ],
  }),
  component: ProjectsPage,
});