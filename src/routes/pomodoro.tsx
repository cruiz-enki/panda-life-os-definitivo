/**
 * **Ruta** — Temporizador Pomodoro con sesiones de foco.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Timer as TimerIcon } from "lucide-react";
import { PomodoroSection } from "@/components/exercise/PomodoroSection";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [
      { title: "Pomodoro · Panda's LIFE OS" },
      { name: "description", content: "Temporizador Pomodoro para enfoque y productividad." },
    ],
  }),
  component: PomodoroPage,
});

function PomodoroPage() {
  return (
    <div className="container max-w-4xl py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-500/10 mb-2">
          <TimerIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Enfoque Pomodoro</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Gestiona tu tiempo con sabiduría. Alterna periodos de enfoque intenso con descansos regenerativos.
        </p>
      </div>

      <div className="flex justify-center">
        <PomodoroSection />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
          <h3 className="font-bold mb-2">Concentración</h3>
          <p className="text-xs text-muted-foreground">Elimina distracciones y enfócate en una sola tarea durante 25 minutos.</p>
        </div>
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
          <h3 className="font-bold mb-2">Descanso Corto</h3>
          <p className="text-xs text-muted-foreground">Tómate 5 minutos para estirarte, hidratarte o simplemente respirar.</p>
        </div>
        <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
          <h3 className="font-bold mb-2">Descanso Largo</h3>
          <p className="text-xs text-muted-foreground">Después de 4 sesiones, toma 15-30 minutos para resetear tu mente por completo.</p>
        </div>
      </div>
    </div>
  );
}
