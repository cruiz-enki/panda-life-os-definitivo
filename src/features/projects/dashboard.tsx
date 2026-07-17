/**
 * **Feature** — Dashboard interno de un proyecto: overview, tareas, hitos, recursos y bitácora.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Plus, Trash2, ExternalLink, Calendar, Target, CheckCircle2, Circle,
  ListChecks, Link2, BookOpen, MessageSquarePlus, X, Flag, FileText, Github, Figma, Video, Sparkles,
} from "lucide-react";
import { useProjects, type Project, type ProjectStatus, type ProjectPriority } from "@/hooks/use-projects";
import { useProjectDetails, type TaskStatus, type TaskPriority, type ResourceKind } from "@/hooks/use-project-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const CATEGORY_EMOJI: Record<string, string> = {
  personal: "🌱", aprendiendum: "📚", enki: "⚡", otro: "🧩",
};
const STATUS_META: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: "Idea", className: "bg-muted text-muted-foreground" },
  activo: { label: "Activo", className: "bg-primary/15 text-primary border border-primary/30" },
  pausado: { label: "Pausado", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30" },
  completado: { label: "Completado", className: "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30" },
  archivado: { label: "Archivado", className: "bg-muted text-muted-foreground/70" },
};
const STATUSES: ProjectStatus[] = ["idea", "activo", "pausado", "completado", "archivado"];

const TASK_STATUS_META: Record<TaskStatus, { label: string; emoji: string }> = {
  todo: { label: "Por hacer", emoji: "◻️" },
  doing: { label: "En curso", emoji: "🔄" },
  done: { label: "Hecho", emoji: "✅" },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-primary/70",
  high: "bg-destructive",
};

const RESOURCE_ICON: Record<ResourceKind, typeof Link2> = {
  link: Link2, doc: FileText, repo: Github, design: Figma, video: Video, other: Sparkles,
};

export function ProjectDashboardPage({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { projects, notes, loading: pLoading, updateProject, deleteProject, addNote, deleteNote } = useProjects();
  const details = useProjectDetails(projectId);
  const project = projects.find(p => p.id === projectId);
  const projectNotes = notes.filter(n => n.project_id === projectId);

  const stats = useMemo(() => {
    const totalTasks = details.tasks.length;
    const doneTasks = details.tasks.filter(t => t.status === "done").length;
    const totalMs = details.milestones.length;
    const doneMs = details.milestones.filter(m => !!m.completed_at).length;
    return { totalTasks, doneTasks, totalMs, doneMs };
  }, [details.tasks, details.milestones]);

  if (pLoading) {
    return <div className="px-4 md:px-10 py-8 max-w-6xl mx-auto text-muted-foreground">Cargando…</div>;
  }
  if (!project) {
    return (
      <div className="px-4 md:px-10 py-8 max-w-6xl mx-auto">
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Volver a Proyectos
        </Link>
        <p className="mt-6">Proyecto no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="h-4 w-4" /> Proyectos
      </Link>

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {CATEGORY_EMOJI[project.category] ?? "🧩"} {project.category}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight break-words">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl whitespace-pre-wrap">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={project.status} onValueChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={project.priority} onValueChange={(v) => updateProject(project.id, { priority: v as ProjectPriority })}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Progreso" value={`${project.progress}%`} icon={Target}>
          <Progress value={project.progress} className="h-1.5 mt-2" />
        </StatCard>
        <StatCard label="Tareas" value={`${stats.doneTasks}/${stats.totalTasks}`} icon={ListChecks} />
        <StatCard label="Hitos" value={`${stats.doneMs}/${stats.totalMs}`} icon={Flag} />
        <StatCard label="Bitácora" value={String(projectNotes.length)} icon={MessageSquarePlus} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="milestones">Hitos</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="log">Bitácora</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Progreso del proyecto</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Avance manual</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                defaultValue={project.progress}
                onMouseUp={(e) => updateProject(project.id, { progress: Number((e.target as HTMLInputElement).value) })}
                onTouchEnd={(e) => updateProject(project.id, { progress: Number((e.target as HTMLInputElement).value) })}
                className="w-full accent-primary"
                aria-label="Progreso del proyecto"
              />
              {project.url && (
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> {project.url}
                </a>
              )}
              {project.deadline && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Deadline: {new Date(project.deadline).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Próximas tareas</CardTitle>
              </CardHeader>
              <CardContent>
                {details.tasks.filter(t => t.status !== "done").slice(0, 5).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin tareas pendientes.</p>
                ) : (
                  <ul className="space-y-2">
                    {details.tasks.filter(t => t.status !== "done").slice(0, 5).map(t => (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                        <span className="truncate flex-1">{t.title}</span>
                        {t.due_date && <span className="text-xs text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4" /> Próximos hitos</CardTitle>
              </CardHeader>
              <CardContent>
                {details.milestones.filter(m => !m.completed_at).slice(0, 5).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin hitos pendientes.</p>
                ) : (
                  <ul className="space-y-2">
                    {details.milestones.filter(m => !m.completed_at).slice(0, 5).map(m => (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <Circle className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate flex-1">{m.title}</span>
                        {m.target_date && <span className="text-xs text-muted-foreground">{new Date(m.target_date).toLocaleDateString()}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks" className="mt-4">
          <TasksPanel details={details} />
        </TabsContent>

        {/* MILESTONES */}
        <TabsContent value="milestones" className="mt-4">
          <MilestonesPanel details={details} />
        </TabsContent>

        {/* RESOURCES */}
        <TabsContent value="resources" className="mt-4">
          <ResourcesPanel details={details} />
        </TabsContent>

        {/* LOG */}
        <TabsContent value="log" className="mt-4">
          <LogPanel
            notes={projectNotes}
            onAdd={(c) => addNote(project.id, c)}
            onDelete={(id) => deleteNote(id)}
          />
        </TabsContent>
      </Tabs>

      {/* Footer danger zone */}
      <div className="mt-10 pt-6 border-t flex justify-end">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={async () => {
            if (confirm("¿Eliminar este proyecto, su bitácora, tareas, hitos y recursos?")) {
              await deleteProject(project.id);
              navigate({ to: "/projects" });
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar proyecto
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, children }: { label: string; value: string; icon: any; children?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {children}
      </CardContent>
    </Card>
  );
}

/* ───── TASKS ───── */
function TasksPanel({ details }: { details: ReturnType<typeof useProjectDetails> }) {
  const [open, setOpen] = useState(false);
  const grouped: Record<TaskStatus, typeof details.tasks> = {
    todo: details.tasks.filter(t => t.status === "todo"),
    doing: details.tasks.filter(t => t.status === "doing"),
    done: details.tasks.filter(t => t.status === "done"),
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4" /> Tareas ({details.tasks.length})</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Nueva tarea</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {(["todo", "doing", "done"] as TaskStatus[]).map(col => (
          <div key={col} className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <span>{TASK_STATUS_META[col].emoji}</span> {TASK_STATUS_META[col].label} ({grouped[col].length})
            </div>
            <div className="space-y-2 min-h-[60px]">
              {grouped[col].map(t => (
                <Card key={t.id} className="group">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => details.updateTask(t.id, { status: t.status === "done" ? "todo" : "done" })}
                          className="mt-0.5 shrink-0"
                          aria-label={t.status === "done" ? "Marcar como pendiente" : "Marcar como hecha"}
                        >
                          {t.status === "done"
                            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                            : <Circle className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                          {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => details.deleteTask(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar tarea"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Select value={t.status} onValueChange={(v) => details.updateTask(t.id, { status: v as TaskStatus })}>
                        <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["todo", "doing", "done"] as TaskStatus[]).map(s => <SelectItem key={s} value={s}>{TASK_STATUS_META[s].label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                        {t.due_date && <span>{new Date(t.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {grouped[col].length === 0 && (
                <p className="text-xs text-muted-foreground italic">Vacío.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {open && <TaskComposer onClose={() => setOpen(false)} onCreate={async (d) => { await details.addTask(d); setOpen(false); }} />}
    </div>
  );
}

function TaskComposer({ onClose, onCreate }: { onClose: () => void; onCreate: (d: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; due_date?: string | null }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [due, setDue] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título *" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas (opcional)" rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["todo", "doing", "done"] as TaskStatus[]).map(s => <SelectItem key={s} value={s}>{TASK_STATUS_META[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => onCreate({ title: title.trim(), description: description.trim() || undefined, status, priority, due_date: due || null })}
          >Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───── MILESTONES ───── */
function MilestonesPanel({ details }: { details: ReturnType<typeof useProjectDetails> }) {
  const [open, setOpen] = useState(false);
  const sorted = [...details.milestones].sort((a, b) => {
    if (!!a.completed_at !== !!b.completed_at) return a.completed_at ? 1 : -1;
    if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date);
    return 0;
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2"><Flag className="h-4 w-4" /> Hitos ({details.milestones.length})</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Nuevo hito</Button>
      </div>
      {sorted.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Flag className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Aún no hay hitos.</p></CardContent></Card>
      ) : (
        <ol className="relative border-l-2 border-border ml-3 space-y-4">
          {sorted.map(m => (
            <li key={m.id} className="ml-6 group">
              <span className={`absolute -left-2 mt-1 h-4 w-4 rounded-full border-2 ${m.completed_at ? "bg-green-500 border-green-500" : "bg-background border-muted-foreground"}`} />
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button onClick={() => details.toggleMilestone(m)} aria-label="Alternar hito">
                        {m.completed_at
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${m.completed_at ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                        {m.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.description}</p>}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {m.target_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.target_date).toLocaleDateString()}</span>}
                          {m.completed_at && <Badge variant="secondary" className="text-[10px]">Completado</Badge>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => details.deleteMilestone(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar hito"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
      {open && <MilestoneComposer onClose={() => setOpen(false)} onCreate={async (d) => { await details.addMilestone(d); setOpen(false); }} />}
    </div>
  );
}

function MilestoneComposer({ onClose, onCreate }: { onClose: () => void; onCreate: (d: { title: string; description?: string; target_date?: string | null }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo hito</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. MVP listo, primera venta…" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalle (opcional)" rows={3} />
          <div>
            <label className="text-xs text-muted-foreground">Fecha objetivo</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => onCreate({ title: title.trim(), description: description.trim() || undefined, target_date: date || null })}
          >Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───── RESOURCES ───── */
function ResourcesPanel({ details }: { details: ReturnType<typeof useProjectDetails> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Recursos ({details.resources.length})</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Agregar</Button>
      </div>
      {details.resources.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Sin recursos. Suma enlaces, docs, repos o referencias.</p></CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {details.resources.map(r => {
            const Icon = RESOURCE_ICON[r.kind] ?? Link2;
            return (
              <Card key={r.id} className="group">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline text-primary inline-flex items-center gap-1">
                            {r.title} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="font-medium text-sm">{r.title}</p>
                        )}
                        {r.url && <p className="text-xs text-muted-foreground truncate">{r.url}</p>}
                        {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => details.deleteResource(r.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar recurso"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {open && <ResourceComposer onClose={() => setOpen(false)} onCreate={async (d) => { await details.addResource(d); setOpen(false); }} />}
    </div>
  );
}

function ResourceComposer({ onClose, onCreate }: { onClose: () => void; onCreate: (d: { title: string; url?: string; kind: ResourceKind; notes?: string }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<ResourceKind>("link");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo recurso</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título *" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="link">🔗 Enlace</SelectItem>
              <SelectItem value="doc">📄 Documento</SelectItem>
              <SelectItem value="repo">💻 Repositorio</SelectItem>
              <SelectItem value="design">🎨 Diseño</SelectItem>
              <SelectItem value="video">🎬 Video</SelectItem>
              <SelectItem value="other">✨ Otro</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => onCreate({ title: title.trim(), url: url.trim() || undefined, kind, notes: notes.trim() || undefined })}
          >Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───── LOG (bitácora) ───── */
function LogPanel({ notes, onAdd, onDelete }: { notes: { id: string; content: string; created_at: string }[]; onAdd: (c: string) => Promise<unknown>; onDelete: (id: string) => Promise<unknown> }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <h2 className="font-semibold flex items-center gap-2"><MessageSquarePlus className="h-4 w-4" /> Bitácora ({notes.length})</h2>
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué avanzaste hoy? ¿Aprendiste algo? ¿Próximo paso?"
          rows={2}
          className="flex-1"
        />
        <Button onClick={async () => { await onAdd(text); setText(""); }} disabled={!text.trim()} size="sm">Agregar</Button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aún no hay notas. Empieza a documentar tu avance.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="group rounded-md border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm whitespace-pre-wrap flex-1">{n.content}</p>
                <button
                  onClick={() => onDelete(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar nota"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
