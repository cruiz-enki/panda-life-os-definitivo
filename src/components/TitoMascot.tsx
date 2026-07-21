/**
 * **Componente global** — Tito, el panda-legionario mascota de ENKI OS.
 * Burbuja flotante persistente que reacciona a eventos, hora y estado.
 *
 * Estados: idle · happy · cheer · sad · sleep · think
 * Eventos globales: window.dispatchEvent(new CustomEvent("tito:cheer", { detail: { text, mood } }))
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Minus } from "lucide-react";
import titoAsset from "@/assets/tito.png.asset.json";
import { useAppState } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { todayCDMX } from "@/lib/date-utils";

type Mood = "idle" | "happy" | "cheer" | "sad" | "sleep" | "think";

type Bubble = { text: string; mood: Mood; ttl?: number };

const LS_MIN = "tito:minimized";
const LS_HIDDEN = "tito:hidden-until"; // fecha ISO

function pickTimeMessages(state: ReturnType<typeof useAppState>["state"]): Bubble[] {
  const now = new Date();
  const h = now.getHours();
  const today = todayCDMX();
  const habitsPending = state.habits.filter((x) => x.lastCompleted !== today).length;
  const doneStreak = Math.max(0, ...state.habits.map((x) => x.streak || 0));
  const msgs: Bubble[] = [];

  if (h >= 6 && h < 10) {
    msgs.push({ mood: "happy", text: "¡Buenos días, legionario! ¿Empezamos con las medicinas AM?" });
    msgs.push({ mood: "think", text: "Un vaso de agua antes que el café, general 🫡" });
  } else if (h >= 10 && h < 13) {
    msgs.push({ mood: "cheer", text: "Modo enfoque activado. ¿Cuál tarea cerramos primero?" });
  } else if (h >= 13 && h < 16) {
    msgs.push({ mood: "think", text: "¿Ya registraste la comida? Un tap y listo." });
  } else if (h >= 16 && h < 19) {
    msgs.push({ mood: "happy", text: "Segunda mitad del día. Revisa tu score de identidad." });
  } else if (h >= 19 && h < 22) {
    msgs.push({ mood: "cheer", text: "Medicinas PM antes de bajar el switch." });
    msgs.push({ mood: "think", text: "¿Cómo estuvo tu ánimo hoy? Registra en /log." });
  } else {
    msgs.push({ mood: "sleep", text: "Hora de dormir. Toca el NFC de tu buró." });
  }

  if (habitsPending > 0) {
    msgs.push({
      mood: "think",
      text: `Te faltan ${habitsPending} hábito${habitsPending === 1 ? "" : "s"} hoy. Vamos.`,
    });
  } else if (state.habits.length > 0) {
    msgs.push({ mood: "cheer", text: "¡Todos los hábitos del día en orden! 🐼⚔️" });
  }

  if (doneStreak >= 7) {
    msgs.push({ mood: "happy", text: `${doneStreak} días de racha. Eres imparable.` });
  }

  return msgs;
}

function moodFrame(mood: Mood): string {
  switch (mood) {
    case "cheer":
      return "animate-[tito-bounce_0.8s_ease-in-out_2]";
    case "happy":
      return "animate-[tito-wiggle_2.4s_ease-in-out_infinite]";
    case "sad":
      return "opacity-70 saturate-50";
    case "sleep":
      return "opacity-80";
    case "think":
      return "";
    default:
      return "animate-[tito-idle_3.5s_ease-in-out_infinite]";
  }
}

export function TitoMascot() {
  const { user } = useAuth();
  const { state } = useAppState();
  const [minimized, setMinimized] = useState(false);
  const [hiddenToday, setHiddenToday] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const [fabOpen, setFabOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate persistencia
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMinimized(window.localStorage.getItem(LS_MIN) === "1");
    const until = window.localStorage.getItem(LS_HIDDEN);
    if (until && new Date(until).getTime() > Date.now()) setHiddenToday(true);
  }, []);

  const messages = useMemo(() => pickTimeMessages(state), [state]);

  const showBubble = useCallback((b: Bubble) => {
    setBubble(b);
    setMood(b.mood);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBubble(null);
      setMood("idle");
    }, b.ttl ?? 5000);
  }, []);

  // Bocadillo inicial + rotación
  useEffect(() => {
    if (minimized || hiddenToday) return;
    if (messages.length === 0) return;
    const t1 = setTimeout(() => showBubble(messages[0]), 1500);
    let i = 1;
    const t2 = setInterval(() => {
      if (i >= messages.length) i = 0;
      showBubble(messages[i]);
      i++;
    }, 45000);
    return () => {
      clearTimeout(t1);
      clearInterval(t2);
    };
  }, [messages, minimized, hiddenToday, showBubble]);

  // Eventos externos
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onCheer = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<Bubble> | undefined;
      showBubble({
        text: detail?.text ?? "¡Buen trabajo!",
        mood: detail?.mood ?? "cheer",
        ttl: detail?.ttl ?? 4000,
      });
    };
    const onFabState = (e: Event) => {
      const detail = (e as CustomEvent).detail as { open?: boolean } | undefined;
      setFabOpen(!!detail?.open);
    };
    window.addEventListener("tito:cheer", onCheer);
    window.addEventListener("tito:say", onCheer);
    window.addEventListener("fab:state", onFabState);
    return () => {
      window.removeEventListener("tito:cheer", onCheer);
      window.removeEventListener("tito:say", onCheer);
      window.removeEventListener("fab:state", onFabState);
    };
  }, [showBubble]);

  // XP celebration
  const prevXp = useRef(state.xp);
  useEffect(() => {
    if (state.xp > prevXp.current) {
      const diff = state.xp - prevXp.current;
      showBubble({ mood: "cheer", text: `+${diff} XP ⚔️ ¡Así se hace!`, ttl: 3500 });
    }
    prevXp.current = state.xp;
  }, [state.xp, showBubble]);

  if (!user) return null;
  if (hiddenToday) return null;

  const onTap = () => {
    // Toggle del panel de acciones (Tito ES el FAB)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tito:toggleFab"));
    }
    // Además, si va a abrirse el panel, no mostramos burbuja para no encimar
    if (fabOpen) {
      const pool = messages.length > 0 ? messages : [{ mood: "happy" as Mood, text: "¡Aquí estoy, general!" }];
      showBubble(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      setBubble(null);
    }
  };

  const minimize = () => {
    setMinimized(true);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_MIN, "1");
  };
  const expand = () => {
    setMinimized(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_MIN);
  };
  const hideToday = () => {
    setHiddenToday(true);
    if (typeof window !== "undefined") {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      window.localStorage.setItem(LS_HIDDEN, end.toISOString());
    }
  };

  return (
    <>
      <style>{`
        @keyframes tito-idle { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-4px) rotate(-1.5deg); } }
        @keyframes tito-wiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes tito-bounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-14px) scale(1.05); } }
        @keyframes tito-pop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <div className="fixed z-[60] bottom-24 right-3 md:bottom-6 md:right-6 pointer-events-none select-none">
        {/* Bocadillo */}
        {!minimized && bubble && (
          <div
            className="pointer-events-auto max-w-[240px] mb-2 ml-auto bg-card/95 backdrop-blur border border-border rounded-2xl rounded-br-sm px-3 py-2 text-sm shadow-lg"
            style={{ animation: "tito-pop .22s ease-out both" }}
          >
            <p className="leading-snug">{bubble.text}</p>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45 bg-card border-r border-b border-border" />
          </div>
        )}

        {/* Mascota */}
        <div className="pointer-events-auto relative flex justify-end">
          {!minimized && (
            <div className="absolute -top-2 -left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* botones se muestran al hover del contenedor padre */}
            </div>
          )}

          <div className="group relative">
            <button
              type="button"
              onClick={onTap}
              aria-label="Tito"
              className={`relative block ${minimized ? "w-14 h-14" : "w-24 h-24 md:w-28 md:h-28"} drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition-all`}
            >
              <img
                src={titoAsset.url}
                alt="Tito"
                className={`w-full h-full object-contain ${moodFrame(mood)}`}
                draggable={false}
              />
            </button>

            {/* Controles */}
            {!minimized ? (
              <div className="absolute -top-1 -left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={minimize}
                  className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted"
                  aria-label="Minimizar"
                  title="Minimizar"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={hideToday}
                  className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted"
                  aria-label="Ocultar hasta mañana"
                  title="Ocultar hasta mañana"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={expand}
                className="absolute inset-0 w-full h-full rounded-full"
                aria-label="Traer a Tito"
                title="Traer a Tito"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
