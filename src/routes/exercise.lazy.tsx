/**
 * **Ruta (lazy)** — Componente de Ejercicio cargado bajo demanda.
 */
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Flame, CheckCircle2, Trophy } from "lucide-react";
import { useExercise } from "@/hooks/use-exercise";
import { useIsOwner } from "@/hooks/use-is-owner";
import { useAppState } from "@/lib/storage";
import { HealthHeader } from "@/components/health/HealthHeader";
import {
  AdminTab,
  LibraryTab,
  QuickExerciseTab,
  RoutinesTab,
  ScheduleTab,
  StatBox,
  TodayTab,
} from "@/features/exercise/parts";

export const Route = createLazyFileRoute("/exercise")({
  component: ExercisePage,
});

function ExercisePage() {
  const ex = useExercise();
  const { isOwner } = useIsOwner();
  const { addBonusXp } = useAppState();
  const [tab, setTab] = useState("today");
  const ownerCols = isOwner ? 6 : 5;

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow">
          <Dumbbell className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Ejercicio</h1>
          <p className="text-sm text-muted-foreground">
            Rutinas de fuerza en casa, guiadas con video.
          </p>
        </div>
      </div>

      <HealthHeader />

      <div className="grid grid-cols-3 gap-3">
        <StatBox icon={<Flame className="w-4 h-4" />} label="Racha" value={`${ex.streak} d`} />
        <StatBox icon={<CheckCircle2 className="w-4 h-4" />} label="Esta semana" value={`${ex.completedThisWeek}`} />
        <StatBox icon={<Trophy className="w-4 h-4" />} label="Total" value={`${ex.logs.filter((l) => l.completed).length}`} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${ownerCols}, 1fr)` }}>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="quick">Individual</TabsTrigger>
          <TabsTrigger value="routines">Rutinas</TabsTrigger>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
          <TabsTrigger value="schedule">Calendario</TabsTrigger>
          {isOwner && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <TodayTab ex={ex} addBonusXp={addBonusXp} />
        </TabsContent>
        <TabsContent value="quick" className="mt-4">
          <QuickExerciseTab ex={ex} addBonusXp={addBonusXp} />
        </TabsContent>
        <TabsContent value="routines" className="mt-4">
          <RoutinesTab ex={ex} />
        </TabsContent>
        <TabsContent value="library" className="mt-4">
          <LibraryTab ex={ex} />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab ex={ex} />
        </TabsContent>
        {isOwner && (
          <TabsContent value="admin" className="mt-4">
            <AdminTab ex={ex} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
