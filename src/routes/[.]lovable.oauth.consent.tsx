/**
 * **Ruta OAuth consent** — `/.lovable/oauth/consent`
 * Pantalla donde el usuario aprueba/deniega un cliente OAuth (ChatGPT, Claude, etc.)
 * que se conecta al servidor MCP de Pandus Maximus.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ShieldCheck } from "lucide-react";

// Los helpers auth.oauth son beta; tipamos localmente.
type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationResult | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationResult | null; error: { message: string } | null }>;
};
type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type AuthorizationResult = { redirect_url?: string; redirect_to?: string };

function oauth(): OAuthAPI {
  return (supabase.auth as unknown as { oauth: OAuthAPI }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-display font-bold">No se pudo cargar la autorización</h1>
        <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauth();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("El servidor de autorización no devolvió una URL de redirección."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "una aplicación";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-primary items-center justify-center text-2xl shadow-glow mb-3">
            🐼
          </div>
          <h1 className="font-display text-2xl font-bold">Conectar {clientName} a Pandus Maximus</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Esto permite que {clientName} use Pandus Maximus como tú.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 mt-0.5 text-primary" />
            <div className="text-muted-foreground">
              El cliente podrá invocar las herramientas de tu Pandus Maximus (registrar gastos, notas,
              medicamentos, tareas, sueño, mood, ubicaciones y consultar resúmenes).
              No se otorgan permisos fuera de lo que las políticas RLS permiten.
            </div>
          </div>

          {scopes.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Permisos solicitados</div>
              <ul className="text-sm space-y-1">
                {scopes.map((s: string) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{s === "openid" ? "Identidad" : s === "email" ? "Tu correo" : s === "profile" ? "Tu perfil básico" : s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details?.client?.redirect_uris?.[0] && (
            <div className="text-xs text-muted-foreground break-all">
              Redirect: <code>{details.client.redirect_uris[0]}</code>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-[1.01] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {busy ? "..." : "Aprobar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
