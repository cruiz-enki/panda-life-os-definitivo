/**
 * **Feature** — Componentes (parts) del módulo **Tareas**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useAppState,
  smartTaskRecommendation,
  priorityLabel,
  priorityRank,
  priorityPoints,
  taskXp,
  recurrenceLabel,
  isOverdue,
  isDueToday,
  type Task,
  type Priority,
  type ReminderOffset,
  type Subtask,
  type Recurrence,
  type RecurrenceFrequency,
} from "@/lib/storage";
import {
  Plus,
  Check,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Bell,
  Sparkles,
  Copy,
  Edit3,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  Flag,
  ChevronRight,
  Clock,
  ListChecks,
  Repeat,
  Zap,
  Flame,
} from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { parseISO } from "date-fns";

type ViewKey = "today" | "upcoming" | "all" | "completed" | "high" | string; // string for list/tag filters

const VIEW_LABELS: Record<string, { label: string; emoji: string }> = {
  today: { label: "Hoy", emoji: "📅" },
  upcoming: { label: "Próximos días", emoji: "📆" },
  all: { label: "Todas las tareas", emoji: "📋" },
  completed: { label: "Completadas", emoji: "✅" },
  high: { label: "Prioridad alta", emoji: "🔥" },
};

export function TasksPage() {
  const {
    state,
    today,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskComplete,
    toggleSubtask,
    addList,
    addTag,
    deleteList,
    deleteTag,
  } = useAppState();

  const [view, setView] = useState<ViewKey>("today");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [listModal, setListModal] = useState(false);
  const [tagModal, setTagModal] = useState(false);

  const { tasks: smartList, alert } = useMemo(
    () => smartTaskRecommendation(state.tasks, today),
    [state.tasks, today],
  );

  const filtered = useMemo(() => {
    let list = [...state.tasks];
    const now = new Date();
    if (view === "today") {
      list = list.filter((t) => t.status !== "completed" && (isDueToday(t, today) || isOverdue(t, now)));
    } else if (view === "upcoming") {
      const in7 = new Date(Date.now() + 7 * 86400000);
      list = list.filter(
        (t) =>
          t.status !== "completed" &&
          t.due &&
          new Date(t.due) >= now &&
          new Date(t.due) <= in7,
      );
    } else if (view === "completed") {
      list = list.filter((t) => t.status === "completed");
    } else if (view === "high") {
      list = list.filter((t) => t.status !== "completed" && t.priority === "high");
    } else if (view !== "all") {
      // list filter by listId
      list = list.filter((t) => t.listId === view);
    }
    if (activeTagFilter) list = list.filter((t) => t.tags.includes(activeTagFilter));
    return list.sort((a, b) => {
      if (a.status !== b.status) return a.status === "completed" ? 1 : -1;
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      const ad = a.due ? new Date(a.due).getTime() : Infinity;
      const bd = b.due ? new Date(b.due).getTime() : Infinity;
      return ad - bd;
    });
  }, [state.tasks, view, activeTagFilter, today]);

  const counts = useMemo(() => {
    const pending = state.tasks.filter((t) => t.status !== "completed");
    return {
      today: pending.filter((t) => isDueToday(t, today) || isOverdue(t)).length,
      upcoming: pending.filter((t) => {
        if (!t.due) return false;
        const d = new Date(t.due).getTime();
        return d > Date.now() && d <= Date.now() + 7 * 86400000;
      }).length,
      all: pending.length,
      completed: state.tasks.filter((t) => t.status === "completed").length,
      high: pending.filter((t) => t.priority === "high").length,
    };
  }, [state.tasks, today]);

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 max-w-7xl mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Tareas</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
            Decide y ejecuta 🎯
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Racha productiva: <span className="text-primary font-semibold">{state.productivity.streak}d</span> · {counts.all} pendientes
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setComposerOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </header>

      {/* Smart alert */}
      <AlertBanner alert={alert} />

      {/* Smart recommendations */}
      {smartList.length > 0 && view === "today" && (
        <section className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-primary">
              Recomendadas para hoy
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {smartList.slice(0, 3).map((t) => (
              <button
                key={t.id}
                onClick={() => setEditingTask(t)}
                className="text-left p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <PriorityDot priority={t.priority} />
                  <span className="text-xs text-muted-foreground">
                    {state.taskLists.find((l) => l.id === t.listId)?.name ?? "—"}
                  </span>
                </div>
                <div className="font-medium text-sm line-clamp-2">{t.title}</div>
                {t.due && (
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDue(t.due, today)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar of views, lists, tags */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">Vistas</h3>
            <div className="space-y-1">
              {(Object.keys(VIEW_LABELS) as Array<keyof typeof VIEW_LABELS>).map((k) => {
                const active = view === k;
                const count = counts[k as keyof typeof counts];
                return (
                  <button
                    key={k}
                    onClick={() => { setView(k); setActiveTagFilter(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      active ? "bg-primary/15 text-primary font-medium" : "hover:bg-secondary/50 text-foreground/80"
                    }`}
                  >
                    <span>{VIEW_LABELS[k].emoji}</span>
                    <span className="flex-1 text-left">{VIEW_LABELS[k].label}</span>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? "bg-primary/20" : "bg-secondary text-muted-foreground"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Listas</h3>
              <button onClick={() => setListModal(true)} className="text-muted-foreground hover:text-primary">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {state.taskLists.map((l) => {
                const active = view === l.id;
                const count = state.tasks.filter((t) => t.listId === l.id && t.status !== "completed").length;
                return (
                  <div key={l.id} className="group relative">
                    <button
                      onClick={() => { setView(l.id); setActiveTagFilter(null); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                        active ? "bg-primary/15 text-primary font-medium" : "hover:bg-secondary/50 text-foreground/80"
                      }`}
                    >
                      <span>{l.emoji}</span>
                      <span className="flex-1 text-left truncate">{l.name}</span>
                      {count > 0 && (
                        <span className="text-xs text-muted-foreground">{count}</span>
                      )}
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar lista "${l.name}" y todas sus tareas?`)) deleteList(l.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                      aria-label="Eliminar lista"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Etiquetas</h3>
              <button onClick={() => setTagModal(true)} className="text-muted-foreground hover:text-primary">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {state.tags.map((tag) => {
                const active = activeTagFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setActiveTagFilter(active ? null : tag.id)}
                    className={`text-xs px-2 py-1 rounded-md border transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                    }`}
                    style={{ color: tag.color }}
                  >
                    #{tag.name}
                  </button>
                );
              })}
              {state.tags.length === 0 && (
                <span className="text-xs text-muted-foreground">Sin etiquetas</span>
              )}
            </div>
          </div>
        </aside>

        {/* Tasks list */}
        <main className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">
              {VIEW_LABELS[view]?.label ?? state.taskLists.find((l) => l.id === view)?.name ?? "Tareas"}
            </h2>
            <div className="flex items-center gap-1.5 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 shadow-sm animate-in fade-in slide-in-from-right-2 duration-500">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-tight">Racha: {state.productivity.streak || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">

            {activeTagFilter && (
              <button
                onClick={() => setActiveTagFilter(null)}
                className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary inline-flex items-center gap-1"
              >
                #{state.tags.find((t) => t.id === activeTagFilter)?.name} <X className="w-3 h-3" />
              </button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">{filtered.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Inbox className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nada por aquí. Disfruta el momento 🐼</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  state={state}
                  today={today}
                  onToggle={() => toggleTaskComplete(task.id)}
                  onSubtaskToggle={(sid) => toggleSubtask(task.id, sid)}
                  onEdit={() => setEditingTask(task)}
                  onDuplicate={() => duplicateTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                  onReschedule={() => {
                    const next = new Date(Date.now() + 86400000);
                    next.setHours(9, 0, 0, 0);
                    updateTask(task.id, { due: next.toISOString() });
                  }}
                />
              ))}
            </ul>
          )}
        </main>
      </div>


      {(composerOpen || editingTask) && (
        <TaskComposer
          task={editingTask}
          state={state}
          onClose={() => { setComposerOpen(false); setEditingTask(null); }}
          onSave={(data) => {
            if (editingTask) {
              updateTask(editingTask.id, data);
            } else {
              addTask(data as Parameters<typeof addTask>[0]);
            }
            setComposerOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {listModal && (
        <ListComposer
          onClose={() => setListModal(false)}
          onCreate={(name, emoji, color) => { addList(name, emoji, color); setListModal(false); }}
        />
      )}
      {tagModal && (
        <TagComposer
          onClose={() => setTagModal(false)}
          onCreate={(name, color) => { addTag(name, color); setTagModal(false); }}
          onDelete={deleteTag}
          tags={state.tags}
        />
      )}
    </div>
  );
}

function AlertBanner({ alert }: { alert: ReturnType<typeof smartTaskRecommendation>["alert"] }) {
  const styles = {
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
    warning: "border-[var(--energy)]/40 bg-[var(--energy)]/10 text-[var(--energy)]",
    info: "border-border bg-card text-muted-foreground",
    success: "border-primary/40 bg-primary/10 text-primary",
  } as const;
  const icons = {
    danger: AlertTriangle,
    warning: Flag,
    info: ListChecks,
    success: CheckCircle2,
  } as const;
  const Icon = icons[alert.tone];
  return (
    <div className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${styles[alert.tone]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">{alert.message}</span>
    </div>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const color = priority === "high" ? "bg-destructive" : priority === "medium" ? "bg-[var(--energy)]" : "bg-muted-foreground";
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

function formatDue(due: string, today: string): string {
  const d = new Date(due);
  const dateStr = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return `Hoy ${time}`;
  if (dateStr === tomorrow) return `Mañana ${time}`;
  if (d.getTime() < Date.now()) return `Vencida · ${d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + ` ${time}`;
}

function TaskRow({
  task,
  state,
  today,
  onToggle,
  onSubtaskToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onReschedule,
}: {
  task: Task;
  state: ReturnType<typeof useAppState>["state"];
  today: string;
  onToggle: () => void;
  onSubtaskToggle: (sid: string) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReschedule: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = task.status === "completed";
  const overdue = isOverdue(task);
  const list = state.taskLists.find((l) => l.id === task.listId);
  const taskTags = task.tags.map((id) => state.tags.find((t) => t.id === id)).filter(Boolean);
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <li
      className={`group rounded-2xl border p-3 sm:p-4 shadow-card transition-all ${
        done
          ? "border-border bg-card/50 opacity-60"
          : overdue
            ? "border-destructive/40 bg-destructive/5"
            : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${
            done
              ? "bg-primary border-primary text-primary-foreground"
              : task.priority === "high"
                ? "border-destructive hover:bg-destructive/10"
                : "border-border hover:border-primary"
          }`}
          aria-label={done ? "Desmarcar" : "Completar"}
        >
          {done && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <button onClick={onEdit} className="block text-left w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityDot priority={task.priority} />
              <h3 className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
            </div>
            {task.description && !done && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
            )}
          </button>

          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
            {list && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60">
                <span>{list.emoji}</span> {list.name}
              </span>
            )}
            {task.due && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                overdue ? "bg-destructive/15 text-destructive" : "bg-secondary/60 text-muted-foreground"
              }`}>
                <CalendarIcon className="w-3 h-3" /> {formatDue(task.due, today)}
              </span>
            )}
            {task.reminder && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground">
                <Bell className="w-3 h-3" /> {task.reminder === 10 ? "10 min" : task.reminder === 60 ? "1h" : "1d"}
              </span>
            )}
            {task.recurrence && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                <Repeat className="w-3 h-3" /> {recurrenceLabel(task.recurrence)}
              </span>
            )}
            {taskTags.map((tag) => (
              <span key={tag!.id} className="px-1.5 py-0.5 rounded-md text-[11px]" style={{ color: tag!.color, background: `color-mix(in oklab, ${tag!.color} 15%, transparent)` }}>
                #{tag!.name}
              </span>
            ))}
            {task.subtasks.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground hover:text-foreground"
              >
                <ListChecks className="w-3 h-3" /> {subDone}/{task.subtasks.length}
                <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
            )}
          </div>

          {expanded && task.subtasks.length > 0 && (
            <ul className="mt-3 space-y-1.5 pl-1">
              {task.subtasks.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onSubtaskToggle(s.id)}
                    className="flex items-center gap-2 text-sm w-full text-left hover:text-primary transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      s.done ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {s.done && <Check className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onReschedule} title="Reprogramar a mañana" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <CalendarIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDuplicate} title="Duplicar" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} title="Editar" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} title="Eliminar" className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!done && task.priority && (
        <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" />+{taskXp(task)} XP</span>
          <span>·</span>
          <span>Prioridad {priorityLabel(task.priority)}</span>
        </div>
      )}
    </li>
  );
}

function TaskComposer({
  task,
  state,
  onClose,
  onSave,
}: {
  task: Task | null;
  state: ReturnType<typeof useAppState>["state"];
  onClose: () => void;
  onSave: (data: Partial<Task> & { title: string; priority: Priority; listId: string; tags: string[] }) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [due, setDue] = useState(task?.due ? task.due.slice(0, 16) : "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [listId, setListId] = useState(task?.listId ?? state.taskLists[0]?.id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(task?.tags ?? []);
  const [reminder, setReminder] = useState<ReminderOffset | "">(task?.reminder ?? "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSub, setNewSub] = useState("");
  const [xpReward, setXpReward] = useState<string>(
    task?.xpReward !== undefined ? String(task.xpReward) : "",
  );
  const [recurrenceEnabled, setRecurrenceEnabled] = useState<boolean>(!!task?.recurrence);
  const [recFrequency, setRecFrequency] = useState<RecurrenceFrequency>(task?.recurrence?.frequency ?? "daily");
  const [recInterval, setRecInterval] = useState<number>(task?.recurrence?.interval ?? 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    if (!title.trim()) return;
    const xpNum = xpReward.trim() === "" ? undefined : Math.max(0, Math.round(Number(xpReward)));
    const recurrence: Recurrence | undefined = recurrenceEnabled
      ? { frequency: recFrequency, interval: Math.max(1, Math.round(recInterval || 1)) }
      : undefined;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      due: due ? new Date(due).toISOString() : undefined,
      priority,
      listId,
      tags: tagIds,
      reminder: reminder === "" ? undefined : reminder,
      subtasks,
      xpReward: Number.isFinite(xpNum as number) ? xpNum : undefined,
      recurrence,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-xl my-8 rounded-2xl bg-card border border-border p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">{task ? "Editar tarea" : "Nueva tarea"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-lg font-medium"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Fecha límite</label>
              <DateTimePicker
                date={due ? parseISO(due) : undefined}
                setDate={(date) => setDue(date ? date.toISOString().slice(0, 16) : "")}
                placeholder="Sin fecha"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Recordatorio</label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value === "" ? "" : (Number(e.target.value) as ReminderOffset))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
              >
                <option value="">Sin recordatorio</option>
                <option value="10">10 minutos antes</option>
                <option value="60">1 hora antes</option>
                <option value="1440">1 día antes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridad</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    priority === p
                      ? p === "high"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : p === "medium"
                          ? "border-[var(--energy)] bg-[var(--energy)]/10 text-[var(--energy)]"
                          : "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <PriorityDot priority={p} /> {priorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lista</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {state.taskLists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setListId(l.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    listId === l.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  {l.emoji} {l.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Etiquetas</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {state.tags.map((tag) => {
                const active = tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => setTagIds(active ? tagIds.filter((x) => x !== tag.id) : [...tagIds, tag.id])}
                    className={`text-xs px-2 py-1 rounded-md border transition-all ${
                      active ? "border-current" : "border-border opacity-60 hover:opacity-100"
                    }`}
                    style={{ color: tag.color, background: active ? `color-mix(in oklab, ${tag.color} 15%, transparent)` : undefined }}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> XP al completar
              </label>
              <input
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                placeholder={`Auto (${priorityPoints(priority)})`}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Vacío = automático por prioridad
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Repetir
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrenceEnabled((v) => !v)}
                  className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                    recurrenceEnabled
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {recurrenceEnabled ? "Sí" : "No"}
                </button>
                {recurrenceEnabled && (
                  <>
                    <input
                      type="number"
                      min={1}
                      value={recInterval}
                      onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 px-2 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
                    />
                    <select
                      value={recFrequency}
                      onChange={(e) => setRecFrequency(e.target.value as RecurrenceFrequency)}
                      className="flex-1 px-2 py-2 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm"
                    >
                      <option value="daily">día(s)</option>
                      <option value="weekly">semana(s)</option>
                      <option value="monthly">mes(es)</option>
                      <option value="yearly">año(s)</option>
                    </select>
                  </>
                )}
              </div>
              {recurrenceEnabled && !due && (
                <p className="mt-1 text-[10px] text-[var(--energy)]">
                  Añade fecha para anclar la repetición
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subtareas</label>
            <ul className="mt-1 space-y-1.5">
              {subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setSubtasks(subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
                    className={`w-4 h-4 rounded border flex items-center justify-center ${s.done ? "bg-primary border-primary" : "border-border"}`}
                  >
                    {s.done && <Check className="w-3 h-3 text-primary-foreground" />}
                  </button>
                  <span className={`flex-1 ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                  <button onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSub.trim()) {
                    e.preventDefault();
                    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSub.trim(), done: false }]);
                    setNewSub("");
                  }
                }}
                placeholder="Añadir subtarea y Enter"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary outline-none text-sm"
              />
              <button
                onClick={() => {
                  if (newSub.trim()) {
                    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSub.trim(), done: false }]);
                    setNewSub("");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            disabled={!title.trim()}
            onClick={submit}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50 disabled:shadow-none"
          >
            {task ? "Guardar cambios" : "Crear tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListComposer({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, emoji: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const colors = [
    "oklch(0.78 0.18 150)", "oklch(0.75 0.2 50)", "oklch(0.7 0.18 220)",
    "oklch(0.7 0.22 295)", "oklch(0.82 0.17 90)", "oklch(0.65 0.22 25)",
  ];
  const [color, setColor] = useState(colors[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Nueva lista</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="w-14 px-2 py-2.5 rounded-xl bg-secondary border border-border text-2xl text-center outline-none focus:border-primary"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la lista"
              className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim(), emoji, color)}
            className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50"
          >
            Crear lista
          </button>
        </div>
      </div>
    </div>
  );
}

function TagComposer({
  onClose, onCreate, onDelete, tags,
}: {
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  tags: { id: string; name: string; color: string }[];
}) {
  const [name, setName] = useState("");
  const colors = [
    "oklch(0.78 0.18 150)", "oklch(0.75 0.2 50)", "oklch(0.7 0.18 220)",
    "oklch(0.7 0.22 295)", "oklch(0.82 0.17 90)", "oklch(0.65 0.22 25)",
  ];
  const [color, setColor] = useState(colors[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Etiquetas</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="nombre-etiqueta"
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-sm"
          />
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            disabled={!name.trim()}
            onClick={() => { onCreate(name.trim(), color); setName(""); }}
            className="w-full py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50 text-sm"
          >
            Añadir etiqueta
          </button>
          {tags.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Existentes</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border" style={{ color: t.color }}>
                    #{t.name}
                    <button onClick={() => onDelete(t.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
