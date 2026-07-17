/**
 * **Feature** — Componentes (parts) del módulo **Notas**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useAppState,
  relatedNotes,
  suggestedNotesForToday,
  NOTE_TYPE_META,
  NOTE_CATEGORY_LABEL,
  NOTE_IMPORTANCE_META,
  type Note,
  type NoteType,
  type NoteCategory,
  type NoteImportance,
} from "@/lib/storage";
import {
  Search,
  Plus,
  Trash2,
  Link2,
  CheckSquare,
  Rocket,
  Sparkles,
  Star,
  Flame,
  DollarSign,
  X,
  ListChecks,
} from "lucide-react";

const TYPES: NoteType[] = ["idea", "learning", "note", "project"];
const CATEGORIES: NoteCategory[] = ["negocio", "marketing", "personal", "clientes", "contenido", "otro"];
const IMPORTANCES: NoteImportance[] = ["normal", "important", "high", "money"];

export function NotesPage() {
  const {
    state,
    addNote,
    updateNote,
    deleteNote,
    toggleNoteChecklist,
    linkNotes,
    convertNoteToTask,
    convertNoteToProject,
  } = useAppState();

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<NoteType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<NoteCategory | "all">("all");
  const [filterTag, setFilterTag] = useState<string | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.notes.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterCategory !== "all" && n.category !== filterCategory) return false;
      if (filterTag !== "all" && !n.tags.includes(filterTag)) return false;
      if (q) {
        const hay = `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.notes, query, filterType, filterCategory, filterTag]);

  const suggested = useMemo(() => suggestedNotesForToday(state.notes, 3), [state.notes]);
  const openNote = openId ? state.notes.find((n) => n.id === openId) ?? null : null;

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Second brain</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Notas</h1>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva nota
        </button>
      </header>

      {/* Suggestions */}
      {suggested.length > 0 && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Hoy podrías trabajar en…</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {suggested.map((n) => (
              <button
                key={n.id}
                onClick={() => setOpenId(n.id)}
                className="text-left p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <span>{NOTE_TYPE_META[n.type].emoji}</span>
                  {NOTE_TYPE_META[n.type].label}
                  {n.importance !== "normal" && <span className="ml-auto">{NOTE_IMPORTANCE_META[n.importance].emoji}</span>}
                </div>
                <div className="font-medium text-sm line-clamp-2">{n.title}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Search + filters */}
      <section className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por palabra, etiqueta…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border outline-none focus:border-primary/50 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Chip active={filterType === "all"} onClick={() => setFilterType("all")}>Todos</Chip>
          {TYPES.map((t) => (
            <Chip key={t} active={filterType === t} onClick={() => setFilterType(t)}>
              {NOTE_TYPE_META[t].emoji} {NOTE_TYPE_META[t].label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs mt-2">
          <Chip active={filterCategory === "all"} onClick={() => setFilterCategory("all")}>Todas categorías</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={filterCategory === c} onClick={() => setFilterCategory(c)}>
              {NOTE_CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
        {state.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs mt-2">
            <Chip active={filterTag === "all"} onClick={() => setFilterTag("all")}>Todas etiquetas</Chip>
            {state.tags.map((t) => (
              <Chip key={t.id} active={filterTag === t.id} onClick={() => setFilterTag(t.id)}>
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: t.color }} />
                #{t.name}
              </Chip>
            ))}
          </div>
        )}
      </section>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No hay notas que coincidan.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              tags={state.tags}
              onOpen={() => setOpenId(n.id)}
            />
          ))}
        </div>
      )}

      {composerOpen && (
        <NoteComposer
          tags={state.tags}
          onClose={() => setComposerOpen(false)}
          onSave={(payload) => {
            const id = addNote(payload);
            setComposerOpen(false);
            setOpenId(id);
          }}
        />
      )}

      {openNote && (
        <NoteDetail
          note={openNote}
          allNotes={state.notes}
          tags={state.tags}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) => updateNote(openNote.id, patch)}
          onDelete={() => {
            deleteNote(openNote.id);
            setOpenId(null);
          }}
          onToggleChecklist={(itemId) => toggleNoteChecklist(openNote.id, itemId)}
          onLink={(otherId) => linkNotes(openNote.id, otherId)}
          onConvertTask={() => convertNoteToTask(openNote.id)}
          onConvertProject={() => convertNoteToProject(openNote.id)}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg border transition-colors ${
        active
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ImportanceIcon({ importance }: { importance: NoteImportance }) {
  if (importance === "important") return <Star className="w-3.5 h-3.5 text-[var(--xp)]" />;
  if (importance === "high") return <Flame className="w-3.5 h-3.5 text-destructive" />;
  if (importance === "money") return <DollarSign className="w-3.5 h-3.5 text-primary" />;
  return null;
}

function NoteCard({ note, tags, onOpen }: { note: Note; tags: { id: string; name: string; color: string }[]; onOpen: () => void }) {
  const noteTags = tags.filter((t) => note.tags.includes(t.id));
  return (
    <button
      onClick={onOpen}
      className="text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{NOTE_TYPE_META[note.type].emoji}</span>
        <span>{NOTE_TYPE_META[note.type].label}</span>
        <span>·</span>
        <span>{NOTE_CATEGORY_LABEL[note.category]}</span>
        <span className="ml-auto"><ImportanceIcon importance={note.importance} /></span>
      </div>
      <h3 className="font-display font-semibold leading-tight line-clamp-2">{note.title}</h3>
      {note.content && note.content !== note.title && (
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">{note.content}</p>
      )}
      <div className="flex items-center gap-1 flex-wrap mt-1">
        {noteTags.map((t) => (
          <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${t.color} / 0.2`, color: t.color, border: `1px solid ${t.color}` }}>
            #{t.name}
          </span>
        ))}
        {note.checklist.length > 0 && (
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 ml-auto">
            <ListChecks className="w-3 h-3" />
            {note.checklist.filter((c) => c.done).length}/{note.checklist.length}
          </span>
        )}
        {note.linkedNoteIds.length > 0 && (
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            {note.linkedNoteIds.length}
          </span>
        )}
      </div>
    </button>
  );
}

function NoteComposer({
  tags,
  onClose,
  onSave,
}: {
  tags: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSave: (n: {
    title: string;
    content: string;
    type: NoteType;
    category: NoteCategory;
    tags: string[];
    importance: NoteImportance;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("idea");
  const [category, setCategory] = useState<NoteCategory>("personal");
  const [importance, setImportance] = useState<NoteImportance>("normal");
  const [selTags, setSelTags] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-start justify-center pt-[6vh] px-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-display font-semibold">Nueva nota</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            autoFocus
            className="w-full bg-transparent text-xl font-display font-semibold outline-none placeholder:text-muted-foreground/50"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido… (soporta listas y - bullets)"
            rows={6}
            className="w-full bg-secondary/30 rounded-xl border border-border p-3 text-sm outline-none focus:border-primary/50 resize-y"
          />

          <div>
            <label className="text-xs text-muted-foreground">Tipo</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TYPES.map((t) => (
                <Chip key={t} active={type === t} onClick={() => setType(t)}>
                  {NOTE_TYPE_META[t].emoji} {NOTE_TYPE_META[t].label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Categoría</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{NOTE_CATEGORY_LABEL[c]}</Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Importancia</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {IMPORTANCES.map((i) => (
                <Chip key={i} active={importance === i} onClick={() => setImportance(i)}>
                  {NOTE_IMPORTANCE_META[i].emoji} {NOTE_IMPORTANCE_META[i].label}
                </Chip>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Etiquetas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((t) => {
                  const active = selTags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelTags((s) => (active ? s.filter((x) => x !== t.id) : [...s, t.id]))}
                      className={`px-2 py-1 rounded-lg text-xs border transition-colors ${active ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/20">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs border border-border">Cancelar</button>
          <button
            disabled={!title.trim() && !content.trim()}
            onClick={() => onSave({
              title: title.trim() || content.trim().slice(0, 60),
              content,
              type,
              category,
              tags: selTags,
              importance,
            })}
            className="px-3 py-1.5 rounded-lg text-xs bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-40"
          >
            Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteDetail({
  note,
  allNotes,
  tags,
  onClose,
  onUpdate,
  onDelete,
  onToggleChecklist,
  onLink,
  onConvertTask,
  onConvertProject,
}: {
  note: Note;
  allNotes: Note[];
  tags: { id: string; name: string; color: string }[];
  onClose: () => void;
  onUpdate: (patch: Partial<Note>) => void;
  onDelete: () => void;
  onToggleChecklist: (itemId: string) => void;
  onLink: (id: string) => void;
  onConvertTask: () => void;
  onConvertProject: () => void;
}) {
  const [editingTitle, setEditingTitle] = useState(note.title);
  const [editingContent, setEditingContent] = useState(note.content);
  const [newCheck, setNewCheck] = useState("");
  const related = useMemo(() => relatedNotes(note, allNotes, 4), [note, allNotes]);
  const linked = allNotes.filter((n) => note.linkedNoteIds.includes(n.id));

  const save = () => {
    if (editingTitle !== note.title || editingContent !== note.content) {
      onUpdate({ title: editingTitle.trim() || "Sin título", content: editingContent });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-start justify-center pt-[4vh] px-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-card mb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{NOTE_TYPE_META[note.type].emoji}</span>
            {NOTE_TYPE_META[note.type].label} · {NOTE_CATEGORY_LABEL[note.category]}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={save}
            className="w-full bg-transparent text-2xl font-display font-bold outline-none"
          />
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onBlur={save}
            rows={Math.min(20, Math.max(5, editingContent.split("\n").length + 1))}
            className="w-full bg-secondary/30 rounded-xl border border-border p-3 text-sm outline-none focus:border-primary/50 resize-y whitespace-pre-wrap"
          />

          {/* metadata controls */}
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <select
              value={note.type}
              onChange={(e) => onUpdate({ type: e.target.value as NoteType })}
              className="bg-secondary/40 rounded-lg border border-border px-2 py-1.5"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{NOTE_TYPE_META[t].emoji} {NOTE_TYPE_META[t].label}</option>
              ))}
            </select>
            <select
              value={note.category}
              onChange={(e) => onUpdate({ category: e.target.value as NoteCategory })}
              className="bg-secondary/40 rounded-lg border border-border px-2 py-1.5"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{NOTE_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <select
              value={note.importance}
              onChange={(e) => onUpdate({ importance: e.target.value as NoteImportance })}
              className="bg-secondary/40 rounded-lg border border-border px-2 py-1.5"
            >
              {IMPORTANCES.map((i) => (
                <option key={i} value={i}>{NOTE_IMPORTANCE_META[i].emoji} {NOTE_IMPORTANCE_META[i].label}</option>
              ))}
            </select>
          </div>

          {/* tags */}
          {tags.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Etiquetas</div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = note.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onUpdate({ tags: active ? note.tags.filter((x) => x !== t.id) : [...note.tags, t.id] })}
                      className={`px-2 py-1 rounded-lg text-xs border transition-colors ${active ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* checklist */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <ListChecks className="w-3 h-3" /> Checklist
            </div>
            <ul className="space-y-1.5">
              {note.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleChecklist(c.id)}
                    className={`w-4 h-4 rounded border ${c.done ? "bg-primary border-primary" : "border-border"} flex items-center justify-center`}
                  >
                    {c.done && <span className="text-[10px] text-primary-foreground">✓</span>}
                  </button>
                  <span className={`text-sm ${c.done ? "line-through text-muted-foreground" : ""}`}>{c.text}</span>
                  <button
                    onClick={() => onUpdate({ checklist: note.checklist.filter((x) => x.id !== c.id) })}
                    className="ml-auto text-muted-foreground hover:text-destructive text-xs"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <input
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCheck.trim()) {
                    onUpdate({ checklist: [...note.checklist, { id: crypto.randomUUID(), text: newCheck.trim(), done: false }] });
                    setNewCheck("");
                  }
                }}
                placeholder="Añadir item…"
                className="flex-1 bg-secondary/30 rounded-lg border border-border px-2 py-1.5 text-xs outline-none"
              />
            </div>
          </div>

          {/* convert actions */}
          <div className="grid md:grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => { onConvertTask(); onClose(); }}
              className="px-3 py-2.5 rounded-xl bg-primary/15 border border-primary/40 text-primary text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/25"
            >
              <CheckSquare className="w-4 h-4" /> Convertir en tarea (+10 XP)
            </button>
            <button
              onClick={() => { onConvertProject(); }}
              className="px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm font-medium inline-flex items-center justify-center gap-2 hover:border-primary/40"
            >
              <Rocket className="w-4 h-4" /> Convertir en proyecto (+15 XP)
            </button>
          </div>

          {/* linked notes */}
          {linked.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> Notas vinculadas</div>
              <div className="flex flex-wrap gap-2">
                {linked.map((l) => (
                  <span key={l.id} className="px-2 py-1 rounded-lg text-xs bg-secondary/40 border border-border">
                    {NOTE_TYPE_META[l.type].emoji} {l.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* related */}
          {related.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Relacionadas con esta nota
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {related.map((r) => {
                  const isLinked = note.linkedNoteIds.includes(r.id);
                  return (
                    <div key={r.id} className="p-2.5 rounded-lg border border-border bg-secondary/20 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">{NOTE_TYPE_META[r.type].emoji} {NOTE_CATEGORY_LABEL[r.category]}</div>
                        <div className="text-sm font-medium truncate">{r.title}</div>
                      </div>
                      <button
                        onClick={() => onLink(r.id)}
                        disabled={isLinked}
                        className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/40 disabled:opacity-40 inline-flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" /> {isLinked ? "Vinculada" : "Vincular"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
