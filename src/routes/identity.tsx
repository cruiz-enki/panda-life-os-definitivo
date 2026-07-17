/**
 * **Ruta** — Identidad personal: valores, principios y rasgos.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useIdentity } from "@/hooks/use-identity";
import { IDENTITY_AREAS, SCORE_WEIGHTS, currentMonthKey } from "@/lib/identity-types";
import type { IdentityArea } from "@/lib/identity-types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, BookHeart, RefreshCw, AlertTriangle, CheckCircle2, Info, Loader2, Trash2 } from "lucide-react";
import { todayCDMX } from "@/lib/date-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/identity")({
  component: IdentityPage,
});

function IdentityPage() {
  const id = useIdentity();
  const [tab, setTab] = useState("dashboard");

  if (id.loading) {
    return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando identidad…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
          <Target className="w-8 h-8 text-primary" /> Identidad
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {id.profile?.desired_identity || "Define quién quieres ser y mide qué tan alineado estás cada día."}
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full overflow-x-auto h-auto p-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="wheel">Rueda</TabsTrigger>
          <TabsTrigger value="journal">Diario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="mirror">Espejo</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <ScoreCard id={id} />
          <AlignmentMessages id={id} />
        </TabsContent>

        <TabsContent value="wheel" className="space-y-4 mt-4">
          <WheelView id={id} />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4 mt-4">
          <JournalView id={id} />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-4">
          <WeeklyView id={id} />
        </TabsContent>

        <TabsContent value="mirror" className="space-y-4 mt-4">
          <MirrorView id={id} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <ProfileView id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Id = ReturnType<typeof useIdentity>;

function ScoreCard({ id }: { id: Id }) {
  const { score, snapshots } = id;
  const trend = snapshots.slice(0, 7).reverse();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Score de identidad</span>
          <span className="font-display text-4xl font-bold text-primary">{score.total}<span className="text-lg text-muted-foreground">/100</span></span>
        </CardTitle>
        <CardDescription>Qué tan alineado estás hoy con la persona que quieres ser.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={score.total} className="h-3" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(score.breakdown) as Array<keyof typeof score.breakdown>).map((k) => (
            <div key={k} className="rounded-xl border border-border p-3 bg-card">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k} · {Math.round(SCORE_WEIGHTS[k] * 100)}%</div>
              <div className="font-display text-2xl font-bold mt-1">{score.breakdown[k]}</div>
              <Progress value={score.breakdown[k]} className="h-1 mt-2" />
            </div>
          ))}
        </div>
        {trend.length >= 2 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Últimos 7 días</div>
            <div className="flex items-end gap-1 h-16">
              {trend.map((s) => (
                <div key={s.id} className="flex-1 bg-primary/30 rounded-t" style={{ height: `${Math.max(8, s.score)}%` }} title={`${s.date}: ${s.score}`} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlignmentMessages({ id }: { id: Id }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modo espejo · alertas de alineación</CardTitle>
        <CardDescription>Mensajes automáticos según tu actividad.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {id.mirror.length === 0 && <p className="text-sm text-muted-foreground">Todo en orden por ahora.</p>}
        {id.mirror.map((m, i) => {
          const Icon = m.type === "warning" ? AlertTriangle : m.type === "success" ? CheckCircle2 : Info;
          const cls = m.type === "warning" ? "text-amber-500" : m.type === "success" ? "text-emerald-500" : "text-blue-500";
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cls}`} />
              <p className="text-sm">{m.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function WheelView({ id }: { id: Id }) {
  const { currentWheel, setAreaScore, wheelHistory } = id;
  const max = 10;
  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 30;
  const angle = (i: number) => (i / currentWheel.length) * Math.PI * 2 - Math.PI / 2;

  const points = currentWheel.map((a, i) => {
    const r = (a.score / max) * radius;
    return `${center + r * Math.cos(angle(i))},${center + r * Math.sin(angle(i))}`;
  }).join(" ");

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Rueda de la vida · {currentMonthKey()}</CardTitle>
          <CardDescription>Promedio: {(currentWheel.reduce((s, a) => s + a.score, 0) / currentWheel.length).toFixed(1)}/10</CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
            {[2, 4, 6, 8, 10].map((lvl) => (
              <circle key={lvl} cx={center} cy={center} r={(lvl / max) * radius} fill="none" stroke="currentColor" className="text-border" strokeWidth={0.5} />
            ))}
            {currentWheel.map((a, i) => (
              <line key={a.id} x1={center} y1={center}
                x2={center + radius * Math.cos(angle(i))}
                y2={center + radius * Math.sin(angle(i))}
                stroke="currentColor" className="text-border" strokeWidth={0.5} />
            ))}
            <polygon points={points} fill="oklch(0.7 0.18 260 / 0.3)" stroke="oklch(0.7 0.18 260)" strokeWidth={2} />
            {currentWheel.map((a, i) => {
              const x = center + (radius + 18) * Math.cos(angle(i));
              const y = center + (radius + 18) * Math.sin(angle(i));
              return (
                <text key={a.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-foreground" fontSize={11}>
                  {a.emoji} {a.score}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calificar áreas</CardTitle>
          <CardDescription>Ajusta del 1 al 10.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWheel.map((a) => (
            <div key={a.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{a.emoji} {a.label}</span>
                <span className="text-sm font-display font-bold">{a.score}/10</span>
              </div>
              <Slider min={0} max={10} step={1} value={[a.score]} onValueChange={(v) => setAreaScore(a.id as IdentityArea, v[0])} />
            </div>
          ))}
        </CardContent>
      </Card>

      {wheelHistory.length > 1 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historial mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wheelHistory.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-20">{m.month}</span>
                  <Progress value={m.avg * 10} className="flex-1 h-2" />
                  <span className="text-sm font-display font-bold w-10 text-right">{m.avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JournalView({ id }: { id: Id }) {
  const { todayJournal, upsertJournal, journal, deleteJournal } = id;
  const [date, setDate] = useState(todayCDMX());
  const entry = journal.find((j) => j.date === date) ?? todayJournal;

  const [didWell, setDidWell] = useState(entry?.did_well ?? "");
  const [didNotWell, setDidNotWell] = useState(entry?.did_not_well ?? "");
  const [learned, setLearned] = useState(entry?.learned ?? "");
  const [emotion, setEmotion] = useState(entry?.emotion ?? "");
  const [energy, setEnergy] = useState<number>(entry?.energy ?? 5);
  const [alignment, setAlignment] = useState<number>(entry?.alignment ?? 5);
  const [insight, setInsight] = useState(entry?.insight ?? "");
  const [saving, setSaving] = useState(false);

  // Reset cuando cambia date
  useMemo(() => {
    const e = journal.find((j) => j.date === date);
    setDidWell(e?.did_well ?? "");
    setDidNotWell(e?.did_not_well ?? "");
    setLearned(e?.learned ?? "");
    setEmotion(e?.emotion ?? "");
    setEnergy(e?.energy ?? 5);
    setAlignment(e?.alignment ?? 5);
    setInsight(e?.insight ?? "");
  }, [date, journal]);

  const save = async () => {
    setSaving(true);
    const err = await upsertJournal({ date, did_well: didWell, did_not_well: didNotWell, learned, emotion, energy, alignment, insight });
    setSaving(false);
    if (err) toast.error("Error al guardar"); else toast.success("Diario guardado");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookHeart className="w-5 h-5" /> Diario guiado</CardTitle>
          <CardDescription>Reflexiona sobre tu día con preguntas guiadas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayCDMX()} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Qué hice bien</Label>
              <Textarea rows={3} value={didWell} onChange={(e) => setDidWell(e.target.value)} placeholder="Logros, decisiones acertadas…" />
            </div>
            <div>
              <Label>Qué no hice bien</Label>
              <Textarea rows={3} value={didNotWell} onChange={(e) => setDidNotWell(e.target.value)} placeholder="Lo que pude haber hecho diferente…" />
            </div>
          </div>
          <div>
            <Label>Qué aprendí</Label>
            <Textarea rows={2} value={learned} onChange={(e) => setLearned(e.target.value)} placeholder="Una lección, un insight…" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Emoción dominante</Label>
              <Input value={emotion} onChange={(e) => setEmotion(e.target.value)} placeholder="ansioso, motivado, en paz…" />
            </div>
            <div>
              <Label>Energía: {energy}/10</Label>
              <Slider min={1} max={10} step={1} value={[energy]} onValueChange={(v) => setEnergy(v[0])} />
            </div>
          </div>
          <div>
            <Label>Alineación con mi identidad: {alignment}/10</Label>
            <Slider min={1} max={10} step={1} value={[alignment]} onValueChange={(v) => setAlignment(v[0])} />
          </div>
          <div>
            <Label>Insight del día</Label>
            <Textarea rows={2} value={insight} onChange={(e) => setInsight(e.target.value)} placeholder="La idea que me llevo de hoy…" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Guardar diario
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          {journal.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes entradas.</p>}
          <div className="space-y-2">
            {journal.slice(0, 10).map((j) => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/40 cursor-pointer" onClick={() => setDate(j.date)}>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{j.date}</div>
                  <div className="text-xs text-muted-foreground truncate">{j.insight || j.did_well || "(sin insight)"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{j.alignment}/10</Badge>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteJournal(j.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WeeklyView({ id }: { id: Id }) {
  const { reflections, generateWeeklyReflection } = id;
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const r = await generateWeeklyReflection();
    setLoading(false);
    if (r?.error) toast.error("Error: " + r.error); else toast.success("Reflexión generada");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reflexión semanal con IA</CardTitle>
          <CardDescription>Análisis de patrones y recomendaciones de tu última semana.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generar reflexión de esta semana
          </Button>
        </CardContent>
      </Card>

      {reflections.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Semana {r.week_key}</span>
              {r.ai_generated && <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Análisis</div>
              <p className="whitespace-pre-wrap">{r.analysis}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Patrones</div>
              <p className="whitespace-pre-wrap">{r.patterns}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Recomendaciones</div>
              <p className="whitespace-pre-wrap">{r.recommendations}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MirrorView({ id }: { id: Id }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    const r = await id.generateMirrorFeedback();
    setLoading(false);
    if (r.error) toast.error("Error: " + r.error);
    else setFeedback(r.feedback);
  };

  return (
    <div className="space-y-4">
      <AlignmentMessages id={id} />
      <Card>
        <CardHeader>
          <CardTitle>Espejo con IA</CardTitle>
          <CardDescription>Pídele al espejo feedback honesto sobre cómo estás actuando hoy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={ask} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Pedir feedback al espejo
          </Button>
          {feedback && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/30">
              <p className="text-sm whitespace-pre-wrap">{feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileView({ id }: { id: Id }) {
  const { profile, saveProfile } = id;
  const [identity, setIdentity] = useState(profile?.desired_identity ?? "");
  const [valuesText, setValuesText] = useState((profile?.core_values ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const err = await saveProfile({
      desired_identity: identity,
      core_values: valuesText.split(",").map((v) => v.trim()).filter(Boolean),
    });
    setSaving(false);
    if (err) toast.error("Error al guardar"); else toast.success("Identidad guardada");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi identidad deseada</CardTitle>
        <CardDescription>Define quién quieres ser. Esta declaración alimenta el feedback del espejo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Identidad deseada</Label>
          <Textarea rows={4} value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Soy una persona disciplinada, financieramente sana, presente con mi familia…" />
        </div>
        <div>
          <Label>Valores fundamentales (separados por coma)</Label>
          <Input value={valuesText} onChange={(e) => setValuesText(e.target.value)} placeholder="integridad, salud, libertad, familia, aprendizaje" />
          <div className="flex flex-wrap gap-1 mt-2">
            {valuesText.split(",").map((v) => v.trim()).filter(Boolean).map((v) => (
              <Badge key={v} variant="secondary">{v}</Badge>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Guardar
        </Button>
      </CardContent>
    </Card>
  );
}
