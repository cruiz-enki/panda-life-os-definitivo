/**
 * **Feature** — Componentes (parts) del módulo **Asistente de decisiones**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

import { 
  Scale, 
  HelpCircle, 
  Shuffle, 
  Brain, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Sparkles, 
  Info,
  ChevronRight,
  ChevronLeft,
  History,
  Calendar,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Method = "random" | "ai" | "pros_cons";

interface Option {
  id: string;
  content: string;
  pros: string[];
  cons: string[];
}

interface SavedDecision {
  id: string;
  question: string;
  method: Method;
  result: string;
  created_at: string;
  options: Option[];
}

export function DecisionsPage() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState<Method>("random");
  const [options, setOptions] = useState<Option[]>([
    { id: "1", content: "", pros: [], cons: [] },
    { id: "2", content: "", pros: [], cons: [] }
  ]);
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SavedDecision[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("decisions")
        .select(`
          *,
          decision_options (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const mapped: SavedDecision[] = (data || []).map(d => ({
        id: d.id,
        question: d.question,
        method: d.method as Method,
        result: d.result || "Sin resultado",
        created_at: d.created_at,
        options: d.decision_options.map((o: any) => ({
          id: o.id,
          content: o.content,
          pros: o.pros || [],
          cons: o.cons || []
        }))
      }));
      setHistory(mapped);
    } catch (e) {
      console.error("Error loading history:", e);
    }
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.error("Máximo 6 opciones");
      return;
    }
    setOptions([...options, { id: Math.random().toString(36).substr(2, 9), content: "", pros: [], cons: [] }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("Mínimo 2 opciones");
      return;
    }
    setOptions(options.filter(o => o.id !== id));
  };

  const updateOptionContent = (id: string, content: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, content } : o));
  };

  const addPro = (optionId: string, text: string) => {
    if (!text.trim()) return;
    setOptions(options.map(o => o.id === optionId ? { ...o, pros: [...o.pros, text] } : o));
  };

  const addCon = (optionId: string, text: string) => {
    if (!text.trim()) return;
    setOptions(options.map(o => o.id === optionId ? { ...o, cons: [...o.cons, text] } : o));
  };

  const removePro = (optionId: string, index: number) => {
    setOptions(options.map(o => o.id === optionId ? { ...o, pros: o.pros.filter((_, i) => i !== index) } : o));
  };

  const removeCon = (optionId: string, index: number) => {
    setOptions(options.map(o => o.id === optionId ? { ...o, cons: o.cons.filter((_, i) => i !== index) } : o));
  };

  const handleRandom = () => {
    const validOptions = options.filter(o => o.content.trim());
    if (validOptions.length < 2) {
      toast.error("Ingresa al menos 2 opciones válidas");
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Configurar la rotación de la ruleta (mínimo 5 vueltas + ángulo aleatorio)
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (360 * 5) + extraDegrees;
    setRotation(totalRotation);

    // Calcular el resultado basándonos en dónde se detendrá (la flecha está arriba a 0/360 deg)
    const sliceAngle = 360 / validOptions.length;
    // El indicador está en el tope (360/0 grados). 
    // Necesitamos saber qué porción de la ruleta queda arriba tras la rotación extra.
    const normalizedExtra = extraDegrees % 360;
    // Sin el offset de sliceAngle/2 porque visualmente la primera porción empieza en 0
    const resultIndex = Math.floor(((360 - normalizedExtra) % 360) / sliceAngle);

    setTimeout(() => {
      const selectedOption = validOptions[resultIndex % validOptions.length];
      setResult(selectedOption.content);
      setIsSpinning(false);
      saveDecision(selectedOption.content);
      toast.success("¡La ruleta ha hablado!");
    }, 4000); // Duración de la animación CSS
  };

  const handleAI = async () => {
    const validOptions = options.filter(o => o.content.trim());
    if (validOptions.length < 2) {
      toast.error("Ingresa al menos 2 opciones válidas");
      return;
    }
    if (!question.trim()) {
      toast.error("Ingresa la pregunta o dilema");
      return;
    }

    setLoading(true);
    try {
      // Usar la edge function ai-chat pero con un system prompt específico
      const prompt = `Actúa como un asesor de toma de decisiones. Dilema: "${question}". Opciones: ${validOptions.map(o => o.content).join(", ")}. Analiza las opciones brevemente y recomienda la mejor basándote en lógica y bienestar general. Responde de forma concisa.`;
      
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: prompt }],
          userId: user?.id 
        }),
      });

      if (!resp.ok) throw new Error("Error con la IA");

      // El chat devuelve un stream de Server-Sent Events
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const json = JSON.parse(data);
                const content = json.choices[0]?.delta?.content || "";
                fullText += content;
              } catch (e) {}
            }
          }
        }
      }

      setAiAnalysis(fullText);
      saveDecision("Recomendación IA", fullText);
    } catch (e) {
      toast.error("No se pudo obtener el análisis de IA");
    } finally {
      setLoading(false);
    }
  };

  const saveDecision = async (decisionResult: string, analysis?: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("decisions").insert({
        user_id: user.id,
        question: question || "Sin pregunta",
        method,
        result: decisionResult
      }).select().single();

      if (error) throw error;

      const optionsToSave = options.filter(o => o.content.trim()).map(o => ({
        decision_id: data.id,
        content: o.content,
        pros: o.pros,
        cons: o.cons,
        ai_analysis: analysis
      }));

      await supabase.from("decision_options").insert(optionsToSave);
      loadHistory(); // Recargar historial
    } catch (e) {
      console.error("Error saving decision:", e);
    }
  };

  if (showHistory) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-4xl mx-auto min-h-screen">
        <header className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Historial de Decisiones</h1>
            <p className="text-muted-foreground text-sm">Tus procesos y resultados guardados.</p>
          </div>
        </header>

        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Aún no has guardado ninguna decisión.</p>
            </div>
          ) : (
            history.map((dec) => (
              <Card key={dec.id} className="border-border/50 bg-card overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                      {dec.method === "random" ? "Azar" : dec.method === "ai" ? "IA" : "Pros vs Contras"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(dec.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">{dec.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs uppercase font-bold tracking-widest text-primary mb-1">Resultado:</p>
                    <p className="font-display font-bold text-xl">"{dec.result}"</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Opciones analizadas:</p>
                    <div className="grid gap-2">
                      {dec.options.map((opt) => (
                        <div key={opt.id} className="text-sm p-3 bg-secondary/20 rounded-xl border border-border/30">
                          <div className="font-medium">{opt.content}</div>
                          {(opt.pros.length > 0 || opt.cons.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {opt.pros.map((p, i) => <Badge key={i} variant="outline" className="text-[9px] bg-green-500/5 text-green-600 border-green-500/20">{p}</Badge>)}
                              {opt.cons.map((c, i) => <Badge key={i} variant="outline" className="text-[9px] bg-destructive/5 text-destructive border-destructive/20">{c}</Badge>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">Tomador de Decisiones</h1>
          <p className="text-muted-foreground text-sm">IA, aleatoriedad o lógica para tus dilemas.</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(true)} className="rounded-xl gap-2 border-primary/20">
          <History className="w-4 h-4" /> <span className="hidden sm:inline">Historial</span>
        </Button>
      </header>

      <Card className="mb-8 border-primary/20 bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            ¿Qué tienes en mente?
          </CardTitle>
          <CardDescription>Describe brevemente el dilema para contextualizar a la IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input 
            placeholder="Ej: ¿Debería mudarme de ciudad este año?" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="text-lg py-6 rounded-2xl border-primary/20 focus:ring-primary/20"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="random" value={method} onValueChange={(v) => setMethod(v as Method)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-2xl h-14">
          <TabsTrigger value="random" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2">
            <Shuffle className="w-4 h-4" /> <span className="hidden sm:inline">Aleatorio</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2">
            <Brain className="w-4 h-4" /> <span className="hidden sm:inline">IA Coach</span>
          </TabsTrigger>
          <TabsTrigger value="pros_cons" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2">
            <Scale className="w-4 h-4" /> <span className="hidden sm:inline">Pros vs Contras</span>
          </TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl">Opciones</h2>
            <Button variant="outline" size="sm" onClick={addOption} className="rounded-xl border-primary/30 text-primary">
              <Plus className="w-4 h-4 mr-1" /> Añadir opción
            </Button>
          </div>

          <div className="grid gap-4">
            {options.map((option, idx) => (
              <Card key={option.id} className="overflow-hidden border-border/50 bg-secondary/10 group">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 border-primary/30 text-primary font-bold">
                      {idx + 1}
                    </Badge>
                    <Input 
                      placeholder={`Opción ${idx + 1}...`}
                      value={option.content}
                      onChange={(e) => updateOptionContent(option.id, e.target.value)}
                      className="border-none bg-transparent text-base font-medium focus-visible:ring-0 px-0"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {method === "pros_cons" && (
                    <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-green-500">Pros</p>
                        <div className="flex flex-wrap gap-2">
                          {option.pros.map((pro, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none pl-2 pr-1 py-1 rounded-lg">
                              {pro}
                              <button onClick={() => removePro(option.id, i)} className="ml-1 p-0.5 rounded-full hover:bg-green-500/20">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          <Input 
                            placeholder="+ Añadir pro..."
                            className="h-8 text-xs border-dashed border-primary/20 rounded-lg bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addPro(option.id, e.currentTarget.value);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-destructive">Contras</p>
                        <div className="flex flex-wrap gap-2">
                          {option.cons.map((con, i) => (
                            <Badge key={i} variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none pl-2 pr-1 py-1 rounded-lg">
                              {con}
                              <button onClick={() => removeCon(option.id, i)} className="ml-1 p-0.5 rounded-full hover:bg-destructive/20">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          <Input 
                            placeholder="+ Añadir contra..."
                            className="h-8 text-xs border-dashed border-primary/20 rounded-lg bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCon(option.id, e.currentTarget.value);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col items-center">
          {method === "random" && (
            <div className="w-full flex flex-col items-center gap-10">
              {/* Roulette Visual */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                {/* Fixed Indicator Arrow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary drop-shadow-lg" />
                </div>
                
                {/* The Wheel */}
                <div 
                  className="w-full h-full rounded-full border-8 border-secondary shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {options.filter(o => o.content.trim()).map((opt, i, arr) => {
                    const angle = 360 / arr.length;
                    const colors = [
                      "bg-primary", "bg-purple-600", "bg-blue-600", 
                      "bg-emerald-600", "bg-orange-600", "bg-pink-600"
                    ];
                    // El offset de -angle/2 centra visualmente la primera opción bajo la flecha cuando rotation=0
                    return (
                      <div 
                        key={opt.id}
                        className={`absolute top-0 left-1/2 -ml-[50%] w-full h-full origin-center flex items-start justify-center pt-10 ${colors[i % colors.length]} border-l border-white/10`}
                        style={{ 
                          clipPath: arr.length > 2 
                            ? `polygon(50% 50%, ${50 + 50 * Math.tan((angle/2) * Math.PI/180)}% 0%, ${50 - 50 * Math.tan((angle/2) * Math.PI/180)}% 0%)`
                            : arr.length === 2 && i === 0 ? "polygon(0 0, 100% 0, 100% 50%, 0 50%)" : "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                          transform: `rotate(${i * angle}deg)`,
                        }}
                      >
                        <div 
                          className="text-white font-bold text-xs sm:text-sm drop-shadow-md text-center px-6 leading-tight max-w-[140px]"
                          style={{ transform: `rotate(0deg)` }}
                        >
                          {opt.content}
                        </div>
                      </div>
                    );
                  })}
                  {/* Center Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/2 w-10 h-10 rounded-full bg-white shadow-inner z-10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-secondary/20" />
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleRandom} 
                disabled={isSpinning}
                className="rounded-2xl h-16 px-10 text-lg font-bold bg-gradient-primary shadow-glow hover:scale-105 transition-all w-full sm:w-auto"
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-6 h-6 mr-3 animate-spin" /> ¡Mucha suerte!
                  </>
                ) : (
                  <>
                    <Shuffle className="w-6 h-6 mr-3" /> Girar ruleta
                  </>
                )}
              </Button>
            </div>
          )}

          {method === "ai" && (
            <Button 
              size="lg" 
              onClick={handleAI} 
              disabled={loading}
              className="rounded-2xl h-16 px-10 text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg hover:scale-105 transition-all border-none"
            >
              {loading ? (
                <>
                  <Sparkles className="w-6 h-6 mr-3 animate-pulse" /> Consultando a Panda IA...
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6 mr-3" /> Obtener recomendación IA
                </>
              )}
            </Button>
          )}

          {method === "pros_cons" && (
            <div className="text-center space-y-4 max-w-md">
              <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 p-4 rounded-2xl text-sm">
                <Info className="w-5 h-5 shrink-0 text-primary" />
                <span>Analiza visualmente cuál opción tiene más beneficios y menos obstáculos.</span>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  // Lógica simple: opción con mejor balance neto
                  const sorted = [...options].sort((a, b) => (b.pros.length - b.cons.length) - (a.pros.length - a.cons.length));
                  setResult(sorted[0].content);
                  saveDecision(sorted[0].content);
                  toast.success("Análisis completado");
                }}
                className="rounded-2xl h-16 w-full text-lg font-bold border-primary text-primary hover:bg-primary/5"
              >
                <Scale className="w-6 h-6 mr-3" /> Calcular balance lógico
              </Button>
            </div>
          )}
        </div>
      </Tabs>

      {/* Result Display */}
      {(result || aiAnalysis) && (
        <Card className="mt-12 border-primary bg-primary/5 shadow-glow animate-in zoom-in duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 text-primary/20 pointer-events-none">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Resultado Sugerido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <div className="text-3xl font-display font-bold text-center py-6 text-primary">
                "{result}"
              </div>
            )}
            {aiAnalysis && (
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-2xl border border-primary/20 text-sm leading-relaxed prose dark:prose-invert max-w-none">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Análisis de Panda IA:
                </h4>
                {aiAnalysis}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-primary/10 py-4 flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setResult(null); setAiAnalysis(null); }} className="rounded-xl">
              Empezar de nuevo
            </Button>
            <Button size="sm" onClick={() => {
              toast.success("Decisión guardada en tu bitácora");
              // Opcionalmente redirigir
            }} className="rounded-xl bg-primary">
              Aceptar esta decisión
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
