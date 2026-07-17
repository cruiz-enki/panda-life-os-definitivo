/**
 * **Feature** — Componentes (parts) del módulo **Wishlist**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { useMemo, useState } from "react";
import { Plus, X, Trash2, Heart, Sparkles, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist, useContentLog } from "@/hooks/use-content";
import { useAppState } from "@/lib/storage";
import {
  WISH_META,
  PRIORITY_META,
  type WishlistItem,
  type WishlistType,
  type WishPriority,
  type WishReason,
  type ContentType,
} from "@/lib/content-types";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";

const TYPE_FILTERS: (WishlistType | "all")[] = ["all", "book", "movie", "series", "podcast", "course", "product", "other"];
const PRIORITY_FILTERS: (WishPriority | "all")[] = ["all", "high", "medium", "low"];

// Reglas locales: sugerir según energía + tiempo
function localSuggestion(items: WishlistItem[], energyAvg: number | null, minutes: number): WishlistItem[] {
  if (items.length === 0) return [];
  const lowEnergy = energyAvg != null && energyAvg <= 5;
  const longTime = minutes >= 60;

  const lightTypes: WishlistType[] = ["podcast", "movie", "article" as WishlistType, "series"];
  const heavyTypes: WishlistType[] = ["book", "course"];

  let pool = items.filter((i) => !i.purchased);
  if (lowEnergy) pool = pool.filter((i) => lightTypes.includes(i.itemType));
  if (longTime) pool = pool.concat(items.filter((i) => heavyTypes.includes(i.itemType) && !pool.includes(i)));

  return pool
    .sort((a, b) => {
      const order: Record<WishPriority, number> = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);
}

export function WishlistPage() {
  const { items, loading, addItem, updateItem, deleteItem } = useWishlist();
  const { addItem: addContentItem } = useContentLog();
  const { state } = useAppState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<WishlistType | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<WishPriority | "all">("all");
  const [tagFilter, setTagFilter] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [availableMin, setAvailableMin] = useState(30);

  const todayEnergy = useMemo(() => {
    const today = todayCDMX();
    const e = state.energy.find((x) => x.date === today);
    if (!e) return null;
    return (e.physical + e.mental + e.emotional) / 3;
  }, [state.energy]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (i.purchased) return false;
      if (typeFilter !== "all" && i.itemType !== typeFilter) return false;
      if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
      if (tagFilter && !i.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [items, typeFilter, priorityFilter, tagFilter]);

  const purchased = items.filter((i) => i.purchased);
  const localSuggestions = useMemo(() => localSuggestion(items, todayEnergy, availableMin), [items, todayEnergy, availableMin]);

  async function handleAiSuggest() {
    setAiLoading(true);
    setAiResult(null);
    try {
      const wishlistPayload = items.filter((i) => !i.purchased).map((i) => ({
        title: i.title,
        tipo: WISH_META[i.itemType].label,
        prioridad: i.priority,
        motivo: i.reason,
        tags: i.tags,
      }));
      const { data, error } = await supabase.functions.invoke("ai-content-suggest", {
        body: {
          wishlist: wishlistPayload,
          energy: todayEnergy != null ? Math.round(todayEnergy) : null,
          availableMinutes: availableMin,
        },
      });
      if (error) throw new Error(error.message);
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
      setAiResult((data as { suggestion: string }).suggestion);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sugerir");
    } finally {
      setAiLoading(false);
    }
  }

  async function moveToBitacora(item: WishlistItem) {
    // Mapeo de wishlist type → content type (product → other)
    const map: Record<WishlistType, ContentType> = {
      book: "book", movie: "movie", series: "series", podcast: "podcast",
      course: "course", product: "other", other: "other",
    };
    await addContentItem({
      title: item.title,
      contentType: map[item.itemType],
      status: "in_progress",
      startDate: todayCDMX(),
      endDate: null,
      rating: null,
      genre: "",
      platform: item.source,
      notes: item.notes,
      keyLearnings: "",
      recommend: null,
      tags: item.tags,
      progressPercent: 0,
      currentPosition: "",
    });
    await deleteItem(item.id);
    toast.success("Movido a bitácora");
  }

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Wishlist</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Lo que quieres consumir 💫</h1>
          <p className="mt-2 text-muted-foreground">{filtered.length} pendientes · {purchased.length} comprados/conseguidos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </header>

      {/* Sugerencias inteligentes */}
      <div className="rounded-2xl bg-card border border-border p-6 mb-8">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold">Recomendado para ti hoy</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-muted-foreground">Tiempo:</label>
            <select
              value={availableMin}
              onChange={(e) => setAvailableMin(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-secondary border border-border outline-none"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 h</option>
              <option value={120}>2 h+</option>
            </select>
            <button
              onClick={handleAiSuggest}
              disabled={aiLoading || items.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              IA
            </button>
          </div>
        </div>

        {todayEnergy != null && (
          <p className="text-xs text-muted-foreground mb-3">
            Tu energía hoy: {Math.round(todayEnergy)}/10 · {todayEnergy <= 5 ? "Sugerencias ligeras" : "Tienes buena energía para algo profundo"}
          </p>
        )}

        {localSuggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Agrega elementos a tu wishlist para recibir sugerencias.</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-2">
            {localSuggestions.map((i) => (
              <div key={i.id} className="p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{WISH_META[i.itemType].emoji}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{WISH_META[i.itemType].label}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{i.title}</p>
                <button
                  onClick={() => moveToBitacora(i)}
                  className="mt-2 text-[11px] text-primary hover:underline"
                >
                  Empezar ahora →
                </button>
              </div>
            ))}
          </div>
        )}

        {aiResult && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-learning text-[var(--learning-foreground)] text-sm whitespace-pre-wrap">
            {aiResult}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "Todos" : `${WISH_META[t].emoji} ${WISH_META[t].label}`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRIORITY_FILTERS.map((p) => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${priorityFilter === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {p === "all" ? "Cualquier prioridad" : PRIORITY_META[p].label}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setTagFilter("")} className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${!tagFilter ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>Sin filtro</button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTagFilter(t)} className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${tagFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>#{t}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Tu wishlist está vacía con esos filtros.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <WishCard
              key={item.id}
              item={item}
              onEdit={() => { setEditing(item); setOpen(true); }}
              onDelete={() => deleteItem(item.id)}
              onMove={() => moveToBitacora(item)}
              onPurchase={() => updateItem(item.id, { purchased: true })}
            />
          ))}
        </div>
      )}

      {purchased.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-muted-foreground mb-3">Ver conseguidos / comprados ({purchased.length})</summary>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 opacity-70">
            {purchased.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card/50 p-3 flex items-center gap-2">
                <span className="text-lg">{WISH_META[item.itemType].emoji}</span>
                <span className="text-sm flex-1 line-through truncate">{item.title}</span>
                <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </details>
      )}

      {open && (
        <WishForm
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSave={async (payload) => {
            if (editing) {
              await updateItem(editing.id, payload);
              toast.success("Actualizado");
            } else {
              await addItem(payload);
              toast.success("Agregado a wishlist");
            }
            setOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function WishCard({ item, onEdit, onDelete, onMove, onPurchase }: {
  item: WishlistItem;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
  onPurchase: () => void;
}) {
  const meta = WISH_META[item.itemType];
  const prio = PRIORITY_META[item.priority];
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/30 transition flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.emoji}</span>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
            style={{ background: `color-mix(in oklab, ${prio.color} 22%, transparent)`, color: prio.color }}
          >
            {prio.label}
          </span>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition" aria-label="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <button onClick={onEdit} className="text-left">
        <h3 className="font-display text-lg font-semibold leading-snug">{item.title}</h3>
        {item.source && <p className="text-xs text-muted-foreground mt-0.5">de {item.source}</p>}
      </button>

      {item.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.notes}</p>}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}

      {item.remindAt && (
        <p className="text-[11px] text-muted-foreground mt-2">⏰ Recordar: {new Date(item.remindAt + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
      )}

      <div className="flex gap-1.5 mt-4 pt-3 border-t border-border/50">
        <button onClick={onMove} className="flex-1 text-[11px] px-2 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary font-medium">
          → Bitácora
        </button>
        {item.itemType === "product" && (
          <button onClick={onPurchase} className="text-[11px] px-2 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-muted-foreground" title="Marcar como comprado">
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}

function WishForm({ initial, onClose, onSave }: {
  initial: WishlistItem | null;
  onClose: () => void;
  onSave: (payload: Omit<WishlistItem, "id" | "createdAt" | "updatedAt" | "purchased">) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [itemType, setItemType] = useState<WishlistType>(initial?.itemType ?? "book");
  const [priority, setPriority] = useState<WishPriority>(initial?.priority ?? "medium");
  const [reason, setReason] = useState<WishReason>(initial?.reason ?? "personal");
  const [source, setSource] = useState(initial?.source ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(", "));
  const [remindAt, setRemindAt] = useState(initial?.remindAt ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-card my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">{initial ? "Editar" : "Nuevo en wishlist"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none" />
          </Field>

          <Field label="Tipo">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(WISH_META) as WishlistType[]).map((t) => (
                <button key={t} type="button" onClick={() => setItemType(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs ${itemType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {WISH_META[t].emoji} {WISH_META[t].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Prioridad">
            <div className="flex gap-1.5">
              {(["high", "medium", "low"] as WishPriority[]).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${priority === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Motivo">
            <div className="flex gap-1.5 flex-wrap">
              {(["recommendation", "personal", "work", "other"] as WishReason[]).map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs ${reason === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {r === "recommendation" ? "Recomendación" : r === "personal" ? "Interés personal" : r === "work" ? "Trabajo" : "Otro"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Fuente (quién o dónde)">
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="@amigo, podcast X…" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
          </Field>

          <Field label="Notas">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm resize-none" />
          </Field>

          <Field label="Etiquetas (coma)">
            <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border outline-none text-sm" />
          </Field>

          <Field label="Recordatorio (opcional)">
            <DatePicker date={remindAt ? parseISO(remindAt) : undefined} setDate={(d) => setRemindAt(d ? d.toISOString().split('T')[0] : "")} />
          </Field>
        </div>

        <button
          disabled={!title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              itemType,
              priority,
              reason,
              source,
              notes,
              tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
              remindAt: remindAt || null,
            })
          }
          className="w-full mt-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50"
        >
          {initial ? "Guardar cambios" : "Agregar a wishlist"}
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
