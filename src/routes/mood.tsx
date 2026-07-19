/**
 * **Ruta** — Mood tracker: emoji + intensidad + tags + correlación por tag.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Smile, Trash2, Sparkles } from "lucide-react";
import { useMood, MOOD_OPTIONS, MOOD_TAGS } from "@/hooks/use-mood";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/mood")({
  head: () => ({
    meta: [
      { title: "Mood · Panda's LIFE OS" },
      { name: "description", content: "Registra tu ánimo con emoji + tags y descubre qué lo correlaciona." },
    ],
  }),
  component: MoodPage,
});

function MoodPage() {
  const { logs, add, remove, avgMood30, tagStats } = useMood();
  const [mood, setMood] = useState<string>("good");
  const [intensity, setIntensity] = useState(3);
  const [energy, setEnergy] = useState(7);
  const [pain, setPain] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) => {
    setSelectedTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const save = async () => {
    setSaving(true);
    await add({ mood, intensity, tags: selectedTags, note: note.trim() || undefined, energy, pain });
    setSelectedTags([]);
    setNote("");
    setSaving(false);
  };

  const moodMeta = (m: string) => MOOD_OPTIONS.find((o) => o.key === m) ?? MOOD_OPTIONS[2];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Smile className="w-7 h-7 text-pink-500" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Mood</h1>
          <p className="text-sm text-muted-foreground">Rápido, en 10 segundos. Registra varias veces al día.</p>
        </div>
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Ánimo promedio 30d</div>
          <div className="font-display text-2xl font-bold">{avgMood30 ? avgMood30.toFixed(1) : "—"}<span className="text-sm text-muted-foreground">/5</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Registros 30d</div>
          <div className="font-display text-2xl font-bold">
            {logs.filter((l) => Date.now() - new Date(l.logged_at).getTime() < 30 * 86400000).length}
          </div>
        </Card>
      </div>

      {/* Quick log */}
      <Card className="p-5 space-y-4">
        <div>
          <Label className="text-xs">¿Cómo te sientes ahora?</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {MOOD_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => setMood(o.key)}
                className={`px-3 py-2 rounded-xl border transition text-sm ${mood === o.key ? "bg-pink-500 text-white border-pink-500" : "hover:bg-muted"}`}
              >
                <span className="text-lg mr-1">{o.emoji}</span> {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Intensidad</Label>
          <div className="flex gap-2 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`w-10 h-10 rounded-lg border ${intensity === i ? "bg-pink-500 text-white border-pink-500" : "hover:bg-muted"}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Energía ⚡</Label>
            <span className="text-sm font-semibold">{energy}<span className="text-xs text-muted-foreground">/10</span></span>
          </div>
          <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full mt-1 accent-pink-500" />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dolor 🩹</Label>
            <span className="text-sm font-semibold">{pain}<span className="text-xs text-muted-foreground">/10</span></span>
          </div>
          <input type="range" min={0} max={10} value={pain} onChange={(e) => setPain(Number(e.target.value))} className="w-full mt-1 accent-pink-500" />
        </div>

        <div>
          <Label className="text-xs">Tags ({selectedTags.length})</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {MOOD_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`px-2 py-1 rounded-full text-xs border transition ${
                  selectedTags.includes(t) ? "bg-pink-500 text-white border-pink-500" : "hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" rows={2} />

        <Button onClick={save} disabled={saving} className="w-full">Guardar</Button>
      </Card>

      {/* Correlación */}
      {tagStats.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold">Correlación por tag (30d)</h2>
          </div>
          <div className="space-y-2">
            {tagStats.slice(0, 10).map((s) => (
              <div key={s.tag} className="flex items-center gap-3">
                <span className="text-xs w-24 shrink-0">{s.tag}</span>
                <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-pink-500" style={{ width: `${(s.avg / 5) * 100}%` }} />
                </div>
                <span className="text-xs w-16 text-right">{s.avg.toFixed(1)} <span className="text-muted-foreground">({s.count})</span></span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Timeline ({logs.length})</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no registras nada. Empieza ahora.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(0, 50).map((l) => {
              const m = moodMeta(l.mood);
              return (
                <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="text-2xl">{m.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground"> · int. {l.intensity}/5</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(l.logged_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                    {l.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {l.tags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded">{t}</span>
                        ))}
                      </div>
                    )}
                    {l.note && <div className="text-xs mt-1">{l.note}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
