/**
 * **Feature** — Componentes (parts) del módulo **Bitácora de contenido**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { useMemo, useState } from "react";
import { Plus, X, Star, Trash2, BookOpenCheck, NotebookPen, CheckSquare, BookOpen, TrendingUp, MessageSquare, Save } from "lucide-react";
import { useContentLog } from "@/hooks/use-content";
import { useAppState } from "@/lib/storage";
import {
  CONTENT_META,
  STATUS_META,
  type ContentLogItem,
  type ContentStatus,
  type ContentType,
  type Recommend,
} from "@/lib/content-types";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

const TYPE_FILTERS: (ContentType | "all")[] = ["all", "book", "movie", "series", "podcast", "article", "course", "other"];
const STATUS_FILTERS: (ContentStatus | "all")[] = ["all", "pending", "in_progress", "completed"];

export function ContentPage() {
  const { items, loading, addItem, updateItem, deleteItem } = useContentLog();
  const { addNote, addTask, addLearning } = useAppState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentLogItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (typeFilter !== "all" && i.contentType !== typeFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (tagFilter && !i.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter, tagFilter]);

  const insights = useMemo(() => {
    const completed = items.filter((i) => i.status === "completed");
    const inProgress = items.filter((i) => i.status === "in_progress").length;
    const ratings = completed.filter((i) => i.rating != null).map((i) => i.rating as number);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
    // Tipo más consumido
    const typeCount: Record<string, number> = {};
    items.forEach((i) => { typeCount[i.contentType] = (typeCount[i.contentType] ?? 0) + 1; });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    // Este mes
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonth = items.filter((i) => new Date(i.createdAt) >= monthStart);
    const booksMonth = thisMonth.filter((i) => i.contentType === "book").length;
    const moviesMonth = thisMonth.filter((i) => i.contentType === "movie").length;

    const messages: string[] = [];
    if (avg !== "—") messages.push(`Tu promedio de calificación es ${avg} ★`);
    if (topType) messages.push(`${CONTENT_META[topType[0] as ContentType].emoji} ${CONTENT_META[topType[0] as ContentType].label} es lo que más consumes`);
    if (moviesMonth > booksMonth && moviesMonth > 0) messages.push(`Has visto más películas (${moviesMonth}) que leído libros (${booksMonth}) este mes`);
    if (booksMonth > moviesMonth && booksMonth > 0) messages.push(`Has leído más libros (${booksMonth}) que visto películas (${moviesMonth}) este mes`);
    if (inProgress >= 3) messages.push(`Tienes ${inProgress} contenidos en progreso — quizás termina alguno antes de empezar otro`);
    return messages;
  }, [items]);

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Bitácora</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Conocimiento & Consumo 📚</h1>
          <p className="mt-2 text-muted-foreground">{items.length} registros · {items.filter(i => i.status === "completed").length} terminados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </header>

      {insights.length > 0 && (
        <div className="rounded-2xl bg-gradient-learning p-6 mb-8 text-[var(--learning-foreground)]">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Insights de consumo</p>
              <ul className="mt-2 space-y-1 text-sm">
                {insights.slice(0, 4).map((m, i) => <li key={i}>• {m}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "Todos" : `${CONTENT_META[t].emoji} ${CONTENT_META[t].label}`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Cualquier estado" : STATUS_META[s].label}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTagFilter("")}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${!tagFilter ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
            >
              Sin filtro
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${tagFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay registros con esos filtros.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onEdit={() => { setEditing(item); setOpen(true); }}
              onDelete={() => deleteItem(item.id)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onAsNote={() => {
                const id = addNote({
                  title: `Aprendizaje · ${item.title}`,
                  content: item.keyLearnings || item.notes,
                  type: "learning",
                  category: "personal",
                  tags: ["bitacora", ...item.tags],
                  importance: "normal",
                });
                if (id) toast.success("Aprendizaje convertido en nota");
              }}
              onAsTask={() => {
                addTask({
                  title: `Aplicar: ${item.title}`,
                  description: item.keyLearnings || `De ${CONTENT_META[item.contentType].label}: ${item.title}`,
                  priority: "medium",
                  tags: ["bitacora"],
                  listId: "",
                });
                toast.success("Tarea creada");
              }}
              onAsLearning={() => {
                if (!item.keyLearnings) { toast.error("Agrega aprendizajes clave primero"); return; }
                addLearning({
                  title: item.keyLearnings.split("\n")[0].slice(0, 80),
                  notes: `${item.keyLearnings}\n\nFuente: ${CONTENT_META[item.contentType].emoji} ${item.title}`,
                  category: "other",
                });
                toast.success("Guardado en Aprendizajes");
              }}
            />
          ))}
        </div>
      )}

      {open && (
        <ContentForm
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSave={async (payload) => {
            if (editing) {
              await updateItem(editing.id, payload);
              toast.success("Actualizado");
            } else {
              await addItem(payload);
              toast.success("Registrado en bitácora");
            }
            setOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ContentCard({
  item,
  onEdit,
  onDelete,
  onUpdate,
  onAsNote,
  onAsTask,
  onAsLearning,
}: {
  item: ContentLogItem;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<ContentLogItem>) => void;
  onAsNote: () => void;
  onAsTask: () => void;
  onAsLearning: () => void;
}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewText, setReviewText] = useState(item.keyLearnings || item.notes || "");
  const meta = CONTENT_META[item.contentType];
  const status = STATUS_META[item.status];
  
  const handleSaveReview = () => {
    onUpdate({ keyLearnings: reviewText });
    setIsReviewing(false);
    toast.success("Reseña guardada");
  };

  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/30 transition flex flex-col relative">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
              style={{ background: `color-mix(in oklab, ${status.color} 22%, transparent)`, color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition" aria-label="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <button onClick={onEdit} className="text-left">
        <h3 className="font-display text-lg font-semibold leading-snug">{item.title}</h3>
        {item.platform && <p className="text-xs text-muted-foreground mt-0.5">{item.platform}{item.genre ? ` · ${item.genre}` : ""}</p>}
      </button>

      <div className="flex items-center gap-1 mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onUpdate({ rating: n === item.rating ? null : n })}
            className="hover:scale-110 transition-transform"
          >
            <Star className={`w-4 h-4 ${n <= (item.rating ?? 0) ? "fill-[var(--xp)] text-[var(--xp)]" : "text-muted-foreground/20"}`} />
          </button>
        ))}
      </div>

      {item.status === "in_progress" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{item.currentPosition || "Progreso"}</span>
            <span>{item.progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-primary transition-all" style={{ width: `${item.progressPercent}%` }} />
          </div>
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}

      {isReviewing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Escribe tu reseña o comentarios..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none resize-none focus:border-primary/50"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsReviewing(false)}
              className="text-[10px] px-2 py-1 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveReview}
              className="text-[10px] px-2 py-1 rounded-lg bg-primary text-primary-foreground flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        item.keyLearnings && (
          <button 
            onClick={() => setIsReviewing(true)}
            className="mt-3 text-left w-full group/text"
          >
            <p className="text-xs text-muted-foreground line-clamp-3 italic group-hover/text:text-foreground transition-colors">
              "{item.keyLearnings}"
            </p>
          </button>
        )
      )}

      {/* Acciones rápidas */}
      <div className="flex gap-1.5 mt-4 pt-3 border-t border-border/50">
        {item.status !== "in_progress" && item.status !== "completed" && (
          <button
            onClick={() => onUpdate({ status: "in_progress", startDate: todayCDMX() })}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-foreground"
          >
            ▶ Iniciar
          </button>
        )}
        {item.status === "in_progress" && (
          <button
            onClick={() => onUpdate({ status: "completed", endDate: todayCDMX(), progressPercent: 100 })}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary"
          >
            ✓ Terminar
          </button>
        )}
        <button 
          onClick={() => setIsReviewing(!isReviewing)} 
          className={`text-[11px] px-2 py-1.5 rounded-lg transition-colors ${isReviewing ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-secondary/70 text-muted-foreground"}`}
          title="Agregar reseña/comentario"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button onClick={onAsLearning} className="text-[11px] px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-muted-foreground" title="Guardar como aprendizaje">
          <BookOpenCheck className="w-3.5 h-3.5" />
        </button>
        <button onClick={onAsNote} className="text-[11px] px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-muted-foreground" title="Convertir en nota">
          <NotebookPen className="w-3.5 h-3.5" />
        </button>
        <button onClick={onAsTask} className="text-[11px] px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-muted-foreground" title="Crear tarea de aplicación">
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}

