/**
 * **Ruta** — Análisis de laboratorio: indicadores, resultados, health score.
 */
import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLabs } from "@/hooks/use-labs";
import { calculateLabStatus, calculateHealthScore, type LabResult, type LabStatus, type LabIndicator, type HealthScore } from "@/lib/lab-types";
import { evaluateCorrelations, type LabCorrelation } from "@/lib/lab-correlations";
import { evaluateAlerts, type LabAlert } from "@/lib/lab-alerts";
import { generateHealthPDF } from "@/lib/pdf-generator";
import { todayCDMX, humanDateLabel } from "@/lib/date-utils";
import { HealthHeader } from "@/components/health/HealthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Beaker, Plus, Trash2, Search, Filter, Calendar, ChevronRight, ArrowUp, ArrowDown, Minus, Info, FileJson, AlertCircle, Heart, Activity, CheckCircle2, Stethoscope, Utensils, Dumbbell, AlertTriangle, Lightbulb, LayoutDashboard, List, ChevronDown, Flame, ShieldCheck, Droplets, Shield, Zap, TrendingUp, TrendingDown, MoveRight, Target, Trophy, FileText, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BulkImportDialog, HealthGoalsSection, HealthTimeline, IndicatorCard, IndicatorDetailDialog, NewGoalDialog, NewResultDialog, SmartAlerts, SmartCorrelations, SmartTrends } from "@/features/labs/parts";

export const Route = createLazyFileRoute("/labs")({
  component: LabsPage,
});

