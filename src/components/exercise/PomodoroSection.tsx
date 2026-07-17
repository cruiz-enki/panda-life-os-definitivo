/**
 * **Componente** — Sección Pomodoro dentro del módulo Ejercicio (sesiones de foco).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Pause, Play, RotateCcw, Coffee, Brain, Bell, Settings2, X, CheckSquare, Target, Zap, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppState, type Task } from "@/lib/storage";

type PomodoroMode = "work" | "shortBreak" | "longBreak";

interface PomodoroSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
};

export function PomodoroSection() {
  const { state, toggleTaskComplete, addPandaCoins } = useAppState() as any;
  const [mode, setMode] = useState<PomodoroMode>("work");
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [autoCompleteTask, setAutoCompleteTask] = useState(false);
  const [isBeastMode, setIsBeastMode] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
    setIsActive(false);
    
    if (newMode !== "work" && isBeastMode) {
      toggleBeastMode();
    }
  }, [settings, isBeastMode]);

  const toggleBeastMode = useCallback(() => {
    const next = !isBeastMode;
    setIsBeastMode(next);
    
    if (next) {
      document.body.classList.add("beast-mode-active");
      setIsActive(true);
      setIsMusicPlaying(true);
      toast("¡MODO BESTIA ACTIVADO! 🔥", { 
        description: "Enfoque total. Sin distracciones. Música ambiental iniciada.",
        className: "bg-red-600 text-white font-bold border-none"
      });
    } else {
      document.body.classList.remove("beast-mode-active");
      setIsMusicPlaying(false);
      toast("Modo Bestia desactivado", { description: "Has vuelto a la interfaz normal." });
    }
  }, [isBeastMode]);

  useEffect(() => {
    if (isMusicPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://actions.google.com/sounds/v1/ambient/rain_on_roof.ogg");
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {
        setIsMusicPlaying(false);
        toast.error("No se pudo iniciar la música. Haz clic en la página para habilitar el audio.");
      });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("beast-mode-active");
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    // Play sound if possible
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
    } catch (e) {}

    if (mode === "work") {
      const nextSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(nextSessionCount);
      
      if (selectedTaskId && autoCompleteTask) {
        const task = (state.tasks as Task[]).find((t: any) => t.id === selectedTaskId);
        if (task && task.status !== "completed") {
          toggleTaskComplete(selectedTaskId);
          toast.success(`¡Tarea "${task.title}" marcada como completada!`);
        }
      }

      if (nextSessionCount % settings.longBreakInterval === 0) {
        toast.success("¡Sesión completada! Has ganado 1 Moneda Panda 🐼🪙", { duration: 5000 });
        addPandaCoins(1);
        switchMode("longBreak");
      } else {
        toast.success("¡Sesión completada! Has ganado 1 Moneda Panda 🐼🪙", { duration: 5000 });
        addPandaCoins(1);
        switchMode("shortBreak");
      }
    } else {
      toast.info("¡Descanso terminado! Volvamos al trabajo.");
      switchMode("work");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((settings[mode] * 60 - timeLeft) / (settings[mode] * 60)) * 100;

  const modeColors = {
    work: "from-orange-500 to-red-600",
    shortBreak: "from-emerald-400 to-teal-600",
    longBreak: "from-blue-400 to-indigo-600",
  };

  const modeLabels = {
    work: "Enfoque",
    shortBreak: "Descanso Corto",
    longBreak: "Descanso Largo",
  };

  return (
    <Card className={cn("w-full max-w-lg mx-auto overflow-hidden border-2 shadow-xl transition-all duration-500", isBeastMode && "pomodoro-card scale-110 border-red-600 shadow-red-900/40")}>
      <CardHeader className={cn("text-white transition-colors duration-500 bg-gradient-to-br", modeColors[mode])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <CardTitle className="text-lg">Pomodoro</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {(["work", "shortBreak", "longBreak"] as PomodoroMode[]).map((m) => (
            <Button
              key={m}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs px-3 rounded-full transition-all",
                mode === m ? "bg-white text-foreground font-bold" : "text-white/80 hover:bg-white/10"
              )}
              onClick={() => switchMode(m)}
            >
              {modeLabels[m]}
            </Button>
          ))}
        </div>
        <div className="absolute top-4 right-14">
           <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-white hover:bg-white/20 transition-all",
              isMusicPlaying ? "bg-white/20" : ""
            )}
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            title={isMusicPlaying ? "Pausar música" : "Poner música ambiental"}
          >
            {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-50" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center pt-8 pb-10 space-y-6">
        {mode === "work" && (
          <div className="w-full space-y-3 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Target className="w-3 h-3" /> Tarea actual (Opcional)
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="auto-complete" 
                  checked={autoCompleteTask} 
                  onCheckedChange={(checked) => setAutoCompleteTask(!!checked)}
                />
                <Label htmlFor="auto-complete" className="text-[10px] font-medium cursor-pointer">
                  Auto-completar al terminar
                </Label>
              </div>
            </div>
            <Select 
              key={`task-select-${(state.tasks as any[]).length}`}
              value={selectedTaskId || "none"} 
              onValueChange={(val) => setSelectedTaskId(val === "none" ? null : val)}
            >
              <SelectTrigger className="w-full bg-secondary/30 border-none h-10 rounded-xl">
                <SelectValue placeholder="Selecciona una tarea..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto z-[100]">
                <SelectItem value="none">Sin tarea seleccionada</SelectItem>
                {(state.tasks as Task[])
                  .filter((t: any) => t.status !== "completed")
                  .map((task: any) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="flex items-center gap-2">
                        <span>{(state.taskLists as any[]).find((l: any) => l.id === task.listId)?.emoji || "📋"}</span>
                        <span className="truncate max-w-[200px]">{task.title}</span>
                      </span>
                    </SelectItem>
                  ))
                }
                {(state.tasks as any[]).filter((t: any) => t.status !== "completed").length === 0 && (
                  <SelectItem value="none" disabled>No hay tareas pendientes</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="relative flex items-center justify-center w-64 h-64">
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-secondary"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", 
                mode === "work" ? "text-red-500" : mode === "shortBreak" ? "text-emerald-500" : "text-blue-500"
              )}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className={cn("font-mono font-bold text-6xl tracking-tight transition-colors", isBeastMode ? "text-red-500 pomodoro-timer-text" : "")}>{formatTime(timeLeft)}</span>
            <span className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest">
              {isActive ? "¡En marcha!" : "Listo"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full px-4">
          <Button 
            size="lg" 
            className={cn("flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg transition-transform active:scale-95",
              isActive ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
            {isActive ? "Pausar" : "Iniciar"}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="w-14 h-14 rounded-2xl border-2"
            onClick={() => {
              setTimeLeft(settings[mode] * 60);
              setIsActive(false);
            }}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>

          {mode === "work" && (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-14 h-14 rounded-2xl border-2 transition-all",
                isBeastMode 
                  ? "bg-red-600 border-red-600 text-white animate-pulse" 
                  : "hover:border-red-500 hover:text-red-500"
              )}
              onClick={toggleBeastMode}
              title={isBeastMode ? "Desactivar Modo Bestia" : "Activar Modo Bestia"}
            >
              <Zap className={cn("w-6 h-6", isBeastMode ? "fill-white" : "")} />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 w-full">
          <div className="flex-1">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Sesiones</div>
            <div className="flex gap-1.5">
              {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn("h-2 rounded-full flex-1", 
                    i < (sessionsCompleted % settings.longBreakInterval) ? "bg-red-500" : "bg-muted"
                  )} 
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{sessionsCompleted}</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase">Total</div>
          </div>
        </div>
      </CardContent>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración Pomodoro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Enfoque (minutos)</Label>
                <span className="text-sm font-bold">{settings.work}</span>
              </div>
              <Slider 
                value={[settings.work]} 
                min={1} 
                max={60} 
                step={1} 
                onValueChange={([val]) => setSettings(s => ({ ...s, work: val }))}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Descanso corto</Label>
                <span className="text-sm font-bold">{settings.shortBreak}</span>
              </div>
              <Slider 
                value={[settings.shortBreak]} 
                min={1} 
                max={15} 
                step={1} 
                onValueChange={([val]) => setSettings(s => ({ ...s, shortBreak: val }))}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Descanso largo</Label>
                <span className="text-sm font-bold">{settings.longBreak}</span>
              </div>
              <Slider 
                value={[settings.longBreak]} 
                min={5} 
                max={45} 
                step={1} 
                onValueChange={([val]) => setSettings(s => ({ ...s, longBreak: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setTimeLeft(settings[mode] * 60);
              setShowSettings(false);
            }}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
