/**
 * **Ruta** — Simulador de escenarios futuros.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  Loader2,
  History,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/future-simulation")({
  component: FutureSimulationPage,
});

function FutureSimulationPage() {
  const { runFutureSimulation, futureSimulations, loading } = useGrowth();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    const result = await runFutureSimulation();
    setIsSimulating(false);
    
    if (!result || result.error) {
      toast.error("Error al generar la simulación");
    } else {
      toast.success("¡Simulación generada con éxito! 🔮");
    }
  };

  const latestSimulation = futureSimulations[0];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" /> Future Simulation
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proyecta tu futuro basándote en tus hábitos y métricas actuales.
          </p>
        </div>
        <Button 
          onClick={handleSimulate} 
          disabled={isSimulating}
          className="relative overflow-hidden group shadow-glow"
        >
          {isSimulating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculando futuro...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Iniciar Simulación AI</>
          )}
        </Button>
      </header>

      {!latestSimulation && !isSimulating && (
        <Card className="border-dashed border-primary/20 bg-primary/5">
          <CardContent className="p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold">¿Hacia dónde te diriges?</h3>
              <p className="text-muted-foreground">
                Nuestra IA analizará tus métricas de vida, hábitos y metas para mostrarte dos escenarios posibles en 1 año.
              </p>
            </div>
            <Button onClick={handleSimulate} variant="outline" className="mt-4">
              Comenzar primera simulación
            </Button>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {latestSimulation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {latestSimulation.simulation_data.scenarios.map((scenario, idx) => (
                <Card key={idx} className={`overflow-hidden border-2 ${idx === 0 ? 'border-primary/10' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {idx === 0 ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <TrendingUp className="w-5 h-5 text-emerald-500" />}
                        {scenario.title}
                      </CardTitle>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                        {scenario.timeframe}
                      </span>
                    </div>
                    <CardDescription className="text-sm mt-2 leading-relaxed">
                      {scenario.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                      {scenario.projections.map((proj, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                          <div className={`mt-1 font-bold text-lg ${proj.impact.includes('↑') ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {proj.impact}
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-sm font-bold flex items-center gap-2">
                              {proj.category}
                            </div>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {proj.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {latestSimulation.ai_insight && (
              <Card className="border-primary/20 bg-primary/5 shadow-glow overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Brain className="w-24 h-24" />
                </div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Insight</span>
                  </div>
                  <p className="text-lg font-display italic text-primary/90">
                    "{latestSimulation.ai_insight}"
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {futureSimulations.length > 1 && (
        <section className="space-y-4 pt-8 border-t border-border/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" /> Historial de Predicciones
          </h2>
          <div className="grid gap-3">
            {futureSimulations.slice(1, 5).map((sim) => (
              <div key={sim.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center gap-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Simulación de {sim.timeframe}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(sim.created_at), "PPP", { locale: es })}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                   // This could swap the current view or show a modal
                   toast.info("Historial visualización en desarrollo");
                }}>
                  Ver <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