function LabsPage() {
  const l = useLabs();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await generateHealthPDF({
        indicators: Array.from(l.indicatorMap.values()),
        results: l.results,
        studies: l.studies,
        healthScores: healthScores,
      });
      toast.success("Reporte PDF generado con éxito");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF médico");
    } finally {
      setExporting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"dashboard" | "results" | "trends" | "timeline">("dashboard");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<LabStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(l.indicators.map(i => i.category));
    return ["Todas", ...Array.from(cats)];
  }, [l.indicators]);

  const filteredIndicators = useMemo(() => {
    return Array.from(l.indicatorMap.entries())
      .map(([key, data]) => {
        // Encontrar el punto de datos para la fecha seleccionada o el último disponible
        let targetPoint;
        if (dateFilter === "all") {
          targetPoint = data.points[data.points.length - 1];
        } else {
          targetPoint = data.points.find(p => p.date === dateFilter);
        }

        // Si no hay datos (o no hay datos en esa fecha), lo omitimos
        if (!targetPoint) return null;

        return { key, ...data, last: targetPoint };
      })
      .filter((it): it is NonNullable<typeof it> => it !== null)
      .filter(it => {
        const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === "Todas" || it.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || it.last.result.status === statusFilter;
        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [l.indicatorMap, search, categoryFilter, statusFilter, dateFilter]);

  const healthScores = useMemo(() => {
    const categories = [
      "Cardiovascular",
      "Función renal",
      "Función hepática",
      "Metabolismo/glucosa",
      "Inflamación",
      "Sistema inmune",
      "Minerales/electrolitos",
      "Metabolismo de hierro"
    ];

    return categories.map(cat => {
      const indicators = Array.from(l.indicatorMap.values()).filter(it => it.category === cat);
      return calculateHealthScore(cat, indicators);
    });
  }, [l.indicatorMap]);

  const activeGoals = useMemo(() => {
    return (l.goals || []).map(goal => {
      const it = l.indicatorMap.get(goal.indicator_name.toLowerCase()) || 
                 Array.from(l.indicatorMap.values()).find(v => v.name === goal.indicator_name);
      
      const lastValue = it?.points[it.points.length - 1]?.value;
      
      // Calculate progress
      let progress = 0;
      if (goal.start_value != null && lastValue != null) {
        const totalDistance = Math.abs(goal.target_value - goal.start_value);
        const currentDistance = Math.abs(lastValue - goal.start_value);
        if (totalDistance > 0) {
          progress = Math.min(100, Math.max(0, (currentDistance / totalDistance) * 100));
        }
      }

      return {
        ...goal,
        current_value: lastValue,
        progress: Math.round(progress)
      };
    });
  }, [l.goals, l.indicatorMap]);

  if (l.loading) return <div className="p-10 text-center">Cargando datos de laboratorio...</div>;

  return (
    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto pb-32">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Salud</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Laboratorios 🧪</h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <p className="text-muted-foreground">Catálogo de indicadores y seguimiento de resultados históricos.</p>
          <Button 
            onClick={handleExportPDF} 
            disabled={exporting}
            className="rounded-full gap-2 bg-slate-800 hover:bg-slate-900 text-white"
          >
            {exporting ? (
              <span className="animate-spin mr-1">⌛</span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Reporte Médico PDF
          </Button>
        </div>
      </header>

      <HealthHeader />

      <SmartAlerts indicators={Array.from(l.indicatorMap.values())} />

      <div className="flex p-1 bg-secondary/30 rounded-2xl w-full md:w-fit mb-8 overflow-x-auto no-scrollbar">
        <Button 
          variant={activeTab === "dashboard" ? "default" : "ghost"} 
          className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${activeTab === "dashboard" ? "shadow-sm" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Button>
        <Button 
          variant={activeTab === "trends" ? "default" : "ghost"} 
          className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${activeTab === "trends" ? "shadow-sm" : ""}`}
          onClick={() => setActiveTab("trends")}
        >
          <TrendingUp className="w-4 h-4" /> Tendencias
        </Button>
        <Button 
          variant={activeTab === "results" ? "default" : "ghost"} 
          className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${activeTab === "results" ? "shadow-sm" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          <List className="w-4 h-4" /> Resultados Detallados
        </Button>
        <Button 
          variant={activeTab === "timeline" ? "default" : "ghost"} 
          className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${activeTab === "timeline" ? "shadow-sm" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          <Calendar className="w-4 h-4" /> Timeline
        </Button>
      </div>

      {activeTab === "dashboard" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <HealthGoalsSection goals={activeGoals} l={l} />

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card 
              className={`bg-card cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${statusFilter === 'all' ? 'ring-2 ring-primary shadow-md' : ''}`}
              onClick={() => {
                setStatusFilter('all');
                setActiveTab("results");
              }}
            >
              <CardContent className="pt-6">
                <div className="text-xs uppercase text-muted-foreground mb-1">Total Indicadores</div>
                <div className="text-3xl font-bold">{l.stats.total}</div>
              </CardContent>
            </Card>
            <Card 
              className={`border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer transition-all hover:ring-2 hover:ring-blue-400/20 ${statusFilter === 'bajo' ? 'ring-2 ring-blue-400 shadow-md' : ''}`}
              onClick={() => {
                setStatusFilter('bajo');
                setActiveTab("results");
              }}
            >
              <CardContent className="pt-6">
                <div className="text-xs uppercase text-blue-600 dark:text-blue-400 mb-1">Bajo Rango</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{l.stats.bajo}</div>
              </CardContent>
            </Card>
            <Card 
              className={`border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10 cursor-pointer transition-all hover:ring-2 hover:ring-green-500/20 ${statusFilter === 'dentro' ? 'ring-2 ring-green-500 shadow-md' : ''}`}
              onClick={() => {
                setStatusFilter('dentro');
                setActiveTab("results");
              }}
            >
              <CardContent className="pt-6">
                <div className="text-xs uppercase text-green-600 dark:text-green-400 mb-1">Dentro de Rango</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{l.stats.dentro}</div>
              </CardContent>
            </Card>
            <Card 
              className={`border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10 cursor-pointer transition-all hover:ring-2 hover:ring-red-500/20 ${statusFilter === 'alto' ? 'ring-2 ring-red-500 shadow-md' : ''}`}
              onClick={() => {
                setStatusFilter('alto');
                setActiveTab("results");
              }}
            >
              <CardContent className="pt-6">
                <div className="text-xs uppercase text-red-600 dark:text-red-400 mb-1">Fuera de Rango (Alto)</div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{l.stats.alto}</div>
              </CardContent>
            </Card>
          </div>

          {/* Health Scores Section */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Health Score por Categoría
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthScores.map((s, idx) => (
                <Collapsible key={idx} className="group">
                  <Card className="overflow-hidden border border-border/40 bg-card shadow-sm hover:shadow-md transition-all rounded-3xl">
                    <CollapsibleTrigger className="w-full text-left">
                      <CardContent className="p-0">
                        <div className={`p-5 flex items-center justify-between transition-colors ${s.score > 0 ? s.color.replace('text-', 'bg-').replace('600', '500/5') : 'bg-secondary/20'} group-data-[state=open]:bg-secondary/10`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${s.score > 0 ? s.color.replace('text-', 'bg-').replace('600', '500/15') : 'bg-muted'}`}>
                              {s.category === "Cardiovascular" && <Heart className="w-5 h-5 text-red-500" />}
                              {s.category === "Función renal" && <Droplets className="w-5 h-5 text-cyan-500" />}
                              {s.category === "Función hepática" && <Activity className="w-5 h-5 text-emerald-500" />}
                              {s.category === "Metabolismo/glucosa" && <Utensils className="w-5 h-5 text-amber-500" />}
                              {s.category === "Inflamación" && <Flame className="w-5 h-5 text-orange-600" />}
                              {s.category === "Sistema inmune" && <ShieldCheck className="w-5 h-5 text-indigo-500" />}
                              {s.category === "Minerales/electrolitos" && <Zap className="w-5 h-5 text-yellow-500" />}
                              {s.category === "Metabolismo de hierro" && <Dumbbell className="w-5 h-5 text-orange-700" />}
                            </div>
                            <div>
                              <div className="text-base font-bold tracking-tight text-foreground leading-tight">{s.category}</div>
                              <div className={`text-[10px] font-bold uppercase tracking-widest ${s.color}`}>{s.label}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {s.score > 0 && (
                              <div className="text-right">
                                <div className={`text-2xl font-display font-black tracking-tighter ${s.color}`}>
                                  {s.score}<span className="text-[10px] font-bold text-muted-foreground/60 ml-0.5">/100</span>
                                </div>
                              </div>
                            )}
                            <ChevronDown className="w-5 h-5 text-muted-foreground/40 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="p-6 pt-2 space-y-6 border-t border-border/40 bg-secondary/5 animate-in fade-in slide-in-from-top-1 duration-300">
                        {s.score === 0 ? (
                          <div className="py-6 text-center space-y-2">
                            <Beaker className="w-8 h-8 mx-auto text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Sin indicadores en esta categoría.</p>
                            <Button variant="outline" size="sm" onClick={() => setActiveTab("results")} className="h-8 text-xs rounded-full">Agregar datos</Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {s.strengths.length > 0 && (
                              <div className="space-y-3">
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-500/50" /> FORTALEZAS
                                </div>
                                <div className="space-y-1.5">
                                  {s.strengths.map((st, i) => (
                                    <div key={i} className="text-[11px] font-medium text-green-700 dark:text-green-400 flex items-start gap-2 bg-green-50/40 dark:bg-green-900/10 p-2 rounded-xl border border-green-100/30">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" /> {st.replace('✓ ', '')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.improvements.length > 0 && (
                              <div className="space-y-3">
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-amber-500/50" /> POR MEJORAR
                                </div>
                                <div className="space-y-1.5">
                                  {s.improvements.map((im, i) => (
                                    <div key={i} className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-start gap-2 bg-amber-50/40 dark:bg-amber-900/10 p-2 rounded-xl border border-amber-100/30">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" /> {im.replace(/⚠ |⬇ /, '')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>

          <SmartCorrelations indicators={Array.from(l.indicatorMap.values())} />

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-12">
            <Beaker className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Análisis de Laboratorios</h3>
            <p className="text-muted-foreground mb-6">
              Visualiza tus indicadores detallados, gráficas de evolución y recomendaciones educativas en la sección de Resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => setActiveTab("trends")} className="rounded-full px-8 gap-2">
                <TrendingUp className="w-4 h-4" /> Ver Tendencias Inteligentes
              </Button>
              <Button onClick={() => setActiveTab("results")} className="rounded-full px-8">
                Ver Resultados Detallados
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <SmartTrends indicators={Array.from(l.indicatorMap.values())} />
          
          {Array.from(l.indicatorMap.values()).filter(it => it.points.length >= 2).length === 0 && (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-muted-foreground">No hay suficientes datos para mostrar tendencias</h3>
              <p className="text-muted-foreground/60 max-w-sm mx-auto mt-2">Registra al menos dos estudios para ver la evolución de tus indicadores.</p>
              <Button variant="outline" onClick={() => setActiveTab("results")} className="mt-6 rounded-full">
                Ir a Resultados Detallados
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "results" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Buscar indicador..." 
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <Activity className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="dentro">Normales</SelectItem>
                  <SelectItem value="bajo">Bajos</SelectItem>
                  <SelectItem value="alto">Altos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Fecha de estudio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  {l.studies.map(s => (
                    <SelectItem key={s.id} value={s.date}>
                      {humanDateLabel(s.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={openBulk} onOpenChange={setOpenBulk}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FileJson className="w-4 h-4" /> Importar JSON
                  </Button>
                </DialogTrigger>
                <BulkImportDialog l={l} onDone={() => setOpenBulk(false)} />
              </Dialog>
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Agregar resultado
                  </Button>
                </DialogTrigger>
                <NewResultDialog l={l} onDone={() => setOpenNew(false)} />
              </Dialog>
            </div>
          </div>

          {/* Main Content: Indicators Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredIndicators.map((it) => (
              <IndicatorCard key={it.key} it={it} onDeleteResult={l.deleteResult} />
            ))}
            {filteredIndicators.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
                <Beaker className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No se encontraron indicadores</h3>
                <p className="text-muted-foreground">Prueba ajustando los filtros o registra un nuevo resultado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">
          <HealthTimeline studies={l.studies} l={l} />
        </div>
      )}
    </div>
  );
}

