/**
 * **Dashboard Productivity** — vista principal cuando el modo activo es "productivity".
 * Métricas: tareas hoy, atrasadas, hábitos del día, tiempo tracked, proyectos activos.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Flame, Clock, ChevronRight, Timer } from "lucide-react";
import { useAppState, isOverdue, isDueToday, priorityRank } from "@/lib/storage";
import { useProjects } from "@/hooks/use-projects";
import { useTimeBlocks } from "@/hooks/use-time-blocks";
import { todayCDMX } from "@/lib/date-utils";

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function fmtHM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ProductivityDashboard() {
  const { state, today } = useAppState();
  const { projects } = useProjects();
  const { blocks } = useTimeBlocks();

  const tasks = state.tasks;

  const dueToday = useMemo(
    () => tasks.filter((t) => t.status !== "completed" && isDueToday(t, today)),
    [tasks, today],
  );
  const overdue = useMemo(
    () => tasks.filter((t) => t.status !== "completed" && isOverdue(t)),
    [tasks],
  );
  const completedToday = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.completedAt?.slice(0, 10) === today),
    [tasks, today],
  );
  const highPriority = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "completed")
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
        .slice(0, 5),
    [tasks],
  );

  const habits = state.habits;
  const dailyHabits = habits.filter((h) => h.frequency === "daily");
  const habitsDoneToday = dailyHabits.filter((h) => h.history.includes(today));
  const habitsPct = dailyHabits.length
    ? Math.round((habitsDoneToday.length / dailyHabits.length) * 100)
    : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak || 0), 0);

  // Tiempo tracked hoy y semana
  const todayBlocks = blocks.filter((b) => b.date === today);
  const minsToday = todayBlocks.reduce((s, b) => s + minutesBetween(b.start_time, b.end_time), 0);

  const weekStart = useMemo(() => {
    const d = new Date(today + "T00:00:00");
    const day = d.getDay();
    const diffToMon = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMon);
    return d.toISOString().slice(0, 10);
  }, [today]);
  const weekBlocks = blocks.filter((b) => b.date >= weekStart && b.date <= today);
  const minsWeek = weekBlocks.reduce((s, b) => s + minutesBetween(b.start_time, b.end_time), 0);

  // Top categoría de tiempo semana
  const timeByCat: Record<string, number> = {};
  weekBlocks.forEach((b) => {
    timeByCat[b.category] = (timeByCat[b.category] || 0) + minutesBetween(b.start_time, b.end_time);
  });
  const topCat = Object.entries(timeByCat).sort((a, b) => b[1] - a[1])[0];

  const activeProjects = projects.filter((p) => p.status === "activo");
  const withDeadline = activeProjects
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="space-y-4 mb-6">
      {/* Fila principal: tareas hoy + hábitos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/tasks"
          className="glass-card rounded-3xl p-5 hover:shadow-glow transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tareas hoy
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold">{dueToday.length}</span>
            <span className="text-sm text-muted-foreground">pendientes</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {completedToday.length} completadas hoy
          </div>
          {overdue.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" />
              {overdue.length} atrasada{overdue.length === 1 ? "" : "s"}
            </div>
          )}
        </Link>

        <Link
          to="/habits"
          className="glass-card rounded-3xl p-5 hover:shadow-glow transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hábitos hoy
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold">
              {habitsDoneToday.length}
              <span className="text-xl text-muted-foreground">/{dailyHabits.length}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
              style={{ width: `${habitsPct}%` }}
            />
          </div>
          {bestStreak > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Mejor racha: <span className="text-foreground font-semibold">{bestStreak}d</span>
            </div>
          )}
        </Link>
      </div>

      {/* Tiempo tracked */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/time" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Tiempo hoy
            </span>
          </div>
          <div className="text-2xl font-display font-bold">{fmtHM(minsToday)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {todayBlocks.length} bloque{todayBlocks.length === 1 ? "" : "s"}
          </div>
        </Link>

        <Link to="/time" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Semana
            </span>
          </div>
          <div className="text-2xl font-display font-bold">{fmtHM(minsWeek)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {topCat ? `Top: ${topCat[0]} (${fmtHM(topCat[1])})` : "Sin registros"}
          </div>
        </Link>

        <Link to="/pomodoro" className="glass-card rounded-3xl p-4 hover:shadow-glow transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🍅</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Pomodoro
            </span>
          </div>
          <div className="text-2xl font-display font-bold">Iniciar</div>
          <div className="text-xs text-muted-foreground mt-1">Sesión de foco</div>
        </Link>
      </div>

      {/* Prioridad + Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold flex items-center gap-2">
              <span>🔥</span> Prioridad alta
            </h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          {highPriority.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas pendientes 🎉</p>
          ) : (
            <ul className="space-y-1.5">
              {highPriority.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      t.priority === "high"
                        ? "bg-destructive"
                        : t.priority === "medium"
                          ? "bg-orange-400"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <span className="truncate flex-1">{t.title}</span>
                  {t.due && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {t.due.slice(5, 10)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold flex items-center gap-2">
              <span>🗂️</span> Proyectos activos
            </h3>
            <Link to="/projects" className="text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-display font-bold">{activeProjects.length}</span>
            <span className="text-xs text-muted-foreground">en curso</span>
          </div>
          {withDeadline.length > 0 ? (
            <ul className="space-y-1.5">
              {withDeadline.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="truncate flex-1">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    📅 {p.deadline!.slice(5, 10)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Sin deadlines cercanos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
