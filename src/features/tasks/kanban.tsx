/**
 * **Kanban de tareas** — columnas por lista, drag & drop nativo para mover tareas.
 */
import { useMemo } from "react";
import type { Task, TaskList } from "@/lib/storage";
import { priorityRank } from "@/lib/storage";
import { CalendarIcon, Clock, Flag, Plus } from "lucide-react";

type Props = {
  tasks: Task[];
  lists: TaskList[];
  onOpenTask: (t: Task) => void;
  onMove: (taskId: string, newListId: string) => void;
  onNewInList: (listId: string) => void;
};

export function TasksKanban({ tasks, lists, onOpenTask, onMove, onNewInList }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const l of lists) map.set(l.id, []);
    map.set("__none__", []);
    for (const t of tasks) {
      const key = t.listId && map.has(t.listId) ? t.listId : "__none__";
      map.get(key)!.push(t);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.status !== b.status) return a.status === "completed" ? 1 : -1;
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        const ad = a.due ? new Date(a.due).getTime() : Infinity;
        const bd = b.due ? new Date(b.due).getTime() : Infinity;
        return ad - bd;
      });
    }
    return map;
  }, [tasks, lists]);

  const columns: { id: string; name: string; emoji: string; color?: string }[] = [
    ...lists.map((l) => ({ id: l.id, name: l.name, emoji: l.emoji, color: l.color })),
    { id: "__none__", name: "Sin lista", emoji: "📦" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
      {columns.map((col) => {
        const items = grouped.get(col.id) ?? [];
        return (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/task-id");
              if (id) onMove(id, col.id);
            }}
            className="min-w-[260px] w-[280px] shrink-0 snap-start rounded-2xl bg-secondary/40 border border-border p-2 flex flex-col"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{col.emoji}</span>
                <span className="truncate">{col.name}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              {col.id !== "__none__" && (
                <button
                  onClick={() => onNewInList(col.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Nueva tarea en esta lista"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-1 flex-1 space-y-1.5 min-h-[80px] max-h-[70vh] overflow-y-auto pr-1">
              {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                  Suelta aquí
                </div>
              )}
              {items.map((t) => {
                const done = t.status === "completed";
                const overdue = t.due && new Date(t.due).getTime() < Date.now() && !done;
                return (
                  <button
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task-id", t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onOpenTask(t)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      done
                        ? "bg-card/50 border-border opacity-60"
                        : overdue
                          ? "bg-destructive/5 border-destructive/40"
                          : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-[var(--energy)]" : "bg-muted-foreground"
                      }`} />
                      <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                      {t.due && (
                        <span className={`inline-flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(t.due).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {t.durationMinutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.durationMinutes}m
                        </span>
                      )}
                      {t.priority === "high" && (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <Flag className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
