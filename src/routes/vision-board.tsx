/**
 * **Ruta** — Tablero de visión (vision board).
 */

import { createFileRoute } from "@tanstack/react-router";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Loader2, Sparkles, Clock, Target, MessageCircle, Calendar, Plus, ExternalLink, Mountain } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/vision-board")({
  component: VisionBoardPage,
});

function VisionBoardPage() {
  const { dreams, loading } = useGrowth();

  if (loading && dreams.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando Vision Board…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-primary" /> Vision Board Dinámico
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualiza tus metas más grandes y mantén el enfoque en tu propósito.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dreams">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Gestionar Sueños
            </Button>
          </Link>
        </div>
      </header>

      {dreams.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">Tu Vision Board está vacío</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Comienza por registrar tus aspiraciones más profundas en la sección de Grandes Sueños.
          </p>
          <Link to="/dreams">
            <Button>
              <Mountain className="w-4 h-4 mr-2" /> Ir a Grandes Sueños
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dreams.map((dream) => (
            <Card key={dream.id} className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all hover:shadow-glow">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {dream.image_url ? (
                  <img 
                    src={dream.image_url} 
                    alt={dream.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Mountain className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {dream.category && <Badge className="bg-primary/20 hover:bg-primary/30 text-primary-foreground border-none text-[10px] uppercase tracking-wider">{dream.category}</Badge>}
                    {dream.status === 'achieved' && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] uppercase tracking-wider">Cumplido</Badge>}
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">{dream.title}</h3>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  {dream.motivation && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Motivación
                      </span>
                      <p className="text-sm italic leading-relaxed text-foreground/90 bg-primary/5 p-3 rounded-xl border border-primary/10">
                        "{dream.motivation}"
                      </p>
                    </div>
                  )}
                  
                  {dream.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <MessageCircle className="w-3 h-3" /> Descripción
                      </span>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {dream.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    {dream.deadline && (
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Deadline</span>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="w-3 h-3 text-rose-500" />
                          {format(new Date(dream.deadline), "MMM yyyy", { locale: es })}
                        </div>
                      </div>
                    )}
                    {!dream.deadline && dream.timeframe && (
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Horizonte</span>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {dream.timeframe}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Link to="/dreams">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:text-primary">
                      Editar <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
