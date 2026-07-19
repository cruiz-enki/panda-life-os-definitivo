/**
 * **Componente** — Píldora en la parte superior con el modo activo.
 * Al tocar navega a `/mode` para cambiarlo.
 */
import { Link } from "@tanstack/react-router";
import { useLifeMode } from "@/hooks/use-life-mode";
import { ChevronRight } from "lucide-react";

export function ModeIndicator({ compact = false }: { compact?: boolean }) {
  const { config } = useLifeMode();

  if (compact) {
    return (
      <Link
        to="/mode"
        aria-label={`Modo ${config.label} — cambiar`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/70 backdrop-blur text-xs font-medium hover:border-primary/40 transition-colors"
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </Link>
    );
  }

  return (
    <Link
      to="/mode"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-card/60 backdrop-blur hover:border-primary/40 transition-colors"
    >
      <span className="text-lg leading-none">{config.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none">
          Modo
        </div>
        <div className="text-sm font-semibold leading-tight">{config.label}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
