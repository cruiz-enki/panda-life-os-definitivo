/**
 * **Ruta layout** — Proyectos y dashboard interno de cada proyecto.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
