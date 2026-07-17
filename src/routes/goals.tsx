/**
 * **Ruta** — Objetivos a corto/medio plazo con proyectos y acciones.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, Loader2, Plus, ChevronRight, CheckCircle2, Circle, 
  Mountain, Target, FolderKanban, CheckSquare, Trash2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Dream, Goal, GoalProject, GoalAction } from "@/lib/growth-types";

export const Route = createFileRoute("/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { 
    dreams, goals, projects, actions, loading,
    addGoal, addProject, addAction,
    updateGoalStatus, updateProjectStatus, updateActionStatus
  } = useGrowth();

  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<{ type: 'goal' | 'project' | 'action', id: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async () => {
    if (!newTitle || !addingTo) return;

    let error;
    if (addingTo.type === 'goal') {
      error = await addGoal({ title: newTitle, description: "", dream_id: addingTo.id, status: 'pending' });
    } else if (addingTo.type === 'project') {
      error = await addProject({ title: newTitle, description: "", goal_id: addingTo.id, status: 'pending' });
    } else if (addingTo.type === 'action') {
      error = await addAction({ title: newTitle, description: "", project_id: addingTo.id, status: 'pending', due_date: null });
    }

    if (error) {
      toast.error("Error al añadir");
    } else {
      toast.success("¡Añadido con éxito!");
      setNewTitle("");
      setAddingTo(null);
    }
  };

  if (loading && dreams.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando sistema de metas…</div>;
  }

  const selectedDream = dreams.find(d => d.id === selectedDreamId) || dreams[0];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Workflow className="w-8 h-8 text-primary" /> Goal Breakdown System
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Descompón tus sueños en metas accionables: Sueño → Meta → Proyecto → Acción.
        </p>
      </header>

      {dreams.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Primero define un sueño</h3>
          <p className="text-sm text-muted-foreground mb-6">Para empezar con el desglose, necesitas tener al menos un sueño activo.</p>
          <Button asChild>
            <a href="/future?tab=suenos">Ir a Grandes Sueños</a>
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground px-2">Selecciona un Sueño</Label>
            <div className="space-y-1">
              {dreams.map((dream) => (
                <button
                  key={dream.id}
                  onClick={() => setSelectedDreamId(dream.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    (selectedDreamId === dream.id || (!selectedDreamId && selectedDream?.id === dream.id))
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : "hover:bg-muted border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Mountain className={`w-4 h-4 ${selectedDreamId === dream.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium line-clamp-1 ${selectedDreamId === dream.id ? "text-primary" : ""}`}>
                      {dream.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {selectedDream && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mountain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedDream.title}</h2>
                      <p className="text-sm text-muted-foreground">Desglose de metas para este sueño</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setAddingTo({ type: 'goal', id: selectedDream.id })}>
                    <Plus className="w-4 h-4 mr-2" /> Meta
                  </Button>
                </div>

                <div className="space-y-4">
                  {goals.filter(g => g.dream_id === selectedDream.id).map(goal => (
                    <div key={goal.id} className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-sm">{goal.title}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setAddingTo({ type: 'project', id: goal.id })}>
                          <Plus className="w-4 h-4 mr-2" /> Proyecto
                        </Button>
                      </div>

                      <div className="pl-6 space-y-3 border-l-2 border-muted ml-5">
                        {projects.filter(p => p.goal_id === goal.id).map(project => (
                          <div key={project.id} className="space-y-2">
                            <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/60">
                              <div className="flex items-center gap-3">
                                <FolderKanban className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">{project.title}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setAddingTo({ type: 'action', id: project.id })}>
                                <Plus className="w-3 h-3 mr-2" /> Acción
                              </Button>
                            </div>

                            <div className="pl-6 space-y-1 border-l-2 border-muted/50 ml-4">
                              {actions.filter(a => a.project_id === project.id).map(action => (
                                <div key={action.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => updateActionStatus(action.id, action.status === 'completed' ? 'pending' : 'completed')}>
                                      {action.status === 'completed' ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </button>
                                    <span className={`text-[13px] ${action.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                      {action.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {goals.filter(g => g.dream_id === selectedDream.id).length === 0 && !addingTo && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground italic">No hay metas definidas aún. Descompón tu sueño en metas manejables.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {addingTo && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Añadir {addingTo.type === 'goal' ? 'Meta' : addingTo.type === 'project' ? 'Proyecto' : 'Acción'}</CardTitle>
              <CardDescription>Escribe un título claro para este paso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input 
                  autoFocus 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddingTo(null)}>Cancelar</Button>
                <Button onClick={handleAdd}>Guardar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
