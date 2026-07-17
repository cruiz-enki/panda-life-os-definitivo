/**
 * **Feature** — Componentes (parts) del módulo **Ejercicio**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Play, 
  Pause,
  Youtube, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Library, 
  Zap, 
  Flame, 
  Trophy, 
  ClipboardList, 
  Image as ImageIcon, 
  X,
  Search,
  Loader2,
  ExternalLink,
  Info,
  Timer,
  StopCircle
} from "lucide-react";
import { useExercise } from "@/hooks/use-exercise";
import { useIsOwner } from "@/hooks/use-is-owner";
import { useAppState } from "@/lib/storage";
import { MUSCLE_GROUPS, LEVELS, EQUIPMENT, getYoutubeId, type Exercise, type Routine } from "@/lib/exercise-types";
import { toast } from "sonner";
import { HealthHeader } from "@/components/health/HealthHeader";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutStopwatch } from "@/components/exercise/WorkoutTimer";
import { SetTracker } from "@/components/exercise/SetTracker";



const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];


export function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</div>
        <div className="font-display text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

// ===================== QUICK / SUELTO =====================
export function QuickExerciseTab({ ex, addBonusXp }: { ex: ReturnType<typeof useExercise>; addBonusXp: (n: number) => void }) {
  const [exerciseId, setExerciseId] = useState<string>("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [setsDone, setSetsDone] = useState(3);
  const [repsDone, setRepsDone] = useState("10");
  const [difficulty, setDifficulty] = useState(3);
  const [energyBefore, setEnergyBefore] = useState(7);
  const [energyAfter, setEnergyAfter] = useState(7);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(ex.today);

  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const filtered = useMemo(() => ex.exercises.filter(e => {
    if (!e.active) return false;
    if (filter !== "all" && e.muscle_group !== filter) return false;
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [ex.exercises, filter, q]);

  const selected = ex.exercises.find(e => e.id === exerciseId);

  const recent = useMemo(() => {
    return ex.logs
      .filter(l => l.completed && !l.routine_id)
      .slice(0, 5)
      .map(l => {
        const elog = ex.exerciseLogs.find(el => el.workout_log_id === l.id);
        const exItem = elog ? ex.exercises.find(e => e.id === elog.exercise_id) : null;
        return { log: l, elog, exItem };
      });
  }, [ex.logs, ex.exerciseLogs, ex.exercises]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />Registrar ejercicio suelto
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Sin rutina. Elige un ejercicio, registra cómo te fue y gana XP.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {MUSCLE_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ejercicio</Label>
            <Select value={exerciseId} onValueChange={(v) => {
              setExerciseId(v);
              const e = ex.exercises.find(x => x.id === v);
              if (e) { setSetsDone(e.default_sets); setRepsDone(e.default_reps); }
            }}>
              <SelectTrigger><SelectValue placeholder="Selecciona un ejercicio" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {filtered.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name} · +{e.xp_reward} XP</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <>
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center gap-2">
                  <WorkoutStopwatch isActive={isTimerActive} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => setIsTimerActive(!isTimerActive)}
                  >
                    {isTimerActive ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {isTimerActive ? "Pausar" : "Iniciar cronómetro"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><Label>Fecha</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div><Label>Series hechas</Label>
                  <div className="mt-2">
                    <SetTracker 
                      totalSets={selected.default_sets || 3} 
                      restSeconds={60} 
                      initialSetsDone={setsDone}
                      onSetsChange={setSetsDone}
                    />
                  </div>
                </div>
                <div><Label>Reps promedio</Label>
                  <Input value={repsDone} onChange={(e) => setRepsDone(e.target.value)} /></div>
              </div>
              <div className="rounded-lg border p-3 space-y-3 bg-secondary/20">
                <div className="text-xs font-medium text-muted-foreground">Bitácora</div>
                <div>
                  <Label>Dificultad real (1-5): {difficulty}</Label>
                  <input type="range" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(+e.target.value)} className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Energía antes (1-10): {energyBefore}</Label>
                    <input type="range" min={1} max={10} value={energyBefore} onChange={(e) => setEnergyBefore(+e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <Label>Energía después (1-10): {energyAfter}</Label>
                    <input type="range" min={1} max={10} value={energyAfter} onChange={(e) => setEnergyAfter(+e.target.value)} className="w-full" />
                  </div>
                </div>
                <div>
                  <Label>Notas (¿cómo te sentiste?)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sensaciones, técnica, dolor, modificaciones..." />
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={async () => {
                const xp = await ex.logSingleExercise(selected.id, {
                  sets_done: setsDone, reps_done: repsDone,
                  difficulty, energy_before: energyBefore, energy_after: energyAfter, notes,
                  date,
                });
                if (xp) {
                  addBonusXp(xp);
                   toast.success(`¡Registrado! +${xp} XP`);
                   setNotes(""); setExerciseId(""); setDate(ex.today);
                   setIsTimerActive(false);
                 } else {
                  toast.error("No se pudo registrar");
                }
              }}>
                <CheckCircle2 className="w-4 h-4" />Registrar y ganar XP
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recientes (sueltos)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.map(({ log, elog, exItem }) => (
              <div key={log.id} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0">
                <span className="text-xl">{exItem?.emoji ?? "💪"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{exItem?.name ?? "Ejercicio"}</div>
                  <div className="text-xs text-muted-foreground">
                    {log.date} · {elog?.sets_done ?? 0}×{elog?.reps_done || "-"}
                    {log.difficulty ? ` · dif ${log.difficulty}/5` : ""}
                  </div>
                </div>
                <Badge variant="outline" className="gap-1"><Zap className="w-3 h-3" />{elog?.xp_awarded ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===================== TODAY =====================
export function TodayTab({ ex, addBonusXp }: { ex: ReturnType<typeof useExercise>; addBonusXp: (n: number) => void }) {
  const today = ex.today;
  const todayLog = ex.logs.find(l => l.date === today && !l.completed);
  const completedToday = ex.logs.find(l => l.date === today && l.completed);

  if (!ex.todayRoutine) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay rutina asignada para hoy.</p>
          <p className="text-xs mt-1">Configura tu calendario semanal en la pestaña Calendario.</p>
        </CardContent>
      </Card>
    );
  }

  if (ex.todayRoutine.rest) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-3">🌿</div>
          <h2 className="font-display text-xl font-bold">Día de descanso</h2>
          <p className="text-sm text-muted-foreground mt-1">Recupérate, hidrata, y prepara mañana.</p>
        </CardContent>
      </Card>
    );
  }

  const routine = ex.todayRoutine.routine;
  if (!routine) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">Rutina no encontrada.</CardContent></Card>
    );
  }

  const items = ex.exercisesForRoutine(routine.id);
  const totalXp = items.reduce((acc, it) => acc + (it.exercise?.xp_reward ?? 0), 0) + (routine.xp_bonus ?? 0);

  if (completedToday) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h2 className="font-display text-xl font-bold">¡Rutina completada!</h2>
          <p className="text-sm text-muted-foreground mt-1">+{completedToday.xp_awarded} XP de bonus</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-3xl">{routine.emoji}</div>
              <div className="min-w-0">
                <CardTitle className="truncate">{routine.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{routine.duration_minutes} min · Nivel {routine.level}</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1"><Zap className="w-3 h-3" />{totalXp} XP</Badge>
          </div>
        </CardHeader>
      </Card>

      {!todayLog ? (
        <Button className="w-full" size="lg" onClick={async () => {
          const log = await ex.startWorkout(routine.id);
          if (log) toast.success("¡Entrenamiento iniciado!");
        }}>
          <Play className="w-4 h-4" />Empezar rutina
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <WorkoutStopwatch isActive={!completedToday} startTime={todayLog.created_at} />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                if (confirm("¿Estás seguro de que quieres cancelar y borrar esta sesión?")) {
                  await ex.deleteWorkoutLog(todayLog.id);
                  toast.success("Sesión cancelada");
                }
              }}
            >
              <StopCircle className="w-3 h-3 mr-1" />Desmarcar / Cancelar rutina
            </Button>
          </div>


          {items.map((it) => {
            const elog = ex.exerciseLogs.find(el => el.workout_log_id === todayLog.id && el.exercise_id === it.exercise_id);
            return it.exercise && (
              <ExerciseCard
                key={it.id}
                exercise={it.exercise}
                sets={it.sets} reps={it.reps} restSeconds={it.rest_seconds}
                completed={!!elog?.completed}
                setsDone={elog?.sets_done || 0}
                pref={ex.prefFor(it.exercise.id)?.status ?? "normal"}
                onToggle={async () => {
                  const delta = await ex.toggleExerciseLog(todayLog.id, it.exercise!.id);
                  if (delta) addBonusXp(delta);
                }}
                onUpdateSets={(s) => ex.updateExerciseLog(todayLog.id, it.exercise_id, s)}
                onSetPref={(s) => ex.setPref(it.exercise!.id, s)}
              />
            );
          })}
          <FinishWorkoutButton workoutLogId={todayLog.id} ex={ex} addBonusXp={addBonusXp} startTime={todayLog.created_at} />
        </div>
      )}
    </div>
  );
}

export function FinishWorkoutButton({ workoutLogId, ex, addBonusXp, startTime }: {
  workoutLogId: string;
  ex: ReturnType<typeof useExercise>;
  addBonusXp: (n: number) => void;
  startTime?: string;
}) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [energyAfter, setEnergyAfter] = useState(7);
  const [notes, setNotes] = useState("");

  return (
    <>
      <Button className="w-full" size="lg" variant="default" onClick={() => setOpen(true)}>
        <CheckCircle2 className="w-4 h-4" />Terminar rutina
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cómo te fue?</DialogTitle>
            {startTime && (
              <div className="text-xs text-muted-foreground">
                Sesión de {Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000)} minutos
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dificultad percibida (1-5): {difficulty}</Label>
              <input type="range" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(+e.target.value)} className="w-full" />
            </div>
            <div>
              <Label>Energía después (1-10): {energyAfter}</Label>
              <input type="range" min={1} max={10} value={energyAfter} onChange={(e) => setEnergyAfter(+e.target.value)} className="w-full" />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Cómo te sentiste?" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              const bonus = await ex.finishWorkout(workoutLogId, { difficulty, energy_after: energyAfter, notes });
              if (bonus) addBonusXp(bonus);
              toast.success(`¡Rutina completada! +${bonus} XP bonus`);
              setOpen(false);
            }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ExerciseCard({ exercise, sets, reps, restSeconds, completed, pref, onToggle, onSetPref, setsDone = 0, onUpdateSets }: {
  exercise: Exercise; sets: number; reps: string; restSeconds: number; completed: boolean;
  pref: "normal" | "modify" | "avoid";
  onToggle: () => void;
  onSetPref: (s: "normal" | "modify" | "avoid") => void;
  setsDone?: number;
  onUpdateSets?: (s: number) => void;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const ytId = getYoutubeId(exercise.youtube_url);

  return (
    <Card className={completed ? "opacity-60" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{exercise.emoji}</span>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{exercise.name}</h3>
              <p className="text-xs text-muted-foreground">
                {sets} × {reps} · descanso {restSeconds}s
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 shrink-0"><Zap className="w-3 h-3" />{exercise.xp_reward}</Badge>
        </div>

        {pref === "avoid" && (
          <div className="text-xs bg-destructive/10 text-destructive rounded-md p-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />Marcado como evitar
          </div>
        )}
        {pref === "modify" && (
          <div className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md p-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />Modifica este ejercicio
          </div>
        )}

        {exercise.precautions && (
          <p className="text-xs text-muted-foreground italic">⚠️ {exercise.precautions}</p>
        )}
        
        {exercise.image_urls && exercise.image_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {exercise.image_urls.map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt={`${exercise.name} ${i + 1}`} 
                className="h-32 w-auto rounded-lg object-cover border border-border flex-shrink-0 cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, '_blank')}
              />
            ))}
          </div>
        )}

        {showVideo && ytId && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={exercise.name}
              className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {onUpdateSets && (
          <div className="py-2 border-y border-border/50">
            <SetTracker 
              totalSets={sets} 
              restSeconds={restSeconds} 
              initialSetsDone={setsDone}
              onSetsChange={onUpdateSets}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ytId && (
            <Button variant="outline" size="sm" onClick={() => setShowVideo(v => !v)}>
              <Play className="w-3 h-3" />{showVideo ? "Ocultar" : "Ver video"}
            </Button>
          )}
          {exercise.youtube_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={exercise.youtube_url} target="_blank" rel="noreferrer">
                <Youtube className="w-3 h-3" />YouTube
              </a>
            </Button>
          )}
          <div className="ml-auto flex gap-1">
            <Select value={pref} onValueChange={(v) => onSetPref(v as never)}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="modify">Modificar</SelectItem>
                <SelectItem value="avoid">Evitar</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant={completed ? "secondary" : "default"} onClick={onToggle}>
              <CheckCircle2 className="w-3 h-3" />{completed ? "Hecho" : "Marcar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== ROUTINES =====================
export function RoutinesTab({ ex }: { ex: ReturnType<typeof useExercise> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ex.routines.map(r => {
        const items = ex.exercisesForRoutine(r.id);
        return (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-2xl">{r.emoji}</span>{r.name}
                </CardTitle>
                <Badge variant="outline">{r.level}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{r.objective}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>⏱️ {r.duration_minutes} min</span>
                <span>📅 {r.suggested_days_per_week}/semana</span>
                <span>⚡ +{r.xp_bonus} XP bonus</span>
              </div>
              <ul className="text-xs space-y-1">
                {items.map(it => it.exercise && (
                  <li key={it.id} className="flex items-center justify-between">
                    <span>{it.exercise.emoji} {it.exercise.name}</span>
                    <span className="text-muted-foreground">{it.sets}×{it.reps}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
      {ex.routines.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay rutinas aún.</CardContent></Card>
      )}
    </div>
  );
}

// ===================== LIBRARY =====================
export function LibraryTab({ ex }: { ex: ReturnType<typeof useExercise> }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => ex.exercises.filter(e => {
    if (filter !== "all" && e.muscle_group !== filter) return false;
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    return e.active;
  }), [ex.exercises, filter, q]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Buscar ejercicio..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los grupos</SelectItem>
            {MUSCLE_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {filtered.map(e => <LibraryItem key={e.id} exercise={e} />)}
      </div>
    </div>
  );
}

export function LibraryItem({ exercise: e }: { exercise: Exercise }) {
  const [show, setShow] = useState(false);
  const ytId = getYoutubeId(e.youtube_url);
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{e.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{e.name}</div>
            <div className="text-xs text-muted-foreground">{e.muscle_group} · {e.level} · {e.equipment}</div>
          </div>
          {ytId && (
            <Button size="sm" variant="outline" onClick={() => setShow(s => !s)}>
              <Play className="w-3 h-3" />{show ? "Ocultar" : "Ver"}
            </Button>
          )}
          {e.youtube_url && (
            <Button asChild size="sm" variant="ghost"><a href={e.youtube_url} target="_blank" rel="noreferrer"><Youtube className="w-4 h-4" /></a></Button>
          )}
        </div>
        {show && ytId && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={e.name}
              className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
        {e.instructions && <p className="text-xs text-muted-foreground">{e.instructions}</p>}
        {e.image_urls && e.image_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {e.image_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="h-16 w-auto rounded border border-border flex-shrink-0" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== SCHEDULE =====================
export function ScheduleTab({ ex }: { ex: ReturnType<typeof useExercise> }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Plantilla semanal</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {DOW_LABELS.map((label, dow) => {
            const slot = ex.schedule.find(s => s.day_of_week === dow);
            const value = slot?.is_rest ? "rest" : (slot?.routine_id ?? "none");
            return (
              <div key={dow} className="flex items-center gap-2">
                <span className="w-12 text-sm font-medium">{label}</span>
                <Select
                  value={value}
                  onValueChange={async (v) => {
                    if (v === "none") await ex.clearWeeklySlot(dow);
                    else if (v === "rest") await ex.setWeeklySlot(dow, null, true);
                    else await ex.setWeeklySlot(dow, v, false);
                  }}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Vacío" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin asignar —</SelectItem>
                    <SelectItem value="rest">🌿 Descanso</SelectItem>
                    {ex.routines.map(r => <SelectItem key={r.id} value={r.id}>{r.emoji} {r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DateOverrideCard ex={ex} />
    </div>
  );
}

export function DateOverrideCard({ ex }: { ex: ReturnType<typeof useExercise> }) {
  const [date, setDate] = useState(ex.today);
  const existing = ex.schedule.find(s => s.scheduled_date === date);
  const value = existing?.is_rest ? "rest" : (existing?.routine_id ?? "none");
  const overrides = ex.schedule.filter(s => s.scheduled_date).sort((a,b) => (a.scheduled_date! < b.scheduled_date! ? 1 : -1));

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Override por fecha</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <Select
            value={value}
            onValueChange={async (v) => {
              if (v === "none") await ex.clearDateOverride(date);
              else if (v === "rest") await ex.setDateOverride(date, null, true);
              else await ex.setDateOverride(date, v, false);
            }}
          >
            <SelectTrigger className="flex-1 min-w-[180px]"><SelectValue placeholder="Sin override" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Sin override —</SelectItem>
              <SelectItem value="rest">🌿 Descanso</SelectItem>
              {ex.routines.map(r => <SelectItem key={r.id} value={r.id}>{r.emoji} {r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {overrides.length > 0 && (
          <div className="text-xs space-y-1 pt-2 border-t">
            <div className="text-muted-foreground mb-1">Overrides activos</div>
            {overrides.map(o => {
              const r = ex.routines.find(x => x.id === o.routine_id);
              return (
                <div key={o.id} className="flex items-center justify-between">
                  <span>{o.scheduled_date} — {o.is_rest ? "🌿 Descanso" : (r ? `${r.emoji} ${r.name}` : "—")}</span>
                  <Button size="sm" variant="ghost" onClick={() => ex.clearDateOverride(o.scheduled_date!)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== ADMIN =====================
export function AdminTab({ ex }: { ex: ReturnType<typeof useExercise> }) {
  return (
    <div className="space-y-6">
      <ExerciseAdmin ex={ex} />
      <RoutineAdmin ex={ex} />
    </div>
  );
}

const EMPTY_EX: Partial<Exercise> = {
  name: "", muscle_group: "full_body", level: "beginner", equipment: "none",
  instructions: "", precautions: "", youtube_url: "",
  default_sets: 3, default_reps: "10", duration_minutes: 5, xp_reward: 5,
  emoji: "💪", active: true, image_urls: [],
};

export function ExerciseAdmin({ ex }: { ex: ReturnType<typeof useExercise> }) {
  const [editing, setEditing] = useState<Partial<Exercise> | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Library className="w-4 h-4" />Ejercicios</CardTitle>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY_EX })}><Plus className="w-3 h-3" />Nuevo</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {ex.exercises.map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/40">
              <span className="text-xl">{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{e.name}</div>
                <div className="text-[10px] text-muted-foreground">{e.muscle_group} · {e.level}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(e)}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm(`¿Eliminar "${e.name}"?`)) return;
                await ex.deleteExercise(e.id);
              }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nuevo"} ejercicio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <div><Label>Emoji</Label><Input value={editing.emoji ?? ""} onChange={(e) => setEditing(s => ({ ...s!, emoji: e.target.value }))} /></div>
                <div><Label>Nombre</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing(s => ({ ...s!, name: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Grupo</Label>
                  <Select value={editing.muscle_group} onValueChange={(v) => setEditing(s => ({ ...s!, muscle_group: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MUSCLE_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Nivel</Label>
                  <Select value={editing.level as string} onValueChange={(v) => setEditing(s => ({ ...s!, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Equipo</Label>
                  <Select value={editing.equipment} onValueChange={(v) => setEditing(s => ({ ...s!, equipment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EQUIPMENT.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div><Label>Instrucciones</Label>
                <Textarea value={editing.instructions ?? ""} onChange={(e) => setEditing(s => ({ ...s!, instructions: e.target.value }))} /></div>
              <div><Label>Precauciones</Label>
                <Textarea value={editing.precautions ?? ""} onChange={(e) => setEditing(s => ({ ...s!, precautions: e.target.value }))} /></div>
              <div><Label>YouTube URL</Label>
                <Input value={editing.youtube_url ?? ""} onChange={(e) => setEditing(s => ({ ...s!, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." /></div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><ImageIcon className="w-3 h-3" />Imágenes</Label>
                  <GoogleDrivePicker 
                    onSelect={(url) => setEditing(s => ({ ...s!, image_urls: [...(s?.image_urls || []), url] }))} 
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Pega URL de imagen o usa Drive..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setEditing(s => ({ ...s!, image_urls: [...(s?.image_urls || []), val] }));
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
                {editing.image_urls && editing.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editing.image_urls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="h-16 w-16 object-cover rounded border border-border" />
                        <button 
                          onClick={() => setEditing(s => ({ ...s!, image_urls: s?.image_urls?.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><Label>Series</Label><Input type="number" value={editing.default_sets ?? 3} onChange={(e) => setEditing(s => ({ ...s!, default_sets: +e.target.value }))} /></div>
                <div><Label>Reps</Label><Input value={editing.default_reps ?? ""} onChange={(e) => setEditing(s => ({ ...s!, default_reps: e.target.value }))} /></div>
                <div><Label>Min</Label><Input type="number" value={editing.duration_minutes ?? 5} onChange={(e) => setEditing(s => ({ ...s!, duration_minutes: +e.target.value }))} /></div>
                <div><Label>XP</Label><Input type="number" value={editing.xp_reward ?? 5} onChange={(e) => setEditing(s => ({ ...s!, xp_reward: +e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={async () => {
                const err = await ex.upsertExercise(editing!);
                if (err) toast.error(err.message); else { toast.success("Guardado"); setEditing(null); }
              }}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

const EMPTY_ROUTINE: Partial<Routine> = {
  name: "", objective: "", duration_minutes: 30, level: "beginner",
  suggested_days_per_week: 3, xp_total: 0, xp_bonus: 25,
  emoji: "🏋️", color: "oklch(0.7 0.18 30)", active: true,
};

export function RoutineAdmin({ ex }: { ex: ReturnType<typeof useExercise> }) {
  const [editing, setEditing] = useState<Partial<Routine> | null>(null);
  const [managing, setManaging] = useState<Routine | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Rutinas</CardTitle>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY_ROUTINE })}><Plus className="w-3 h-3" />Nueva</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {ex.routines.map(r => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/40">
              <span className="text-xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {ex.exercisesForRoutine(r.id).length} ejercicios · {r.duration_minutes}min
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setManaging(r)}>Ejercicios</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!confirm(`¿Eliminar "${r.name}"?`)) return;
                await ex.deleteRoutine(r.id);
              }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nueva"} rutina</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <div><Label>Emoji</Label><Input value={editing.emoji ?? ""} onChange={(e) => setEditing(s => ({ ...s!, emoji: e.target.value }))} /></div>
                <div><Label>Nombre</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing(s => ({ ...s!, name: e.target.value }))} /></div>
              </div>
              <div><Label>Objetivo</Label><Input value={editing.objective ?? ""} onChange={(e) => setEditing(s => ({ ...s!, objective: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nivel</Label>
                  <Select value={editing.level as string} onValueChange={(v) => setEditing(s => ({ ...s!, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Días/semana</Label><Input type="number" value={editing.suggested_days_per_week ?? 3} onChange={(e) => setEditing(s => ({ ...s!, suggested_days_per_week: +e.target.value }))} /></div>
                <div><Label>Duración (min)</Label><Input type="number" value={editing.duration_minutes ?? 30} onChange={(e) => setEditing(s => ({ ...s!, duration_minutes: +e.target.value }))} /></div>
                <div><Label>XP bonus</Label><Input type="number" value={editing.xp_bonus ?? 25} onChange={(e) => setEditing(s => ({ ...s!, xp_bonus: +e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={async () => {
                const err = await ex.upsertRoutine(editing!);
                if (err) toast.error(err.message); else { toast.success("Guardado"); setEditing(null); }
              }}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {managing && (
        <Dialog open={!!managing} onOpenChange={(o) => !o && setManaging(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{managing.emoji} {managing.name} — Ejercicios</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {ex.exercisesForRoutine(managing.id).map((it, idx, arr) => it.exercise && (
                <div key={it.id} className="p-2 rounded bg-secondary/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span>{it.exercise.emoji}</span>
                    <div className="flex-1 text-sm font-medium truncate">{it.exercise.name}</div>
                    <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => ex.reorderRoutineExercise(it.id, "up")}>↑</Button>
                    <Button size="sm" variant="ghost" disabled={idx === arr.length - 1} onClick={() => ex.reorderRoutineExercise(it.id, "down")}>↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => ex.removeExerciseFromRoutine(it.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px]">Series</Label>
                      <Input type="number" value={it.sets} onChange={(e) => ex.updateRoutineExercise(it.id, { sets: +e.target.value })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Reps</Label>
                      <Input value={it.reps} onChange={(e) => ex.updateRoutineExercise(it.id, { reps: e.target.value })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Descanso (s)</Label>
                      <Input type="number" value={it.rest_seconds} onChange={(e) => ex.updateRoutineExercise(it.id, { rest_seconds: +e.target.value })} className="h-8" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <Label>Agregar ejercicio</Label>
                <Select onValueChange={(v) => ex.addExerciseToRoutine(managing.id, v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {ex.exercises.map(e => <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function GoogleDrivePicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<any[]>([]);

  const searchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-drive-picker", {
        body: { query }
      });
      if (error) throw error;
      setFiles(data.files || []);
    } catch (e) {
      toast.error("Error al conectar con Google Drive");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) searchFiles();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs h-7">
          <ExternalLink className="w-3 h-3" /> Google Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tus imágenes en Google Drive</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
              className="pl-9"
            />
          </div>
          <Button onClick={searchFiles} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[300px] p-1">
          {loading ? (
             <div className="col-span-full flex flex-col items-center justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
               <p className="text-sm text-muted-foreground">Explorando tu Drive...</p>
             </div>
          ) : files.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-40">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p className="text-sm">No se encontraron imágenes</p>
            </div>
          ) : (
            files.map((file) => (
              <div 
                key={file.id} 
                className="group relative cursor-pointer rounded-lg border border-border overflow-hidden hover:border-primary transition-all bg-secondary/5"
                onClick={() => {
                  const directUrl = `https://drive.google.com/uc?id=${file.id}&export=download`;
                  onSelect(directUrl);
                  setOpen(false);
                  toast.success("Imagen vinculada");
                }}
              >
                <img 
                  src={file.thumbnailLink} 
                  alt={file.name} 
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus className="text-white w-6 h-6" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5">
                  <p className="text-[10px] text-white truncate font-medium">{file.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/20 p-2 rounded-lg leading-tight">
          <Info className="w-3 h-3 shrink-0" />
          Nota: Asegúrate de que las imágenes tengan el acceso compartido (Cualquiera con el enlace) para que Panda OS pueda visualizarlas.
        </div>
      </DialogContent>
    </Dialog>
  );
}
