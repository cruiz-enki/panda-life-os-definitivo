/**
 * **Feature** — Módulo **Proyectos**: lista, filtros, creación y detalle con bitácora.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Calendar, FolderKanban } from "lucide-react";
import { useProjects, type Project, type ProjectCategory, type ProjectStatus, type ProjectPriority } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const CATEGORY_META: Record<ProjectCategory, { label: string; emoji: string }> = {
  personal: { label: "Personal", emoji: "🌱" },
  aprendiendum: { label: "Aprendiendum", emoji: "📚" },
  enki: { label: "Enki", emoji: "⚡" },
  otro: { label: "Otro", emoji: "🧩" },
};

const STATUS_META: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: "Idea", className: "bg-muted text-muted-foreground" },
  activo: { label: "Activo", className: "bg-primary/15 text-primary border border-primary/30" },
  pausado: { label: "Pausado", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30" },
  completado: { label: "Completado", className: "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30" },
  archivado: { label: "Archivado", className: "bg-muted text-muted-foreground/70" },
};

const PRIORITY_META: Record<ProjectPriority, { label: string; className: string }> = {
  low: { label: "Baja", className: "text-muted-foreground" },
  medium: { label: "Media", className: "text-foreground" },
  high: { label: "Alta", className: "text-destructive font-medium" },
};

const CATEGORIES: ProjectCategory[] = ["personal", "aprendiendum", "enki", "otro"];
const STATUSES: ProjectStatus[] = ["idea", "activo", "pausado", "completado", "archivado"];

export function ProjectsPage() {
  const { projects, notes, loading, addProject } = useProjects();
  const [filterCat, setFilterCat] = useState<ProjectCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");
  const [composerOpen, setComposerOpen] = useState(false);

  const filtered = useMemo(() => projects.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  }), [projects, filterCat, filterStatus]);


  const stats = useMemo(() => ({
    total: projects.length,
    activos: projects.filter(p => p.status === "activo").length,
    completados: projects.filter(p => p.status === "completado").length,
  }), [projects]);

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Tus iniciativas</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} totales · {stats.activos} activos · {stats.completados} completados
          </p>
        </div>
        <Button onClick={() => setComposerOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo proyecto
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as any)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay proyectos todavía. Crea el primero para empezar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => {
            const noteCount = notes.filter(n => n.project_id === p.id).length;
            return (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="block"
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{CATEGORY_META[p.category].emoji}</span>
                        <span className="line-clamp-2">{p.title}</span>
                      </CardTitle>
                      <Badge className={STATUS_META[p.status].className} variant="outline">
                        {STATUS_META[p.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progreso</span>
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={PRIORITY_META[p.priority].className}>● {PRIORITY_META[p.priority].label}</span>
                      {p.deadline && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(p.deadline).toLocaleDateString()}</span>
                      )}
                      {noteCount > 0 && <span>📝 {noteCount}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {composerOpen && (
        <ProjectComposer
          onClose={() => setComposerOpen(false)}
          onCreate={async (data) => {
            await addProject(data);
            setComposerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ProjectComposer({ onClose, onCreate }: { onClose: () => void; onCreate: (d: Partial<Project> & { title: string }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("personal");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [url, setUrl] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi nuevo proyecto" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿De qué se trata?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoría</label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Deadline</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Link (opcional)</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!title.trim()}
            onClick={() => onCreate({
              title: title.trim(),
              description: description.trim() || null,
              category, status, priority,
              deadline: deadline || null,
              url: url.trim() || null,
            })}
          >Crear proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

