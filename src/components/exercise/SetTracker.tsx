/**
 * **Componente** — Registro set-a-set durante un entrenamiento (reps, peso, RIR).
 */
import { useState, useEffect } from "react";
import { Check, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RestTimer } from "./WorkoutTimer";
import { toast } from "sonner";

interface SetTrackerProps {
  totalSets: number;
  restSeconds: number;
  initialSetsDone?: number;
  onSetsChange: (setsDone: number) => void;
}

export function SetTracker({ totalSets, restSeconds, initialSetsDone = 0, onSetsChange }: SetTrackerProps) {
  const [setsDone, setSetsDone] = useState(initialSetsDone);
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    setSetsDone(initialSetsDone);
  }, [initialSetsDone]);

  const handleToggleSet = (index: number) => {
    const newSetsDone = index + 1;
    if (newSetsDone === setsDone) {
      // If clicking the last completed set, uncheck it
      const updated = setsDone - 1;
      setSetsDone(updated);
      onSetsChange(updated);
      setShowRest(false);
    } else {
      setSetsDone(newSetsDone);
      onSetsChange(newSetsDone);
      if (newSetsDone < totalSets && restSeconds > 0) {
        setShowRest(true);
      } else if (newSetsDone === totalSets) {
        setShowRest(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: totalSets }).map((_, i) => (
          <button
            key={i}
            onClick={() => handleToggleSet(i)}
            className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
              i < setsDone 
                ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/50 border-secondary text-muted-foreground hover:border-primary/50"
            )}
          >
            {i < setsDone ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
          </button>
        ))}
        <Button 
          variant="outline" 
          size="icon" 
          className="w-10 h-10 rounded-full" 
          onClick={() => {
            const next = setsDone + 1;
            setSetsDone(next);
            onSetsChange(next);
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {showRest && (
        <RestTimer 
          duration={restSeconds} 
          onComplete={() => {
            setShowRest(false);
            toast.info("¡Descanso terminado! Siguiente serie.");
          }} 
        />
      )}
    </div>
  );
}
