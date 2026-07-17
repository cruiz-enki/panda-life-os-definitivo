/**
 * **Ruta** — Time tracking: bloques manuales categorizados. "¿En qué se me fue el día?"
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Clock, Trash2, Plus } from "lucide-react";
import { useTimeBlocks, TIME_CATEGORIES, categoryMeta } from "@/hooks/use-time-blocks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/time")({
  head: () => ({
    meta: [
      { title: "Tiempo · Panda's LIFE OS" },
      { name: "description", content: "Registra bloques de tiempo por categoría y proyecto. Sabe en qué se te fue el día." },
    ],
  }),
  component: TimePage,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtHM(min: number) { const h = Math.floor(min / 60); const m = Math.round(min % 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }

function TimePage() {
  const { blocks, add, remove, minutesBetween, totalsByCategory } = useTimeBlocks();
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [category, setCategory] = useState(TIME_CATEGORIES[0].key);
  const [project, setProject] = useState("");
  const [note, setNote] = useState("");

  const dayBlocks = useMemo(() => blocks.filter((b) => b.date === date), [blocks, date]);
  const dayTotal = dayBlocks.reduce((s, b) => s + minutesBetween(b.start_time, b.end_time), 0);

  const save = async () => {
    if (end <= start) return;
    await add({
      date,
      start_time: `${start}:00`,
      end_time: `${end}:00`,
      category,
      project: project.trim() || null,
      note: note.trim() || null,
      identity_area: null,
    });
    setProject("");
    setNote("");
    const [eh, em] = end.split(":").map(Number);
    const nextStart = new Date();
    nextStart.setHours(eh, em, 0, 0);
    setStart(end);
    const nextEnd = new Date(nextStart.getTime() + 60 * 60000);
    setEnd(`${String(nextEnd.getHours()).padStart(2, "0")}:${String(nextEnd.getMinutes()).padStart(2, "0")}`);
  };

  const totalWeek = Object.values(totalsByCategory).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Clock className="w-7 h-7 text-cyan-500" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Tiempo</h1>
          <p className="text-sm text-muted-foreground">Bloques manuales. Al final del día, ¿en qué se te fue?</p>
        </div>
      </header>

      {/* Semana por categoría */}
      {totalWeek > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Últimos 7 días · {fmtHM(totalWeek)} registrado</h2>
          <div className="space-y-1.5">
            {Object.entries(totalsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, min]) => {
                const meta = categoryMeta(cat);
                const pct = (min / totalWeek) * 100;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0" style={{ color: meta.color }}>{meta.label}</span>
                    <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                    <span className="text-xs w-24 text-right tabular-nums">{fmtHM(min)} <span className="text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Añadir bloque */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Agregar bloque</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Inicio</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Fin</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Duración</Label>
            <div className="h-10 flex items-center font-mono">{fmtHM(minutesBetween(`${start}:00`, `${end}:00`))}</div>
          </div>
        </div>
        <div>
          <Label className="text-xs">Categoría</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {TIME_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-2.5 py-1 rounded-full text-xs border transition ${category === c.key ? "text-white border-transparent" : "hover:bg-muted"}`}
                style={category === c.key ? { backgroundColor: c.color } : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Proyecto (opcional)" value={project} onChange={(e) => setProject(e.target.value)} />
          <Input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button onClick={save} className="w-full"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
      </Card>

      {/* Bloques del día */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">{date} · {fmtHM(dayTotal)}</h2>
        {dayBlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin bloques para este día.</p>
        ) : (
          <div className="space-y-2">
            {dayBlocks.map((b) => {
              const meta = categoryMeta(b.category);
              const min = minutesBetween(b.start_time, b.end_time);
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border-l-4" style={{ borderColor: meta.color }}>
                  <div className="text-xs font-mono w-20 shrink-0">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtHM(min)}
                      {b.project && <span> · {b.project}</span>}
                      {b.note && <span> · {b.note}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
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
