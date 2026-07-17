/**
 * **Ruta** — Introspección: lista de ejercicios por categoría.
 */
import { createFileRoute } from "@tanstack/react-router";
import { IntrospectionCategoryPage } from "@/features/introspection/parts";

export const Route = createFileRoute("/introspection/category/$categoryKey")({
  head: () => ({
    meta: [
      { title: "Categoría · Introspección" },
      { name: "description", content: "Ejercicios de autoconocimiento por categoría." },
    ],
  }),
  component: CategoryRoute,
});

function CategoryRoute() {
  const { categoryKey } = Route.useParams();
  return <IntrospectionCategoryPage categoryKey={categoryKey} />;
}
