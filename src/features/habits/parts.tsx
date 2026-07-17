/**
 * **Feature** — Componentes (parts) del módulo **Hábitos**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppState } from "@/lib/storage";
import type { Habit, HabitFrequency } from "@/lib/storage-types";
import { todayCDMX, humanDateLabel, daysAgoCDMX } from "@/lib/date-utils";
import { DateQuickPicker } from "@/components/DateQuickPicker";
import { Flame, Plus, Check, Trash2, X, Crown, Pencil, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const CEO_HABITS: { name: string; emoji: string; points: number }[] = [
  { name: "Programar publicación diaria", emoji: "📅", points: 40 },
  { name: "Mandar mensaje al equipo", emoji: "💬", points: 35 },
  { name: "Ordenar archivos", emoji: "🗂️", points: 30 },
  { name: "Publicar contenido", emoji: "🚀", points: 50 },
];
const CEO_TAG = "👑";

// Devuelve [inicio, fin] del periodo actual según frecuencia (YYYY-MM-DD strings)
function periodRange(frequency: HabitFrequency, refDate: string): { start: string; end: string; label: string } {
  const d = new Date(refDate + "T00:00:00");
  if (frequency === "daily") {
    return { start: refDate, end: refDate, label: "hoy" };
  }
  if (frequency === "weekly") {
    // lunes-domingo
    const day = d.getDay(); // 0=dom..6=sab
    const diffToMon = (day + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - diffToMon);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0,10), end: sun.toISOString().slice(0,10), label: "esta semana" };
  }
  // monthly
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: first.toISOString().slice(0,10), end: last.toISOString().slice(0,10), label: "este mes" };
}

function periodProgress(h: Habit, refDate: string): { count: number; target: number; pct: number; label: string; done: boolean } {
  const { start, end, label } = periodRange(h.frequency, refDate);
  const count = h.history.filter((d) => d >= start && d <= end).length;
  const target = Math.max(1, h.targetCount || 1);
  const pct = Math.min(100, (count / target) * 100);
  return { count, target, pct, label, done: count >= target };
}

export function HabitsPage() {
  const { state, toggleHabitForDate, addHabit, updateHabit, deleteHabit, toggleEnkiMode } = useAppState();

  const today = todayCDMX();
  const [selectedDate, setSelectedDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCeoForm, setIsCeoForm] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [points, setPoints] = useState(15);
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [category, setCategory] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const openNew = (ceo: boolean) => {
    setEditingId(null);
    setIsCeoForm(ceo);
    setName("");
    setEmoji(ceo ? "👑" : "✨");
    setPoints(ceo ? 40 : 15);
    setFrequency("daily");
    setTargetCount(1);
    setCategory("");
    setOpen(true);
  };

  const openEdit = (h: typeof state.habits[number]) => {
    const ceo = h.name.startsWith(CEO_TAG);
    setEditingId(h.id);
    setIsCeoForm(ceo);
    setName(ceo ? h.name.replace(`${CEO_TAG} `, "") : h.name);
    setEmoji(h.emoji);
    setPoints(h.points);
    setFrequency(h.frequency ?? "daily");
    setTargetCount(h.targetCount ?? 1);
    setCategory(h.category ?? "");
    setOpen(true);
  };

  const submitForm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const finalName = isCeoForm && !trimmed.startsWith(CEO_TAG) ? `${CEO_TAG} ${trimmed}` : trimmed;
    const tgt = frequency === "daily" ? 1 : Math.max(1, targetCount);
    if (editingId) {
      updateHabit(editingId, { name: finalName, emoji: emoji || "✨", points, frequency, targetCount: tgt, category: category.trim() || undefined });
    } else {
      addHabit(finalName, emoji || "✨", points, frequency, tgt, category.trim() || undefined);
    }
    setOpen(false);
    setEditingId(null);
    setName(""); setEmoji("✨"); setPoints(15); setIsCeoForm(false); setFrequency("daily"); setTargetCount(1); setCategory("");
  };

  const isCeo = (n: string) => n.startsWith(CEO_TAG);
  const { ceoHabits, otherHabits } = useMemo(() => ({
    ceoHabits: state.habits.filter((h) => isCeo(h.name)),
    otherHabits: state.habits.filter((h) => !isCeo(h.name)),
  }), [state.habits]);

  const habitsByCategory = useMemo(() => {
    const groups: Record<string, typeof state.habits> = {};
    otherHabits.forEach(h => {
      let cat = h.category?.trim();
      
      // Intentar auto-categorizar si no tiene categoría
      if (!cat) {
        const n = h.name.toLowerCase();
        if (n.includes("ejercicio") || n.includes("meditar") || n.includes("agua") || n.includes("salud") || n.includes("dormir") || n.includes("entrenar") || n.includes("gym")) cat = "Salud";
        else if (n.includes("leer") || n.includes("estudiar") || n.includes("aprender") || n.includes("curso")) cat = "Personal";
        else if (n.includes("trabajo") || n.includes("correo") || n.includes("reunión") || n.includes("proyecto")) cat = "Trabajo";
        else if (n.includes("limpiar") || n.includes("ordenar") || n.includes("casa") || n.includes("hogar")) cat = "Hogar";
        else cat = "Otros";
      }

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(h);
    });
    return groups;
  }, [otherHabits]);

  const { completedOnDate, completionRate, ceoDoneToday } = useMemo(() => {
    const done = state.habits.filter((h) => h.history.includes(selectedDate)).length;
    return {
      completedOnDate: done,
      completionRate: state.habits.length ? (done / state.habits.length) * 100 : 0,
      ceoDoneToday: ceoHabits.filter((h) => h.history.includes(selectedDate)).length,
    };
  }, [state.habits, ceoHabits, selectedDate]);
  const isPast = selectedDate !== today;


  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => daysAgoCDMX(6 - i));
    const last14Days = Array.from({ length: 14 }, (_, i) => daysAgoCDMX(13 - i));
    const last30Days = Array.from({ length: 30 }, (_, i) => daysAgoCDMX(29 - i));
    
    const getRate = (days: string[]) => {
      if (state.habits.length === 0) return 0;
      let totalCompleted = 0;
      days.forEach(d => {
        totalCompleted += state.habits.filter(h => h.history.includes(d)).length;
      });
      return (totalCompleted / (state.habits.length * days.length)) * 100;
    };

    const getDailyData = (days: string[]) => {
      return days.map(d => ({
        date: d,
        label: d.slice(8, 10),
        count: state.habits.filter(h => h.history.includes(d)).length,
        total: state.habits.length,
        rate: state.habits.length ? (state.habits.filter(h => h.history.includes(d)).length / state.habits.length) * 100 : 0
      }));
    };

    return {
      weeklyRate: getRate(last7Days),
      monthlyRate: getRate(last30Days),
      weeklyData: getDailyData(last7Days),
      monthlyData: getDailyData(last30Days),
      last14Days
    };
  }, [state.habits]);

  const seedCeoHabits = () => {
    const existing = new Set(ceoHabits.map((h) => h.name));
    CEO_HABITS.forEach((h) => {
      const fullName = `${CEO_TAG} ${h.name}`;
      if (!existing.has(fullName)) addHabit(fullName, h.emoji, h.points);
    });
  };

  const renderHabitCard = (h: typeof state.habits[number], ceo = false) => {
    const done = h.history.includes(selectedDate);
    const freq = h.frequency ?? "daily";
    const prog = periodProgress(h, selectedDate);
    const showProgress = freq !== "daily";
    const cardDone = showProgress ? prog.done : done;
    
    return (
      <div
        key={h.id}
        onClick={() => setSelectedHabitId(h.id)}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-card transition-all cursor-pointer ${
          cardDone
            ? ceo
              ? "border-[var(--energy)]/60 bg-[var(--energy)]/10"
              : "border-primary/50 bg-primary/5"
            : ceo
              ? "border-[var(--energy)]/30 bg-card hover:border-[var(--energy)]/60"
              : "border-border bg-card hover:border-primary/30"
        }`}
      >
        <div 
          className="cursor-pointer"
          onClick={() => setSelectedHabitId(h.id)}
        >
          <div className="flex items-start gap-4">

          <div className="text-4xl shrink-0">{h.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-display text-lg font-semibold ${cardDone ? "line-through text-muted-foreground" : ""}`}>
              {ceo ? h.name.replace(`${CEO_TAG} `, "") : h.name}
            </h3>
            <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[var(--energy)]">
                <Flame className="w-4 h-4" /> {h.streak}
              </span>
              <span className="text-muted-foreground">+{h.points} XP</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                {freq === "daily" ? "Diario" : freq === "weekly" ? `${h.targetCount}×/sem` : `${h.targetCount}×/mes`}
              </span>
            </div>
            
            {/* Historial de últimos 14 días */}
            <div className="mt-4 flex items-center gap-1 h-6">
              {stats.last14Days.map((date, idx) => {
                const isDayDone = h.history.includes(date);
                const isToday = date === today;
                return (
                  <div
                    key={idx}
                    title={humanDateLabel(date)}
                    className={`flex-1 h-full rounded-[3px] transition-colors border ${
                      isDayDone 
                        ? ceo ? "bg-[var(--energy)] border-[var(--energy)]" : "bg-primary border-primary"
                        : isToday ? "border-primary/40 bg-transparent" : "bg-secondary/40 border-transparent"
                    }`}
                  />
                );
              })}
            </div>

            {showProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{prog.label}</span>
                  <span className={`font-medium ${prog.done ? "text-primary" : "text-foreground"}`}>{prog.count}/{prog.target}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${ceo ? "bg-[var(--energy)]" : "bg-primary"} transition-all`}
                    style={{ width: `${prog.pct}%` }}
                  />
                </div>
              </div>
            )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHabitForDate(h.id, selectedDate);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              done
                ? ceo
                  ? "bg-[var(--energy)] text-background shadow-glow"
                  : "bg-primary text-primary-foreground shadow-glow"
                : "border border-border hover:border-primary"
            }`}
            aria-label={done ? "Desmarcar" : "Completar"}
          >
            {done && <Check className="w-5 h-5" />}
          </button>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(h);
            }}
            className="text-muted-foreground hover:text-primary"
            aria-label="Editar hábito"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteHabit(h.id);
            }}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Eliminar hábito"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-32 md:pb-12">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Hábitos</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-1">Construye tu día 🎯</h1>
          <p className="mt-2 text-muted-foreground">
            {completedOnDate} de {state.habits.length} completados · {completionRate.toFixed(0)}%
            {isPast && <span className="ml-1 text-primary">({humanDateLabel(selectedDate)})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all ${
              showStats 
                ? "bg-primary/10 border-primary text-primary shadow-glow" 
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> {showStats ? "Cerrar estadísticas" : "Rendimiento"}
          </button>
          <button
            onClick={() => openNew(false)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuevo hábito
          </button>
        </div>
      </header>

      {showStats && (
        <div className="mb-8 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Resumen Semanal */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Desempeño Semanal
              </h3>
              <span className="text-2xl font-bold text-primary">{stats.weeklyRate.toFixed(0)}%</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-32">
              {stats.weeklyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-secondary rounded-full overflow-hidden relative h-20">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-500"
                      style={{ height: `${d.rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen Mensual */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Tendencia Mensual (30d)
              </h3>
              <span className="text-2xl font-bold text-primary">{stats.monthlyRate.toFixed(0)}%</span>
            </div>
            <div className="grid grid-cols-10 gap-1 h-32">
              {stats.monthlyData.map((d, i) => (
                <div 
                  key={i} 
                  className={`rounded-[2px] transition-colors duration-300 ${
                    d.rate >= 80 ? "bg-primary" : 
                    d.rate >= 50 ? "bg-primary/60" : 
                    d.rate > 0 ? "bg-primary/30" : "bg-secondary"
                  }`}
                  title={`${d.date}: ${d.rate.toFixed(0)}%`}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-muted-foreground">
              <span>Hace 30 días</span>
              <span>Hoy</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 p-3 rounded-xl border border-border bg-card/50">
        <DateQuickPicker value={selectedDate} onChange={setSelectedDate} label="Marcar para" />
        {isPast && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Estás registrando hábitos del pasado. La racha se recalcula automáticamente.
          </p>
        )}
      </div>

      {/* Sistema Enki / Modo CEO */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--energy)]" />
              <h2 className="font-display text-xl font-bold">Sistema Enki · Modo CEO</h2>
              {ceoHabits.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {ceoDoneToday}/{ceoHabits.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-lg border border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modo CEO</span>
              <Switch 
                checked={state.enkiModeEnabled} 
                onCheckedChange={toggleEnkiMode}
                className="scale-75"
              />
            </div>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={seedCeoHabits}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--energy)]/40 text-[var(--energy)] hover:bg-[var(--energy)]/10 transition-colors"
              >
                {ceoHabits.length === 0 ? "Activar Modo CEO" : "Restaurar faltantes"}
              </button>
              <button
                onClick={() => openNew(true)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--energy)] text-background font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo CEO
              </button>
            </div>
          </div>
          {state.enkiModeEnabled && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs text-muted-foreground mb-3">
                Hábitos personales de liderazgo y operación. XP alto · cuentan para misiones y battle pass.
              </p>
              {ceoHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--energy)]/40 p-6 text-center text-sm text-muted-foreground">
                  Activa el Modo CEO para sembrar tus hábitos de liderazgo (publicar, ordenar archivos, mensaje al equipo…).
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {ceoHabits.map((h) => renderHabitCard(h, true))}
                </div>
              )}
            </div>
          )}
        </section>

      {Object.entries(habitsByCategory).map(([cat, habits]) => (
        <section key={cat} className="mb-8">
          <h2 className="font-display text-xl font-bold mb-3">{cat}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(habits as typeof state.habits).map((h) => renderHabitCard(h, false))}
          </div>
        </section>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                {isCeoForm && <Crown className="w-5 h-5 text-[var(--energy)]" />}
                {editingId ? "Editar hábito" : isCeoForm ? "Nuevo hábito CEO" : "Nuevo hábito"}
              </h2>
              <button onClick={() => { setOpen(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCeoForm(false)}
                  className={`px-3 py-1.5 rounded-lg border ${!isCeoForm ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setIsCeoForm(true)}
                  className={`px-3 py-1.5 rounded-lg border inline-flex items-center gap-1 ${isCeoForm ? "border-[var(--energy)] text-[var(--energy)] bg-[var(--energy)]/10" : "border-border text-muted-foreground"}`}
                >
                  <Crown className="w-3.5 h-3.5" /> Modo CEO
                </button>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Meditar 10 minutos"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Categoría</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Salud, Trabajo, Personal..."
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Emoji</label>
                  <input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    maxLength={2}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-2xl text-center"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">XP</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Frecuencia</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["daily","weekly","monthly"] as HabitFrequency[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`px-2 py-2 rounded-xl text-xs border transition-colors ${frequency === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {f === "daily" ? "Diario" : f === "weekly" ? "Semanal" : "Mensual"}
                    </button>
                  ))}
                </div>
              </div>
              {frequency !== "daily" && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Meta ({frequency === "weekly" ? "veces por semana" : "veces por mes"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={frequency === "weekly" ? 7 : 31}
                    value={targetCount}
                    onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                  />
                </div>
              )}
              <button
                disabled={!name.trim()}
                onClick={submitForm}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50 disabled:shadow-none"
              >
                {editingId ? "Guardar cambios" : "Crear hábito"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Insights Dialog */}
      {selectedHabitId && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedHabitId(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const h = state.habits.find(h => h.id === selectedHabitId);
              if (!h) return null;
              
              const isCeo = h.name.startsWith(CEO_TAG);
              const displayName = isCeo ? h.name.replace(`${CEO_TAG} `, "") : h.name;
              
              // Calculate specific stats for this habit
              const last30Days = Array.from({ length: 30 }, (_, i) => daysAgoCDMX(29 - i));
              const completionsLast30 = h.history.filter(d => last30Days.includes(d)).length;
              const rateLast30 = (completionsLast30 / 30) * 100;
              
              const last7Days = Array.from({ length: 7 }, (_, i) => daysAgoCDMX(6 - i));
              const completionsLast7 = h.history.filter(d => last7Days.includes(d)).length;
              const rateLast7 = (completionsLast7 / 7) * 100;

              return (
                <>
                  <button 
                    onClick={() => setSelectedHabitId(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className={`p-8 rounded-t-3xl ${isCeo ? "bg-[var(--energy)]/10" : "bg-primary/5"}`}>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-6xl p-4 bg-card rounded-2xl shadow-sm border border-border/50">
                        {h.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isCeo && <Crown className="w-4 h-4 text-[var(--energy)]" />}
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {h.category || "Hábito"}
                          </span>
                        </div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">{displayName}</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Flame className="w-4 h-4 text-[var(--energy)]" />
                          <span className="text-xs font-semibold">Racha Actual</span>
                        </div>
                        <p className="text-2xl font-bold">{h.streak} días</p>
                      </div>
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold">Últimos 7d</span>
                        </div>
                        <p className="text-2xl font-bold">{rateLast7.toFixed(0)}%</p>
                      </div>
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold">Mejor Racha</span>
                        </div>
                        <p className="text-2xl font-bold">{Math.max(h.streak, h.history.length > 0 ? 1 : 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Activity Map */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Actividad (Últimos 30 días)</h3>
                      <div className="grid grid-cols-10 gap-2">
                        {last30Days.map((date, i) => {
                          const isDone = h.history.includes(date);
                          const isToday = date === todayCDMX();
                          return (
                            <div 
                              key={i}
                              title={humanDateLabel(date)}
                              className={`aspect-square rounded-lg border transition-all ${
                                isDone 
                                  ? isCeo ? "bg-[var(--energy)] border-[var(--energy)] shadow-[0_0_10px_rgba(255,107,0,0.3)]" : "bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                  : isToday ? "border-primary/50 bg-secondary/20" : "bg-secondary/30 border-transparent"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                        <span>Hace 30 días</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-secondary/30" /> Pendiente
                          </span>
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isCeo ? "bg-[var(--energy)]" : "bg-primary"}`} /> Completado
                          </span>
                        </div>
                        <span>Hoy</span>
                      </div>
                    </div>

                    {/* Weekly breakdown */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Métricas</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Total completados</span>
                            <span className="font-bold">{h.history.length} veces</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">XP total generado</span>
                            <span className="font-bold text-primary">+{h.history.length * h.points} XP</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Frecuencia objetivo</span>
                            <span className="font-bold">
                              {h.frequency === "daily" ? "Diario" : h.frequency === "weekly" ? `${h.targetCount}×/semana` : `${h.targetCount}×/mes`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center items-center p-6 bg-secondary/20 rounded-2xl border border-border/50">
                        <div className="relative w-24 h-24 mb-3">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-secondary"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 * (1 - rateLast30 / 100)}
                              className={isCeo ? "text-[var(--energy)]" : "text-primary"}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold">
                            {rateLast30.toFixed(0)}%
                          </div>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Éxito Mensual</p>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => {
                          openEdit(h);
                          setSelectedHabitId(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors font-semibold"
                      >
                        <Pencil className="w-4 h-4" /> Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("¿Seguro que quieres eliminar este hábito?")) {
                            deleteHabit(h.id);
                            setSelectedHabitId(null);
                          }
                        }}
                        className="px-4 py-3 rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
