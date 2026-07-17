/**
 * **Feature** — Componentes (parts) del módulo **Laboratorio**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
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

export function SmartTrends({ indicators }: { indicators: any[] }) {
  const trends = useMemo(() => {
    return indicators
      .filter(it => it.points.length >= 2)
      .map(it => {
        const current = it.points[it.points.length - 1];
        const previous = it.points[it.points.length - 2];
        const valCur = current.value || 0;
        const valPrev = previous.value || 0;
        const diff = valCur - valPrev;
        const pct = valPrev !== 0 ? (diff / valPrev) * 100 : 0;
        
        // Logical Trend Rules
        // Better lower: Glucose, LDL, Triglycerides, ALT, etc.
        const betterLower = ["Glucosa", "Colesterol LDL directo", "Triglicéridos", "ALT (TGP)", "AST (TGO)", "Proteína C Reactiva ultrasensible", "Hemoglobina Glicosilada (HbA1c)"].includes(it.name);
        // Better higher: HDL, Albumin, eGFR, etc.
        const betterHigher = ["Colesterol HDL", "Albúmina", "TFGe", "Vitamina D", "Hierro Sérico"].includes(it.name);

        let status: "mejorando" | "estable" | "empeorando" | "cambio importante" = "estable";
        
        const isStable = Math.abs(pct) < 5;
        const isBigChange = Math.abs(pct) >= 20;

        if (isStable) {
          status = "estable";
        } else if (betterLower) {
          status = diff < 0 ? "mejorando" : "empeorando";
        } else if (betterHigher) {
          status = diff > 0 ? "mejorando" : "empeorando";
        }

        if (isBigChange && status !== "estable") {
          status = "cambio importante";
        }

        return {
          it,
          current,
          diff,
          pct,
          status,
          betterLower,
          betterHigher
        };
      })
      .sort((a, b) => {
        // Sort by "importance": outsiders or big changes first
        if (a.status === "cambio importante" && b.status !== "cambio importante") return -1;
        if (b.status === "cambio importante" && a.status !== "cambio importante") return 1;
        return 0;
      })
      .slice(0, 6); // Top 6 interesting trends
  }, [indicators]);

  if (trends.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" /> Tendencias Inteligentes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map(({ it, current, diff, pct, status }) => (
          <Card key={it.name} className="overflow-hidden border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all rounded-3xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-tight">{it.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-display font-black tracking-tight">{current.value}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{it.unit}</span>
                  </div>
                </div>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={it.points}>
                      <defs>
                        <linearGradient id={`grad-${it.name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={status === 'mejorando' ? '#10b981' : status === 'empeorando' ? '#ef4444' : '#6366f1'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={status === 'mejorando' ? '#10b981' : status === 'empeorando' ? '#ef4444' : '#6366f1'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={status === 'mejorando' ? '#10b981' : status === 'empeorando' ? '#ef4444' : '#6366f1'} 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad-${it.name.replace(/\s+/g, '-')})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Cambio</div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <MoveRight className="w-3 h-3" />}
                    {Math.abs(diff).toFixed(1)} <span className="text-[10px] opacity-70">({diff > 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Estado</div>
                  <Badge variant="secondary" className={`text-[10px] h-5 px-2 font-bold uppercase ${
                    status === 'mejorando' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                    status === 'empeorando' ? 'bg-red-500/10 text-red-600 border-red-200' : 
                    status === 'cambio importante' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HealthTimeline({ studies, l }: { studies: any[]; l: any }) {
  const timelineData = useMemo(() => {
    return [...studies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(study => {
      const studyResults = l.results.filter((r: any) => r.study_id === study.id);
      const alerts = studyResults.filter((r: any) => r.status === "alto" || r.status === "bajo");
      const inRange = studyResults.filter((r: any) => r.status === "dentro");
      
      return {
        ...study,
        alerts,
        inRange,
        allInRange: alerts.length === 0 && inRange.length > 0
      };
    });
  }, [studies, l.results]);

  if (timelineData.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
        <CardContent className="p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <h3 className="text-lg font-medium">No hay historial disponible</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">Registra tus estudios para ver la evolución cronológica de tu salud.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {timelineData.map((item, idx) => (
        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          {/* Dot */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
            item.allInRange ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {item.allInRange ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <time className="font-display text-lg font-bold uppercase tracking-tight">
                {new Date(item.date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
              </time>
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                {item.date}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {item.alerts.length > 0 ? (
                <div className="space-y-2">
                  {item.alerts.map((res: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{res.indicator_name} {res.status === 'alto' ? 'alto' : 'bajo'} ({res.value} {res.unit})</span>
                    </div>
                  ))}
                </div>
              ) : item.inRange.length > 0 ? (
                <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Todos los indicadores en rango saludable</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Sin resultados específicos registrados.</p>
              )}

              {item.lab_name && (
                <div className="pt-2 border-t border-border/40 flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  <Beaker className="w-3 h-3" /> {item.lab_name}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export function SmartCorrelations({ indicators }: { indicators: any[] }) {
  const correlations = useMemo(() => evaluateCorrelations(indicators), [indicators]);

  if (correlations.length === 0) return null;

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-500" /> Correlaciones Inteligentes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {correlations.map((c) => (
          <Card key={c.id} className="overflow-hidden border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  c.severity === "critical" ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
                  c.severity === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                  "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                }`}>
                  {c.id === "metabolic-syndrome" && <Activity className="w-6 h-6" />}
                  {c.id === "fatty-liver" && <Droplets className="w-6 h-6" />}
                  {c.id === "renal-function" && <Shield className="w-6 h-6" />}
                  {c.id === "cv-inflammatory-risk" && <Heart className="w-6 h-6" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold leading-tight">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {c.observation}
                  </p>
                  <div className="pt-2 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Sugerencias:</div>
                    <ul className="space-y-1.5">
                      {c.suggestions.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border/40 flex gap-3 items-center">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-[10px] text-muted-foreground italic">
          Estas correlaciones son orientativas y se basan en patrones estadísticos. No representan un diagnóstico médico definitivo. Siempre consulta a un profesional de la salud.
        </p>
      </div>
    </div>
  );
}


export function SmartAlerts({ indicators }: { indicators: any[] }) {
  const alerts = useMemo(() => evaluateAlerts(indicators), [indicators]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className={`flex items-start gap-4 p-4 rounded-2xl border ${
            alert.severity === "success" ? "bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900/30" :
            alert.severity === "warning" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30" :
            "bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30"
          }`}
        >
          <div className={`p-2 rounded-xl ${
            alert.severity === "success" ? "bg-green-100 text-green-600 dark:bg-green-900/20" :
            alert.severity === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
            "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
          }`}>
            {alert.type === "preventive" && <Calendar className="w-5 h-5" />}
            {alert.type === "persistence" && <AlertTriangle className="w-5 h-5" />}
            {alert.type === "worsening" && <TrendingUp className="w-5 h-5" />}
            {alert.type === "improvement" && <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold leading-none">{alert.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {alert.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}


export function HealthGoalsSection({ goals, l }: { goals: any[]; l: any }) {
  const [openNewGoal, setOpenNewGoal] = useState(false);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Objetivos de Salud
        </h2>
        <Dialog open={openNewGoal} onOpenChange={setOpenNewGoal}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <Plus className="w-4 h-4" /> Fijar Meta
            </Button>
          </DialogTrigger>
          <NewGoalDialog l={l} onDone={() => setOpenNewGoal(false)} />
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
          <CardContent className="p-8 text-center space-y-3">
            <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No tienes objetivos activos. ¡Fija una meta para motivar tu progreso!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="overflow-hidden border border-border/40 bg-card/50 shadow-sm hover:shadow-md transition-all rounded-3xl">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-tight">{goal.indicator_name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">Meta:</span>
                      <span className="text-lg font-black tracking-tight">
                        {goal.target_type === 'max' ? '&lt;' : '&gt;'} {goal.target_value} {goal.unit}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("¿Eliminar este objetivo?")) {
                        l.deleteGoal(goal.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end text-xs">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground uppercase font-bold tracking-widest text-[10px]">Actual</span>
                      <div className="font-bold text-sm">
                        {goal.current_value ?? goal.start_value} <span className="text-[10px] font-normal opacity-70">{goal.unit}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-muted-foreground uppercase font-bold tracking-widest text-[10px]">Progreso</span>
                      <div className={`font-black text-sm ${goal.progress >= 100 ? 'text-green-500' : 'text-primary'}`}>
                        {goal.progress}%
                      </div>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${goal.progress >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>

                  {goal.progress >= 100 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                      <Trophy className="w-3 h-3" /> ¡Objetivo alcanzado!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewGoalDialog({ l, onDone }: { l: any; onDone: () => void }) {
  const [indicatorName, setIndicatorName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetType, setTargetType] = useState<"max" | "min">("max");
  const [saving, setSaving] = useState(false);

  const indicators = Array.from(l.indicatorMap.values());

  const handleSave = async () => {
    if (!indicatorName || !targetValue) {
      toast.error("Selecciona un indicador y define una meta.");
      return;
    }

    setSaving(true);
    const it = indicators.find((i: any) => i.name === indicatorName) as any;
    const startValue = it?.points?.[it.points.length - 1]?.value || 0;

    const { error } = await l.addGoal({
      indicator_name: indicatorName,
      target_value: Number(targetValue),
      start_value: startValue,
      current_value: startValue,
      unit: it?.unit || "",
      target_type: targetType,
    });

    setSaving(false);
    if (error) {
      toast.error("Error al guardar la meta");
    } else {
      toast.success("¡Meta fijada! Éxito en tu proceso.");
      onDone();
    }
  };

  return (
    <DialogContent className="max-w-md rounded-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Fijar Nuevo Objetivo
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label>Indicador</Label>
          <Select value={indicatorName} onValueChange={setIndicatorName}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecciona uno..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-[300px]">
              {indicators.map((i: any) => (
                <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Meta</Label>
            <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="max">Menor que (&lt;)</SelectItem>
                <SelectItem value="min">Mayor que (&gt;)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor Objetivo</Label>
            <Input 
              type="number" 
              step="any" 
              value={targetValue} 
              onChange={(e) => setTargetValue(e.target.value)} 
              placeholder="0.00"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3">
          <Trophy className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Se usará tu último valor registrado como punto de partida para medir el progreso. ¡Tú puedes!
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onDone} className="rounded-full">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
          {saving ? "Guardando..." : "Fijar Objetivo"}
        </Button>
      </div>
    </DialogContent>
  );
}


export function IndicatorCard({ it, onDeleteResult }: { it: any; onDeleteResult: (id: string) => Promise<{ error: any }> }) {
  const [openDetail, setOpenDetail] = useState(false);
  const lastResult = it.last.result;
  
  const statusColor = {
    bajo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dentro: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    alto: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    desconocido: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }[lastResult.status as LabStatus];

  const statusLabel = {
    bajo: "Bajo",
    dentro: "Normal",
    alto: "Alto",
    desconocido: "S/D"
  }[lastResult.status as LabStatus];

  return (
    <>
      <Card 
        className="overflow-hidden border-border/60 hover:border-primary/40 transition-all cursor-pointer group"
        onClick={() => setOpenDetail(true)}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{it.category}</div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{it.name}</h3>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColor}>{statusLabel}</Badge>
              <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </div>

          <div className="flex items-end gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Último Valor</span>
              <div className="text-3xl font-display font-bold">
                {lastResult.value} <span className="text-sm font-normal text-muted-foreground">{it.unit}</span>
              </div>
            </div>
            <div className="flex flex-col border-l pl-4 border-border">
              <span className="text-sm text-muted-foreground">Referencia</span>
              <span className="text-sm font-medium">{it.ref_display || (lastResult.ref_min != null || lastResult.ref_max != null ? `${lastResult.ref_min ?? '—'} - ${lastResult.ref_max ?? '—'}` : 'Sin ref')}</span>
            </div>
            <div className="ml-auto text-right">
              <span className="text-xs text-muted-foreground block">{humanDateLabel(it.last.date)}</span>
            </div>
          </div>

          {it.points.length >= 2 && (
            <div className="h-[120px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={it.points}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    labelFormatter={(d) => humanDateLabel(d)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="oklch(0.65 0.15 150)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "oklch(0.65 0.15 150)" }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{it.points.length} registros totales</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("¿Eliminar este resultado?")) {
                  onDeleteResult(lastResult.id).then(({ error }) => {
                    if (!error) toast.success("Resultado eliminado");
                  });
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar último
            </Button>
          </div>
        </CardContent>
      </Card>

      <IndicatorDetailDialog 
        it={it} 
        open={openDetail} 
        onOpenChange={setOpenDetail} 
      />
    </>
  );
}

export function IndicatorDetailDialog({ it, open, onOpenChange }: { it: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const lastResult = it.last.result;
  
  const statusTheme = {
    bajo: {
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
      light: "bg-blue-50/50 dark:bg-blue-950/20",
      label: "Bajo",
      icon: <ArrowDown className="w-5 h-5" />
    },
    dentro: {
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300",
      border: "border-green-200 dark:border-green-800",
      light: "bg-green-50/50 dark:bg-green-950/20",
      label: "Normal",
      icon: <CheckCircle2 className="w-5 h-5" />
    },
    alto: {
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      light: "bg-red-50/50 dark:bg-red-950/20",
      label: "Alto",
      icon: <ArrowUp className="w-5 h-5" />
    },
    desconocido: {
      color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
      light: "bg-gray-50/50 dark:bg-gray-900/20",
      label: "Sin Datos",
      icon: <Minus className="w-5 h-5" />
    }
  }[lastResult.status as LabStatus];

  const categoryBadgeMap: Record<string, React.ReactNode> = {
    "Riesgo cardiovascular": <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 gap-1"><Heart className="w-3 h-3" /> Riesgo Cardiovascular</Badge>,
    "Función renal": <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 gap-1"><Activity className="w-3 h-3" /> Función Renal</Badge>,
    "Función hepática": <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1"><Activity className="w-3 h-3" /> Función Hepática</Badge>,
    "Metabolismo de la glucosa": <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1"><Activity className="w-3 h-3" /> Metabolismo Glucosa</Badge>,
    "Metabolismo del hierro": <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 gap-1"><Activity className="w-3 h-3" /> Metabolismo Hierro</Badge>,
    "Electrolitos": <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 gap-1"><Activity className="w-3 h-3" /> Electrolitos</Badge>,
  };

  const categoryBadge = categoryBadgeMap[it.category] || <Badge variant="secondary">{it.category}</Badge>;

  const dynamicAdvice = useMemo(() => {
    if (it.name === 'Triglicéridos' && lastResult.status === 'alto') {
      return "Para reducir los triglicéridos, es clave limitar el consumo de azúcares simples, alcohol y harinas refinadas.";
    }
    if (it.name === 'Colesterol HDL' && lastResult.status === 'bajo') {
      return "Para subir el colesterol 'bueno', se recomienda realizar ejercicio aeróbico regular y consumir grasas saludables como aguacate y nueces.";
    }
    if (it.name === 'ALT (TGP)' && lastResult.status === 'alto') {
      return "Una elevación de ALT puede sugerir inflamación hepática. Se recomienda reducir el consumo de fructosa, alcohol y realizar ejercicio para mejorar el hígado graso.";
    }
    return null;
  }, [it.name, lastResult.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none">
        <div className={`p-6 md:p-8 ${statusTheme.light}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {categoryBadge}
                <Badge className={`${statusTheme.color} border-none`}>
                  <div className="flex items-center gap-1.5">
                    {statusTheme.icon}
                    <span className="font-bold">{statusTheme.label}</span>
                  </div>
                </Badge>
              </div>
              <h2 className="text-3xl font-display font-bold pt-2">{it.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-4xl font-display font-bold text-primary">
                {lastResult.value} <span className="text-lg font-normal text-muted-foreground">{it.unit}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Ref: {it.ref_display || `${it.ref_min ?? '—'} - ${it.ref_max ?? '—'}`}
              </div>
            </div>
          </div>

          {/* Semaforo visual */}
          <div className="flex gap-2 mb-8">
            <div className={`h-2 flex-1 rounded-full ${lastResult.status === 'bajo' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-muted'}`} title="Bajo" />
            <div className={`h-2 flex-1 rounded-full ${lastResult.status === 'dentro' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-muted'}`} title="Normal" />
            <div className={`h-2 flex-1 rounded-full ${lastResult.status === 'alto' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-muted'}`} title="Alto" />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8 bg-background">
          {/* Educativo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none bg-secondary/30 shadow-none">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Info className="w-5 h-5" /> ¿Qué es?
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {it.description || "Este indicador mide componentes específicos de tu salud según tu estudio de laboratorio."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-secondary/30 shadow-none">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-bold">
                  <Lightbulb className="w-5 h-5" /> ¿Por qué importa?
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Conocer este valor ayuda a detectar tendencias en tu metabolismo, función orgánica y bienestar general antes de que se conviertan en síntomas.
                </p>
              </CardContent>
            </Card>
          </div>

          {(it.high_causes || it.low_causes) && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-muted-foreground" /> Posibles causas de variación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.high_causes && (
                  <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30">
                    <div className="text-xs font-bold text-red-600 uppercase mb-2">Si sale Alto</div>
                    <p className="text-sm text-red-800/80 dark:text-red-300/80">{it.high_causes}</p>
                  </div>
                )}
                {it.low_causes && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-2">Si sale Bajo</div>
                    <p className="text-sm text-blue-800/80 dark:text-blue-300/80">{it.low_causes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-muted-foreground" /> Recomendaciones y Control
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Hábitos y Alimentación</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {dynamicAdvice && (
                        <div className="text-sm font-medium text-primary mb-2">💡 {dynamicAdvice}</div>
                      )}
                      {it.control_tips || "Mantener una dieta balanceada, hidratación adecuada y reducir ultraprocesados."}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Actividad Física</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El ejercicio regular mejora la mayoría de los indicadores metabólicos y cardiovasculares.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-2">
                  <AlertTriangle className="w-5 h-5" /> ¿Cuándo consultar?
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  {it.doctor_advice || "Si los valores persisten fuera de rango en estudios consecutivos o presentas síntomas."}
                </p>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Evolución Histórica</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={it.points}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })} />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip 
                    labelFormatter={(d) => humanDateLabel(d)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="oklch(0.65 0.15 150)" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: "oklch(0.65 0.15 150)" }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Historial de Resultados</h3>
            <div className="border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">

                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Fecha</th>
                    <th className="text-left p-3 font-semibold">Valor</th>
                    <th className="text-left p-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...it.points].reverse().map((p, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{humanDateLabel(p.date)}</td>
                      <td className="p-3 font-medium">{p.value} {it.unit}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.result.status === 'bajo' ? 'bg-blue-100 text-blue-700' :
                          p.result.status === 'alto' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {p.result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="bg-muted/50 p-4 rounded-2xl flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                Aclaración: Esta información es educativa y no sustituye valoración médica profesional. Los rangos de referencia pueden variar según el laboratorio y el equipo utilizado. Siempre consulta los resultados con tu médico.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center pb-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar Detalle</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NewResultDialog({ l, onDone }: { l: any; onDone: () => void }) {
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState(todayCDMX());
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedInd = l.indicators.find((i: LabIndicator) => i.id === selectedId);

  const handleSave = async () => {
    if (!selectedId || !value) {
      toast.error("Selecciona un indicador y escribe un valor.");
      return;
    }

    setSaving(true);
    const { error } = await l.addResult({
      indicator_id: selectedInd.id,
      indicator_key: selectedInd.name.toLowerCase().replace(/\s+/g, '_'),
      indicator_name: selectedInd.name,
      category: selectedInd.category,
      value: Number(value),
      unit: selectedInd.unit,
      ref_min: selectedInd.ref_min,
      ref_max: selectedInd.ref_max,
      result_date: date,
    }, selectedInd.ref_type);


    setSaving(false);
    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Resultado guardado");
      onDone();
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Registrar Resultado</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Indicador</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona uno..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {l.indicators.map((i: LabIndicator) => (
                <SelectItem key={i.id} value={i.id}>{i.name} ({i.category})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor {selectedInd?.unit ? `(${selectedInd.unit})` : ''}</Label>
            <Input 
              type="number" 
              step="any" 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="0.00"
            />
          </div>
        </div>

        {selectedInd && (
          <div className="bg-secondary/30 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold block mb-1">Referencia: {selectedInd.ref_display}</span>
              <p className="text-muted-foreground">El estado se calculará automáticamente al guardar según los rangos del laboratorio.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Resultado"}
        </Button>
      </div>
    </DialogContent>
  );
}

export function BulkImportDialog({ l, onDone }: { l: any; onDone: () => void }) {
  const [json, setJson] = useState("");
  const [saving, setSaving] = useState(false);

  const handleImport = async () => {
    try {
      const data = JSON.parse(json);
      if (!data.fecha_estudio || !Array.isArray(data.resultados)) {
        throw new Error("Formato inválido. Se requiere 'fecha_estudio' y un array de 'resultados'.");
      }

      setSaving(true);
      const { error } = await l.bulkImport(data);
      setSaving(false);

      if (error) {
        toast.error("Error al importar: " + error.message);
      } else {
        toast.success("Importación exitosa");
        onDone();
      }
    } catch (e: any) {
      toast.error("Error de formato: " + e.message);
    }
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Importar Resultados Masivos</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          Pega el JSON de los resultados. El sistema mapeará automáticamente los indicadores al catálogo.
        </p>
        <Textarea 
          placeholder='{"fecha_estudio": "2024-02-18", "laboratorio": "Chopo", "resultados": [...] }'
          className="min-h-[300px] font-mono text-xs"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button onClick={handleImport} disabled={saving || !json.trim()}>
          {saving ? "Importando..." : "Comenzar Importación"}
        </Button>
      </div>
    </DialogContent>
  );
}
