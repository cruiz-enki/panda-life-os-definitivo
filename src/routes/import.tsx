/**
 * **Ruta** — Importación masiva de datos (JSON con esquemas Zod).
 */
import { createFileRoute } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { useMemo, useState } from "react";
import { useAppState } from "@/lib/storage";
import { toast } from "sonner";
import { Download, Upload, Sparkles, Package, Check, Loader2 } from "lucide-react";
import { TEMPLATES, type ContentTemplate } from "@/data/templates";
import { bulkImportContentClient } from "@/lib/import-client";
import { importPayloadSchema, type ImportPayload, type ImportSummary } from "@/lib/import-schemas";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Importar contenido — Pandus Maximus" },
      { name: "description", content: "Importa hábitos, ingredientes, platillos y recompensas desde plantillas, archivos o texto con IA." },
    ],
  }),
  component: ImportPage,
});

function summaryTotals(s: ImportSummary) {
  let created = 0;
  let skipped = 0;
  for (const k of Object.keys(s) as Array<keyof ImportSummary>) {
    const entry = s[k];
    if (!entry) continue;
    created += entry.created ?? 0;
    skipped += entry.skipped ?? 0;
  }
  return { created, skipped };
}

function SummaryCard({ summary }: { summary: ImportSummary }) {
  const labels: Record<keyof ImportSummary, string> = {
    habits: "Hábitos",
    tasks: "Tareas",
    ingredients: "Ingredientes",
    dishes: "Platillos",
    rewards: "Premios",
    quests: "Misiones temporales",
    fixed_missions: "Misiones fijas",
    skills: "Habilidades",
  };
  const t = summaryTotals(summary);
  return (
    <Card className="p-4 space-y-2 border-primary/40 bg-primary/5">
      <div className="flex items-center gap-2 font-semibold">
        <Check className="w-4 h-4 text-primary" /> Importación completada · {t.created} creados, {t.skipped} duplicados omitidos
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {(Object.keys(labels) as Array<keyof ImportSummary>).map((k) => {
          const s = summary[k];
          if (!s || (s.created === 0 && s.skipped === 0)) return null;
          return (
            <div key={k} className="flex justify-between bg-card px-2 py-1 rounded">
              <span>{labels[k]}</span>
              <span className="text-muted-foreground">+{s.created} / -{s.skipped}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TemplatesTab({ onSummary }: { onSummary: (s: ImportSummary) => void }) {
  const { markTemplateImported, state } = useAppState();
  const importedIds = state.importedTemplateIds || [];
  const importFn = bulkImportContentClient;
  const [loading, setLoading] = useState<string | null>(null);

  const apply = async (tpl: ContentTemplate) => {
    setLoading(tpl.id);
    try {
      const payload: ImportPayload = {
        habits: tpl.habits,
        tasks: tpl.tasks,
        ingredients: tpl.ingredients,
        dishes: tpl.dishes,
        rewards: tpl.rewards,
        quests: tpl.quests,
        fixed_missions: tpl.fixed_missions,
        skills: tpl.skills,
      };
      const summary = await importFn(payload);
      onSummary(summary);
      markTemplateImported(tpl.id);
      const t = summaryTotals(summary);
      toast.success(`${tpl.name}: ${t.created} elementos creados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setLoading(null);
    }
  };

  const counts = (tpl: ContentTemplate) => {
    const items: string[] = [];
    if (tpl.habits?.length) items.push(`${tpl.habits.length} hábitos`);
    if (tpl.tasks?.length) items.push(`${tpl.tasks.length} tareas`);
    if (tpl.ingredients?.length) items.push(`${tpl.ingredients.length} ingredientes`);
    if (tpl.dishes?.length) items.push(`${tpl.dishes.length} platillos`);
    if (tpl.rewards?.length) items.push(`${tpl.rewards.length} recompensas`);
    if (tpl.quests?.length) items.push(`${tpl.quests.length} misiones temporales`);
    if (tpl.fixed_missions?.length) items.push(`${tpl.fixed_missions.length} misiones fijas`);
    if (tpl.skills?.length) items.push(`${tpl.skills.length} categorías de skills`);
    return items;
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {TEMPLATES.map((tpl) => (
        <Card key={tpl.id} className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{tpl.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{tpl.name}</div>
                {importedIds.includes(tpl.id) && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-primary/20">
                    <Check className="w-2.5 h-2.5 mr-0.5" /> Importado
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{tpl.description}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {counts(tpl).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
            ))}
          </div>
          <Button
            size="sm"
            variant={importedIds.includes(tpl.id) ? "outline" : "default"}
            className="w-full"
            disabled={loading !== null}
            onClick={() => apply(tpl)}
          >
            {loading === tpl.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (importedIds.includes(tpl.id) ? <Check className="w-4 h-4 mr-2" /> : <Package className="w-4 h-4 mr-2" />)}
            {importedIds.includes(tpl.id) ? "Importar de nuevo" : "Cargar pack"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

function FileTab({ onSummary }: { onSummary: (s: ImportSummary) => void }) {
  const importFn = bulkImportContentClient;
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPayload | null>(null);

  const downloadTemplate = () => {
    const sample: ImportPayload = {
      habits: [{ name: "Tomar agua", emoji: "💧", points: 10, frequency: "daily" }],
      tasks: [{ title: "Mi tarea ejemplo", priority: "medium" }],
      ingredients: [{ name: "Pollo", emoji: "🍗", category: "proteina", default_unit: "g", default_qty: "150" }],
      dishes: [{ name: "Bowl de pollo", emoji: "🍲", dish_type: "quick", classification: "saludable", ingredient_names: ["Pollo"] }],
      rewards: [{ name: "Recompensa ejemplo", emoji: "🎁", cost: 100 }],
      quests: [{ title: "Misión ejemplo", xp: 100, target: 5, scope: "weekly" }],
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-import.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = importPayloadSchema.parse(json);
      setPreview(parsed);
      toast.success("Archivo válido. Revisa la previsualización.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Archivo inválido");
      setPreview(null);
    }
    e.target.value = "";
  };

  const exportAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const [h, t, i, d, r, q] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("meal_ingredients").select("*").eq("user_id", user.id),
        supabase.from("meal_dishes").select("*").eq("user_id", user.id),
        supabase.from("rewards_shop").select("*").eq("user_id", user.id),
        supabase.from("custom_quests").select("*").eq("user_id", user.id),
      ]);
      const dump = {
        exportedAt: new Date().toISOString(),
        habits: h.data ?? [],
        tasks: t.data ?? [],
        meal_ingredients: i.data ?? [],
        meal_dishes: d.data ?? [],
        rewards_shop: r.data ?? [],
        custom_quests: q.data ?? [],
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `panda-export-${todayCDMX()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup descargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const summary = await importFn(preview);
      onSummary(summary);
      setPreview(null);
      toast.success("Contenido importado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const counts = (p: ImportPayload) => {
    const arr: string[] = [];
    if (p.habits?.length) arr.push(`${p.habits.length} hábitos`);
    if (p.tasks?.length) arr.push(`${p.tasks.length} tareas`);
    if (p.ingredients?.length) arr.push(`${p.ingredients.length} ingredientes`);
    if (p.dishes?.length) arr.push(`${p.dishes.length} platillos`);
    if (p.rewards?.length) arr.push(`${p.rewards.length} recompensas`);
    if (p.quests?.length) arr.push(`${p.quests.length} misiones temporales`);
    if (p.fixed_missions?.length || p.achievements?.length) arr.push(`${(p.fixed_missions?.length || 0) + (p.achievements?.length || 0)} misiones fijas`);
    if (p.skills?.length) arr.push(`${p.skills.length} skills`);
    return arr;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold">Plantilla JSON</div>
        <p className="text-sm text-muted-foreground">
          Descarga la plantilla, edítala con tu contenido y súbela aquí. Los duplicados por nombre se omiten automáticamente.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" /> Descargar plantilla
          </Button>
          <label>
            <input type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-4 h-4 mr-2" /> Subir archivo</span>
            </Button>
          </label>
        </div>
      </Card>

      {preview && (
        <Card className="p-4 space-y-3 border-primary/40">
          <div className="font-semibold">Previsualización</div>
          <div className="flex flex-wrap gap-1">
            {counts(preview).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmImport} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar importación
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <div className="font-semibold">Exportar todo</div>
        <p className="text-sm text-muted-foreground">
          Descarga un respaldo completo con todos tus hábitos, tareas, ingredientes, platillos, recompensas y misiones.
        </p>
        <Button variant="outline" size="sm" onClick={exportAll} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar backup
        </Button>
      </Card>
    </div>
  );
}

function AiTab({ onSummary }: { onSummary: (s: ImportSummary) => void }) {
  const importFn = bulkImportContentClient;
  const [text, setText] = useState("");
  const [target, setTarget] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPayload | null>(null);

  const parse = async () => {
    if (!text.trim()) {
      toast.error("Pega algún texto");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-import-text", {
        body: { text, target },
      });
      if (error) throw new Error(error.message);
      const errBody = (data as { error?: string })?.error;
      if (errBody) throw new Error(errBody);
      const payload = (data as { payload: unknown }).payload;
      const validated = importPayloadSchema.parse(payload);
      setPreview(validated);
      toast.success("IA generó la propuesta. Revisa antes de importar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error con IA");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const summary = await importFn(preview);
      onSummary(summary);
      setPreview(null);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  };

  const counts = (p: ImportPayload) => {
    const arr: string[] = [];
    if (p.habits?.length) arr.push(`${p.habits.length} hábitos`);
    if (p.tasks?.length) arr.push(`${p.tasks.length} tareas`);
    if (p.ingredients?.length) arr.push(`${p.ingredients.length} ingredientes`);
    if (p.dishes?.length) arr.push(`${p.dishes.length} platillos`);
    if (p.rewards?.length) arr.push(`${p.rewards.length} recompensas`);
    if (p.quests?.length) arr.push(`${p.quests.length} misiones temporales`);
    if (p.fixed_missions?.length || p.achievements?.length) arr.push(`${(p.fixed_missions?.length || 0) + (p.achievements?.length || 0)} misiones fijas`);
    if (p.skills?.length) arr.push(`${p.skills.length} skills`);
    return arr;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Pegar texto libre
        </div>
        <p className="text-sm text-muted-foreground">
          Pega notas de Notion, WhatsApp, una lista a mano… La IA detecta hábitos, tareas, ingredientes, platillos, recompensas y misiones.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Ej:&#10;- Meditar 10 min diario&#10;- Comprar pechuga, arroz, brócoli&#10;- Tarea: agendar dentista esta semana&#10;- Recompensa: cena italiana 500 pts"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixto (todo)</SelectItem>
              <SelectItem value="habits">Solo hábitos</SelectItem>
              <SelectItem value="tasks">Solo tareas</SelectItem>
              <SelectItem value="ingredients">Solo ingredientes</SelectItem>
              <SelectItem value="dishes">Solo platillos</SelectItem>
              <SelectItem value="rewards">Solo recompensas</SelectItem>
              <SelectItem value="quests">Solo misiones</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={parse} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Procesar con IA
          </Button>
        </div>
      </Card>

      {preview && (
        <Card className="p-4 space-y-3 border-primary/40">
          <div className="font-semibold">Propuesta de la IA</div>
          <div className="flex flex-wrap gap-1">
            {counts(preview).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
            ))}
          </div>
          <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
            {preview.habits?.map((h, i) => <div key={`h${i}`}>• {h.emoji ?? "✨"} <b>{h.name}</b> <span className="text-muted-foreground">(hábito)</span></div>)}
            {preview.tasks?.map((t, i) => <div key={`t${i}`}>• ✅ <b>{t.title}</b> <span className="text-muted-foreground">(tarea)</span></div>)}
            {preview.ingredients?.map((x, i) => <div key={`i${i}`}>• {x.emoji ?? "🥕"} <b>{x.name}</b> <span className="text-muted-foreground">(ingrediente)</span></div>)}
            {preview.dishes?.map((d, i) => <div key={`d${i}`}>• {d.emoji ?? "🍽️"} <b>{d.name}</b> <span className="text-muted-foreground">(platillo)</span></div>)}
            {preview.rewards?.map((r, i) => <div key={`r${i}`}>• {r.emoji ?? "🎁"} <b>{r.name}</b> <span className="text-muted-foreground">({r.cost ?? 100} pts)</span></div>)}
            {preview.quests?.map((q, i) => <div key={`q${i}`}>• {q.emoji ?? "🎯"} <b>{q.title}</b> <span className="text-muted-foreground">(misión)</span></div>)}
            {preview.achievements?.map((a, i) => <div key={`a${i}`}>• {a.emoji ?? "🏆"} <b>{a.title}</b> <span className="text-muted-foreground">(logro)</span></div>)}
            {preview.skills?.map((s, i) => <div key={`s${i}`}>• {s.icon ?? "🧠"} <b>{s.name}</b> <span className="text-muted-foreground">(categoría skill)</span></div>)}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirm} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Importar todo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Descartar</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ImportPage() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" /> Importar contenido
        </h1>
        <p className="text-sm text-muted-foreground">
          Carga rápida de hábitos, tareas, ingredientes, platillos, recompensas y misiones.
        </p>
      </header>

      {summary && <SummaryCard summary={summary} />}

      <Tabs defaultValue="templates" className="space-y-3">
        <TabsList className="w-full">
          <TabsTrigger value="templates" className="flex-1"><Package className="w-4 h-4 mr-1.5" />Plantillas</TabsTrigger>
          <TabsTrigger value="file" className="flex-1"><Upload className="w-4 h-4 mr-1.5" />Archivo</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1"><Sparkles className="w-4 h-4 mr-1.5" />IA</TabsTrigger>
        </TabsList>
        <TabsContent value="templates"><TemplatesTab onSummary={setSummary} /></TabsContent>
        <TabsContent value="file"><FileTab onSummary={setSummary} /></TabsContent>
        <TabsContent value="ai"><AiTab onSummary={setSummary} /></TabsContent>
      </Tabs>
    </div>
  );
}
