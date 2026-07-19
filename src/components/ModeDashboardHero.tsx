/**
 * **Componente** — Hero + tiles del dashboard cuando el usuario está
 * en un modo distinto de "Normal". Devuelve `null` en Normal.
 */
import { Link } from "@tanstack/react-router";
import { useLifeMode } from "@/hooks/use-life-mode";

export function ModeDashboardHero() {
  const { mode, config } = useLifeMode();
  if (mode === "normal") return null;

  return (
    <section className="mb-5">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
            {config.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Modo activo
            </div>
            <div className="font-display font-bold text-lg leading-tight">{config.label}</div>
            <div className="text-xs text-muted-foreground truncate">{config.description}</div>
          </div>
          <Link
            to="/mode"
            className="text-[11px] font-bold text-primary uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
          >
            Cambiar
          </Link>
        </div>
      </div>

      {config.dashTiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {config.dashTiles.map((t) => (
            <Link
              key={`${t.to}-${t.label}`}
              to={t.to}
              search={t.hint === "?tab=expense" ? ({ tab: "expense" } as never) : undefined}
              className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-1 hover:border-primary/40 active:scale-[0.98] transition-all"
            >
              <span className="text-2xl leading-none">{t.emoji}</span>
              <span className="text-xs font-semibold truncate">{t.label}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