function ContentForm({
  initial,
  onClose,
  onSave,
}: {
  initial: ContentLogItem | null;
  onClose: () => void;
  onSave: (payload: Omit<ContentLogItem, "id" | "createdAt" | "updatedAt">) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [contentType, setContentType] = useState<ContentType>(initial?.contentType ?? "book");
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "pending");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [keyLearnings, setKeyLearnings] = useState(initial?.keyLearnings ?? "");
  const [recommend, setRecommend] = useState<Recommend | null>(initial?.recommend ?? null);
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(", "));
  const [progressPercent, setProgressPercent] = useState(initial?.progressPercent ?? 0);
  const [currentPosition, setCurrentPosition] = useState(initial?.currentPosition ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-card my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar registro" : "Nuevo registro"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none" />
          </Field>

          <Field label="Tipo">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CONTENT_META) as ContentType[]).map((t) => (
                <button key={t} type="button" onClick={() => setContentType(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs ${contentType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {CONTENT_META[t].emoji} {CONTENT_META[t].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Estado">
            <div className="flex gap-1.5">
              {(["pending", "in_progress", "completed"] as ContentStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </Field>

          {(status === "in_progress" || status === "completed") && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inicio">
                <DatePicker date={startDate ? parseISO(startDate) : undefined} setDate={(d) => setStartDate(d ? d.toISOString().split('T')[0] : "")} />
              </Field>
              <Field label="Fin">
                <DatePicker date={endDate ? parseISO(endDate) : undefined} setDate={(d) => setEndDate(d ? d.toISOString().split('T')[0] : "")} />
              </Field>
            </div>
          )}

          {status === "in_progress" && (
            <>
              <Field label={`Progreso: ${progressPercent}%`}>
                <input type="range" min={0} max={100} value={progressPercent} onChange={(e) => setProgressPercent(Number(e.target.value))} className="w-full" />
              </Field>
              <Field label="Posición actual (Cap. 5, Ep. 12, etc.)">
                <input value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
              </Field>
            </>
          )}

          {status === "completed" && (
            <Field label="Calificación">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(rating === n ? null : n)}>
                    <Star className={`w-6 h-6 ${rating != null && n <= rating ? "fill-[var(--xp)] text-[var(--xp)]" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Género">
              <input value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
            </Field>
            <Field label="Plataforma">
              <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Netflix, Kindle…" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
            </Field>
          </div>

          <Field label="Notas personales">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm resize-none" />
          </Field>

          <Field label="Aprendizajes clave">
            <textarea value={keyLearnings} onChange={(e) => setKeyLearnings(e.target.value)} rows={3} placeholder="¿Qué te llevas?" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm resize-none" />
          </Field>

          <Field label="¿Recomendarías?">
            <div className="flex gap-1.5">
              {(["yes", "no", "maybe"] as Recommend[]).map((r) => (
                <button key={r} type="button" onClick={() => setRecommend(recommend === r ? null : r)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${recommend === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {r === "yes" ? "Sí 👍" : r === "no" ? "No 👎" : "Tal vez 🤔"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Etiquetas (separadas por coma)">
            <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="ficción, productividad…" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
          </Field>
        </div>

        <button
          disabled={!title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              contentType,
              status,
              startDate: startDate || null,
              endDate: endDate || null,
              rating,
              genre,
              platform,
              notes,
              keyLearnings,
              recommend,
              tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
              progressPercent,
              currentPosition,
            })
          }
          className="w-full mt-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50"
        >
          {initial ? "Guardar cambios" : "Registrar (+5 XP)"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
