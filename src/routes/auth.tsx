/**
 * **Ruta** — Página de autenticación (login / signup / OAuth).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceder · Panda's LIFE OS" },
      { name: "description", content: "Inicia sesión o crea tu cuenta para sincronizar Panda's LIFE OS en la nube." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : undefined,
  }),
  component: AuthPage,
});


function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const safeNext = next && next.startsWith("/") ? next : "/";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: safeNext });
  }, [user, loading, navigate, safeNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safeNext}`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safeNext });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      const lower = msg.toLowerCase();
      setError(
        lower.includes("invalid login")
          ? "Email o contraseña incorrectos."
          : lower.includes("already registered")
            ? "Ese email ya está registrado. Inicia sesión."
            : lower.includes("no autorizado") || lower.includes("not authorized") || lower.includes("allowlist") || msg.includes("42501")
              ? "Esta app es privada. Tu email no está en la lista de invitados."
              : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${safeNext}` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error con Google");
      setBusy(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-primary items-center justify-center text-3xl shadow-glow mb-4">
            🐼
          </div>
          <h1 className="font-display text-3xl font-bold">Panda's LIFE OS</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80 px-3 py-1 rounded-full border border-border bg-card/40">
            🔒 App privada — solo invitados
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition font-medium text-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">o con email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary"
              />
            )}
            <input
              type="email"
              required
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña (mín. 6)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            {info && <p className="text-xs text-primary">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-[1.01] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {busy ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setInfo(null);
              }}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Crear una" : "Iniciar sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
