/**
 * **Ruta** — Horizontes de planeación (90 días, 1/3/5/10 años).
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Compass, Loader2, Save, Calendar, Milestone, Flag, Target, Rocket, CheckCircle2, Circle, Clock } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { HorizonType } from "@/lib/growth-types";

export const Route = createFileRoute("/horizons")({
  component: HorizonsPage,
});

const HORIZON_CONFIG: { type: HorizonType; label: string; description: string; icon: any; color: string }[] = [
  { type: "90_days", label: "Horizonte 90 días", description: "Corto plazo y enfoque inmediato.", icon: Target, color: "text-blue-500" },
  { type: "1_year", label: "Horizonte 1 año", description: "Metas anuales y hitos de crecimiento.", icon: Flag, color: "text-emerald-500" },
  { type: "3_years", label: "Horizonte 3 años", description: "Construcción de base y visión intermedia.", icon: Milestone, color: "text-amber-500" },
  { type: "5_years", label: "Horizonte 5 años", description: "Cambios transformacionales.", icon: Rocket, color: "text-purple-500" },
  { type: "10_years", label: "Horizonte 10 años", description: "Legado y visión a largo plazo.", icon: Calendar, color: "text-rose-500" },
];

function HorizonsPage() {
  const { horizons, upsertHorizon, updateHorizonStatus, loading } = useGrowth();
  const [activeType, setActiveType] = useState<HorizonType>("90_days");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const horizon = horizons.find(h => h.horizon_type === activeType);
    setContent(horizon?.content || "");
  }, [activeType, horizons]);

  const handleSave = async () => {
    setSaving(true);
    const error = await upsertHorizon(activeType, content);
    setSaving(false);
    if (error) {
      toast.error("Error al guardar horizonte");
    } else {
      toast.success("¡Horizonte actualizado!");
    }
  };

  const toggleStatus = async () => {
    const horizon = horizons.find(h => h.horizon_type === activeType);
    if (!horizon) {
      toast.error("Guarda primero el horizonte para poder completarlo");
      return;
    }
    const newStatus = horizon.status === 'completed' ? 'pending' : 'completed';
    const error = await updateHorizonStatus(horizon.id, newStatus);
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(newStatus === 'completed' ? "¡Horizonte cumplido! 🎉" : "Horizonte reabierto");
    }
  };

  if (loading && horizons.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando horizontes…</div>;
  }

  const activeConfig = HORIZON_CONFIG.find(c => c.type === activeType)!;
  const currentHorizon = horizons.find(h => h.horizon_type === activeType);

  const getDuration = () => {
    if (!currentHorizon || !currentHorizon.completed_at) return null;
    return formatDistanceStrict(
      new Date(currentHorizon.created_at),
      new Date(currentHorizon.completed_at),
      { locale: es }
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="w-8 h-8 text-primary" /> Sistema de Horizontes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Planifica tu vida en diferentes escalas temporales para mantener el rumbo.
        </p>
      </header>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <div className="space-y-2">
          {HORIZON_CONFIG.map((config) => (
            <button
              key={config.type}
              onClick={() => setActiveType(config.type)}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                activeType === config.type
                  ? "bg-primary/10 border-primary/30 shadow-sm"
                  : "hover:bg-muted border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <config.icon className={`w-4 h-4 ${activeType === config.type ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${activeType === config.type ? "text-primary" : ""}`}>
                  {config.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <Card className="border-primary/20 bg-card">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <activeConfig.icon className={`w-5 h-5 ${activeConfig.color}`} />
                {activeConfig.label}
              </CardTitle>
              <CardDescription>{activeConfig.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={currentHorizon?.status === 'completed' ? "default" : "outline"}
                size="sm"
                onClick={toggleStatus}
                className={currentHorizon?.status === 'completed' ? "bg-emerald-500 hover:bg-emerald-600 border-none" : ""}
              >
                {currentHorizon?.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Circle className="w-4 h-4 mr-2" />
                )}
                {currentHorizon?.status === 'completed' ? "Cumplido" : "Pendiente"}
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-b border-primary/10 pb-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Registrado: {currentHorizon ? format(new Date(currentHorizon.created_at), "d 'de' MMMM, yyyy", { locale: es }) : '---'}</span>
              </div>
              {currentHorizon?.status === 'completed' && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cumplido en: {getDuration()}</span>
                </div>
              )}
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`¿Qué quieres haber logrado en ${activeConfig.label.toLowerCase()}? Describe tus metas, cambios de estilo de vida, etc.`}
              className="min-h-[400px] text-base leading-relaxed resize-none border-none bg-transparent focus-visible:ring-0 p-0"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
