/**
 * **Ruta** — Introspección: player de un ejercicio (intro + preguntas).
 */
import { createFileRoute } from "@tanstack/react-router";
import { IntrospectionExercisePage } from "@/features/introspection/parts";

export const Route = createFileRoute("/introspection/exercise/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Ejercicio · Introspección" },
      { name: "description", content: "Experiencia guiada de autoconocimiento." },
    ],
  }),
  component: ExerciseRoute,
});

function ExerciseRoute() {
  const { exerciseId } = Route.useParams();
  return <IntrospectionExercisePage exerciseId={exerciseId} />;
}
