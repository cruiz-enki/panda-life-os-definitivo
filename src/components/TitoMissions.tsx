/**
 * **TitoMissions** — Motor + panel de misiones diarias de Pandus Maximus.
 *
 * - `TitoMissionsEngine`: componente invisible que evalúa progreso, dispara
 *   confetti, cheer de Pandus Maximus y otorga bonus XP. Se monta una sola vez en root.
 * - `TitoMissionsPanel`: lista embebible (usada dentro del FAB) con el
 *   estado en vivo de las 3 misiones del día.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppState } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import {
  pickTodayMissions,
  loadMissionsRecord,
  saveMissionsRecord,
  type Mission,
} from "@/lib/daily-missions";

type Burst = { id: number; emoji: string };

function useTodayMissions() {
  const { user } = useAuth();
  const { state } = useAppState();
  const missions: Mission[] = useMemo(
    () => (user ? pickTodayMissions(user.id, 3) : []),
    [user]
  );
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
  return { user, missions, evaluated, doneCount, allDone };
}

/** Motor invisible: reacciones, XP, confetti. */
export function TitoMissionsEngine() {
  const { user, missions, evaluated, allDone } = useTodayMissions();
  const { addBonusXp } = useAppState();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seen = useRef<Record<string, boolean>>({});
  const initRef = useRef(false);
  const finalCelebrated = useRef(false);

  useEffect(() => {
    if (!user) return;
    const rec = loadMissionsRecord(user.id);
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
        if (!rec.claimed.includes(e.mission.id)) {
          addBonusXp(e.mission.xp);
          rec.claimed = [...rec.claimed, e.mission.id];
          saveMissionsRecord(user.id, rec);
        }
        triggerBurst(e.mission.emoji);
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
      }
    }
  }, [evaluated, user, addBonusXp]);

  useEffect(() => {
    if (allDone && !finalCelebrated.current) {
      finalCelebrated.current = true;
      ["⚔️", "🐼", "🌟", "🔥", "🎉"].forEach((e, i) =>
        setTimeout(() => triggerBurst(e), i * 120)
      );
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
    setTimeout(
      () => setBursts((prev) => prev.filter((b) => b.id !== id)),
      1500
    );
  }

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
      <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
        {bursts.map((b) => (
          <ConfettiBurst key={b.id} emoji={b.emoji} />
        ))}
      </div>
    </>
  );
}

/** Panel embebible con las 3 misiones (para meterlo en el FAB). */
export function TitoMissionsPanel() {
  const { missions, evaluated, doneCount, allDone } = useTodayMissions();
  if (missions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
      <div className="flex items-center gap-2 px-1 pb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-none">
          Misión de Pandus Maximus
        </div>
        <div className="ml-auto text-[11px] font-medium">
          {allDone ? "👑 ¡Día conquistado!" : `${doneCount}/${missions.length}`}
        </div>
      </div>
      <ul className="space-y-1">
        {evaluated.map(({ mission, done, progress, label }) => (
          <li
            key={mission.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
              done ? "bg-primary/10" : "bg-background/40"
            }`}
          >
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-full text-base shrink-0 ${
                done ? "bg-primary/20 mission-check-in" : "bg-background/70"
              }`}
            >
              {done ? "✓" : mission.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[13px] font-medium leading-tight truncate ${
                  done ? "line-through text-muted-foreground" : ""
                }`}
              >
                {mission.title}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
    </div>
  );
}

function ConfettiBurst({ emoji }: { emoji: string }) {
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

// Compat: export previo
export const TitoMissions = TitoMissionsEngine;
