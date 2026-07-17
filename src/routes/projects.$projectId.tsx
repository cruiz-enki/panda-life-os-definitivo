/**
 * **Ruta** — Dashboard de un proyecto específico.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ProjectDashboardPage } from "@/features/projects/dashboard";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Proyecto · Panda's LIFE OS" },
      { name: "description", content: "Dashboard del proyecto: tareas, hitos, recursos y bitácora." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <ProjectDashboardPage projectId={projectId} />;
}
