/**
 * **Ruta** — Trayectoria de vida: visualización histórica.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { useIdentity } from "@/hooks/use-identity";
import { currentMonthKey } from "@/lib/identity-types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Minus, Activity, Heart, Wallet, Users, Briefcase, Zap, Loader2, Plus, History, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/life-trajectory")({
  component: LifeTrajectoryPage,
});

const AREAS = [
  { id: "health", label: "Salud", icon: Heart, color: "#ef4444" },
  { id: "finances", label: "Finanzas", icon: Wallet, color: "#22c55e" },
  { id: "relationships", label: "Relaciones", icon: Users, color: "#ec4899" },
  { id: "business", label: "Negocios", icon: Briefcase, color: "#3b82f6" },
  { id: "stress", label: "Estrés", icon: Zap, color: "#f59e0b", invert: true },
];

function LifeTrajectoryPage() {
  const { lifeMetrics, addLifeMetric, loading } = useGrowth();
  const { setAreaScore } = useIdentity();
  const [syncWithWheel, setSyncWithWheel] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMetrics, setNewMetrics] = useState({
    health: 5,
    finances: 5,
    relationships: 5,
    business: 5,
    stress: 5,
  });

  const handleAdd = async () => {
    const error = await addLifeMetric(newMetrics);
    if (error) {
      toast.error("Error al guardar check-in");
    } else {
      if (syncWithWheel) {
        const month = currentMonthKey();
        await Promise.all([
          setAreaScore("salud", newMetrics.health, month, "Actualizado desde Life Trajectory"),
          setAreaScore("finanzas", newMetrics.finances, month, "Actualizado desde Life Trajectory"),
          setAreaScore("relaciones", newMetrics.relationships, month, "Actualizado desde Life Trajectory"),
          setAreaScore("negocio", newMetrics.business, month, "Actualizado desde Life Trajectory"),
          setAreaScore("mental", 11 - newMetrics.stress, month, "Actualizado desde Life Trajectory (Estrés invertido)"),
        ]);
      }
      toast.success("Check-in registrado. ¡Sigue así! 🚀");
      setIsAdding(false);
    }
  };

  if (loading && lifeMetrics.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando trayectoria…</div>;
  }

  const getTrajectory = (areaId: string) => {
    if (lifeMetrics.length < 2) return <Minus className="w-5 h-5 text-muted-foreground" />;
    
    const last = lifeMetrics[lifeMetrics.length - 1][areaId as keyof typeof newMetrics];
    const prev = lifeMetrics[lifeMetrics.length - 2][areaId as keyof typeof newMetrics];
    
    const isStress = areaId === 'stress';
    
    if (last > prev) {
      return isStress ? <TrendingUp className="w-5 h-5 text-rose-500" /> : <TrendingUp className="w-5 h-5 text-emerald-500" />;
    } else if (last < prev) {
      return isStress ? <TrendingDown className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />;
    }
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const chartData = lifeMetrics.map(m => ({
    ...m,
    date: format(new Date(m.created_at), "d MMM", { locale: es })
  }));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" /> Life Trajectory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualiza tu dirección real en las áreas clave de tu vida.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/identity" hash="wheel">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Ver Rueda de la Vida
            </Button>
          </Link>
          <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
            {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nuevo Check-in</>}
          </Button>
        </div>
      </header>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5 shadow-glow">
          <CardHeader>
            <CardTitle>Check-in de Trayectoria</CardTitle>
            <CardDescription>Sé honesto contigo mismo. ¿Cómo van estas áreas hoy (1-10)?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {AREAS.map((area) => (
                <div key={area.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-bold">
                      <area.icon className="w-4 h-4" /> {area.label}
                    </Label>
                    <span className="text-lg font-display font-bold text-primary">
                      {newMetrics[area.id as keyof typeof newMetrics]}
                    </span>
                  </div>
                  <Slider 
                    value={[newMetrics[area.id as keyof typeof newMetrics]]} 
                    onValueChange={([val]) => setNewMetrics({ ...newMetrics, [area.id]: val })} 
                    max={10} 
                    min={1} 
                    step={1}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-xl border border-border/50">
              <Checkbox 
                id="sync" 
                checked={syncWithWheel} 
                onCheckedChange={(checked) => setSyncWithWheel(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="sync"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3 text-primary" /> Sincronizar con la Rueda de la Vida
                </label>
                <p className="text-xs text-muted-foreground">
                  Actualiza automáticamente tus puntajes del mes actual en el módulo de Identidad.
                </p>
              </div>
            </div>

            <Button onClick={handleAdd} className="w-full">Registrar Trayectoria</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {AREAS.map((area) => {
          const lastValue = lifeMetrics.length > 0 
            ? lifeMetrics[lifeMetrics.length - 1][area.id as keyof typeof newMetrics]
            : '--';
          
          return (
            <Card key={area.id} className="border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-2xl bg-muted/50" style={{ color: area.color }}>
                  <area.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{area.label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold">{lastValue}</span>
                  {getTrajectory(area.id)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Historial de Trayectoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            {lifeMetrics.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                <Activity className="w-12 h-12" />
                <p>Registra al menos 2 check-ins para ver tendencias.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 10]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend />
                  {AREAS.map(area => (
                    <Line 
                      key={area.id}
                      type="monotone" 
                      dataKey={area.id} 
                      name={area.label}
                      stroke={area.color} 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
