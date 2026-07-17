/**
 * **Ruta** — Introspección: pantalla de resultados de una sesión.
 */
import { createFileRoute } from "@tanstack/react-router";
import { IntrospectionResultPage } from "@/features/introspection/parts";

export const Route = createFileRoute("/introspection/result/$sessionId")({
  head: () => ({
    meta: [
      { title: "Resultado · Introspección" },
      { name: "description", content: "Tu radiografía personal con insights y recomendaciones." },
    ],
  }),
  component: ResultRoute,
});

function ResultRoute() {
  const { sessionId } = Route.useParams();
  return <IntrospectionResultPage sessionId={sessionId} />;
}
