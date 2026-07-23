/**
 * **Componente global** — Tito, el panda-legionario mascota de ENKI OS.
 * Burbuja flotante persistente que reacciona a eventos, hora y estado.
 *
 * Estados: idle · happy · cheer · sad · sleep · think
 * Eventos globales: window.dispatchEvent(new CustomEvent("tito:cheer", { detail: { text, mood } }))
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Minus } from "lucide-react";
import { pickSpriteUrl } from "@/lib/tito-sprites";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { todayCDMX } from "@/lib/date-utils";
import {
  resolveActiveSkin,
  readStoredSkinId,
  currentPosture,
  type TitoSkinAccessory,
} from "@/lib/tito-skins";

type Mood = "idle" | "happy" | "cheer" | "sad" | "sleep" | "think" | "hungry" | "tired";

type Bubble = { text: string; mood: Mood; ttl?: number };

type ReactionType = "med" | "water" | "exercise" | "mood" | "sleep" | "task" | "expense" | "meal" | "habit";

type ReactionSpec = {
  anim: string;
  duration: number;
  emojis: string[];
  text: string;
  mood: Mood;
};

const REACTIONS: Record<ReactionType, ReactionSpec> = {
  med:      { anim: "tito-salute",      duration: 1200, emojis: ["💊","🫡","✨"], text: "¡Medicina tomada, general! 🫡", mood: "cheer" },
  water:    { anim: "tito-splash",      duration: 1000, emojis: ["💧","💦","🫧"], text: "¡Hidratado! 💧",                  mood: "happy" },
  exercise: { anim: "tito-pushup",      duration: 1400, emojis: ["💪","🔥","⚡"], text: "¡Uno, dos, uno, dos! 💪",         mood: "cheer" },
  mood:     { anim: "tito-heart",       duration: 1200, emojis: ["❤️","🧠","✨"], text: "Registrado. Aquí estoy contigo.", mood: "happy" },
  sleep:    { anim: "tito-sleepy",      duration: 1400, emojis: ["😴","💤","🌙"], text: "Buenas noches, legionario.",       mood: "sleep" },
  task:     { anim: "tito-bounce-run",  duration: 900,  emojis: ["✅","⚔️","✨"], text: "¡Otra menos, general!",           mood: "cheer" },
  expense:  { anim: "tito-coin",        duration: 1100, emojis: ["💰","🧾","✨"], text: "Anotado en el libro mayor.",       mood: "think" },
  meal:     { anim: "tito-eat",         duration: 1100, emojis: ["🍽️","😋","✨"], text: "¡Provecho!",                       mood: "happy" },
  habit:    { anim: "tito-bounce-run",  duration: 900,  emojis: ["🎯","⚔️","✨"], text: "Otro día firme en la formación.", mood: "cheer" },
};

type Vitals = { happy: number; hunger: number; energy: number; care: number };

/**
 * Calcula "vitales" tipo Tamagotchi a partir del estado del usuario.
 * - happy: hábitos completados hoy / total
 * - hunger: 1 = lleno, 0 = hambriento (baja con las horas del día sin registrar comida/agua)
 * - energy: 1 = descansado, 0 = agotado (baja de noche si no hay hábito de sueño)
 * - care: promedio ponderado → mood ambiental
 */
function computeVitals(state: ReturnType<typeof useAppState>["state"]): Vitals {
  const today = todayCDMX();
  const h = new Date().getHours();
  const habits = state.habits ?? [];
  const total = habits.length;
  const doneToday = habits.filter((x) => x.lastCompleted === today).length;
  const happy = total > 0 ? doneToday / total : 0.8;

  // Hambre: hábitos con métrica de agua/comida cumplidos hoy
  const nutritionHabits = habits.filter((x) =>
    ["water_ml", "meals_count", "protein_g"].includes(x.linkedMetric ?? ""),
  );
  const nutritionDone = nutritionHabits.filter((x) => x.lastCompleted === today).length;
  const nutritionRatio = nutritionHabits.length > 0 ? nutritionDone / nutritionHabits.length : happy;
  // Decae con la hora del día (a mediodía debería haber al menos 30% cumplido)
  const dayProgress = Math.min(1, Math.max(0, (h - 7) / 14)); // 7am→0, 9pm→1
  const hunger = Math.max(0, Math.min(1, nutritionRatio - dayProgress * 0.3 + 0.3));

  // Energía: si es muy noche o muy tarde sin sueño registrado
  const sleepHabits = habits.filter((x) => (x.linkedMetric ?? "").startsWith("sleep"));
  const sleepDone = sleepHabits.some((x) => x.lastCompleted === today);
  let energy = happy;
  if (h >= 23 || h < 5) energy = sleepDone ? 0.6 : 0.15;
  else if (h >= 21) energy = Math.min(energy, 0.4);

  const care = happy * 0.5 + hunger * 0.25 + energy * 0.25;
  return { happy, hunger, energy, care };
}

