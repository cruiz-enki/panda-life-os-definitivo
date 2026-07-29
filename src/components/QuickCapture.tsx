/**
 * **Componente** — Captura rápida: tarea/nota/aprendizaje desde un único input con hashtags.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Plus, X, Wand2, Loader2, CheckSquare, Calendar as CalIcon, Flag, Hash, Inbox } from "lucide-react";
import { QuickActionsFab } from "@/components/QuickActionsFab";
import { useAppState } from "@/lib/storage";
import { classifyCapture, type Classification } from "@/lib/ai-client";
import { parseTaskInput } from "@/lib/task-nlp";
import { toast } from "sonner";

export function QuickCapture() {
  const { quickCaptureNote, addNote, addTask, addLearning, ensureInboxList, state } = useAppState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [suggestion, setSuggestion] = useState<Classification | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && ref.current) ref.current.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset al cerrar
  useEffect(() => {
    if (!open) { setSuggestion(null); setClassifying(false); }
  }, [open]);

  const submit = (goToNote = false) => {
    const id = quickCaptureNote(text);
    if (!id) return;
    setText("");
    setSuggestion(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    if (goToNote) {
      setOpen(false);
      navigate({ to: "/notes" });
    }
  };

  const parsed = useMemo(() => (text.trim() ? parseTaskInput(text) : null), [text]);
  const parsedHasSignal = !!parsed && (!!parsed.due || !!parsed.priority || parsed.tags.length > 0 || !!parsed.listHint);

  const createTaskFromNLP = () => {
    if (!text.trim()) return;
    const p = parseTaskInput(text);
    // Resolver lista: intenta match por nombre; si no, Inbox.
    let listId = state.taskLists.find((l) => p.listHint && l.name.toLowerCase() === p.listHint.toLowerCase())?.id;
    if (!listId) listId = ensureInboxList();

    // Resolver tags: crea las que no existan
    const tagIds: string[] = [];
    const existing = new Map(state.tags.map((t) => [t.name.toLowerCase(), t.id]));
    for (const name of p.tags) {
      const id = existing.get(name.toLowerCase());
      if (id) tagIds.push(id);
    }

    addTask({
      title: p.title,
      description: "",
      priority: p.priority ?? "medium",
      tags: tagIds,
      listId,
      due: p.due,
    });
    toast.success(`✅ Tarea creada${p.due ? ` · ${new Date(p.due).toLocaleDateString("es-MX")}` : ""}`);
    setText("");
    setSuggestion(null);
    setOpen(false);
  };


  const askAI = async () => {
    if (!text.trim()) return;
    setClassifying(true);
    setSuggestion(null);
    try {
      const c = await classifyCapture(text);
      setSuggestion(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error clasificando");
    } finally {
      setClassifying(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    const tagIds = state.tags
      .filter((t) => suggestion.tags.some((s) => s.toLowerCase() === t.name.toLowerCase()))
      .map((t) => t.id);

    if (suggestion.kind === "task") {
      const listId = state.taskLists[0]?.id;
      if (!listId) {
        toast.error("Crea una lista primero");
        return;
      }
      addTask({
        title: suggestion.title,
        description: suggestion.summary,
        priority: suggestion.priority ?? "medium",
        tags: tagIds,
        listId,
      });
      toast.success("✨ Tarea creada por IA");
      setOpen(false);
    } else if (suggestion.kind === "learning") {
      addLearning({
        title: suggestion.title,
        notes: suggestion.summary || text.trim(),
        category: "mindset",
      });
      toast.success("✨ Aprendizaje guardado por IA");
      setOpen(false);
    } else {
      addNote({
        title: suggestion.title,
        content: text.trim(),
        type: suggestion.kind === "idea" ? "idea" : "note",
        category: suggestion.category,
        importance: suggestion.importance,
        tags: tagIds,
      });
      toast.success("✨ Nota organizada por IA");
      setOpen(false);
    }
    setText("");
    setSuggestion(null);
  };

  const kindEmoji = (k: Classification["kind"]) =>
    k === "task" ? "✅" : k === "learning" ? "📚" : k === "idea" ? "💡" : "📝";

  // Permite abrir desde el FAB de la barra inferior móvil
  useEffect(() => {
    (window as unknown as { __openQuickCapture?: () => void }).__openQuickCapture = () => setOpen(true);
    return () => {
      delete (window as unknown as { __openQuickCapture?: () => void }).__openQuickCapture;
    };
  }, []);

  return (
    <>
      {/* FAB desktop con speed-dial — en móvil vive dentro de MobileNav */}
      <QuickActionsFab variant="desktop" onCapture={() => setOpen(true)} />

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                Captura rápida
                <span className="text-xs text-muted-foreground hidden md:inline">⌘/Ctrl + K</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => { setText(e.target.value); setSuggestion(null); }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  if (e.shiftKey) { createTaskFromNLP(); }
                  else submit(false);
                }
              }}
              placeholder={`Escribe tu idea…\n⌘Enter guarda como nota · ⇧⌘Enter crea tarea\nTip tarea: "Llamar a Juan mañana 3pm #trabajo !alta"`}
              className="w-full bg-transparent px-5 py-4 text-base outline-none resize-none min-h-[120px]"
            />

            {parsed && parsedHasSignal && (
              <div className="mx-5 mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
                  <CheckSquare className="w-3 h-3" /> Vista previa tarea
                </div>
                <div className="text-sm font-medium mb-2">{parsed.title || "(sin título)"}</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary inline-flex items-center gap-1">
                    <Inbox className="w-3 h-3" /> {parsed.listHint || "Inbox"}
                  </span>
                  {parsed.due && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary inline-flex items-center gap-1">
                      <CalIcon className="w-3 h-3" />
                      {new Date(parsed.due).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: parsed.matched.time ? "2-digit" : undefined, minute: parsed.matched.time ? "2-digit" : undefined })}
                    </span>
                  )}
                  {parsed.priority && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary inline-flex items-center gap-1">
                      <Flag className="w-3 h-3" /> {parsed.priority}
                    </span>
                  )}
                  {parsed.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-0.5">
                      <Hash className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {suggestion && (
              <div className="mx-5 mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider mb-2">
                  <Wand2 className="w-3 h-3" /> Sugerencia IA
                </div>
                <div className="text-sm font-medium">
                  {kindEmoji(suggestion.kind)} {suggestion.title}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.summary}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary">{suggestion.kind}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary">{suggestion.category}</span>
                  {suggestion.priority && <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary">prio: {suggestion.priority}</span>}
                  {suggestion.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{t}</span>
                  ))}
                </div>
                <button
                  onClick={applySuggestion}
                  className="mt-3 w-full px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow inline-flex items-center justify-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Aplicar y guardar
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/20">
              <span className="text-xs text-muted-foreground">
                {saved ? "✓ Guardado" : suggestion ? "Aplica o guarda como nota" : parsedHasSignal ? "Crea como tarea o guarda como nota" : "Se guarda como 💡 Idea"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={askAI}
                  disabled={!text.trim() || classifying}
                  className="px-3 py-1.5 rounded-lg text-xs border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 inline-flex items-center gap-1"
                >
                  {classifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {classifying ? "Pensando…" : "Organizar IA"}
                </button>
                <button
                  onClick={createTaskFromNLP}
                  disabled={!text.trim()}
                  title="⇧⌘Enter"
                  className="px-3 py-1.5 rounded-lg text-xs border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" /> Tarea
                </button>
                <button
                  onClick={() => submit(false)}
                  disabled={!text.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nota
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
