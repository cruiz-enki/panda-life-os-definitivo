/**
 * **Componentes** del módulo **Introspección** — landing, categorías,
 * lista de ejercicios, player y pantalla de resultados.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Brain, Check, Crown, Lightbulb, Lock, Sparkles, Target, ListChecks, RotateCcw, Save, Heart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  INTROSPECTION_CATEGORIES,
  SCALE_LABELS,
  levelFromScore,
  levelToneFromScore,
  type IntrospectionInsights,
  type IntrospectionQuestion,
} from "@/lib/introspection-types";
import {
  useIntrospectionExercise,
  useIntrospectionExercises,
  useIntrospectionSession,
} from "@/hooks/use-introspection";

/* ============================================================ */
/* LANDING — categorías                                          */
/* ============================================================ */

export function IntrospectionLanding() {
  const { exercises } = useIntrospectionExercises();

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ex of exercises) m[ex.category] = (m[ex.category] ?? 0) + 1;
    return m;
  }, [exercises]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium">
          <Brain className="w-3.5 h-3.5" />
          Introspección
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Una guía inteligente
          <br />
          de autoconocimiento.
        </h1>
        <p className="text-muted-foreground max-w-xl text-base md:text-lg">
          Ejercicios guiados para conocerte, reflexionar y descubrir tus fortalezas con calma.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {INTROSPECTION_CATEGORIES.map((cat) => {
          const count = countByCategory[cat.key] ?? 0;
          return (
            <Link
              key={cat.key}
              to="/introspection/category/$categoryKey"
              params={{ categoryKey: cat.key }}
              className="group relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl transition-transform hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${cat.color_from}, ${cat.color_to})` }}
            >
              <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ background: "radial-gradient(circle at 20% 20%, white, transparent 60%)" }} />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="text-5xl">{cat.emoji}</div>
                  {cat.premium && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold uppercase tracking-wider">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold">{cat.name}</h2>
                  <p className="mt-1 text-white/85 text-sm md:text-base">{cat.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-white/80">{count} ejercicio{count === 1 ? "" : "s"}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}

        {/* Categorías futuras */}
        {["Encuentra tu calma", "Límites internos"].map((label) => (
          <div key={label} className="rounded-3xl p-6 md:p-8 border-2 border-dashed border-border bg-muted/30 flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Próximamente</span>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-muted-foreground/80">{label}</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Nuevas experiencias en camino.</p>
            </div>
          </div>
        ))}
      </section>

      <Disclaimer />
    </div>
  );
}

function Disclaimer({ variant }: { variant?: "financial" } = {}) {
  const text = variant === "financial"
    ? "Esta sección está diseñada para ayudarte a desarrollar mayor conciencia y bienestar financiero. No sustituye asesoría financiera, contable, fiscal o de inversión profesional."
    : "Este espacio está diseñado para apoyar tu autoconocimiento y bienestar emocional. No sustituye atención psicológica, médica o terapéutica profesional.";
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{text}</p>
    </div>
  );
}

/* ============================================================ */
/* CATEGORÍA — lista de ejercicios                              */
/* ============================================================ */

export function IntrospectionCategoryPage({ categoryKey }: { categoryKey: string }) {
  const cat = INTROSPECTION_CATEGORIES.find((c) => c.key === categoryKey);
  const { exercises, loading } = useIntrospectionExercises();
  const filtered = exercises.filter((e) => e.category === categoryKey);

  if (!cat) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Categoría no encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/introspection">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <Link to="/introspection" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Introspección
      </Link>

      <header
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${cat.color_from}, ${cat.color_to})` }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 10%, white, transparent 55%)" }} />
        <div className="relative space-y-2">
          <div className="text-5xl">{cat.emoji}</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">{cat.name}</h1>
          <p className="text-white/85 max-w-lg">{cat.description}</p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ejercicios</h2>
        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Cargando…</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Aún no hay ejercicios.</Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((ex) => (
              <Link
                key={ex.id}
                to="/introspection/exercise/$exerciseId"
                params={{ exerciseId: ex.id }}
                className="block group"
              >
                <Card className="p-5 md:p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 border-border/60">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${ex.color_from ?? cat.color_from}, ${ex.color_to ?? cat.color_to})` }}
                    >
                      {ex.emoji ?? "✨"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-display text-lg md:text-xl font-bold">{ex.name}</h3>
                        {ex.premium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        )}
                      </div>
                      {ex.subtitle && <p className="text-sm text-muted-foreground">{ex.subtitle}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {ex.duration_min && <span>⏱ {ex.duration_min}–{ex.duration_max} min</span>}
                        {ex.level && <span>📊 {ex.level}</span>}
                        {ex.type && <span>🎯 {ex.type}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground self-center transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Disclaimer variant={categoryKey === "financial_intelligence" ? "financial" : undefined} />

    </div>
  );
}

/* ============================================================ */
/* PLAYER — intro, preguntas, finalizar                          */
/* ============================================================ */

type PlayerPhase = "intro" | "question" | "submitting";

