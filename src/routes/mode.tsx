/**
 * **Ruta** — Selector de Modo de Vida. Se muestra al entrar por primera vez
 * y siempre que el usuario quiera cambiar de modo desde el header.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LIFE_MODES, LIFE_MODE_ORDER, useLifeMode, type LifeMode } from "@/hooks/use-life-mode";

export const Route = createFileRoute("/mode")({
  head: () => ({
    meta: [
      { title: "Modo · Panda's LIFE OS" },
      { name: "description", content: "Elige el modo de vida con el que vas a usar la app." },
    ],
  }),
  component: ModePicker,
});

function ModePicker() {
  const { mode: current, setMode } = useLifeMode();
  const navigate = useNavigate();

  const pick = (m: LifeMode) => {
    setMode(m);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh px-5 py-10 max-w-3xl mx-auto pb-24">
      <header className="mb-8 text-center">
        <div className="text-5xl mb-3">🐼</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          ¿Con qué enfoque vamos hoy?
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Elige un modo. Puedes cambiarlo cuando quieras desde el header.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LIFE_MODE_ORDER.map((id) => {
          const m = LIFE_MODES[id];
          const active = current === id;
          const Icon = m.icon;
          return (
            <button
              key={id}
              onClick={() => pick(id)}
              className={`text-left rounded-2xl border p-5 transition-all active:scale-[0.99] ${
                active
                  ? "border-primary/60 bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {m.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-lg flex items-center gap-2">
                    {m.label}
                    {active && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </div>
                <Icon className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-8">
        En modos específicos se ocultan los demás módulos para que la app se sienta más ligera.
      </p>
    </div>
  );
}
