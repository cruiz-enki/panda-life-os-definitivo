/**
 * **Feature** — Componentes (parts) del módulo **Aprendizajes**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Quote, 
  History, 
  BookOpen, 
  Film, 
  Mic, 
  Briefcase, 
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Globe,
  Flag,
  Star,
  Plus,
  BookOpenCheck,
  Trophy
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState, type LearningCategory } from "@/lib/storage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/use-content";
import { WishlistType } from "@/lib/content-types";

interface DailyAprender {
  quote: { text: string; author: string };
  historicalFact: { year: string; event: string };
  mexicoHistory: { year: string; event: string; context: string };
  worldHistory: { title: string; event: string; significance: string };
  recommendations: {
    book: { title: string; author: string; reason: string };
    series: { title: string; platform: string; reason: string };
    movie: { title: string; director: string; reason: string };
    podcast: { title: string; host: string; reason: string };
  };
  businessAnecdote: { title: string; story: string; takeaway: string };
  miniBiography: { person: string; era: string; description: string; achievement: string };
  classicBookSummary: { title: string; author: string; summary: string; lesson: string };
  randomKnowledge: string;
  randomKnowledge2?: string;
}

export function AprenderPage() {
  const { state, addTask, addLearning } = useAppState();
  const { addItem: addWishlistItem } = useWishlist();
  const location = useLocation();
  const [data, setData] = useState<DailyAprender | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const personalListId = state.taskLists.find(l => l.name.toLowerCase().includes("personal"))?.id || state.taskLists[0]?.id || "";

  const addToWishlist = async (title: string, reason: string, itemType: WishlistType = "other") => {
    await addWishlistItem({
      title,
      notes: reason,
      itemType,
      priority: "medium",
      reason: "recommendation",
      source: "Aprende Hoy AI",
      tags: ["AI"],
      remindAt: null,
    });
    toast.success(`"${title}" añadido a tu Wishlist`);
  };

  const addToBitacora = (title: string, content: string, category: LearningCategory) => {
    addLearning({
      title: title,
      notes: content,
      category: category,
    });
    toast.success(`"${title}" guardado en tu Bitácora`);
  };


  const fetchDailyAprender = async (force = false) => {
    setLoading(true);
    
    // Intentamos cargar de caché local para hoy si no es force refresh
    const todayStr = new Date().toISOString().split('T')[0];
    if (!force) {
      const cached = localStorage.getItem(`daily_aprender_${todayStr}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing cached daily aprender", e);
        }
      }
    }

    try {
      const { data: responseData, error } = await supabase.functions.invoke("ai-daily-learning");
      
      if (error) throw error;
      
      if (responseData) {
        setData(responseData);
        localStorage.setItem(`daily_aprender_${todayStr}`, JSON.stringify(responseData));
      }
    } catch (err) {
      console.error("Error fetching daily aprender", err);
      // Fallback a mock data si falla la IA
      const mockData: DailyAprender = {
        quote: {
          text: "La educación no es la preparación para la vida; la educación es la vida misma.",
          author: "John Dewey"
        },
        historicalFact: {
          year: "1844",
          event: "Samuel Morse envía el primer mensaje por telégrafo eléctrico desde Washington D.C. a Baltimore."
        },
        mexicoHistory: {
          year: "1824",
          event: "Promulgación de la primera Constitución Federal de los Estados Unidos Mexicanos.",
          context: "Estableció a México como una república representativa, popular y federal después del primer imperio."
        },
        worldHistory: {
          title: "La Caída del Muro de Berlín",
          event: "El 9 de noviembre de 1989, miles de personas derribaron la barrera que dividió a Alemania por 28 años.",
          significance: "Simbolizó el fin de la Guerra Fría y el inicio de la reunificación alemana y europea."
        },
        recommendations: {
          book: {
            title: "Hábitos Atómicos",
            author: "James Clear",
            reason: "Fundamental para entender cómo pequeños cambios construyen grandes resultados."
          },
          series: {
            title: "The Bear",
            platform: "Disney+",
            reason: "Una clase magistral sobre liderazgo, presión y búsqueda de la excelencia."
          },
          movie: {
            title: "El Sistema Solar",
            director: "Documental",
            reason: "Visualmente impactante para entender nuestro lugar en el cosmos."
          },
          podcast: {
            title: "The Diary of a CEO",
            host: "Steven Bartlett",
            reason: "Entrevistas profundas sobre psicología humana y éxito en los negocios."
          }
        },
        businessAnecdote: {
          title: "El origen de Netflix",
          story: "Reed Hastings fundó Netflix después de que Blockbuster le cobrara $40 dólares de multa por devolver tarde la película 'Apollo 13'. Pensó que debía haber un modelo mejor basado en suscripción.",
          takeaway: "Los problemas personales suelen ser la mejor fuente de ideas de negocio disruptivas."
        },
        miniBiography: {
          person: "Leonardo da Vinci",
          era: "Renacimiento (1452-1519)",
          description: "Polímata florentino, epítome del hombre del Renacimiento.",
          achievement: "Maestro en pintura, anatomía, ingeniería y arquitectura; autor de la Mona Lisa."
        },
        classicBookSummary: {
          title: "Meditaciones",
          author: "Marco Aurelio",
          summary: "Una serie de reflexiones personales escritas por el emperador romano mientras estaba en campaña militar.",
          lesson: "La importancia de la autodisciplina, la humildad y vivir de acuerdo a la naturaleza."
        },
        randomKnowledge: "¿Sabías que la miel es el único alimento que no caduca? Se ha encontrado miel comestible en tumbas egipcias de hace 3,000 años.",
        randomKnowledge2: "¿Sabías que el chocolate fue utilizado como moneda en civilizaciones antiguas como la de los mayas y aztecas?",
      };
      setData(mockData);
      toast.error("No se pudo actualizar el aprendizaje del día. Usando datos de respaldo.");
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchDailyAprender();
  }, []);


  if (loading && !data) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-20 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-24">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5" /> 
            Actualizado para hoy
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            Aprende Hoy
          </h1>
          <p className="mt-2 text-muted-foreground">Tu dosis diaria de curiosidad y sabiduría 🐼✨</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/learnings-history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <BookOpenCheck className="w-4 h-4" />
            Mis Aprendizajes
          </Link>
          <button 
            onClick={() => fetchDailyAprender(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frase del Día */}
        <Card className="md:col-span-2 overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-none group">
          <CardContent className="pt-8 pb-8 px-8 text-center relative">
            <Quote className="absolute top-4 left-4 w-12 h-12 text-primary/10" />
            <button
              onClick={() => addToBitacora(`Frase de ${data?.quote.author}`, data!.quote.text, "mindset")}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary shadow-sm"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
            <blockquote className="relative">
              <p className="text-2xl md:text-3xl font-display font-bold italic leading-tight text-foreground/90 mb-4">
                "{data?.quote.text}"
              </p>
              <footer className="text-primary font-medium">— {data?.quote.author}</footer>
            </blockquote>
          </CardContent>
        </Card>


        {/* Hechos Históricos */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col group">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <History className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Un día como hoy</span>
              </div>
              <CardTitle className="text-xl font-display font-bold text-primary">{data?.historicalFact.year}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Un día como hoy (${data?.historicalFact.year})`, data!.historicalFact.event, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-foreground/80 leading-relaxed">{data?.historicalFact.event}</p>
          </CardContent>
        </Card>


        {/* Historia de México */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-600 flex flex-col group">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Flag className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Historia de México</span>
              </div>
              <CardTitle className="text-xl font-display font-bold">{data?.mexicoHistory.year}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Historia de México: ${data?.mexicoHistory.event}`, data!.mexicoHistory.context, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="font-bold text-sm mb-1">{data?.mexicoHistory.event}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{data?.mexicoHistory.context}</p>
          </CardContent>
        </Card>


        {/* Historia Universal */}
        <Card className="md:col-span-2 border-border bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Globe className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Historia Universal</span>
              </div>
              <CardTitle className="text-xl font-display font-bold">{data?.worldHistory.title}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Historia Universal: ${data?.worldHistory.title}`, `${data?.worldHistory.event}\n\nSignificado: ${data?.worldHistory.significance}`, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-foreground/80 leading-relaxed mb-3">{data?.worldHistory.event}</p>
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Significado:</p>
              <p className="text-xs text-muted-foreground italic">{data?.worldHistory.significance}</p>
            </div>
          </CardContent>
        </Card>

        {/* Mini Biografía */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col border-r-4 border-r-indigo-500">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-indigo-500 mb-1">
                <Star className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Biografía</span>
              </div>
              <CardTitle className="text-xl font-display font-bold">{data?.miniBiography.person}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Biografía: ${data?.miniBiography.person}`, `${data?.miniBiography.description}\nLogro: ${data?.miniBiography.achievement}`, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-xs font-medium text-indigo-600 mb-1 uppercase">{data?.miniBiography.era}</p>
            <p className="text-foreground/80 leading-relaxed mb-3">{data?.miniBiography.description}</p>
            <div className="p-2 rounded bg-indigo-50 border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 uppercase">Legado:</p>
              <p className="text-xs text-muted-foreground">{data?.miniBiography.achievement}</p>
            </div>
          </CardContent>
        </Card>

        {/* Libro Clásico */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col border-b-4 border-b-amber-700">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Libro Clásico</span>
              </div>
              <CardTitle className="text-xl font-display font-bold">{data?.classicBookSummary.title}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Resumen: ${data?.classicBookSummary.title}`, `${data?.classicBookSummary.summary}\nLección: ${data?.classicBookSummary.lesson}`, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-xs font-medium text-amber-800 mb-1 italic">de {data?.classicBookSummary.author}</p>
            <p className="text-foreground/80 leading-relaxed mb-3">{data?.classicBookSummary.summary}</p>
            <div className="p-2 rounded bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-800 uppercase">Lección:</p>
              <p className="text-xs text-muted-foreground">{data?.classicBookSummary.lesson}</p>
            </div>
          </CardContent>
        </Card>

        {/* Conocimiento Random 1 */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col">

          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Sabías que...</span>
            </div>
            <button
              onClick={() => addToBitacora("Curiosidad: Sabías que...", data!.randomKnowledge, "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-foreground/80 leading-relaxed">{data?.randomKnowledge}</p>
          </CardContent>
        </Card>

        {/* Conocimiento Random 2 */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col border-t-2 border-t-amber-100">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Dato Curioso</span>
            </div>
            <button
              onClick={() => addToBitacora("Curiosidad: Dato Curioso", data?.randomKnowledge2 || "¿Sabías que el chocolate fue utilizado como moneda en civilizaciones antiguas como la de los mayas y aztecas?", "other")}
              className="p-2 rounded-lg bg-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-foreground/80 leading-relaxed italic">{data?.randomKnowledge2 || "¿Sabías que el chocolate fue utilizado como moneda en civilizaciones antiguas como la de los mayas y aztecas?"}</p>
          </CardContent>
        </Card>




        {/* Recomendaciones */}
        <div className="md:col-span-2 mt-4">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Curaduría Panda OS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RecommendationItem 
              icon={<BookOpen className="w-4 h-4" />} 
              label="Libro" 
              title={data?.recommendations.book.title} 
              subtitle={data?.recommendations.book.author}
              reason={data?.recommendations.book.reason}
              color="text-blue-500"
              onWishlist={() => addToWishlist(data!.recommendations.book.title, data!.recommendations.book.reason, "book")}
              onBitacora={() => addToBitacora(`Lectura: ${data!.recommendations.book.title}`, data!.recommendations.book.reason, "other")}
            />
            <RecommendationItem 
              icon={<Film className="w-4 h-4" />} 
              label="Serie" 
              title={data?.recommendations.series.title} 
              subtitle={data?.recommendations.series.platform}
              reason={data?.recommendations.series.reason}
              color="text-purple-500"
              onWishlist={() => addToWishlist(data!.recommendations.series.title, data!.recommendations.series.reason, "series")}
              onBitacora={() => addToBitacora(`Serie: ${data!.recommendations.series.title}`, data!.recommendations.series.reason, "creative")}
            />
            <RecommendationItem 
              icon={<Film className="w-4 h-4" />} 
              label="Película" 
              title={data?.recommendations.movie.title} 
              subtitle={data?.recommendations.movie.director}
              reason={data?.recommendations.movie.reason}
              color="text-red-500"
              onWishlist={() => addToWishlist(data!.recommendations.movie.title, data!.recommendations.movie.reason, "movie")}
              onBitacora={() => addToBitacora(`Película: ${data!.recommendations.movie.title}`, data!.recommendations.movie.reason, "creative")}
            />
            <RecommendationItem 
              icon={<Mic className="w-4 h-4" />} 
              label="Podcast" 
              title={data?.recommendations.podcast.title} 
              subtitle={data?.recommendations.podcast.host}
              reason={data?.recommendations.podcast.reason}
              color="text-green-500"
              onWishlist={() => addToWishlist(data!.recommendations.podcast.title, data!.recommendations.podcast.reason, "podcast")}
              onBitacora={() => addToBitacora(`Podcast: ${data!.recommendations.podcast.title}`, data!.recommendations.podcast.reason, "other")}
            />

          </div>
        </div>

        <Card className="md:col-span-2 mt-4 overflow-hidden border-primary/20 bg-primary/5 group">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Briefcase className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Anécdota de Negocios</span>
              </div>
              <CardTitle className="text-2xl font-display font-bold">{data?.businessAnecdote.title}</CardTitle>
            </div>
            <button
              onClick={() => addToBitacora(`Anécdota Negocios: ${data?.businessAnecdote.title}`, `${data?.businessAnecdote.story}\n\nAprendizaje: ${data?.businessAnecdote.takeaway}`, "business")}
              className="p-2 rounded-lg bg-white/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary shadow-sm"
              title="Guardar en Bitácora"
            >
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-foreground/80 leading-relaxed italic">
              "{data?.businessAnecdote.story}"
            </p>
            <div className="p-4 rounded-xl bg-background border border-border">
              <p className="text-sm font-bold flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                Aprendizaje clave:
              </p>
              <p className="text-sm text-muted-foreground mt-1">{data?.businessAnecdote.takeaway}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 p-8 rounded-3xl border border-dashed border-border text-center">
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Esta sección se actualiza diariamente con contenido seleccionado para expandir tu mente y darte temas de conversación interesantes. 🐼📚✨
        </p>
      </footer>
    </div>
  );
}

function RecommendationItem({ 
  icon, 
  label, 
  title, 
  subtitle, 
  reason,
  color,
  onWishlist,
  onBitacora
}: { 
  icon: React.ReactNode; 
  label: string; 
  title?: string; 
  subtitle?: string;
  reason?: string;
  color: string;
  onWishlist: () => void;
  onBitacora: () => void;
}) {
  return (
    <Card className="border-border bg-card hover:bg-secondary/20 transition-colors flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <h4 className="font-bold text-sm leading-tight mb-1">{title}</h4>
        <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>
        <div className="text-[10px] leading-relaxed text-foreground/70 border-t border-border pt-2">
          {reason}
        </div>
      </CardContent>
      <div className="px-4 pb-4 flex gap-2">
        <button 
          onClick={onWishlist}
          title="Añadir a Wishlist"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary text-[10px] font-bold transition-colors"
        >
          <Star className="w-3 h-3" /> Wishlist
        </button>
        <button 
          onClick={onBitacora}
          title="Guardar en Bitácora"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary text-[10px] font-bold transition-colors"
        >
          <Plus className="w-3 h-3" /> Bitácora
        </button>
      </div>
    </Card>
  );
}