export function IntrospectionExercisePage({ exerciseId }: { exerciseId: string }) {
  const navigate = useNavigate();
  const { exercise, questions, session, answers, loading, startSession, saveAnswer, completeSession } = useIntrospectionExercise(exerciseId);

  const [phase, setPhase] = useState<PlayerPhase>("intro");
  const [index, setIndex] = useState(0);
  const [openDraft, setOpenDraft] = useState("");
  const [scaleDraft, setScaleDraft] = useState<number | null>(null);
  const [multiDraft, setMultiDraft] = useState<string[]>([]);

  // Si ya hay sesión activa con respuestas, saltar la intro
  useEffect(() => {
    if (!loading && session && Object.keys(answers).length > 0 && phase === "intro") {
      setPhase("question");
      const firstUnansweredIdx = questions.findIndex((q) => !answers[q.id]);
      if (firstUnansweredIdx >= 0) setIndex(firstUnansweredIdx);
    }
  }, [loading, session, answers, questions, phase]);

  const current = questions[index];

  // Sincronizar drafts cuando cambia la pregunta
  useEffect(() => {
    if (!current) return;
    const existing = answers[current.id];
    setOpenDraft(existing?.value_text ?? "");
    setScaleDraft(existing?.value_number ?? null);
    const arr = Array.isArray(existing?.value_json) ? (existing?.value_json as string[]) : [];
    setMultiDraft(arr);
  }, [current, answers]);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Cargando…</div>;
  }
  if (!exercise) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Ejercicio no encontrado.</p>
        <Button asChild variant="outline"><Link to="/introspection">Volver</Link></Button>
      </div>
    );
  }

  const gradient = `linear-gradient(135deg, ${exercise.color_from ?? "#f59e0b"}, ${exercise.color_to ?? "#ea580c"})`;

  /* -------- Intro -------- */
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link to="/introspection/category/$categoryKey" params={{ categoryKey: exercise.category }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="p-8 md:p-12 text-white relative" style={{ background: gradient }}>
            <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 0%, white, transparent 60%)" }} />
            <div className="relative space-y-3">
              <div className="text-6xl">{exercise.emoji ?? "🪞"}</div>
              <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">{exercise.name}</h1>
              {exercise.subtitle && <p className="text-white/85 text-base md:text-lg">{exercise.subtitle}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/85">
                {exercise.duration_min && <span className="px-2.5 py-1 rounded-full bg-white/15">⏱ {exercise.duration_min}–{exercise.duration_max} min</span>}
                {exercise.level && <span className="px-2.5 py-1 rounded-full bg-white/15">📊 {exercise.level}</span>}
                {exercise.premium && <span className="px-2.5 py-1 rounded-full bg-white/15 inline-flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-6 bg-card">
            {exercise.intro_text && (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
                {exercise.intro_text}
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold text-white border-0 shadow-lg hover:opacity-95"
              style={{ background: gradient }}
              onClick={async () => {
                await startSession();
                setPhase("question");
                setIndex(0);
              }}
            >
              <Sparkles className="w-5 h-5" />
              {session ? "Continuar introspección" : "Comenzar introspección"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Tus respuestas se guardan automáticamente. Puedes salir y continuar cuando quieras.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  /* -------- Submitting -------- */
  if (phase === "submitting") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse" style={{ background: gradient }}>✨</div>
          <h2 className="font-display text-xl font-bold">Analizando tus respuestas…</h2>
          <p className="text-sm text-muted-foreground">Estamos preparando una mirada cálida y profunda sobre lo que compartiste.</p>
        </div>
      </div>
    );
  }

  /* -------- Question -------- */
  if (!current) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Sin preguntas configuradas.</div>;
  }

  const total = questions.length;
  const progress = ((index + 1) / total) * 100;
  const minMulti = current.options?.min ?? 1;
  const maxMulti = current.options?.max ?? undefined;
  const answered =
    current.type === "scale"
      ? scaleDraft !== null
      : current.type === "multi"
        ? multiDraft.length >= minMulti
        : openDraft.trim().length > 0;
  const isLast = index === total - 1;
  const blockChange = index === 0 || questions[index - 1].block_key !== current.block_key;

  const handleSave = async () => {
    if (current.type === "scale" && scaleDraft !== null) {
      await saveAnswer(current.id, { value_number: scaleDraft });
    } else if (current.type === "multi" && multiDraft.length > 0) {
      await saveAnswer(current.id, { value_json: multiDraft, value_text: multiDraft.join(", ") });
    } else if (current.type === "open" && openDraft.trim().length > 0) {
      await saveAnswer(current.id, { value_text: openDraft.trim() });
    }
  };

  const handleNext = async () => {
    if (!answered) return;
    await handleSave();
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    setPhase("submitting");
    const final = await completeSession();
    if (final) {
      navigate({ to: "/introspection/result/$sessionId", params: { sessionId: final.id } });
    } else {
      toast.error("No pudimos completar la sesión. Inténtalo de nuevo.");
      setPhase("question");
    }
  };

  const handlePrev = async () => {
    if (index === 0) return;
    await handleSave();
    setIndex((i) => i - 1);
  };

  const toggleMulti = (choice: string) => {
    setMultiDraft((prev) => {
      if (prev.includes(choice)) return prev.filter((c) => c !== choice);
      if (maxMulti && prev.length >= maxMulti) return prev;
      return [...prev, choice];
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">{current.block_label}</span>
          <span>Pregunta {index + 1} de {total}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: gradient }} />
        </div>
      </div>

      <Card className="p-6 md:p-10 border-0 shadow-xl bg-card">
        {blockChange && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${exercise.color_from}15`, color: exercise.color_to ?? undefined }}>
            <Heart className="w-3 h-3" />
            Bloque · {current.block_label}
          </div>
        )}
        <h2 className="font-display text-2xl md:text-3xl font-bold leading-snug mb-8">{current.text}</h2>

        {current.type === "scale" ? (
          <ScaleAnswer
            value={scaleDraft}
            onChange={setScaleDraft}
            gradient={gradient}
            minLabel={current.meta?.min_label}
            maxLabel={current.meta?.max_label}
          />
        ) : current.type === "multi" ? (
          <MultiAnswer
            choices={current.options?.choices ?? []}
            selected={multiDraft}
            onToggle={toggleMulti}
            gradient={gradient}
            min={minMulti}
            max={maxMulti}
          />
        ) : (
          <OpenAnswer value={openDraft} onChange={setOpenDraft} />
        )}


        <div className="mt-10 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={handlePrev} disabled={index === 0}>
            <ArrowLeft className="w-4 h-4" /> Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={!answered}
            size="lg"
            className="text-white border-0 shadow-md"
            style={{ background: gradient }}
          >
            {isLast ? <>Finalizar <Check className="w-4 h-4" /></> : <>Siguiente <ArrowRight className="w-4 h-4" /></>}
          </Button>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">Tus respuestas se guardan automáticamente.</p>
    </div>
  );
}

function ScaleAnswer({
  value,
  onChange,
  gradient,
  minLabel,
  maxLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  gradient: string;
  minLabel?: string;
  maxLabel?: string;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`relative aspect-square rounded-2xl font-display text-2xl md:text-3xl font-bold transition-all border-2 ${
                active
                  ? "text-white border-transparent shadow-lg scale-105"
                  : "bg-secondary/50 text-foreground/70 border-border hover:border-foreground/30 hover:bg-secondary"
              }`}
              style={active ? { background: gradient } : undefined}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{minLabel ?? "Muy bajo"}</span>
        <span>Neutral</span>
        <span>{maxLabel ?? "Muy alto"}</span>
      </div>
      {value !== null && (
        <div className="text-center text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {SCALE_LABELS[value]}
        </div>
      )}
    </div>
  );
}

function MultiAnswer({
  choices,
  selected,
  onToggle,
  gradient,
  min,
  max,
}: {
  choices: string[];
  selected: string[];
  onToggle: (c: string) => void;
  gradient: string;
  min: number;
  max?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => {
          const active = selected.includes(c);
          const reachedMax = !active && max !== undefined && selected.length >= max;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              disabled={reachedMax}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                active
                  ? "text-white border-transparent shadow-md scale-[1.02]"
                  : reachedMax
                    ? "bg-muted/40 text-muted-foreground/50 border-border/40 cursor-not-allowed"
                    : "bg-secondary/40 text-foreground/80 border-border hover:border-foreground/30 hover:bg-secondary"
              }`}
              style={active ? { background: gradient } : undefined}
            >
              {active && <Check className="w-3.5 h-3.5 inline -ml-1 mr-1" />}
              {c}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Selecciona al menos {min}
          {max ? ` · máx ${max}` : ""}
        </span>
        <span>{selected.length} seleccionada{selected.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}


function OpenAnswer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe lo que sientas, sin filtros…"
        rows={6}
        className="text-base resize-none rounded-2xl border-border focus-visible:ring-2"
      />
      <p className="text-xs text-muted-foreground text-right">{value.trim().length} caracteres</p>
    </div>
  );
}

/* ============================================================ */
/* RESULTADOS                                                    */
/* ============================================================ */

export function IntrospectionResultPage({ sessionId }: { sessionId: string }) {
  const { session, exercise, loading, updateNotes } = useIntrospectionSession(sessionId);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (session?.notes) {
      setNotes(session.notes);
      setShowNotes(true);
    }
  }, [session?.notes]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Cargando resultados…</div>;
  if (!session || !exercise) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Resultado no encontrado.</p>
        <Button asChild variant="outline"><Link to="/introspection">Volver</Link></Button>
      </div>
    );
  }

  const gradient = `linear-gradient(135deg, ${exercise.color_from ?? "#f59e0b"}, ${exercise.color_to ?? "#ea580c"})`;
  const score = session.score ?? 0;
  const scoreMax = session.score_max ?? 100;
  const percent = scoreMax > 0 ? Math.round((score / scoreMax) * 100) : 0;
  const levelLabel = session.level_label ?? levelFromScore(percent);
  const tone = levelToneFromScore(percent);
  const insights = (session.ai_result ?? {}) as IntrospectionInsights;

  const handleSaveNotes = async () => {
    await updateNotes(notes);
    toast.success("Reflexión guardada");
  };

  const recommendation = pickRecommendation(tone);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
      <Link to="/introspection" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Introspección
      </Link>

      {/* HERO con score */}
      <Card className="relative overflow-hidden border-0 shadow-2xl text-white" >
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 10%, white, transparent 60%)" }} />
        <div className="relative p-8 md:p-12">
          <div className="text-sm uppercase tracking-wider text-white/80 mb-1">{exercise.name}</div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-8">Tu radiografía personal</h1>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreGauge percent={percent} />
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="text-5xl md:text-6xl font-display font-bold">{score}<span className="text-2xl text-white/70">/{scoreMax}</span></div>
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-semibold">{levelLabel}</div>
              {session.score_secondary !== null && session.score_secondary !== undefined && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-white/70">
                    {exercise.id === "know_yourself_003"
                      ? "Desconexión interna"
                      : exercise.id === "know_yourself_005"
                        ? "Autoaceptación"
                        : exercise.id === "know_yourself_006"
                          ? "Autenticidad percibida"
                          : exercise.id === "know_yourself_007"
                            ? "Autocuidado"
                      : exercise.id === "emotional_mastery_001"
                        ? "Saturación emocional"
                        : exercise.id === "emotional_mastery_002"
                          ? "Autoconocimiento emocional"
                      : exercise.id === "emotional_mastery_003"
                            ? "Capacidad de reencuadre"
                            : exercise.id === "emotional_mastery_004"
                              ? "Profundidad emocional"
                            : exercise.id === "find_calm_001"
                              ? "Saturación mental"
                            : exercise.id === "find_calm_002"
                              ? "Dependencia de hábitos poco útiles"
                            : exercise.id === "find_calm_003"
                              ? "Sobrepensamiento"
                            : exercise.id === "find_calm_004"
                              ? "Conexión corporal"
                            : exercise.id === "inner_boundaries_001"
                              ? "Complacencia emocional"
                            : exercise.id === "inner_boundaries_004"
                              ? "Complacencia emocional"
                            : exercise.id === "inner_boundaries_005"
                              ? "Evitación"
                            : exercise.id === "inner_boundaries_006"
                              ? "Evitación emocional"
                            : exercise.id === "financial_intelligence_002"
                              ? "Merecimiento financiero"
                            : "Desgaste emocional"}
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="text-2xl font-display font-bold">{session.score_secondary}<span className="text-base text-white/70">/{session.score_secondary_max ?? 100}</span></div>
                    {session.level_secondary_label && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{session.level_secondary_label}</span>
                    )}
                  </div>
                </div>
              )}
              {insights.limiting_narrative_score !== undefined && insights.limiting_narrative_score !== null && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-white/70">Narrativa limitante</div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="text-2xl font-display font-bold">{insights.limiting_narrative_score}<span className="text-base text-white/70">/100</span></div>
                    {insights.limiting_narrative_level && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{insights.limiting_narrative_level}</span>
                    )}
                  </div>
                </div>
              )}
              {insights.self_demand_score !== undefined && insights.self_demand_score !== null && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-white/70">Autoexigencia emocional</div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="text-2xl font-display font-bold">{insights.self_demand_score}<span className="text-base text-white/70">/100</span></div>
                    {insights.self_demand_level && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{insights.self_demand_level}</span>
                    )}
                  </div>
                </div>
              )}
              {insights.mental_saturation_score !== undefined && insights.mental_saturation_score !== null && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-white/70">Saturación mental</div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="text-2xl font-display font-bold">{insights.mental_saturation_score}<span className="text-base text-white/70">/100</span></div>
                    {insights.mental_saturation_level && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{insights.mental_saturation_level}</span>
                    )}
                  </div>
                </div>
              )}
              {insights.abc_intensity_score !== undefined && insights.abc_intensity_score !== null && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-white/70">Intensidad emocional</div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="text-2xl font-display font-bold">{insights.abc_intensity_score}<span className="text-base text-white/70">/100</span></div>
                    {insights.abc_intensity_level && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{insights.abc_intensity_level}</span>
                    )}
                  </div>
                </div>
              )}
              {insights.score_interpretation && (
                <p className="text-white/90 text-sm md:text-base mt-2 max-w-md mx-auto md:mx-0">{insights.score_interpretation}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Versiones detectadas — específico Capas de Identidad */}
      {(insights.most_authentic_version || insights.most_exhausted_version) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.most_authentic_version && (
            <Card className="p-6 border-l-4 border-emerald-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Tu versión más auténtica</div>
              <p className="text-lg font-medium leading-snug">{insights.most_authentic_version}</p>
            </Card>
          )}
          {insights.most_exhausted_version && (
            <Card className="p-6 border-l-4 border-rose-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">Tu versión más agotada</div>
              <p className="text-lg font-medium leading-snug">{insights.most_exhausted_version}</p>
            </Card>
          )}
        </div>
      )}

      {/* Yo del Futuro — específico Mi Yo del Futuro */}
      {insights.future_identity && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 80% 0%, white, transparent 55%)" }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu yo futuro</div>
            <p className="font-display text-2xl md:text-3xl font-bold leading-snug">"{insights.future_identity}"</p>
            {insights.future_self_summary && (
              <p className="text-white/90 leading-relaxed pt-2">{insights.future_self_summary}</p>
            )}
          </div>
        </Card>
      )}

      {insights.distance_from_future_self && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#a78bfa" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu distancia con esa versión</div>
          <p className="text-foreground/90 leading-relaxed">{insights.distance_from_future_self}</p>
        </Card>
      )}

      {(insights.main_blockers?.length || insights.main_strengths?.length) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.main_blockers && insights.main_blockers.length > 0 && (
            <Card className="p-6 border-l-4 border-rose-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">Qué te está alejando</div>
              <ul className="space-y-2 text-foreground/90 text-sm">
                {insights.main_blockers.map((b, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">•</span>{b}</li>)}
              </ul>
            </Card>
          )}
          {insights.main_strengths && insights.main_strengths.length > 0 && (
            <Card className="p-6 border-l-4 border-emerald-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">Lo que ya tienes a tu favor</div>
              <ul className="space-y-2 text-foreground/90 text-sm">
                {insights.main_strengths.map((b, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{b}</li>)}
              </ul>
            </Card>
          )}
        </div>
      ) : null}

      {insights.hidden_fears && insights.hidden_fears.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Miedos que detectamos</div>
          <div className="flex flex-wrap gap-2">
            {insights.hidden_fears.map((f, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm">{f}</span>
            ))}
          </div>
        </Card>
      )}

      {insights.recommended_habits && insights.recommended_habits.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Hábitos para acercarte</h3>
          <ul className="space-y-2 text-foreground/90">
            {insights.recommended_habits.map((h, i) => (
              <li key={i} className="flex gap-3"><Check className="w-4 h-4 mt-1 shrink-0" style={{ color: exercise.color_to ?? "#7c3aed" }} />{h}</li>
            ))}
          </ul>
        </Card>
      )}

      {insights.future_message && (
        <Card className="p-6 md:p-10 border-2" style={{ borderColor: `${exercise.color_from}50` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">El mensaje que tu yo futuro quiere recordarte</div>
          <p className="font-display text-xl md:text-2xl leading-relaxed italic" style={{ color: exercise.color_to ?? "#7c3aed" }}>
            "{insights.future_message}"
          </p>
        </Card>
      )}

      {insights.first_small_step && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu primer paso pequeño</div>
          <p className="text-lg font-medium leading-snug">{insights.first_small_step}</p>
        </Card>
      )}

      {/* Valores Centrales — específico Mi Brújula Interior */}
      {insights.core_values && insights.core_values.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Tus 3 valores centrales</h3>
          <div className="flex flex-wrap gap-3">
            {insights.core_values.slice(0, 3).map((v, i) => (
              <div
                key={i}
                className="px-5 py-3 rounded-2xl text-white font-display font-bold text-lg shadow-md"
                style={{ background: gradient }}
              >
                {v}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conflicto principal — específico Brújula */}
      {insights.main_conflict && (
        <Card className="p-6 md:p-8 border-l-4 border-rose-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">Tu principal conflicto interno</div>
          <p className="text-lg font-medium leading-snug">{insights.main_conflict}</p>
        </Card>
      )}

      {/* Resumen de alineación de vida — Brújula */}
      {insights.life_alignment_summary && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu alineación de vida</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.life_alignment_summary}</p>
        </Card>
      )}

      {insights.mask_analysis && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Análisis de tus máscaras</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.mask_analysis}</p>
        </Card>
      )}

      {/* Específico — Las Historias Que Me Cuento */}
      {insights.dominant_story && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 0%, white, transparent 55%)" }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">La historia que más te limita</div>
            <p className="font-display text-2xl md:text-3xl font-bold leading-snug">"{insights.dominant_story}"</p>
            {insights.self_talk_summary && (
              <p className="text-white/90 leading-relaxed pt-2">{insights.self_talk_summary}</p>
            )}
          </div>
        </Card>
      )}

      {insights.main_limiting_belief && (
        <Card className="p-6 md:p-8 border-l-4 border-rose-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">Creencia limitante principal</div>
          <p className="text-lg font-medium leading-snug">{insights.main_limiting_belief}</p>
          {insights.probable_origin && (
            <p className="text-sm text-muted-foreground mt-3"><span className="font-semibold">Origen probable:</span> {insights.probable_origin}</p>
          )}
        </Card>
      )}

      {insights.healthier_reframe && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}50` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Reencuadre más sano</div>
          <p className="font-display text-xl md:text-2xl leading-relaxed italic" style={{ color: exercise.color_to ?? "#db2777" }}>
            "{insights.healthier_reframe}"
          </p>
        </Card>
      )}

      {insights.self_sabotage_patterns && insights.self_sabotage_patterns.length > 0 && (
        <InsightList
          title="Patrones de autosabotaje"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.self_sabotage_patterns}
          tone="muted"
        />
      )}

      {insights.daily_reframe && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: exercise.color_to ?? "#db2777" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reframe diario</span>
          </div>
          <p className="font-display text-lg md:text-xl leading-relaxed">"{insights.daily_reframe}"</p>
          <p className="text-xs text-muted-foreground mt-3">Lo verás cada mañana como recordatorio personalizado.</p>
        </Card>
      )}

      {/* Específico — Mi Espejo Honesto */}
      {insights.self_image_summary && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 0%, white, transparent 55%)" }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu autoimagen actual</div>
            <p className="text-white/95 leading-relaxed whitespace-pre-line">{insights.self_image_summary}</p>
          </div>
        </Card>
      )}

      {(insights.most_visible_mask || insights.main_fear) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.most_visible_mask && (
            <Card className="p-6 border-l-4 border-slate-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Tu máscara más visible</div>
              <p className="text-lg font-medium leading-snug">{insights.most_visible_mask}</p>
            </Card>
          )}
          {insights.main_fear && (
            <Card className="p-6 border-l-4 border-rose-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">Tu miedo central</div>
              <p className="text-lg font-medium leading-snug">{insights.main_fear}</p>
            </Card>
          )}
        </div>
      )}

      {insights.blind_spots && insights.blind_spots.length > 0 && (
        <InsightList
          title="Tus puntos ciegos probables"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.blind_spots}
          tone="muted"
        />
      )}

      {insights.hidden_strengths && insights.hidden_strengths.length > 0 && (
        <InsightList
          title="Fortalezas invisibles que aún no te reconoces"
          icon={<Sparkles className="w-4 h-4" />}
          items={insights.hidden_strengths}
          tone="success"
        />
      )}

      {insights.self_compassion_level && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? "#475569" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">La parte de ti que necesita más compasión</div>
          <p className="text-foreground/90 leading-relaxed">{insights.self_compassion_level}</p>
        </Card>
      )}

      {insights.loving_message_to_self && (
        <Card className="p-6 md:p-10 border-2 relative overflow-hidden" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="absolute top-0 right-0 text-7xl opacity-10 leading-none">💌</div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4" style={{ color: exercise.color_to ?? "#475569" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carta desde alguien que te ama</span>
            </div>
            <p className="font-display text-lg md:text-xl leading-relaxed italic whitespace-pre-line" style={{ color: exercise.color_to ?? "#475569" }}>
              {insights.loving_message_to_self}
            </p>
          </div>
        </Card>
      )}

      {/* Específico — Lo Que Me Está Drenando */}
      {insights.energy_summary && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 20% 80%, white, transparent 55%)" }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu mapa energético</div>
            <p className="text-white/95 leading-relaxed whitespace-pre-line">{insights.energy_summary}</p>
          </div>
        </Card>
      )}

      {(insights.main_energy_drainers?.length || insights.hidden_weight) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.main_energy_drainers && insights.main_energy_drainers.length > 0 && (
            <Card className="p-6 border-l-4 border-rose-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">Tus principales fugas de energía</div>
              <ul className="space-y-2 text-foreground/90 text-sm">
                {insights.main_energy_drainers.map((b, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">•</span>{b}</li>)}
              </ul>
            </Card>
          )}
          {insights.hidden_weight && (
            <Card className="p-6 border-l-4 border-slate-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Lo que estás cargando en silencio</div>
              <p className="text-foreground/90 leading-relaxed">{insights.hidden_weight}</p>
            </Card>
          )}
        </div>
      ) : null}

      {insights.self_neglect_patterns && insights.self_neglect_patterns.length > 0 && (
        <InsightList
          title="Patrones de autoabandono"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.self_neglect_patterns}
          tone="muted"
        />
      )}

      {insights.recovery_actions && insights.recovery_actions.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Plan de recuperación · 7 días</h3>
          <ul className="space-y-2 text-foreground/90">
            {insights.recovery_actions.map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: gradient }}>{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {insights.compassionate_message && (
        <Card className="p-6 md:p-10 border-2 relative overflow-hidden" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="absolute top-0 right-0 text-7xl opacity-10 leading-none">🌊</div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4" style={{ color: exercise.color_to ?? "#a78bfa" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Un mensaje para ti hoy</span>
            </div>
            <p className="font-display text-lg md:text-xl leading-relaxed italic whitespace-pre-line" style={{ color: exercise.color_to ?? "#a78bfa" }}>
              {insights.compassionate_message}
            </p>
          </div>
        </Card>
      )}

      {/* Específico — Termómetro Emocional */}
      {(insights.dominant_emotion || insights.emotional_need) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.dominant_emotion && (
            <Card className="p-6 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#60a5fa" }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Emoción dominante hoy</div>
              <p className="text-2xl font-display font-bold leading-snug">{insights.dominant_emotion}</p>
              {insights.likely_trigger && <p className="text-sm text-muted-foreground mt-2">Detonante: {insights.likely_trigger}</p>}
            </Card>
          )}
          {insights.emotional_need && (
            <Card className="p-6 border-l-4 border-violet-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">Quizá hoy necesitas…</div>
              <p className="text-lg font-medium leading-snug">{insights.emotional_need}</p>
            </Card>
          )}
        </div>
      )}

      {insights.micro_ritual && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu micro ritual de hoy</div>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.micro_ritual}</p>
        </Card>
      )}

      {insights.helpful_reframe && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? "#a78bfa" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Un reencuadre amable</div>
          <p className="font-display text-lg italic leading-relaxed" style={{ color: exercise.color_to ?? "#a78bfa" }}>"{insights.helpful_reframe}"</p>
        </Card>
      )}

      {insights.gentle_reflection && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Una pregunta para ti</div>
          <p className="text-lg leading-relaxed">{insights.gentle_reflection}</p>
        </Card>
      )}

      {/* Específico — Mis Detonantes Emocionales */}
      {(insights.dominant_trigger || insights.reaction_style || insights.hidden_emotional_need) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.dominant_trigger && (
            <Card className="p-6 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#f472b6" }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu detonante principal</div>
              <p className="text-lg font-medium leading-snug">{insights.dominant_trigger}</p>
              {insights.dominant_emotion && (
                <p className="text-sm text-muted-foreground mt-2">Emoción más activada: <span className="font-medium text-foreground/80">{insights.dominant_emotion}</span></p>
              )}
            </Card>
          )}
          {insights.reaction_style && (
            <Card className="p-6 border-l-4 border-amber-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">Tu estilo de reacción</div>
              <p className="text-lg font-medium leading-snug">{insights.reaction_style}</p>
            </Card>
          )}
          {insights.hidden_emotional_need && (
            <Card className="p-6 border-l-4 border-violet-500 md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">La necesidad emocional detrás</div>
              <p className="text-lg font-medium leading-snug">{insights.hidden_emotional_need}</p>
            </Card>
          )}
        </div>
      )}

      {insights.main_pattern && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu patrón emocional</div>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.main_pattern}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted">Detonante</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-muted">Emoción</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-muted">Reacción</span>
            <span>→</span>
            <span className="px-2 py-1 rounded-full bg-muted">Necesidad</span>
          </div>
        </Card>
      )}

      {insights.regulation_tips && insights.regulation_tips.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Plan de regulación sugerido</div>
          <ul className="space-y-2">
            {insights.regulation_tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-foreground/90 leading-relaxed">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `${exercise.color_from}20`, color: exercise.color_to ?? "#a78bfa" }}>{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {insights.next_time_reminder && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? "#a78bfa" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Para la próxima vez que te actives</div>
          <p className="font-display text-xl md:text-2xl italic leading-snug" style={{ color: exercise.color_to ?? "#a78bfa" }}>"{insights.next_time_reminder}"</p>
        </Card>
      )}

      {/* Específico — El ABC de Mis Emociones */}
      {(insights.event_summary || insights.automatic_thought || insights.reaction_pattern) && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu patrón emocional</div>
          <div className="grid gap-3 md:grid-cols-4 text-sm">
            {[
              { label: "Situación", value: insights.event_summary },
              { label: "Pensamiento", value: insights.automatic_thought },
              { label: "Emoción", value: insights.dominant_emotion },
              { label: "Reacción", value: insights.reaction_pattern },
            ].map((step, i, arr) => step.value ? (
              <div key={i} className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{step.label}{i < arr.length - 1 ? " →" : ""}</div>
                <p className="font-medium leading-snug">{step.value}</p>
              </div>
            ) : null)}
          </div>
        </Card>
      )}

      {insights.hidden_interpretation && (
        <Card className="p-6 md:p-8 border-l-4 border-violet-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">La interpretación que pudo influir</div>
          <p className="text-foreground/90 leading-relaxed">{insights.hidden_interpretation}</p>
        </Card>
      )}

      {insights.gentle_reframe && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? "#a78bfa" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Un pensamiento nuevo</div>
          <p className="font-display text-xl md:text-2xl italic leading-snug" style={{ color: exercise.color_to ?? "#a78bfa" }}>"{insights.gentle_reframe}"</p>
        </Card>
      )}

      {insights.next_time_tool && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu herramienta para la próxima vez</div>
          <p className="text-lg leading-relaxed">{insights.next_time_tool}</p>
        </Card>
      )}

      {/* Específico — La Emoción Debajo de la Emoción */}
      {(insights.surface_emotion || insights.hidden_emotion) && (
        <Card className="relative overflow-hidden border-0 shadow-xl text-white">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 0%, white, transparent 55%)" }} />
          <div className="relative p-6 md:p-8 grid gap-4 md:grid-cols-2">
            {insights.surface_emotion && (
              <div>
                <div className="text-xs uppercase tracking-wider text-white/80 mb-1">Tu emoción visible</div>
                <p className="font-display text-2xl md:text-3xl font-bold leading-snug">{insights.surface_emotion}</p>
              </div>
            )}
            {insights.hidden_emotion && (
              <div>
                <div className="text-xs uppercase tracking-wider text-white/80 mb-1">La emoción debajo</div>
                <p className="font-display text-2xl md:text-3xl font-bold leading-snug">{insights.hidden_emotion}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {(insights.main_need || insights.main_fear) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.main_need && (
            <Card className="p-6 border-l-4 border-emerald-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Lo que probablemente necesitabas</div>
              <p className="text-lg font-medium leading-snug">{insights.main_need}</p>
            </Card>
          )}
          {insights.main_fear && (
            <Card className="p-6 border-l-4 border-rose-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">El miedo detrás</div>
              <p className="text-lg font-medium leading-snug">{insights.main_fear}</p>
            </Card>
          )}
        </div>
      )}

      {insights.emotional_pattern && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mapa de tu emoción profunda</div>
          <p className="text-foreground/90 leading-relaxed">{insights.emotional_pattern}</p>
        </Card>
      )}

      {insights.protective_pattern && (
        <Card className="p-6 md:p-8 border-l-4 border-violet-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">Cómo te has estado protegiendo</div>
          <p className="text-foreground/90 leading-relaxed">{insights.protective_pattern}</p>
        </Card>
      )}

      {insights.self_validation_message && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? "#db2777" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lo que esa parte de ti necesita escuchar</div>
          <p className="font-display text-xl md:text-2xl italic leading-snug" style={{ color: exercise.color_to ?? "#db2777" }}>"{insights.self_validation_message}"</p>
        </Card>
      )}

      {insights.micro_healing_action && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Micro acción de autocuidado</div>
          <p className="text-lg leading-relaxed">{insights.micro_healing_action}</p>
        </Card>
      )}

      {/* Específico — Mi Estado Interior (Encuentra tu Calma) */}
      {insights.inner_state_summary && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 0%, white, transparent 55%)" }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu estado interior hoy</div>
            <p className="text-white/95 leading-relaxed whitespace-pre-line">{insights.inner_state_summary}</p>
          </div>
        </Card>
      )}
      {(insights.mental_load || insights.body_state) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.mental_load && (
            <Card className="p-6 border-l-4 border-sky-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-300 mb-2">Tu carga mental</div>
              <p className="text-foreground/90 leading-relaxed">{insights.mental_load}</p>
            </Card>
          )}
          {insights.body_state && (
            <Card className="p-6 border-l-4 border-violet-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">Tu cuerpo hoy</div>
              <p className="text-foreground/90 leading-relaxed">{insights.body_state}</p>
            </Card>
          )}
        </div>
      )}
      {insights.body_message && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quizá hoy tu cuerpo quiere decirte…</div>
          <p className="font-display text-xl md:text-2xl italic leading-snug" style={{ color: exercise.color_to ?? "#a78bfa" }}>"{insights.body_message}"</p>
        </Card>
      )}
      {insights.gentle_recommendation && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recomendación amable</div>
          <p className="text-foreground/90 leading-relaxed">{insights.gentle_recommendation}</p>
        </Card>
      )}
      {insights.micro_ritual && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Micro ritual</div>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.micro_ritual}</p>
        </Card>
      )}
      {insights.reflection_question && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#93c5fd" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Una pregunta suave</div>
          <p className="text-lg italic leading-snug">{insights.reflection_question}</p>
        </Card>
      )}
      {insights.next_24h_focus && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Para las próximas 24 horas</div>
          <p className="text-lg font-medium leading-snug">{insights.next_24h_focus}</p>
        </Card>
      )}
      {(insights.regulation_score !== undefined || insights.fatigue_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.regulation_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Regulación emocional</div>
              <div className="text-3xl font-display font-bold">{insights.regulation_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.regulation_level_label && <div className="text-sm text-muted-foreground">{insights.regulation_level_label}</div>}
            </Card>
          )}
          {insights.fatigue_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fatiga emocional</div>
              <div className="text-3xl font-display font-bold">{insights.fatigue_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.fatigue_level && <div className="text-sm text-muted-foreground">{insights.fatigue_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Mi Kit de Calma Personal */}
      {insights.calm_profile && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu perfil de calma</div>
            <div className="flex items-center gap-3">
              {insights.calm_profile_emoji && <span className="text-4xl">{insights.calm_profile_emoji}</span>}
              <h2 className="font-display text-2xl md:text-3xl font-bold">{insights.calm_profile}</h2>
            </div>
            {insights.calm_profile_description && (
              <p className="text-white/95 leading-relaxed">{insights.calm_profile_description}</p>
            )}
          </div>
        </Card>
      )}
      {insights.best_regulation_tools && insights.best_regulation_tools.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tus herramientas más efectivas</div>
          <div className="flex flex-wrap gap-2">
            {insights.best_regulation_tools.map((t, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${exercise.color_from}25`, color: exercise.color_to ?? "#0f766e" }}>{t}</span>
            ))}
          </div>
        </Card>
      )}
      {insights.unhelpful_patterns && insights.unhelpful_patterns.length > 0 && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">Patrones que te dejan peor</div>
          <ul className="space-y-1.5">
            {insights.unhelpful_patterns.map((p, i) => (
              <li key={i} className="text-foreground/90 leading-relaxed">• {p}</li>
            ))}
          </ul>
        </Card>
      )}
      {insights.personal_refuge && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu refugio emocional</div>
          <p className="font-display text-lg md:text-xl italic leading-snug" style={{ color: exercise.color_to ?? "#0f766e" }}>{insights.personal_refuge}</p>
        </Card>
      )}
      {insights.recommended_calm_protocol && insights.recommended_calm_protocol.length > 0 && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu protocolo de calma</div>
          <ol className="space-y-2">
            {insights.recommended_calm_protocol.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: exercise.color_to ?? "#0f766e" }}>{i + 1}</span>
                <span className="text-foreground/90 leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {insights.emergency_grounding_tool && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}50` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">🆘 Herramienta de emergencia</div>
          <p className="text-lg font-medium leading-snug">{insights.emergency_grounding_tool}</p>
        </Card>
      )}
      {insights.compassionate_message && exercise.id === "find_calm_002" && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#93c5fd" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mensaje para ti</div>
          <p className="text-foreground/90 leading-relaxed">{insights.compassionate_message}</p>
        </Card>
      )}
      {(insights.inner_resource_score !== undefined || (exercise.id === "find_calm_002" && insights.main_need)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.inner_resource_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fortaleza de recursos internos</div>
              <div className="text-3xl font-display font-bold">{insights.inner_resource_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.inner_resource_level && <div className="text-sm text-muted-foreground">{insights.inner_resource_level}</div>}
            </Card>
          )}
          {exercise.id === "find_calm_002" && insights.main_need && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tu necesidad principal</div>
              <p className="text-lg font-medium leading-snug">{insights.main_need}</p>
            </Card>
          )}
        </div>
      )}

      {/* Específico — Silenciar Mi Mente */}
      {exercise.id === "find_calm_003" && insights.mental_state_summary && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu mente hoy</div>
            <p className="text-white/95 leading-relaxed whitespace-pre-line">{insights.mental_state_summary}</p>
          </div>
        </Card>
      )}
      {exercise.id === "find_calm_003" && insights.main_mental_loads && insights.main_mental_loads.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Lo que más ocupa tu mente</div>
          <div className="flex flex-wrap gap-2">
            {insights.main_mental_loads.map((l, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${exercise.color_from}25`, color: exercise.color_to ?? "#4338ca" }}>{l}</span>
            ))}
          </div>
        </Card>
      )}
      {exercise.id === "find_calm_003" && insights.dominant_thought && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#a78bfa" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu pensamiento dominante</div>
          <p className="font-display text-lg md:text-xl italic leading-snug">"{insights.dominant_thought}"</p>
          {insights.overthinking_pattern && (
            <p className="text-sm text-muted-foreground mt-3">{insights.overthinking_pattern}</p>
          )}
        </Card>
      )}
      {exercise.id === "find_calm_003" && insights.control_patterns && insights.control_patterns.length > 0 && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">Lo que intentas controlar demasiado</div>
          <ul className="space-y-1.5">
            {insights.control_patterns.map((p, i) => <li key={i} className="text-foreground/90 leading-relaxed">• {p}</li>)}
          </ul>
        </Card>
      )}
      {exercise.id === "find_calm_003" && insights.what_can_wait && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lo que puedes soltar por hoy</div>
          <p className="text-lg leading-snug">{insights.what_can_wait}</p>
        </Card>
      )}
      {exercise.id === "find_calm_003" && insights.micro_relief_action && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}50` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Micro acción de alivio</div>
          <p className="text-lg font-medium leading-snug">{insights.micro_relief_action}</p>
        </Card>
      )}
      {exercise.id === "find_calm_003" && (insights.cognitive_saturation_score !== undefined || insights.release_capacity_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.cognitive_saturation_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Saturación cognitiva</div>
              <div className="text-3xl font-display font-bold">{insights.cognitive_saturation_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.cognitive_saturation_level && <div className="text-sm text-muted-foreground">{insights.cognitive_saturation_level}</div>}
            </Card>
          )}
          {insights.release_capacity_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Capacidad de soltar</div>
              <div className="text-3xl font-display font-bold">{insights.release_capacity_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.release_capacity_level && <div className="text-sm text-muted-foreground">{insights.release_capacity_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Escuchar a Mi Cuerpo (find_calm_004) */}
      {exercise.id === "find_calm_004" && insights.body_state_summary && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu estado corporal hoy</div>
            <p className="text-white/95 leading-relaxed whitespace-pre-line">{insights.body_state_summary}</p>
          </div>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.tension_zones && insights.tension_zones.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tus zonas de tensión</div>
          <div className="flex flex-wrap gap-2">
            {insights.tension_zones.map((z, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${exercise.color_from}25`, color: exercise.color_to ?? "#0f766e" }}>{z}</span>
            ))}
          </div>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.possible_emotional_connection && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#86b6a1" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quizá tu cuerpo quiere decirte…</div>
          <p className="text-foreground/90 leading-relaxed">{insights.possible_emotional_connection}</p>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.body_need && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lo que tu cuerpo necesita</div>
          <p className="text-lg font-medium leading-snug">{insights.body_need}</p>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.ignored_signal && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">Una señal que has estado ignorando</div>
          <p className="text-foreground/90 leading-relaxed">{insights.ignored_signal}</p>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.gentle_body_recommendation && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recomendación amable</div>
          <p className="text-foreground/90 leading-relaxed">{insights.gentle_body_recommendation}</p>
        </Card>
      )}
      {exercise.id === "find_calm_004" && insights.micro_body_ritual && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mini ritual corporal</div>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.micro_body_ritual}</p>
        </Card>
      )}
      {exercise.id === "find_calm_004" && (insights.body_fatigue_score !== undefined || insights.body_regulation_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.body_fatigue_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fatiga físico-emocional</div>
              <div className="text-3xl font-display font-bold">{insights.body_fatigue_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.body_fatigue_level && <div className="text-sm text-muted-foreground">{insights.body_fatigue_level}</div>}
            </Card>
          )}
          {insights.body_regulation_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Regulación corporal</div>
              <div className="text-3xl font-display font-bold">{insights.body_regulation_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.body_regulation_level && <div className="text-sm text-muted-foreground">{insights.body_regulation_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Mi Relación con el "No" (inner_boundaries_001) */}
      {exercise.id === "inner_boundaries_001" && insights.boundary_style && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu estilo de límites</div>
            <p className="text-white/95 leading-relaxed">{insights.boundary_style}</p>
            {insights.people_pleasing_level_label && (
              <p className="text-sm text-white/80 italic">{insights.people_pleasing_level_label}</p>
            )}
          </div>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && insights.main_boundary_issue && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#7c2d3a" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">El límite que más te cuesta hoy</div>
          <p className="font-display text-lg md:text-xl leading-snug">{insights.main_boundary_issue}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && insights.hidden_cost && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">El costo invisible</div>
          <p className="text-foreground/90 leading-relaxed">{insights.hidden_cost}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && insights.healthy_boundary_phrase && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Una frase de límite para ti</div>
          <p className="font-display text-lg md:text-xl italic leading-snug">"{insights.healthy_boundary_phrase}"</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && insights.boundary_library_phrases && insights.boundary_library_phrases.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu biblioteca de frases de límites</div>
          <ul className="space-y-2">
            {insights.boundary_library_phrases.map((p, i) => (
              <li key={i} className="px-4 py-3 rounded-lg text-sm md:text-base leading-snug" style={{ background: `${exercise.color_from}15` }}>
                "{p}"
              </li>
            ))}
          </ul>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && insights.first_boundary_action && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu primer micro límite esta semana</div>
          <p className="text-lg font-medium leading-snug">{insights.first_boundary_action}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_001" && (insights.interpersonal_guilt_score !== undefined || insights.relational_exhaustion_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.interpersonal_guilt_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Culpa interpersonal</div>
              <div className="text-3xl font-display font-bold">{insights.interpersonal_guilt_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.interpersonal_guilt_level && <div className="text-sm text-muted-foreground">{insights.interpersonal_guilt_level}</div>}
            </Card>
          )}
          {insights.relational_exhaustion_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Desgaste relacional</div>
              <div className="text-3xl font-display font-bold">{insights.relational_exhaustion_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.relational_exhaustion_level && <div className="text-sm text-muted-foreground">{insights.relational_exhaustion_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Mi Culpa al Elegirme (inner_boundaries_004) */}
      {exercise.id === "inner_boundaries_004" && insights.guilt_level && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu relación con la culpa al elegirte</div>
            <p className="text-white/95 leading-relaxed">{insights.guilt_level}</p>
            {insights.people_pleasing_pattern && (
              <p className="text-sm text-white/85 italic">{insights.people_pleasing_pattern}</p>
            )}
          </div>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && insights.main_guilt_trigger && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_from ?? "#7c2d3a" }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu momento de culpa más característico</div>
          <p className="font-display text-lg md:text-xl leading-snug">{insights.main_guilt_trigger}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && (insights.learned_belief || insights.hidden_fear) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.learned_belief && (
            <Card className="p-6 md:p-8 border-l-4 border-rose-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300 mb-2">La creencia que cargas</div>
              <p className="text-foreground/90 leading-relaxed italic">"{insights.learned_belief}"</p>
            </Card>
          )}
          {insights.hidden_fear && (
            <Card className="p-6 md:p-8 border-l-4 border-amber-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">El miedo detrás</div>
              <p className="text-foreground/90 leading-relaxed">{insights.hidden_fear}</p>
            </Card>
          )}
        </div>
      )}
      {exercise.id === "inner_boundaries_004" && insights.hidden_cost && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">El costo invisible de no elegirte</div>
          <p className="text-foreground/90 leading-relaxed">{insights.hidden_cost}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && insights.healthy_reframe && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Un reframe amable para ti</div>
          <p className="font-display text-lg md:text-xl italic leading-snug">"{insights.healthy_reframe}"</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && insights.reframe_library && insights.reframe_library.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu biblioteca de reframes de culpa</div>
          <ul className="space-y-2">
            {insights.reframe_library.map((p, i) => (
              <li key={i} className="px-4 py-3 rounded-lg text-sm md:text-base leading-snug" style={{ background: `${exercise.color_from}15` }}>
                "{p}"
              </li>
            ))}
          </ul>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && (insights.first_self_choice_action || insights.small_self_choice) && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu primer acto de elegirte esta semana</div>
          <p className="text-lg font-medium leading-snug">{insights.first_self_choice_action ?? insights.small_self_choice}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && insights.supportive_message && (
        <Card className="p-6 md:p-8 border-l-4 border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-2">Lo que necesitas escuchar hoy</div>
          <p className="text-foreground/90 leading-relaxed">{insights.supportive_message}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_004" && (insights.self_abandonment_score !== undefined || insights.prioritization_capacity_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.self_abandonment_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Autoabandono emocional</div>
              <div className="text-3xl font-display font-bold">{insights.self_abandonment_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.self_abandonment_level && <div className="text-sm text-muted-foreground">{insights.self_abandonment_level}</div>}
            </Card>
          )}
          {insights.prioritization_capacity_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Capacidad de priorización</div>
              <div className="text-3xl font-display font-bold">{insights.prioritization_capacity_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.prioritization_capacity_level && <div className="text-sm text-muted-foreground">{insights.prioritization_capacity_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Mi Voz al Poner Límites (inner_boundaries_005) */}
      {exercise.id === "inner_boundaries_005" && (insights.communication_style || insights.main_fear) && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">Tu voz al poner límites</div>
            {insights.communication_style && <p className="text-white/95 leading-relaxed">{insights.communication_style}</p>}
            {insights.main_fear && <p className="text-sm text-white/85 italic">Miedo dominante: {insights.main_fear}</p>}
          </div>
        </Card>
      )}
      {exercise.id === "inner_boundaries_005" && insights.avoidance_pattern && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-400">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">Tu patrón invisible</div>
          <p className="text-foreground/90 leading-relaxed">{insights.avoidance_pattern}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_005" && insights.boundary_scripts && insights.boundary_scripts.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tus scripts personalizados</div>
          <ul className="space-y-3">
            {insights.boundary_scripts.map((s, i) => (
              <li key={i} className="px-4 py-3 rounded-lg" style={{ background: `${exercise.color_from}15` }}>
                {s.tone && <div className="text-xs font-semibold text-muted-foreground mb-1">{s.tone}</div>}
                <p className="text-sm md:text-base leading-snug">"{s.text}"</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {exercise.id === "inner_boundaries_005" && insights.power_phrase && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tu frase de poder</div>
          <p className="font-display text-lg md:text-xl italic leading-snug">"{insights.power_phrase}"</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_005" && insights.conversation_tip && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tip para la conversación que evitas</div>
          <p className="leading-relaxed">{insights.conversation_tip}</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_005" && (insights.communicative_safety_score !== undefined || insights.healthy_expression_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.communicative_safety_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Seguridad comunicativa</div>
              <div className="text-3xl font-display font-bold">{insights.communicative_safety_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.communicative_safety_level && <div className="text-sm text-muted-foreground">{insights.communicative_safety_level}</div>}
            </Card>
          )}
          {insights.healthy_expression_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Autoexpresión saludable</div>
              <div className="text-3xl font-display font-bold">{insights.healthy_expression_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.healthy_expression_level && <div className="text-sm text-muted-foreground">{insights.healthy_expression_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — El Miedo Detrás de Mis Límites (inner_boundaries_006) */}
      {exercise.id === "inner_boundaries_006" && (insights.main_fear || insights.fear_origin) && (
        <Card className="p-6 md:p-10 border-0 shadow-xl text-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: gradient, opacity: 0.95 }} />
          <div className="relative space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/80">El miedo detrás de tus límites</div>
            {insights.main_fear && <p className="text-white/95 leading-relaxed">{insights.main_fear}</p>}
            {insights.fear_origin && <p className="text-sm text-white/85 italic">{insights.fear_origin}</p>}
          </div>
        </Card>
      )}
      {exercise.id === "inner_boundaries_006" && (insights.worst_imagined_scenario || insights.real_cost_of_avoiding) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.worst_imagined_scenario && (
            <Card className="p-6 border-l-4 border-rose-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300 mb-2">Lo que temes que pase</div>
              <p className="text-foreground/90 leading-relaxed">{insights.worst_imagined_scenario}</p>
            </Card>
          )}
          {insights.real_cost_of_avoiding && (
            <Card className="p-6 border-l-4 border-amber-400">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">El costo real de evitarlo</div>
              <p className="text-foreground/90 leading-relaxed">{insights.real_cost_of_avoiding}</p>
            </Card>
          )}
        </div>
      )}
      {exercise.id === "inner_boundaries_006" && insights.fear_to_behavior_map && insights.fear_to_behavior_map.length > 0 && (
        <Card className="p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mapa de miedos relacionales</div>
          <ul className="space-y-3">
            {insights.fear_to_behavior_map.map((m, i) => (
              <li key={i} className="grid gap-2 md:grid-cols-3 p-4 rounded-lg" style={{ background: `${exercise.color_from}12` }}>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Miedo</div>
                  <p className="text-sm font-medium">{m.fear}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conducta</div>
                  <p className="text-sm">{m.behavior}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Costo</div>
                  <p className="text-sm italic">{m.cost}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {exercise.id === "inner_boundaries_006" && insights.courageous_belief && (
        <Card className="p-6 md:p-8 border-2 border-dashed" style={{ borderColor: `${exercise.color_from}60` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Creencia valiente</div>
          <p className="font-display text-lg md:text-xl italic leading-snug">"{insights.courageous_belief}"</p>
        </Card>
      )}
      {exercise.id === "inner_boundaries_006" && insights.courage_micro_steps && insights.courage_micro_steps.length > 0 && (
        <Card className="p-6 md:p-8 bg-muted/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tus micro pasos de valentía</div>
          <ol className="space-y-2 list-decimal list-inside">
            {insights.courage_micro_steps.map((s, i) => (
              <li key={i} className="leading-relaxed">{s}</li>
            ))}
          </ol>
        </Card>
      )}
      {exercise.id === "inner_boundaries_006" && (insights.inner_safety_score !== undefined || insights.approval_dependency_score !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.inner_safety_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Seguridad interna</div>
              <div className="text-3xl font-display font-bold">{insights.inner_safety_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.inner_safety_level && <div className="text-sm text-muted-foreground">{insights.inner_safety_level}</div>}
            </Card>
          )}
          {insights.approval_dependency_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Dependencia de aprobación</div>
              <div className="text-3xl font-display font-bold">{insights.approval_dependency_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.approval_dependency_level && <div className="text-sm text-muted-foreground">{insights.approval_dependency_level}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Específico — Mis Creencias Financieras (financial_intelligence_002) */}
      {exercise.id === "financial_intelligence_002" && insights.dominant_money_belief && (
        <Card
          className="p-6 md:p-8 border-l-4"
          style={{
            borderLeftColor: exercise.color_to ?? "#d4af6a",
            background: `linear-gradient(135deg, ${exercise.color_from ?? "#0f5132"}10, ${exercise.color_to ?? "#d4af6a"}10)`,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Creencia dominante sobre el dinero</div>
          <p className="text-lg md:text-xl font-medium leading-snug">{insights.dominant_money_belief}</p>
          {insights.main_blocker && (
            <div className="mt-4 pt-4 border-t border-foreground/10">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Bloqueo principal</div>
              <p className="text-base text-foreground/90">{insights.main_blocker}</p>
            </div>
          )}
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && insights.money_story_summary && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu historia con el dinero</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.money_story_summary}</p>
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && insights.inherited_patterns && insights.inherited_patterns.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Patrones heredados</h3>
          <ul className="space-y-2">
            {insights.inherited_patterns.map((p: string, i: number) => (
              <li key={i} className="flex gap-3 text-foreground/90">
                <span className="text-amber-600 mt-1">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && insights.healthy_money_reframe && (
        <Card
          className="p-6 md:p-8 text-white"
          style={{ background: `linear-gradient(135deg, ${exercise.color_from ?? "#0f5132"}, ${exercise.color_to ?? "#d4af6a"})` }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">Tu reframe financiero</div>
          <p className="text-xl md:text-2xl font-display font-semibold leading-snug">{insights.healthy_money_reframe}</p>
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && insights.new_money_beliefs && insights.new_money_beliefs.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Nuevas creencias para sembrar</h3>
          <ul className="space-y-2">
            {insights.new_money_beliefs.map((b: string, i: number) => (
              <li key={i} className="flex gap-3 text-foreground/90">
                <span className="text-amber-600 mt-1">✦</span>
                <span className="whitespace-pre-line">{b}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && insights.next_financial_action && (
        <Card className="p-6 md:p-8 border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tu próximo micro paso financiero</div>
          <p className="text-base md:text-lg font-medium text-foreground/90">{insights.next_financial_action}</p>
        </Card>
      )}

      {exercise.id === "financial_intelligence_002" && (
        <div className="grid gap-4 md:grid-cols-3">
          {insights.financial_security_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Seguridad financiera</div>
              <div className="text-3xl font-display font-bold">{insights.financial_security_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.financial_security_level && <div className="text-sm text-muted-foreground">{insights.financial_security_level}</div>}
            </Card>
          )}
          {insights.growth_openness_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Apertura al crecimiento</div>
              <div className="text-3xl font-display font-bold">{insights.growth_openness_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.growth_openness_level && <div className="text-sm text-muted-foreground">{insights.growth_openness_level}</div>}
            </Card>
          )}
          {insights.financial_anxiety_score !== undefined && (
            <Card className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Ansiedad financiera</div>
              <div className="text-3xl font-display font-bold">{insights.financial_anxiety_score}<span className="text-base text-muted-foreground">/100</span></div>
              {insights.financial_anxiety_level && <div className="text-sm text-muted-foreground">{insights.financial_anxiety_level}</div>}
            </Card>
          )}
        </div>
      )}




      {/* Insight principal */}
      {insights.main_insight && (
        <Card className="p-6 md:p-8 border-l-4" style={{ borderLeftColor: exercise.color_to ?? exercise.color_from ?? "#f59e0b" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${exercise.color_from}15` }}>
              <Lightbulb className="w-5 h-5" style={{ color: exercise.color_to ?? "#ea580c" }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Insight principal</div>
              <p className="text-lg md:text-xl font-medium leading-snug">{insights.main_insight}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Resumen */}
      {insights.summary && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resumen personalizado</h3>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{insights.summary}</p>
        </Card>
      )}

      {/* Fortalezas y crecimiento */}
      <div className="grid gap-4 md:grid-cols-2">
        <InsightList
          title="Fortalezas detectadas"
          icon={<Sparkles className="w-4 h-4" />}
          items={insights.strengths ?? []}
          tone="success"
        />
        <InsightList
          title="Áreas de crecimiento"
          icon={<Target className="w-4 h-4" />}
          items={insights.growth_areas ?? []}
          tone="accent"
        />
      </div>

      {/* Patrones */}
      {insights.detected_patterns && insights.detected_patterns.length > 0 && (
        <InsightList
          title="Patrones que notamos"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.detected_patterns}
          tone="muted"
        />
      )}

      {insights.hidden_patterns && insights.hidden_patterns.length > 0 && (
        <InsightList
          title="Tu patrón invisible"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.hidden_patterns}
          tone="muted"
        />
      )}

      {insights.avoidance_patterns && insights.avoidance_patterns.length > 0 && (
        <InsightList
          title="Patrones de evitación"
          icon={<ListChecks className="w-4 h-4" />}
          items={insights.avoidance_patterns}
          tone="muted"
        />
      )}
      {insights.reflection_questions && insights.reflection_questions.length > 0 && (
        <Card className="p-6 md:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Preguntas para esta semana</h3>
          <ul className="space-y-3">
            {insights.reflection_questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-foreground/90">
                <span className="font-display font-bold" style={{ color: exercise.color_to ?? "#ea580c" }}>{i + 1}.</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Reto 7 días / Acción 24h */}
      {insights.weekly_authenticity_challenge && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Micro reto de autenticidad · 7 días</div>
          <p className="text-lg font-medium leading-snug">{insights.weekly_authenticity_challenge}</p>
        </Card>
      )}
      {insights.recommended_micro_shift && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Micro acción · 7 días</div>
          <p className="text-lg font-medium leading-snug">{insights.recommended_micro_shift}</p>
        </Card>
      )}
      {insights.next_24h_action && (
        <Card className="p-6 md:p-8 border-2" style={{ borderColor: `${exercise.color_from}40` }}>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Acción para las próximas 24 horas</div>
          <p className="text-lg font-medium leading-snug">{insights.next_24h_action}</p>
        </Card>
      )}

      {/* Cierre */}
      {(insights.motivational_closing || insights.closing_message) && (
        <div className="p-6 md:p-8 rounded-3xl text-white text-center" style={{ background: gradient }}>
          <p className="font-display text-xl md:text-2xl font-bold leading-snug">{insights.motivational_closing ?? insights.closing_message}</p>
        </div>
      )}


      {/* Reflexión personal */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tu reflexión personal</h3>
          {!showNotes && (
            <Button variant="ghost" size="sm" onClick={() => setShowNotes(true)}>Agregar</Button>
          )}
        </div>
        {showNotes && (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué te llevas de este momento contigo?"
              rows={5}
              className="resize-none rounded-2xl"
            />
            <Button onClick={handleSaveNotes} className="text-white border-0" style={{ background: gradient }}>
              <Save className="w-4 h-4" /> Guardar reflexión
            </Button>
          </div>
        )}
      </Card>

      {/* Recomendado para ti */}
      <Card className="p-6 md:p-8 bg-muted/30">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recomendado para ti</h3>
        <div className="flex items-start gap-3">
          <div className="text-3xl">{recommendation.emoji}</div>
          <div className="flex-1">
            <div className="font-display font-bold text-lg">{recommendation.name}</div>
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Próximamente</span>
          </div>
        </div>
      </Card>

      {/* Acciones */}
      <div className="grid gap-3 md:grid-cols-2 pt-2">
        <Button asChild variant="outline" size="lg">
          <Link to="/introspection">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/introspection/exercise/$exerciseId" params={{ exerciseId: exercise.id }}>
            <RotateCcw className="w-4 h-4" /> Repetir en 30 días
          </Link>
        </Button>
      </div>

      <Disclaimer />
    </div>
  );
}

function ScoreGauge({ percent }: { percent: number }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 160 160" className="-rotate-90 w-full h-full">
        <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="white"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-bold">{percent}%</div>
        <div className="text-xs text-white/80 uppercase tracking-wider">Alineación</div>
      </div>
    </div>
  );
}

function InsightList({ title, icon, items, tone }: { title: string; icon: React.ReactNode; items: string[]; tone: "success" | "accent" | "muted" }) {
  if (items.length === 0) return null;
  const toneClasses = {
    success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    accent: "text-amber-600 dark:text-amber-300 bg-amber-500/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card className="p-6">
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClasses}`}>
        {icon}
        {title}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-foreground/90 leading-relaxed">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function pickRecommendation(tone: "low" | "mid" | "high") {
  if (tone === "low") return { emoji: "🌊", name: "Encuentra tu calma", description: "Un espacio para regularte y volver al centro." };
  if (tone === "mid") return { emoji: "💛", name: "Maestría emocional", description: "Aprende a navegar lo que sientes con más claridad." };
  return { emoji: "🌱", name: "Límites internos", description: "Define qué cuidas y qué dejas ir desde tu mejor versión." };
}
