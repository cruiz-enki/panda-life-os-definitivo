/**
 * **Componente** — Botón sutil de regreso al home del modo activo.
 * Se muestra solo cuando hay un modo distinto de "normal" y la ruta actual
 * no es la home (`/`), auth o el selector de modo.
 */
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLifeMode, LIFE_MODES } from "@/hooks/use-life-mode";

const HIDDEN_PATHS = new Set(["/", "/auth", "/mode"]);

export function ModeBackButton() {
  const { mode } = useLifeMode();
  const { pathname } = useLocation();

  if (mode === "normal") return null;
  if (HIDDEN_PATHS.has(pathname)) return null;

  const cfg = LIFE_MODES[mode];

  return (
    <div className="px-4 md:px-6 pt-3">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border/60 bg-card/40 backdrop-blur px-2.5 py-1"
        aria-label={`Volver al home de ${cfg.label}`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>
          <span className="opacity-70">Volver a</span>{" "}
          <span className="font-medium">{cfg.emoji} {cfg.label}</span>
        </span>
      </Link>
    </div>
  );
}