function ambientMood(v: Vitals, hour: number): Mood {
  if (hour >= 23 || hour < 5) return v.energy < 0.3 ? "tired" : "sleep";
  if (v.care < 0.25) return "sad";
  if (v.hunger < 0.3) return "hungry";
  if (v.energy < 0.3) return "tired";
  if (v.care > 0.85) return "happy";
  return "idle";
}

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
      return "opacity-60 saturate-[.4] animate-[tito-sad_3s_ease-in-out_infinite]";
    case "hungry":
      return "opacity-80 animate-[tito-hungry_1.6s_ease-in-out_infinite]";
    case "tired":
      return "opacity-70 saturate-75 animate-[tito-tired_4s_ease-in-out_infinite]";
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
  const [reaction, setReaction] = useState<{ spec: ReactionSpec; id: number; type: ReactionType } | null>(null);
  const [skinId, setSkinId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate persistencia
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMinimized(window.localStorage.getItem(LS_MIN) === "1");
    const until = window.localStorage.getItem(LS_HIDDEN);
    if (until && new Date(until).getTime() > Date.now()) setHiddenToday(true);
    setSkinId(readStoredSkinId());
    const onSkin = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined;
      setSkinId(id ?? readStoredSkinId());
    };
    window.addEventListener("tito:skin-change", onSkin);
    return () => window.removeEventListener("tito:skin-change", onSkin);
  }, []);

  const vitals = useMemo(() => computeVitals(state), [state]);
  const hourNow = new Date().getHours();
  const ambient = useMemo(() => ambientMood(vitals, hourNow), [vitals, hourNow]);
  const level = useMemo(() => levelFromXp(state.xp).level, [state.xp]);
  const activeSkin = useMemo(() => resolveActiveSkin(level, skinId), [level, skinId]);
  const posture = useMemo(
    () => currentPosture(hourNow, reaction?.type ?? null),
    [hourNow, reaction],
  );
  const accessories: TitoSkinAccessory[] = useMemo(
    () => [...activeSkin.accessories, ...posture.extras],
    [activeSkin, posture],
  );

  const messages = useMemo(() => {
    const base = pickTimeMessages(state);
    const extra: Bubble[] = [];
    if (vitals.care < 0.25) {
      extra.push({ mood: "sad", text: "Me siento decaído… llevamos varios pendientes. ¿Un tap y arrancamos?" });
    }
    if (vitals.hunger < 0.3) {
      extra.push({ mood: "hungry", text: "Tengo hambre 🍙 ¿Registramos comida o un vaso de agua?" });
    }
    if (vitals.energy < 0.3) {
      extra.push({ mood: "tired", text: "Estoy agotado 😴 ¿Ya registraste tu sueño?" });
    }
    return [...base, ...extra];
  }, [state, vitals]);

  const showBubble = useCallback((b: Bubble) => {
    setBubble(b);
    setMood(b.mood);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBubble(null);
      setMood("idle");
    }, b.ttl ?? 5000);
  }, []);

  // Mood ambiental cuando no hay burbuja activa (Tamagotchi)
  useEffect(() => {
    if (!bubble) setMood(ambient);
  }, [ambient, bubble]);

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
    const onReact = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type?: ReactionType; text?: string; emojis?: string[] } | undefined;
      const type = detail?.type;
      if (!type || !REACTIONS[type]) return;
      const base = REACTIONS[type];
      const spec: ReactionSpec = {
        ...base,
        emojis: detail?.emojis ?? base.emojis,
      };
      setReaction({ spec, id: Date.now(), type });
      showBubble({ mood: spec.mood, text: detail?.text ?? spec.text, ttl: Math.max(spec.duration + 800, 2500) });
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(() => setReaction(null), spec.duration + 200);
    };
    window.addEventListener("tito:cheer", onCheer);
    window.addEventListener("tito:say", onCheer);
    window.addEventListener("tito:react", onReact);
    window.addEventListener("fab:state", onFabState);
    return () => {
      window.removeEventListener("tito:cheer", onCheer);
      window.removeEventListener("tito:say", onCheer);
      window.removeEventListener("tito:react", onReact);
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

  const unhide = () => {
    setHiddenToday(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_HIDDEN);
  };

  // Permite volver a mostrar a Tito desde cualquier lado con window.dispatchEvent(new Event('tito:show'))
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onShow = () => unhide();
    window.addEventListener("tito:show", onShow);
    return () => window.removeEventListener("tito:show", onShow);
  }, []);

  if (!user) return null;
  if (hiddenToday) {
    return (
      <button
        onClick={unhide}
        aria-label="Mostrar a Tito"
        title="Mostrar a Tito"
        style={{
          position: "fixed",
          right: 12,
          bottom: 92,
          zIndex: 60,
          width: 32,
          height: 32,
          borderRadius: 9999,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 16,
          lineHeight: 1,
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
      >
        🐼
      </button>
    );
  }

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
        @keyframes tito-sad { 0%,100% { transform: translateY(2px) rotate(-2deg); } 50% { transform: translateY(6px) rotate(-2deg); } }
        @keyframes tito-hungry { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2px) scale(1.02); } }
        @keyframes tito-tired { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(3px) rotate(4deg); } }

        /* Reacciones en tiempo real */
        @keyframes tito-salute { 0% { transform: rotate(0) translateY(0); } 25% { transform: rotate(-8deg) translateY(-4px); } 50% { transform: rotate(-8deg) translateY(-4px) scale(1.04); } 100% { transform: rotate(0) translateY(0); } }
        @keyframes tito-splash { 0%,100% { transform: translateY(0) scale(1); } 30% { transform: translateY(-6px) scale(1.05,.95); } 60% { transform: translateY(4px) scale(.95,1.05); } }
        @keyframes tito-pushup { 0%,100% { transform: translateY(0) rotate(0); } 25% { transform: translateY(6px) rotate(-4deg) scale(1.02,.96); } 50% { transform: translateY(-6px) rotate(2deg) scale(.98,1.04); } 75% { transform: translateY(6px) rotate(-4deg) scale(1.02,.96); } }
        @keyframes tito-heart { 0%,100% { transform: scale(1); } 20% { transform: scale(1.12); } 40% { transform: scale(.98); } 60% { transform: scale(1.08); } }
        @keyframes tito-sleepy { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(4px) rotate(6deg); } }
        @keyframes tito-bounce-run { 0%,100% { transform: translateY(0) rotate(0); } 25% { transform: translateY(-8px) rotate(-4deg); } 50% { transform: translateY(0) rotate(0); } 75% { transform: translateY(-6px) rotate(4deg); } }
        @keyframes tito-coin { 0%,100% { transform: rotateY(0) translateY(0); } 50% { transform: rotateY(180deg) translateY(-6px); } }
        @keyframes tito-eat { 0%,100% { transform: scale(1); } 25% { transform: scale(1.05,.95); } 50% { transform: scale(.98,1.05); } 75% { transform: scale(1.05,.95); } }

        /* Ráfaga de emojis */
        @keyframes tito-burst { 0% { opacity: 0; transform: translate(0,0) scale(.6); } 15% { opacity: 1; } 100% { opacity: 0; transform: var(--tito-burst-end) scale(1.1); } }
      `}</style>

      <div className="fixed z-[60] bottom-24 right-3 md:bottom-6 md:right-6 pointer-events-none select-none">
        {/* Bocadillo — oculto cuando el panel de acciones está abierto */}
        {!minimized && bubble && !fabOpen && (
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
                className={`w-full h-full object-contain ${reaction ? "" : moodFrame(mood)}`}
                style={
                  reaction
                    ? { animation: `${reaction.spec.anim} ${reaction.spec.duration}ms ease-in-out both`, transformOrigin: "50% 80%" }
                    : undefined
                }
                draggable={false}
              />
              {activeSkin.aura && !minimized && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 32px 6px ${activeSkin.aura}`, opacity: 0.85 }}
                />
              )}
              {!minimized && accessories.length > 0 && (
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  {accessories.map((a, i) => (
                    <span
                      key={`${a.emoji}-${i}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 ${a.size ?? "text-xl"}`}
                      style={{
                        top: a.top,
                        left: a.left,
                        transform: `translate(-50%, -50%) rotate(${a.rotate ?? 0}deg)`,
                        filter: a.filter,
                        zIndex: a.z ?? 3,
                      }}
                    >
                      {a.emoji}
                    </span>
                  ))}
                </div>
              )}
              {reaction && (
                <div key={reaction.id} className="pointer-events-none absolute inset-0 overflow-visible">
                  {reaction.spec.emojis.map((emo, i) => {
                    const angle = (-90 + (i - (reaction.spec.emojis.length - 1) / 2) * 30) * (Math.PI / 180);
                    const dist = 70;
                    const dx = Math.cos(angle) * dist;
                    const dy = Math.sin(angle) * dist;
                    return (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 text-2xl"
                        style={{
                          ["--tito-burst-end" as string]: `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px)`,
                          animation: `tito-burst ${reaction.spec.duration}ms ease-out both`,
                          animationDelay: `${i * 60}ms`,
                        }}
                      >
                        {emo}
                      </span>
                    );
                  })}
                </div>
              )}
            </button>

            {/* Vitales tipo Tamagotchi — visibles cuando algo anda bajo */}
            {!minimized && vitals.care < 0.75 && (
              <div
                className="pointer-events-none absolute -top-2 -right-1 flex flex-col gap-1"
                title={`Ánimo ${Math.round(vitals.happy * 100)}% · Hambre ${Math.round(vitals.hunger * 100)}% · Energía ${Math.round(vitals.energy * 100)}%`}
              >
                {vitals.happy < 0.5 && (
                  <span className="text-[11px] leading-none bg-card/90 border border-border rounded-full px-1 py-0.5 shadow-sm">❤️</span>
                )}
                {vitals.hunger < 0.4 && (
                  <span className="text-[11px] leading-none bg-card/90 border border-border rounded-full px-1 py-0.5 shadow-sm">🍙</span>
                )}
                {vitals.energy < 0.4 && (
                  <span className="text-[11px] leading-none bg-card/90 border border-border rounded-full px-1 py-0.5 shadow-sm">⚡</span>
                )}
              </div>
            )}

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
