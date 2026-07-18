/**
 * **Ruta** — Ajustes de la app (cuenta, integraciones, notificaciones, etc.).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { NotificationsCard } from "@/components/NotificationsCard";
import { FocusModeCard } from "@/components/FocusModeCard";
import { TelegramCard } from "@/components/TelegramCard";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/storage";
import { useIsOwner } from "@/hooks/use-is-owner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Download, LogOut, ShieldCheck, RefreshCw, ChevronRight, Sun, Moon, Monitor, Crown } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { state, toggleEnkiMode } = useAppState();
  const { isOwner } = useIsOwner();

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-2">Notificaciones, instalación y personalización.</p>
      </header>

      <ThemeSelector />

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-[var(--energy)]" />
            <h3 className="font-display text-lg font-semibold">Modo CEO (Sistema Enki)</h3>
          </div>
          <Switch 
            checked={state.enkiModeEnabled} 
            onCheckedChange={toggleEnkiMode} 
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Activa o oculta el panel de hábitos de liderazgo y operación de alto impacto en la sección de Hábitos.
        </p>
      </Card>

      <NotificationsCard />

      <TelegramCard />

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Instalar como app</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Añade Panda's LIFE OS a tu pantalla de inicio para acceder con un toque y recibir notificaciones nativas.
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li><strong className="text-foreground">iPhone (Safari):</strong> botón Compartir → "Añadir a pantalla de inicio".</li>
          <li><strong className="text-foreground">Android (Chrome):</strong> menú ⋮ → "Instalar aplicación".</li>
          <li><strong className="text-foreground">Escritorio (Chrome/Edge):</strong> icono <Download className="inline size-3.5" /> en la barra de URL.</li>
        </ul>
      </Card>

      {isOwner && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Administración</h3>
          </div>
          <p className="text-sm text-muted-foreground">Acciones disponibles solo para propietarios.</p>
          <div className="space-y-2 pt-1">
            <Link
              to="/admin/invites"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border transition-colors"
            >
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Invitados</div>
                <div className="text-xs text-muted-foreground">Gestiona accesos al sistema.</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <Link
              to="/admin/reset"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/40 hover:bg-destructive/10 border border-border hover:border-destructive/40 transition-colors"
            >
              <RefreshCw className="size-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Reset</div>
                <div className="text-xs text-muted-foreground">Restablece datos del sistema.</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </div>
        </Card>
      )}

      {user && (
        <Card className="p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold">Cuenta</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="size-4 mr-2" /> Cerrar sesión
          </Button>
        </Card>
      )}
    </div>
  );
}

function ThemeSelector() {
  const [theme, setTheme] = (import.meta as any).env.SSR 
    ? ["dark", () => {}] 
    : (() => {
        const current = localStorage.getItem("theme") || "system";
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [t, setT] = (window as any).useState?.(current) || [current, () => {}];
        return [t, setT];
      })();

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      localStorage.setItem("theme", newTheme);
      root.classList.toggle("dark", newTheme === "dark");
    }
    setTheme(newTheme);
    // Recarga opcional para asegurar que todos los gradientes y variables OKLCH se refresquen
    // window.location.reload(); 
  };

  const themes = [
    { id: "light", label: "Modo día", icon: Sun, color: "bg-white border-slate-200" },
    { id: "dark", label: "Modo noche", icon: Moon, color: "bg-slate-900 border-slate-800" },
    { id: "system", label: "Sistema", icon: Monitor, color: "bg-slate-400 border-slate-300" },
  ];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sun className="size-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Tema y apariencia</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => {
          const Icon = t.icon;
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                active 
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                  : "border-border bg-secondary/30 hover:bg-secondary/60 hover:border-border/80"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${t.color}`}>
                <Icon className={`w-5 h-5 ${t.id === 'light' ? 'text-orange-500' : t.id === 'dark' ? 'text-blue-400' : 'text-slate-600'}`} />
              </div>
              <span className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
