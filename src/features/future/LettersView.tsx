/**
 * **Vista** — Cartas al yo del futuro (subvista de /future).
 */
import { useState } from "react";
import { useGrowth } from "@/hooks/use-growth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Plus, Trash2, Loader2, Calendar, Lock, Unlock, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import { es } from "date-fns/locale";

export function LettersView() {
  const { futureLetters, addFutureLetter, deleteFutureLetter, markLetterAsRead, loading } = useGrowth();
  const [isAdding, setIsAdding] = useState(false);
  const [newLetter, setNewLetter] = useState({ title: "", content: "", unlock_date: "" });
  const [viewingLetter, setViewingLetter] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newLetter.title || !newLetter.content || !newLetter.unlock_date) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    const unlockDate = new Date(newLetter.unlock_date);
    if (!isAfter(unlockDate, new Date())) {
      toast.error("La fecha de apertura debe ser en el futuro");
      return;
    }
    const error = await addFutureLetter({ ...newLetter, unlock_date: unlockDate.toISOString() });
    if (error) {
      toast.error("Error al guardar la carta");
    } else {
      toast.success("Carta sellada y guardada para el futuro 💌");
      setIsAdding(false);
      setNewLetter({ title: "", content: "", unlock_date: "" });
    }
  };

  if (loading && futureLetters.length === 0) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando cartas…</div>;
  }

  const selectedLetter = futureLetters.find(l => l.id === viewingLetter);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="w-7 h-7 text-primary" /> Cartas al Futuro
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Escríbele a tu "yo" del futuro. La carta se mantendrá sellada hasta la fecha que elijas.
          </p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"} className="rounded-full">
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nueva Carta</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5 shadow-glow overflow-hidden">
          <div className="h-2 bg-gradient-primary w-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" /> Escribe desde el corazón
            </CardTitle>
            <CardDescription>
              Comparte tus miedos, esperanzas y consejos con la persona en la que te convertirás.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título de la carta</Label>
              <Input value={newLetter.title} onChange={(e) => setNewLetter({ ...newLetter, title: e.target.value })} placeholder="Ej: Para cuando cumpla 30 años..." />
            </div>
            <div className="space-y-2">
              <Label>¿Cuándo debe abrirse?</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="date" className="pl-10" value={newLetter.unlock_date} onChange={(e) => setNewLetter({ ...newLetter, unlock_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tu mensaje</Label>
              <Textarea value={newLetter.content} onChange={(e) => setNewLetter({ ...newLetter, content: e.target.value })} placeholder="Querido yo del futuro..." className="min-h-[280px] leading-relaxed italic" />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-full h-12">
              <Send className="w-4 h-4 mr-2" /> Sellar y enviar al futuro
            </Button>
          </CardContent>
        </Card>
      )}

      {viewingLetter && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl border-primary/20 bg-amber-50 dark:bg-slate-900">
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setViewingLetter(null)}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <CardHeader className="text-center pt-10 pb-6 border-b border-primary/10">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4 opacity-40" />
              <CardTitle className="font-display text-2xl italic">"{selectedLetter.title}"</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-2">
                <Unlock className="w-3 h-3 text-emerald-500" />
                Abierta el {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-12 leading-loose text-lg font-serif italic text-foreground/90 whitespace-pre-wrap">
              {selectedLetter.content}
            </CardContent>
            <div className="p-8 flex justify-center">
              <Button onClick={() => setViewingLetter(null)} variant="outline" className="rounded-full px-8">Cerrar carta</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {futureLetters.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-10" />
            <p className="text-muted-foreground font-medium italic">Aún no has escrito ninguna carta al futuro.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">¿Qué le dirías a tu "yo" de dentro de un año?</p>
          </div>
        )}

        {futureLetters.map((letter) => {
          const isUnlocked = !isAfter(new Date(letter.unlock_date), new Date());
          return (
            <Card
              key={letter.id}
              className={`group transition-all duration-500 relative overflow-hidden border-primary/10 ${isUnlocked ? "hover:border-primary/40 hover:shadow-glow cursor-pointer" : "opacity-80"}`}
              onClick={() => {
                if (isUnlocked) {
                  setViewingLetter(letter.id);
                  if (!letter.is_read) markLetterAsRead(letter.id);
                } else {
                  toast.info(`Esta carta se mantendrá sellada hasta el ${format(new Date(letter.unlock_date), "d 'de' MMMM, yyyy", { locale: es })}`);
                }
              }}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full transition-all group-hover:w-24 group-hover:h-24 ${isUnlocked ? "bg-emerald-500/10" : "bg-primary/5"}`} />

              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-muted/50 text-primary">
                      {isUnlocked ? <Unlock className="w-6 h-6 text-emerald-500" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all" onClick={(e) => { e.stopPropagation(); deleteFutureLetter(letter.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{letter.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{isUnlocked ? `Se abrió el ${format(new Date(letter.unlock_date), "d 'de' MMM, yyyy", { locale: es })}` : `Se abrirá el ${format(new Date(letter.unlock_date), "d 'de' MMM, yyyy", { locale: es })}`}</span>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="bg-primary/5 rounded-lg p-3 text-[10px] uppercase tracking-widest text-center font-bold text-primary/60">Cerrada · Bajo llave</div>
                  )}
                  {isUnlocked && !letter.is_read && (
                    <div className="bg-emerald-500/10 rounded-lg p-3 text-[10px] uppercase tracking-widest text-center font-bold text-emerald-600 animate-pulse">¡Ya puedes leerla!</div>
                  )}
                  {isUnlocked && letter.is_read && (
                    <div className="bg-muted rounded-lg p-3 text-[10px] uppercase tracking-widest text-center font-bold text-muted-foreground">Leída</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
