/**
 * **Componente** — Vestidor de Pandus Maximus. Elige skin desbloqueada por nivel.
 */
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState, levelFromXp } from "@/lib/storage";
import {
  TITO_SKINS,
  readStoredSkinId,
  storeSkinId,
  resolveActiveSkin,
  type TitoSkin,
} from "@/lib/tito-skins";

function SkinPreview({ skin, size = "md" }: { skin: TitoSkin; size?: "sm" | "md" }) {
  const px = size === "sm" ? 56 : 84;
  return (
    <div
      className={cn(
        "relative mx-auto rounded-full flex items-center justify-center text-3xl bg-gradient-to-br",
        skin.bg ?? "from-stone-400 to-stone-600",
      )}
      style={{
        width: px,
        height: px,
        boxShadow: skin.aura ? `0 0 20px 4px ${skin.aura}` : undefined,
      }}
      aria-hidden
    >
      🐼
      {skin.accessories.map((a, i) => (
        <span
          key={i}
          className={cn("absolute -translate-x-1/2 -translate-y-1/2", a.size ?? "text-sm")}
          style={{
            top: a.top,
            left: a.left,
            transform: `translate(-50%, -50%) rotate(${a.rotate ?? 0}deg)`,
            filter: a.filter,
          }}
        >
          {a.emoji}
        </span>
      ))}
    </div>
  );
}

export function TitoWardrobe() {
  const { state } = useAppState() as any;
  const { level } = levelFromXp(state.xp);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(readStoredSkinId());
  }, []);

  const active = resolveActiveSkin(level, selectedId);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 md:p-6 mb-6 md:mb-8 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎽</span>
        <h3 className="font-display font-bold text-lg">Vestidor de Pandus Maximus</h3>
        <span className="text-xs text-muted-foreground">Desbloquea atuendos con XP</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TITO_SKINS.map((skin) => {
          const unlocked = level >= skin.minLevel;
          const isActive = active.id === skin.id;
          return (
            <button
              key={skin.id}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                setSelectedId(skin.id);
                storeSkinId(skin.id);
              }}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition-all",
                unlocked ? "border-primary/30 bg-secondary/30 hover:bg-secondary/60" : "border-border bg-muted/30 opacity-70 cursor-not-allowed",
                isActive && "ring-2 ring-primary shadow-glow",
              )}
            >
              <div className={cn("relative", !unlocked && "grayscale")}>
                <SkinPreview skin={skin} />
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-2">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <div className="font-display font-bold text-sm">{skin.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {unlocked ? (isActive ? "Equipado" : `Nivel ${skin.minLevel}+`) : `Nivel ${skin.minLevel}+`}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{skin.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        💡 Además del atuendo, Pandus Maximus cambia de postura según la hora: ☕ mañana, ☀️ mediodía, 📜 tarde, 🌙 noche. Al entrenar saca la 🗡️.
      </p>
    </section>
  );
}
