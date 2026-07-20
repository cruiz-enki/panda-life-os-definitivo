/**
 * **Calendario de tareas** — grilla mensual con tareas por día. Drag & drop para reagendar.
 */
import { useMemo, useState } from "react";
import type { Task } from "@/lib/storage";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  tasks: Task[];
  onOpenTask: (t: Task) => void;
  onReschedule: (taskId: string, newDue: Date) => void;
  onNewOnDate: (date: Date) => void;
};

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfGrid(d: Date) {
  const s = startOfMonth(d);
  // Semana empezando en lunes: getDay() 0=dom → 6, 1=lun → 0
  const dow = (s.getDay() + 6) % 7;
  s.setDate(s.getDate() - dow);
  return s;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function TasksCalendar({ tasks, onOpenTask, onReschedule, onNewOnDate }: Props) {
  const [cursor, setCursor] = useState(() => new Date());

  const days = useMemo(() => {
    const arr: Date[] = [];
    const start = startOfGrid(cursor);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due) continue;
      const d = new Date(t.due);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  const monthLabel = cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-sm capitalize">{monthLabel}</h3>
          <button
            onClick={() => setCursor(new Date())}
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {DOW.map((d) => (
          <div key={d} className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = isSameDay(d, today);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const items = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/task-id");
                if (!id) return;
                const target = new Date(d);
                target.setHours(9, 0, 0, 0);
                onReschedule(id, target);
              }}
              onDoubleClick={() => {
                const target = new Date(d);
                target.setHours(9, 0, 0, 0);
                onNewOnDate(target);
              }}
              className={`min-h-[92px] border-r border-b border-border p-1.5 ${
                inMonth ? "bg-card" : "bg-secondary/20"
              } ${isToday ? "ring-1 ring-primary/40 ring-inset" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${isToday ? "font-bold text-primary" : inMonth ? "text-foreground/80" : "text-muted-foreground/50"}`}>
                  {d.getDate()}
                </span>
                {items.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{items.length - 3}</span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((t) => {
                  const done = t.status === "completed";
                  const isOver = new Date(t.due!).getTime() < Date.now() && !done;
                  return (
                    <button
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/task-id", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => onOpenTask(t)}
                      className={`block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing ${
                        done
                          ? "bg-secondary/60 text-muted-foreground line-through"
                          : isOver
                            ? "bg-destructive/15 text-destructive"
                            : t.priority === "high"
                              ? "bg-destructive/10 text-destructive"
                              : t.priority === "medium"
                                ? "bg-[var(--energy)]/15 text-[var(--energy)]"
                                : "bg-primary/10 text-primary"
                      }`}
                      title={t.title}
                    >
                      {t.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground px-3 py-2 border-t border-border">
        Arrastra una tarea a otro día para reagendar · doble clic en un día para crear
      </p>
    </div>
  );
}
