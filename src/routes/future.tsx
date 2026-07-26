/**
 * **Ruta** — Módulo Futuro unificado: Sueños, Cartas, Simulación y Vision Board.
 * Fusiona los antiguos /dreams, /horizons, /future-letters, /future-simulation,
 * /life-trajectory y /vision-board en un solo módulo con pestañas.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mountain, Mail, Sparkles, LayoutGrid } from "lucide-react";
import { DreamsView } from "@/features/future/DreamsView";
import { HorizonsView } from "@/features/future/HorizonsView";
import { LettersView } from "@/features/future/LettersView";
import { SimulationView } from "@/features/future/SimulationView";
import { TrajectoryView } from "@/features/future/TrajectoryView";
import { VisionBoardView } from "@/features/future/VisionBoardView";

const searchSchema = z.object({
  tab: z.enum(["suenos", "cartas", "simulacion", "vision"]).optional(),
});

export const Route = createFileRoute("/future")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Futuro · Pandus Maximus" },
      { name: "description", content: "Sueños, horizontes, cartas al futuro, simulación de escenarios y vision board — todo en un solo lugar." },
    ],
  }),
  component: FuturePage,
});

function FuturePage() {
  const navigate = useNavigate({ from: "/future" });
  const { tab } = Route.useSearch();
  const active = tab ?? "suenos";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" /> Futuro
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todo lo que proyectas: sueños grandes, horizontes, cartas al yo del futuro, escenarios simulados y tu vision board.
        </p>
      </header>

      <Tabs
        value={active}
        onValueChange={(v) => navigate({ search: { tab: v as any }, replace: true })}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="suenos" className="gap-2">
            <Mountain className="w-4 h-4" /> Sueños
          </TabsTrigger>
          <TabsTrigger value="cartas" className="gap-2">
            <Mail className="w-4 h-4" /> Cartas
          </TabsTrigger>
          <TabsTrigger value="simulacion" className="gap-2">
            <Sparkles className="w-4 h-4" /> Simulación
          </TabsTrigger>
          <TabsTrigger value="vision" className="gap-2">
            <LayoutGrid className="w-4 h-4" /> Vision Board
          </TabsTrigger>
        </TabsList>

        {/* Sueños absorbe Horizontes */}
        <TabsContent value="suenos" className="space-y-12">
          <DreamsView />
          <div className="border-t border-border/50 pt-8">
            <HorizonsView />
          </div>
        </TabsContent>

        <TabsContent value="cartas">
          <LettersView />
        </TabsContent>

        {/* Simulación absorbe Trayectoria */}
        <TabsContent value="simulacion" className="space-y-12">
          <SimulationView />
          <div className="border-t border-border/50 pt-8">
            <TrajectoryView />
          </div>
        </TabsContent>

        <TabsContent value="vision">
          <VisionBoardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
