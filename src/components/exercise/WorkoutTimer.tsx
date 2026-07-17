/**
 * **Componente** — Temporizador de descanso entre series.
 */
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkoutStopwatchRef {
  reset: () => void;
  stop: () => void;
  start: () => void;
  toggle: () => void;
}

export const WorkoutStopwatch = forwardRef<WorkoutStopwatchRef, { 
  isActive: boolean; 
  startTime?: string; 
  className?: string;
  onToggle?: (active: boolean) => void;
}>(({ isActive: initialIsActive, startTime, className, onToggle }, ref) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(initialIsActive);

  useImperativeHandle(ref, () => ({
    reset: () => setSeconds(0),
    stop: () => setIsActive(false),
    start: () => setIsActive(true),
    toggle: () => setIsActive(prev => !prev)
  }));

  useEffect(() => {
    setIsActive(initialIsActive);
  }, [initialIsActive]);

  useEffect(() => {
    if (startTime && seconds === 0) {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      if (diff > 0) setSeconds(diff);
    }
  }, [startTime]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      window.clearInterval(interval);
    }
    return () => window.clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? hrs.toString().padStart(2, "0") : null,
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  const handleToggle = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    onToggle?.(newActive);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-2 font-mono text-2xl font-bold bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm">
        <Timer className={cn("w-5 h-5 text-primary", isActive && "animate-pulse")} />
        <span>{formatTime(seconds)}</span>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 rounded-full p-0" 
          onClick={handleToggle}
          title={isActive ? "Pausar" : "Continuar"}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 rounded-full p-0" 
          onClick={() => setSeconds(0)}
          title="Reiniciar"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

WorkoutStopwatch.displayName = "WorkoutStopwatch";

export function RestTimer({ duration, onComplete }: { duration: number; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      window.clearInterval(interval);
      onComplete?.();
    }
    return () => window.clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Descanso</span>
        <span className="text-lg font-mono font-bold">{timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear" 
          style={{ width: `${100 - progress}%` }}
        />
      </div>
      <div className="flex gap-2 w-full mt-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsActive(!isActive)}>
          {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setTimeLeft(duration)}>
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button variant="ghost" className="h-7 text-[10px] ml-auto px-2" onClick={() => setTimeLeft(0)}>
          SALTAR
        </Button>
      </div>
    </div>
  );
}
