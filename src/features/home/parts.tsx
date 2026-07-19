/**
 * **Feature** — Componentes (parts) del módulo **Hogar**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Trash2, Flame, Sparkles, Trophy, Home as HomeIcon, Star, Pencil, Calendar, Search } from "lucide-react";
import { useHome } from "@/hooks/use-home";
import { useAppState } from "@/lib/storage";
import {
  HOME_BONUS,
  HOME_TYPE_META,
  HOME_XP_DEFAULTS,
  dayOfWeekLabel,
  type HomeFrequency,
  type HomeTaskType,
} from "@/lib/home-types";

const TYPE_OPTIONS: HomeTaskType[] = ["routine", "weekly", "block", "pets", "project"];
const FREQ_OPTIONS: HomeFrequency[] = ["daily", "weekly", "biweekly", "monthly", "flexible", "custom"];

const MOTIVATIONAL = [
  "Cada tarea cuenta. Tu hogar te lo agradece 🌿",
  "Pequeños hábitos, grandes resultados ✨",
  "El orden externo refleja claridad interna 🧘",
  "Hoy es un buen día para cuidar tu espacio 🏠",
  "Disciplina diaria, libertad mensual 🔥",
];

export function HomePage() {
  const home = useHome();
  const { addBonusXp } = useAppState();
  const [tab, setTab] = useState<"today" | "all" | "areas" | "schedule">("all");
  const [openTask, setOpenTask] = useState(false);
  const [openArea, setOpenArea] = useState(false);
  const [editingTask, setEditingTask] = useState<import("@/lib/home-types").HomeTask | null>(null);
  const [editingArea, setEditingArea] = useState<import("@/lib/home-types").HomeArea | null>(null);

  // Bonus tracking refs (no doble-cobro por sesión)
  const dayBonusGivenRef = useRef(false);
  const mvdGivenRef = useRef(false);
  const weekBonusGivenRef = useRef(false);

  // Mensaje motivacional estable por día
  const motivational = useMemo(() => {
    const day = new Date().getDate();
    return MOTIVATIONAL[day % MOTIVATIONAL.length];
  }, []);

  const { snapshot, todayList, weeklyList, potentialXpToday, areas, tasks } = home;

  const todayProgress = snapshot.todayTotal > 0 ? (snapshot.todayDone / snapshot.todayTotal) * 100 : 0;

  // Auto-trigger bonuses cuando se cumple condición
  useEffect(() => {
    if (snapshot.mvdMet && !mvdGivenRef.current) {
      mvdGivenRef.current = true;
      addBonusXp(HOME_BONUS.MVD);
      toast(`✅ Mínimo viable del día +${HOME_BONUS.MVD} XP`, { description: "Mantienes la racha 🔥", duration: 3500 });
    }
  }, [snapshot.mvdMet, addBonusXp]);

  useEffect(() => {
    if (snapshot.dayComplete && snapshot.todayTotal > 0 && !dayBonusGivenRef.current) {
      dayBonusGivenRef.current = true;
      addBonusXp(HOME_BONUS.DAY_COMPLETE);
      toast(`🌟 Día completo del hogar +${HOME_BONUS.DAY_COMPLETE} XP`, { description: "¡Excelente cierre!", duration: 4500 });
    }
  }, [snapshot.dayComplete, snapshot.todayTotal, addBonusXp]);

  useEffect(() => {
    if (snapshot.weekComplete && snapshot.weeklyTasksTotal > 0 && !weekBonusGivenRef.current) {
      weekBonusGivenRef.current = true;
      addBonusXp(HOME_BONUS.WEEK_COMPLETE);
      toast(`🏆 Semana del hogar completa +${HOME_BONUS.WEEK_COMPLETE} XP`, { description: "Disciplina pura 💪", duration: 5000 });
    }
  }, [snapshot.weekComplete, snapshot.weeklyTasksTotal, addBonusXp]);

  const onComplete = async (taskId: string) => {
    const { xp, alreadyCompleted } = await home.completeTask(taskId);
    if (alreadyCompleted) return;
    if (xp > 0) {
      addBonusXp(xp);
      toast(`+${xp} XP`, { duration: 1500 });
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><HomeIcon className="w-4 h-4" /> Hogar</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Tu casa, tu santuario 🏠</h1>
          <p className="mt-2 text-muted-foreground italic">{motivational}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenArea(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-primary/50 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Área
          </button>
          <button
            onClick={() => setOpenTask(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Tarea
          </button>
        </div>
      </header>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatTile
          icon={<Sparkles className="w-4 h-4 text-[var(--xp)]" />}
          label="XP potencial hoy"
          value={`+${potentialXpToday}`}
          hint={snapshot.todayTotal === 0 ? "Sin tareas hoy" : `${snapshot.todayDone}/${snapshot.todayTotal} hechas`}
        />
        <StatTile
          icon={<Flame className="w-4 h-4 text-[oklch(0.7_0.2_30)]" />}
          label="MVD"
          value={snapshot.mvdMet ? "Cumplido" : "Pendiente"}
          hint={snapshot.mvdMet ? "Racha mantenida" : "Completa una tarea clave"}
          tone={snapshot.mvdMet ? "success" : "muted"}
        />
        <StatTile
          icon={<Trophy className="w-4 h-4 text-[oklch(0.82_0.17_90)]" />}
          label="Día"
          value={snapshot.dayComplete ? "Completo" : `${todayProgress.toFixed(0)}%`}
          hint={snapshot.dayComplete ? `+${HOME_BONUS.DAY_COMPLETE} XP otorgados` : `Bonus al 100%: +${HOME_BONUS.DAY_COMPLETE} XP`}
          tone={snapshot.dayComplete ? "success" : "muted"}
        />
        <StatTile
          icon={<Star className="w-4 h-4 text-primary" />}
          label="Semana"
          value={`${snapshot.weeklyTasksDone}/${snapshot.weeklyTasksTotal}`}
          hint={snapshot.weekComplete ? "¡Completa!" : `Bonus: +${HOME_BONUS.WEEK_COMPLETE} XP`}
          tone={snapshot.weekComplete ? "success" : "muted"}
        />
      </div>

      {/* Progress bar del día */}
      {snapshot.todayTotal > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progreso del día</span>
            <span>{snapshot.todayDone}/{snapshot.todayTotal}</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-700"
              style={{ width: `${Math.max(2, todayProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {([
          ["all", `Todas (${tasks.length})`],
          ["today", `Hoy (${snapshot.todayTotal})`],
          ["schedule", `Agenda`],
          ["areas", `Áreas (${areas.length})`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      {tab === "all" && (
        <AllTasksView
          tasks={tasks}
          areas={areas}
          onComplete={onComplete}
          onUndo={(id) => home.undoCompletion(id)}
          onDelete={(id) => home.deleteTask(id)}
          onEdit={(t) => setEditingTask(t)}
          completions={home.completions}
        />
      )}
      {tab === "schedule" && (
        <ScheduleView
          tasks={tasks}
          areas={areas}
          onSchedule={home.scheduleTask}
        />
      )}
      {tab === "today" && (
        <TaskGrid
          items={todayList}
          areas={areas}
          onComplete={onComplete}
          onUndo={(id) => home.undoCompletion(id)}
          onDelete={(id) => home.deleteTask(id)}
          onEdit={(t) => setEditingTask(t)}
          emptyMsg="No hay tareas programadas para hoy."
        />
      )}
      {tab === "areas" && (
        <AreaGrid
          areas={areas}
          onDelete={(id) => { if (confirm("¿Eliminar esta área?")) home.deleteArea(id); }}
          onEdit={(a) => setEditingArea(a)}
        />
      )}

      {openTask && (
        <TaskDialog onClose={() => setOpenTask(false)} onSave={async (input) => { await home.createTask(input); setOpenTask(false); }} areas={areas} />
      )}
      {editingTask && (
        <TaskDialog
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (input) => { await home.updateTask(editingTask.id, input); setEditingTask(null); }}
          areas={areas}
        />
      )}
      {openArea && (
        <AreaDialog onClose={() => setOpenArea(false)} onSave={async (input) => { await home.createArea(input); setOpenArea(false); }} />
      )}
      {editingArea && (
        <AreaDialog
          initial={editingArea}
          onClose={() => setEditingArea(null)}
          onSave={async (input) => { await home.updateArea(editingArea.id, input); setEditingArea(null); }}
        />
      )}
    </div>
  );
}

function StatTile({ icon, label, value, hint, tone = "muted" }: {
  icon: React.ReactNode; label: string; value: string; hint?: string; tone?: "muted" | "success";
}) {
  return (
    <div className={`p-4 rounded-xl border ${tone === "success" ? "border-primary/40 bg-primary/5" : "border-border bg-card/50"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function TaskGrid({
  items, areas, onComplete, onUndo, onDelete, onEdit, emptyMsg, showFrequency,
}: {
  items: { task: import("@/lib/home-types").HomeTask; completed: boolean }[];
  areas: import("@/lib/home-types").HomeArea[];
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: import("@/lib/home-types").HomeTask) => void;
  emptyMsg: string;
  showFrequency?: boolean;
}) {
  if (items.length === 0) {
    return <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">{emptyMsg}</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(({ task, completed }) => {
        const area = areas.find((a) => a.id === task.area_id);
        const xp = task.xp_reward > 0 ? task.xp_reward : HOME_XP_DEFAULTS[task.task_type];
        return (
          <div key={task.id} className={`group p-4 rounded-xl border transition-all ${completed ? "border-primary/40 bg-primary/5" : "border-border bg-card/50 hover:border-primary/30"}`}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => completed ? onUndo(task.id) : onComplete(task.id)}
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  completed ? "bg-primary text-primary-foreground" : "border-2 border-border hover:border-primary"
                }`}
                aria-label={completed ? "Deshacer" : "Completar"}
              >
                {completed ? <Check className="w-4 h-4" /> : <span className="text-lg">{task.emoji}</span>}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-medium text-sm leading-tight ${completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                  {task.is_key && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[oklch(0.82_0.17_90)]/20 text-[oklch(0.7_0.18_70)]">CLAVE</span>}
                  {!task.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">PAUSADA</span>}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                  <span>{HOME_TYPE_META[task.task_type].emoji} {HOME_TYPE_META[task.task_type].label}</span>
                  {area && <span>· <span style={{ color: area.color }}>{area.emoji} {area.name}</span></span>}
                  {showFrequency && task.frequency !== "daily" && (
                    <span>· {task.frequency === "flexible" ? "Flexible" : task.frequency === "weekly" && task.day_of_week != null ? dayOfWeekLabel(task.day_of_week) : task.frequency}</span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-0.5 text-[var(--xp)]">
                    <Sparkles className="w-3 h-3" />+{xp}
                  </span>
                  {task.scheduled_date && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                      <Calendar className="w-3 h-3" /> {task.scheduled_date}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => onEdit(task)}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm("¿Eliminar esta tarea?")) onDelete(task.id); }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleView({
  tasks, areas, onSchedule
}: {
  tasks: import("@/lib/home-types").HomeTask[];
  areas: import("@/lib/home-types").HomeArea[];
  onSchedule: (taskId: string, date: string | null) => Promise<any>;
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const scheduledTasks = tasks.filter(t => t.scheduled_date === selectedDate);
  
  const filteredUnscheduled = useMemo(() => {
    const unscheduled = tasks.filter(t => !t.scheduled_date);
    if (!searchQuery.trim()) return unscheduled;
    
    const query = searchQuery.toLowerCase().trim();
    return unscheduled.filter(t => {
      const area = areas.find(a => a.id === t.area_id);
      return (
        t.title.toLowerCase().includes(query) ||
        (area?.name.toLowerCase().includes(query)) ||
        t.emoji?.includes(query)
      );
    });
  }, [tasks, searchQuery, areas]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Agenda para el {selectedDate}
          </h2>
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-4">
            <input
              type="date"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tareas asignadas</p>
              {scheduledTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center border border-dashed border-border rounded-lg">
                  Nada programado para este día
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduledTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-sm">
                      <span className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <span className="font-medium">{t.title}</span>
                      </span>
                      <button 
                        onClick={() => onSchedule(t.id, null)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold">Tareas disponibles</h2>
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-card/50">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredUnscheduled.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  {searchQuery ? "No hay coincidencias" : "No hay tareas sin programar"}
                </p>
              ) : (
                filteredUnscheduled.map(t => {
                  const area = areas.find(a => a.id === t.area_id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSchedule(t.id, selectedDate)}
                      className="w-full text-left p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{t.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          {area && <p className="text-[10px]" style={{ color: area.color }}>{area.name}</p>}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllTasksView({
  tasks, areas, onComplete, onUndo, onDelete, onEdit, completions
}: {
  tasks: import("@/lib/home-types").HomeTask[];
  areas: import("@/lib/home-types").HomeArea[];
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: import("@/lib/home-types").HomeTask) => void;
  completions: import("@/lib/home-types").HomeCompletion[];
}) {
  const [filterArea, setFilterArea] = useState<string>("all");
  const todayISO = new Date().toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filterArea !== "all") {
      result = result.filter(t => t.area_id === filterArea);
    }
    return result;
  }, [tasks, filterArea]);

  const tasksWithStatus = filteredTasks.map(t => ({
    task: t,
    completed: completions.some(c => c.task_id === t.id && c.completed_date === todayISO)
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterArea("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            filterArea === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas
        </button>
        {areas.map(a => (
          <button
            key={a.id}
            onClick={() => setFilterArea(a.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterArea === a.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {a.emoji} {a.name}
          </button>
        ))}
      </div>

      <TaskGrid
        items={tasksWithStatus}
        areas={areas}
        onComplete={onComplete}
        onUndo={onUndo}
        onDelete={onDelete}
        onEdit={onEdit}
        emptyMsg="No hay tareas en esta área."
      />
    </div>
  );
}

function AreaGrid({ areas, onDelete, onEdit }: {
  areas: import("@/lib/home-types").HomeArea[];
  onDelete: (id: string) => void;
  onEdit: (area: import("@/lib/home-types").HomeArea) => void;
}) {
  if (areas.length === 0) {
    return <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">Crea áreas (cocina, baño, recámara…) para organizar tus tareas.</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {areas.map((a) => (
        <div key={a.id} className="group p-4 rounded-xl border border-border bg-card/50 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${a.color}20` }}>
            {a.emoji}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{a.name}</h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => onEdit(a)}
              className="text-muted-foreground hover:text-primary"
              aria-label="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => { if (confirm(`¿Eliminar área "${a.name}"? Las tareas quedan sin área.`)) onDelete(a.id); }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskDialog({
  onClose, onSave, areas, initial,
}: {
  onClose: () => void;
  onSave: (input: Omit<import("@/lib/home-types").HomeTask, "id" | "user_id" | "created_at" | "updated_at" | "scheduled_date">) => Promise<void>;
  areas: import("@/lib/home-types").HomeArea[];
  initial?: import("@/lib/home-types").HomeTask;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✨");
  const [taskType, setTaskType] = useState<HomeTaskType>(initial?.task_type ?? "routine");
  const [frequency, setFrequency] = useState<HomeFrequency>(initial?.frequency ?? "daily");
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(initial?.day_of_week ?? null);
  const [areaId, setAreaId] = useState<string>(initial?.area_id ?? "");
  const [xpReward, setXpReward] = useState<number>(initial?.xp_reward ?? HOME_XP_DEFAULTS.routine);
  const [isKey, setIsKey] = useState(initial?.is_key ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");

  // Sincroniza XP sugerido cuando cambia el tipo (solo si no es edit, o el usuario no ha tocado)
  const typeRef = useRef(taskType);
  useEffect(() => {
    if (typeRef.current !== taskType) {
      setXpReward(HOME_XP_DEFAULTS[taskType]);
      typeRef.current = taskType;
    }
  }, [taskType]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSave({
      area_id: areaId || null,
      title: title.trim(),
      description,
      task_type: taskType,
      frequency,
      day_of_week: frequency === "weekly" ? dayOfWeek : null,
      xp_reward: xpReward,
      is_key: isKey,
      active,
      emoji,
      sort_order: initial?.sort_order ?? 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{isEdit ? "Editar tarea" : "Nueva tarea del hogar"}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-[80px_1fr] gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="text-center text-2xl px-2 py-2 rounded-lg bg-secondary border border-border" maxLength={2} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tender la cama" autoFocus className="px-3 py-2 rounded-lg bg-secondary border border-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Tipo</span>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value as HomeTaskType)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{HOME_TYPE_META[t].emoji} {HOME_TYPE_META[t].label}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Frecuencia</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as HomeFrequency)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
              {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f === "flexible" ? "Flexible (sin día)" : f}</option>)}
            </select>
          </label>
        </div>

        {frequency === "weekly" && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Día de la semana (opcional)</span>
            <select value={dayOfWeek ?? ""} onChange={(e) => setDayOfWeek(e.target.value === "" ? null : Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
              <option value="">Cualquier día</option>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{dayOfWeekLabel(d)}</option>)}
            </select>
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Área (opcional)</span>
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
            <option value="">— Sin área —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">XP recompensa</span>
            <input type="number" min={1} max={200} value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
          </label>
          <label className="flex items-end gap-2 pb-2 cursor-pointer">
            <input type="checkbox" checked={isKey} onChange={(e) => setIsKey(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Tarea clave (MVD)</span>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Notas (opcional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm resize-none" />
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">Activa <span className="text-xs text-muted-foreground">(desactiva para pausar sin borrar)</span></span>
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium">{isEdit ? "Guardar" : "Crear"}</button>
        </div>
      </form>
    </div>
  );
}

function AreaDialog({
  onClose, onSave, initial,
}: {
  onClose: () => void;
  onSave: (input: Omit<import("@/lib/home-types").HomeArea, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  initial?: import("@/lib/home-types").HomeArea;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🏠");
  const [color, setColor] = useState(initial?.color ?? "oklch(0.7 0.15 200)");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({ name: name.trim(), emoji, color, sort_order: initial?.sort_order ?? 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{isEdit ? "Editar área" : "Nueva área del hogar"}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="text-center text-2xl px-2 py-2 rounded-lg bg-secondary border border-border" maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cocina, Baño, Recámara…" autoFocus className="px-3 py-2 rounded-lg bg-secondary border border-border" />
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Color (oklch)</span>
          <input value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-mono" />
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium">{isEdit ? "Guardar" : "Crear"}</button>
        </div>
      </form>
    </div>
  );
}
