/**
 * **TitoMissions** — Panel flotante con las 3 misiones diarias que da Tito.
 * Se muestra encima de la mascota; al completar una misión dispara
 * animación de victoria (confetti emoji) + burbuja de Tito + bonus XP.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import {
  pickTodayMissions,
  loadMissionsRecord,
  saveMissionsRecord,
  type Mission,
} from "@/lib/daily-missions";

const LS_COLLAPSED = "tito:missions:collapsed";

type Burst = { id: number; emoji: string };

export function TitoMissions() {
  const { user } = useAuth();
  const { state, addBonusXp } = useAppState();
  const [collapsed, setCollapsed] = useState(true);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seen = useRef<Record<string, boolean>>({});
  const initRef = useRef(false);

  // Hydrate colapsado
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem(LS_COLLAPSED) !== "0");
  }, []);

  const missions: Mission[] = useMemo(() => {
    if (!user) return [];
    return pickTodayMissions(user.id, 3);
  }, [user]);

  const evaluated = useMemo(
    () =>
      missions.map((m) => {
        const r = m.evaluate(state);
        return { mission: m, ...r };
      }),
    [missions, state]
  );

  const doneCount = evaluated.filter((e) => e.done).length;
  const allDone = missions.length > 0 && doneCount === missions.length;

  // Detección de completadas nuevas → cheer + XP + confetti
  useEffect(() => {
    if (!user) return;
    const rec = loadMissionsRecord(user.id);

    // En la primera pasada, marca como vistas las ya hechas para no re-celebrar
    // misiones completadas antes de abrir la app hoy.
    if (!initRef.current) {
      initRef.current = true;
      evaluated.forEach((e) => {
        if (e.done) seen.current[e.mission.id] = true;
      });
      return;
    }

    for (const e of evaluated) {
      if (e.done && !seen.current[e.mission.id]) {
        seen.current[e.mission.id] = true;

        // Bonus XP una sola vez por día
        if (!rec.claimed.includes(e.mission.id)) {
          addBonusXp(e.mission.xp);
          rec.claimed = [...rec.claimed, e.mission.id];
          saveMissionsRecord(user.id, rec);
        }

        // Anima confetti
        triggerBurst(e.mission.emoji);

        // Tito celebra
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tito:cheer", {
              detail: {
                mood: "cheer",
                text: `¡Misión cumplida, general! ${e.mission.emoji} +${e.mission.xp} XP`,
                ttl: 4500,
              },
            })
          );
        }

        // Auto-expande para que se vea el ✓
        setCollapsed(false);
        if (typeof window !== "undefined") window.localStorage.setItem(LS_COLLAPSED, "0");
      }
    }
  }, [evaluated, user, addBonusXp]);

  // Celebración final si TODAS las misiones están hechas
  const finalCelebrated = useRef(false);
  useEffect(() => {
    if (allDone && !finalCelebrated.current) {
      finalCelebrated.current = true;
      // Ráfaga grande
      ["⚔️", "🐼", "🌟", "🔥", "🎉"].forEach((e, i) => setTimeout(() => triggerBurst(e), i * 120));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tito:cheer", {
            detail: {
              mood: "cheer",
              text: "¡Triple misión completada! Hoy fuiste César 👑",
              ttl: 6000,
            },
          })
        );
      }
    }
  }, [allDone]);

  function triggerBurst(emoji: string) {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, emoji }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1500);
  }

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_COLLAPSED, next ? "1" : "0");
  };

  if (!user || missions.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes tito-confetti {
          0% { transform: translate(0,0) scale(.6) rotate(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(var(--r)); opacity: 0; }
        }
        @keyframes mission-check {
          0% { transform: scale(.5); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .mission-check-in { animation: mission-check .35s ease-out; }
      `}</style>

      {/* Confetti overlay (por encima de todo, no bloquea clics) */}
      <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
        {bursts.map((b) => (
          <ConfettiBurst key={b.id} emoji={b.emoji} />
        ))}
      </div>

      {/* Panel de misiones — anclado sobre Tito */}
      <div
        className="fixed z-[59] right-3 md:right-6 pointer-events-none"
        style={{ bottom: "calc(6rem + 128px)" }}
      >
        <div className="pointer-events-auto ml-auto w-[240px] md:w-[280px] bg-card/95 backdrop-blur border border-border rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground leading-none">Misión de Tito</div>
                <div className="text-sm font-medium truncate">
                  {allDone ? "¡Día conquistado! 👑" : `${doneCount}/${missions.length} completadas`}
                </div>
              </div>
            </div>
            {collapsed ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          </button>

          {!collapsed && (
            <ul className="px-2 pb-2 space-y-1 border-t border-border/60">
              {evaluated.map(({ mission, done, progress, label }) => (
                <li
                  key={mission.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-colors ${
                    done ? "bg-primary/10" : "bg-muted/20"
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-lg shrink-0 ${
                      done ? "bg-primary/20 mission-check-in" : "bg-background/60"
                    }`}
                  >
                    {done ? "✓" : mission.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium leading-tight truncate ${done ? "line-through text-muted-foreground" : ""}`}>
                      {mission.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>+{mission.xp} XP</span>
                      {label && <span>· {label}</span>}
                    </div>
                    {!done && progress > 0 && (
                      <div className="mt-1 h-1 rounded-full bg-background/60 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function ConfettiBurst({ emoji }: { emoji: string }) {
  // 14 partículas con dirección aleatoria
  const pieces = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.6;
      const dist = 80 + Math.random() * 120;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        r: (Math.random() - 0.5) * 720,
        delay: Math.random() * 80,
      };
    });
  }, []);

  return (
    <div className="absolute right-16 bottom-32 md:right-24 md:bottom-32 text-2xl">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            // @ts-expect-error CSS custom props
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--r": `${p.r}deg`,
            animation: `tito-confetti 1.4s ease-out ${p.delay}ms both`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
