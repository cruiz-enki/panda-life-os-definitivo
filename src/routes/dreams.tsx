/**
 * **Ruta** — Sueños y aspiraciones de vida.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mountain, Plus, Trash2, Loader2, Sparkles, Clock, Tag, MessageCircle, Image as ImageIcon, Target, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dreams")({
  component: DreamsPage,
});

function DreamsPage() {
  const { dreams, addDream, deleteDream, loading } = useGrowth();
  const [isAdding, setIsAdding] = useState(false);
  const [newDream, setNewDream] = useState({
    title: "",
    description: "",
    category: "",
    timeframe: "",
    motivation: "",
    deadline: "",
    image_url: "",
  });

  const handleAdd = async () => {
    if (!newDream.title) {
      toast.error("El título es obligatorio");
      return;
    }
    const error = await addDream({
      ...newDream,
      deadline: newDream.deadline ? new Date(newDream.deadline).toISOString() : null,
      status: "active",
    });
    if (error) {
      toast.error("Error al añadir el sueño");
    } else {
      toast.success("¡Sueño añadido!");
      setIsAdding(false);
      setNewDream({ title: "", description: "", category: "", timeframe: "", motivation: "", deadline: "", image_url: "" });
    }
  };

  if (loading && dreams.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando sueños…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <Mountain className="w-8 h-8 text-primary" /> Grandes Sueños
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define tus aspiraciones más grandes y el porqué detrás de ellas.
          </p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nuevo Sueño</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5 shadow-glow">
          <CardHeader>
            <CardTitle>Expresa tu sueño</CardTitle>
            <CardDescription>Sé específico y conecta con tu propósito.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>¿Cuál es tu sueño?</Label>
              <Input 
                value={newDream.title} 
                onChange={(e) => setNewDream({ ...newDream, title: e.target.value })} 
                placeholder="Ej: Dar la vuelta al mundo, Escribir un libro..."
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input 
                  value={newDream.category} 
                  onChange={(e) => setNewDream({ ...newDream, category: e.target.value })} 
                  placeholder="Ej: Viajes, Carrera, Salud..."
                />
              </div>
              <div className="space-y-2">
                <Label>Ventana de tiempo</Label>
                <Input 
                  value={newDream.timeframe} 
                  onChange={(e) => setNewDream({ ...newDream, timeframe: e.target.value })} 
                  placeholder="Ej: 5 años, Diciembre 2028..."
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha límite (opcional)</Label>
                <Input 
                  type="date"
                  value={newDream.deadline} 
                  onChange={(e) => setNewDream({ ...newDream, deadline: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen URL (Unsplash, etc.)</Label>
                <Input 
                  value={newDream.image_url} 
                  onChange={(e) => setNewDream({ ...newDream, image_url: e.target.value })} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivación (Lo que te impulsa)</Label>
              <Textarea 
                value={newDream.motivation} 
                onChange={(e) => setNewDream({ ...newDream, motivation: e.target.value })} 
                placeholder="Describe qué sentiras al lograrlo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción / El porqué</Label>
              <Textarea 
                value={newDream.description} 
                onChange={(e) => setNewDream({ ...newDream, description: e.target.value })} 
                placeholder="Conecta con tu propósito profundo..."
              />
            </div>
            <Button onClick={handleAdd} className="w-full">Guardar Sueño</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {dreams.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Aún no has registrado ningún sueño.</p>
            <p className="text-xs text-muted-foreground/60">Empieza hoy mismo a darles forma.</p>
          </div>
        )}
        {dreams.map((dream) => (
          <Card key={dream.id} className="group hover:border-primary/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold">{dream.title}</h3>
                    {dream.category && <Badge variant="secondary"><Tag className="w-3 h-3 mr-1" /> {dream.category}</Badge>}
                    {dream.timeframe && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {dream.timeframe}</Badge>}
                  </div>
                  {dream.description && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50 italic">
                      <MessageCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                      <p>{dream.description}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDream(dream.id)} className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
