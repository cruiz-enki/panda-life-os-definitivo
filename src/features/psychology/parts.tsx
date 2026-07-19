/**
 * **Feature** — Componentes (parts) del módulo **Psicología**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { useMemo, useState } from "react";
import { Brain, Plus, Calendar, CheckSquare, TrendingUp, Lightbulb, Lock, Trash2, Sparkles, ArrowRight, Heart, Repeat, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { usePsych } from "@/hooks/use-psych";
import { useMood, type MoodLog } from "@/hooks/use-mood";
import { EMOTIONS, type PsychSession } from "@/lib/psych-types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { HealthHeader } from "@/components/health/HealthHeader";

const todayISO = () => todayCDMX();

export function PsychologyPage() {
  const psych = usePsych();
  const mood = useMood();
  const { user } = useAuth();
  const [tab, setTab] = useState("panel");

  // Últimas 24 h de mood_logs con check-in emocional
  const todayMood = useMemo(() => {
    const today = todayISO();
    return mood.logs.find((l) => l.logged_at.slice(0, 10) === today && (l.anxiety != null || l.stress != null));
  }, [mood.logs]);
  const lastSession = psych.sessions[0];
  const pendingTasks = psych.tasks.filter((t) => t.status !== "completed");
  const nextSession = useMemo(() => {
    const future = psych.sessions
      .map((s) => s.next_session)
      .filter((d): d is string => !!d && d >= todayISO())
      .sort();
    return future[0];
  }, [psych.sessions]);

  // Tendencia 7d desde mood_logs (promedio diario de ansiedad/estrés)
  const trend7 = useMemo(() => {
    const days: { day: string; ansiedad: number; estres: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const entries = mood.logs.filter((l) => l.logged_at.slice(0, 10) === iso);
      const anx = entries.filter((l) => l.anxiety != null);
      const str = entries.filter((l) => l.stress != null);
      days.push({
        day: d.toLocaleDateString("es", { weekday: "short" }),
        ansiedad: anx.length ? anx.reduce((s, l) => s + (l.anxiety ?? 0), 0) / anx.length : 0,
        estres: str.length ? str.reduce((s, l) => s + (l.stress ?? 0), 0) / str.length : 0,
      });
    }
    return days;
  }, [mood.logs]);

  const dailyMessage = useMemo(() => {
    if (!todayMood) return "Registra tu check-in emocional en Mood (⚡ ansiedad, estrés, detonante). 1 minuto puede cambiar tu enfoque.";
    if ((todayMood.anxiety ?? 0) >= 4) return "Tu ansiedad está alta hoy. Respira 4-7-8 tres veces y aleja la pantalla 5 minutos.";
    if ((todayMood.stress ?? 0) >= 4) return "Estrés elevado. Identifica una sola tarea prioritaria y posterga el resto sin culpa.";
    if (pendingTasks.length > 3) return `Tienes ${pendingTasks.length} acuerdos terapéuticos pendientes. Elige uno pequeño para hoy.`;
    if (lastSession && Date.now() - new Date(lastSession.date).getTime() > 14 * 86400000) return "Hace más de 2 semanas de tu última sesión. ¿Agendamos la próxima?";
    return "Vas bien. Mantén tu práctica: presencia, respiración y autocompasión.";
  }, [todayMood, pendingTasks.length, lastSession]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Psicología</h1>
            <p className="text-sm text-muted-foreground">Sesiones, seguimiento y aplicación diaria</p>
          </div>
        </div>
      </header>

      <HealthHeader />

      {/* Mensaje diario */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Recomendación de hoy</div>
            <p className="text-sm leading-relaxed">{dailyMessage}</p>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none sm:mx-0 sm:px-0 sm:overflow-visible">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-3">
            <TabsTrigger value="panel">Panel</TabsTrigger>
            <TabsTrigger value="sessions">Sesiones</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>


        {/* PANEL */}
        <TabsContent value="panel" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Última sesión</div>
              {lastSession ? (
                <>
                  <div className="font-semibold text-sm truncate">{lastSession.main_topic || "Sin tema"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(lastSession.date).toLocaleDateString("es")}</div>
                  {lastSession.insight && <p className="text-xs mt-2 line-clamp-3 italic">"{lastSession.insight}"</p>}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Aún no hay sesiones registradas.</div>
              )}
            </Card>

            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Tareas pendientes</div>
              <div className="font-display text-3xl font-bold">{pendingTasks.length}</div>
              {pendingTasks[0] && <div className="text-xs text-muted-foreground truncate mt-1">→ {pendingTasks[0].title}</div>}
            </Card>

            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Próxima sesión</div>
              {nextSession ? (
                <>
                  <div className="font-semibold">{new Date(nextSession).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}</div>
                  <div className="text-xs text-muted-foreground">en {Math.ceil((new Date(nextSession).getTime() - Date.now()) / 86400000)} días</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Sin agendar</div>
              )}
            </Card>
          </div>

          <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm">Check-in emocional</div>
                {todayMood ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Hoy registraste ansiedad <b>{todayMood.anxiety ?? "—"}/5</b> · estrés <b>{todayMood.stress ?? "—"}/5</b>
                    {todayMood.trigger && <> · detonante: <b className="capitalize">{todayMood.trigger}</b></>}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Aún no registras tu ansiedad y estrés de hoy.</p>
                )}
              </div>
              <Link to="/mood"><Button size="sm" variant="outline">Ir a Mood <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Tendencia semanal</div>
              <div className="text-[10px] text-muted-foreground">desde Mood</div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend7}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="ansiedad" stroke="oklch(0.7 0.18 25)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="estres" stroke="oklch(0.7 0.18 280)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Acuerdos pendientes</div>
            </div>
            {pendingTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Sin tareas pendientes 🌿</div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => psych.toggleTask(t.id)}
                      className="w-5 h-5 rounded border-2 border-muted-foreground hover:border-primary transition-colors shrink-0"
                      aria-label="Completar"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      {t.due_date && <div className="text-xs text-muted-foreground">Para: {new Date(t.due_date).toLocaleDateString("es")}</div>}
                    </div>
                    {t.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="space-y-4 mt-4">
          <SessionForm onSave={psych.createSession} />
          <div className="space-y-3">
            {psych.sessions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aún no hay sesiones registradas.</p>
              </Card>
            ) : (
              psych.sessions.map((s) => (
                <SessionCard key={s.id} session={s} onDelete={psych.deleteSession} onConvertTask={psych.createTask} userId={user?.id ?? ""} />
              ))
            )}
          </div>
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <InsightsView moodLogs={mood.logs} sessions={psych.sessions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Check-in emocional se registra ahora en /mood (mood_logs con anxiety/stress/trigger/dominant_thought).

function ScaleField({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-bold">{value}/5</span>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-9 rounded-md border text-xs font-semibold transition-all ${value === n ? "text-white border-transparent" : "border-border hover:border-foreground/30"}`}
            style={value === n ? { background: color } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}




// ============== SESSION FORM ==============
function SessionForm({ onSave }: { onSave: (input: Omit<PsychSession, "id" | "created_at" | "updated_at">) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [psychologist, setPsychologist] = useState("");
  const [mainTopic, setMainTopic] = useState("");
  const [subtopicsRaw, setSubtopicsRaw] = useState("");
  const [insight, setInsight] = useState("");
  const [agreements, setAgreements] = useState("");
  const [impact, setImpact] = useState(3);
  const [nextSession, setNextSession] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setDate(todayISO()); setPsychologist(""); setMainTopic(""); setSubtopicsRaw("");
    setInsight(""); setAgreements(""); setImpact(3); setNextSession(""); setIsPrivate(false); setNotes("");
  };

  const submit = async () => {
    if (!mainTopic.trim()) return toast.error("Agrega un tema principal");
    const err = await onSave({
      date, psychologist, main_topic: mainTopic,
      subtopics: subtopicsRaw.split(",").map((s) => s.trim()).filter(Boolean),
      insight, agreements, impact,
      next_session: nextSession || null,
      is_private: isPrivate, notes,
    });
    if (err) toast.error("Error al guardar");
    else { toast.success("Sesión registrada"); reset(); setOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg"><Plus className="w-4 h-4 mr-2" /> Registrar sesión</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva sesión</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Fecha</Label>
              <DatePicker date={date ? parseISO(date) : undefined} setDate={(d) => setDate(d ? d.toISOString().split('T')[0] : "")} />
            </div>
            <div>
              <Label className="text-xs">Psicóloga</Label>
              <Input value={psychologist} onChange={(e) => setPsychologist(e.target.value)} placeholder="Nombre" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Tema principal *</Label>
            <Input value={mainTopic} onChange={(e) => setMainTopic(e.target.value)} placeholder="Ej. Manejo de ansiedad" />
          </div>
          <div>
            <Label className="text-xs">Subtemas (separados por coma)</Label>
            <Input value={subtopicsRaw} onChange={(e) => setSubtopicsRaw(e.target.value)} placeholder="autoexigencia, sueño" />
          </div>
          <div>
            <Label className="text-xs">Insight clave</Label>
            <Textarea value={insight} onChange={(e) => setInsight(e.target.value)} rows={2} placeholder="Lo que entendí en esta sesión…" />
          </div>
          <div>
            <Label className="text-xs">Tareas / acuerdos</Label>
            <Textarea value={agreements} onChange={(e) => setAgreements(e.target.value)} rows={2} placeholder="Lo que voy a practicar…" />
          </div>
          <ScaleField label="Nivel de impacto" value={impact} onChange={setImpact} color="oklch(0.7 0.18 160)" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Próxima sesión</Label>
              <DatePicker date={nextSession ? parseISO(nextSession) : undefined} setDate={(d) => setNextSession(d ? d.toISOString().split('T')[0] : "")} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer pb-2">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                <Lock className="w-3 h-3" /> Privado
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notas adicionales</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== SESSION CARD ==============
function SessionCard({
  session, onDelete, onConvertTask, userId,
}: {
  session: PsychSession;
  onDelete: (id: string) => Promise<unknown>;
  onConvertTask: (input: { session_id: string | null; title: string; description: string; status: "pending"; due_date: string | null; completed_at: null; is_private: boolean }) => Promise<unknown>;
  userId: string;
}) {
  const [showConvert, setShowConvert] = useState(false);
  const impactColor = session.impact >= 4 ? "oklch(0.7 0.18 160)" : session.impact >= 3 ? "oklch(0.75 0.15 80)" : "oklch(0.65 0.05 250)";

  const convertToTask = async () => {
    if (!session.insight.trim()) return toast.error("No hay insight para convertir");
    const err = await onConvertTask({
      session_id: session.id,
      title: session.insight.slice(0, 80),
      description: `Desde sesión del ${new Date(session.date).toLocaleDateString("es")}`,
      status: "pending",
      due_date: null,
      completed_at: null,
      is_private: session.is_private,
    });
    if (!err) toast.success("Convertido en acuerdo");
  };

  const convertToHabit = async () => {
    if (!session.insight.trim() || !userId) return;
    const { error } = await supabase.from("habits").insert({
      user_id: userId,
      name: session.insight.slice(0, 60),
      emoji: "🧠",
      points: 10,
    });
    if (error) toast.error("Error al crear hábito");
    else toast.success("Hábito creado desde insight");
  };

  const convertToNote = async () => {
    if (!session.insight.trim() || !userId) return;
    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      title: `Insight: ${session.main_topic}`,
      content: session.insight,
      type: "learning",
      category: "personal",
      importance: "important",
      tags: ["psicologia", ...session.subtopics],
    });
    if (error) toast.error("Error al guardar nota");
    else toast.success("Guardado como concepto");
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{session.main_topic}</h3>
            {session.is_private && <Lock className="w-3 h-3 text-muted-foreground" />}
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: impactColor, color: impactColor }}>
              Impacto {session.impact}/5
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {new Date(session.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
            {session.psychologist && <span>· {session.psychologist}</span>}
          </div>
        </div>
        <button onClick={() => onDelete(session.id)} className="text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {session.subtopics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {session.subtopics.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
        </div>
      )}

      {session.insight && (
        <div className="bg-muted/50 rounded-lg p-3 my-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            <Lightbulb className="w-3 h-3" /> Insight
          </div>
          <p className="text-sm italic">"{session.insight}"</p>
        </div>
      )}

      {session.agreements && (
        <div className="text-sm mb-2">
          <span className="text-xs text-muted-foreground">Acuerdos: </span>{session.agreements}
        </div>
      )}

      {session.next_session && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ArrowRight className="w-3 h-3" /> Próxima: {new Date(session.next_session).toLocaleDateString("es")}
        </div>
      )}

      {session.insight && (
        <div className="mt-3 pt-3 border-t border-border">
          <button onClick={() => setShowConvert(!showConvert)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Convertir insight en…
          </button>
          {showConvert && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={convertToTask}><CheckSquare className="w-3 h-3 mr-1" /> Tarea</Button>
              <Button size="sm" variant="outline" onClick={convertToHabit}><Repeat className="w-3 h-3 mr-1" /> Hábito</Button>
              <Button size="sm" variant="outline" onClick={convertToNote}><NotebookPen className="w-3 h-3 mr-1" /> Concepto</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============== INSIGHTS ==============
function InsightsView({ moodLogs, sessions }: { moodLogs: MoodLog[]; sessions: PsychSession[] }) {
  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return moodLogs.filter((l) => new Date(l.logged_at).getTime() >= cutoff);
  }, [moodLogs]);

  const anxEntries = last30.filter((l) => l.anxiety != null);
  const strEntries = last30.filter((l) => l.stress != null);
  const avgAnxiety = anxEntries.length ? (anxEntries.reduce((s, l) => s + (l.anxiety ?? 0), 0) / anxEntries.length).toFixed(1) : "—";
  const avgStress = strEntries.length ? (strEntries.reduce((s, l) => s + (l.stress ?? 0), 0) / strEntries.length).toFixed(1) : "—";

  // Top detonantes
  const triggerCount = useMemo(() => {
    const map: Record<string, { count: number; avgAnx: number }> = {};
    last30.forEach((l) => {
      if (!l.trigger) return;
      const k = l.trigger.toLowerCase();
      if (!map[k]) map[k] = { count: 0, avgAnx: 0 };
      map[k].count++;
      map[k].avgAnx += l.anxiety ?? 0;
    });
    return Object.entries(map)
      .map(([k, v]) => ({ trigger: k, count: v.count, avgAnx: +(v.avgAnx / v.count).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [last30]);

  // Top emociones desde mood.emoji/tags
  const emotionCount = useMemo(() => {
    const map: Record<string, number> = {};
    last30.forEach((l) => {
      if (l.emoji) map[l.emoji] = (map[l.emoji] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [last30]);

  const highAnxDays = anxEntries.filter((l) => (l.anxiety ?? 0) >= 4).length;


  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Ansiedad promedio (30d)</div>
          <div className="font-display text-3xl font-bold mt-1">{avgAnxiety}<span className="text-sm text-muted-foreground">/5</span></div>
          <div className="text-xs text-muted-foreground mt-1">{highAnxDays} días con ansiedad alta (≥4)</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Estrés promedio (30d)</div>
          <div className="font-display text-3xl font-bold mt-1">{avgStress}<span className="text-sm text-muted-foreground">/5</span></div>
          <div className="text-xs text-muted-foreground mt-1">{last30.length} check-ins registrados</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="font-semibold text-sm mb-3">Top detonantes (30d)</div>
        {triggerCount.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">Sin detonantes registrados</div>
        ) : (
          <div className="space-y-2">
            {triggerCount.map((t) => (
              <div key={t.trigger} className="flex items-center gap-3 text-sm">
                <span className="capitalize flex-1">{t.trigger}</span>
                <Badge variant="secondary">{t.count}×</Badge>
                <span className="text-xs text-muted-foreground w-20 text-right">ansiedad {t.avgAnx}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="font-semibold text-sm mb-3">Emociones dominantes (30d)</div>
        {emotionCount.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">Sin datos</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {emotionCount.map(([k, v]) => {
              const e = EMOTIONS.find((x) => x.value === k);
              return (
                <div key={k} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                  <span>{e?.emoji}</span>
                  <span>{e?.label ?? k}</span>
                  <Badge variant="outline" className="text-[10px]">{v}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-muted/30">
        <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Heart className="w-4 h-4" /> Conexiones</div>
        <p className="text-xs text-muted-foreground mb-3">Revisa estos módulos para encontrar relaciones con tu bienestar emocional:</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/health"><Button size="sm" variant="outline">Salud / Sueño</Button></Link>
          <Link to="/habits"><Button size="sm" variant="outline">Hábitos</Button></Link>
          <Link to="/energy"><Button size="sm" variant="outline">Energía</Button></Link>
          <Link to="/identity"><Button size="sm" variant="outline">Identidad</Button></Link>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold text-sm mb-3">Sesiones de mayor impacto</div>
        {sessions.filter((s) => s.impact >= 4).slice(0, 3).map((s) => (
          <div key={s.id} className="text-sm py-2 border-b border-border last:border-0">
            <div className="font-medium">{s.main_topic}</div>
            {s.insight && <p className="text-xs text-muted-foreground italic line-clamp-2 mt-0.5">"{s.insight}"</p>}
          </div>
        ))}
        {sessions.filter((s) => s.impact >= 4).length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">Aún no hay sesiones de alto impacto</div>
        )}
      </Card>
    </>
  );
}
