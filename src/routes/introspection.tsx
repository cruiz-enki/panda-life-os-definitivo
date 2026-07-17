/**
 * **Ruta layout** — Introspección (módulo de autoconocimiento).
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/introspection")({
  component: IntrospectionLayout,
});

function IntrospectionLayout() {
  return <Outlet />;
}
