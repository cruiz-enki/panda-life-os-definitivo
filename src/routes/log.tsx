/**
 * **Ruta** — Registrar: pantalla única para capturar rápido hábitos, tareas,
 * mood, sueño, comidas y energía. Diseño móvil-first estilo iOS con tabs.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Repeat, CheckSquare, Smile, Moon, Utensils, Battery,
  Check, Plus, ArrowRight, Flame, DollarSign, Camera, Sparkles,
} from "lucide-react";
import { scanReceipt } from "@/lib/receipt-scan.functions";
import { useAppState } from "@/lib/storage";
import { todayCDMX } from "@/lib/date-utils";
import { useMood, MOOD_OPTIONS, MOOD_TAGS } from "@/hooks/use-mood";
import { useSleep } from "@/hooks/use-sleep";
import { useMeals } from "@/hooks/use-meals";
import { useFinance } from "@/hooks/use-finance";
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/finance-types";
import type { Priority } from "@/lib/storage-types";

type LogSearch = { tab?: TabKey };

export const Route = createFileRoute("/log")({
  validateSearch: (s: Record<string, unknown>): LogSearch => {
    const t = s.tab;
    const allowed: TabKey[] = ["habits", "tasks", "mood", "sleep", "meals", "energy", "expense"];
    return { tab: typeof t === "string" && (allowed as string[]).includes(t) ? (t as TabKey) : undefined };
  },
  head: () => ({
    meta: [
      { title: "Registrar · Panda's LIFE OS" },
      { name: "description", content: "Captura rápida de hábitos, tareas, mood, sueño, comidas, energía y gastos." },
    ],
  }),
  component: LogPage,
});

type TabKey = "habits" | "tasks" | "mood" | "sleep" | "meals" | "energy" | "expense";

const TABS: { key: TabKey; label: string; icon: typeof Repeat }[] = [
  { key: "habits", label: "Hábitos", icon: Repeat },
  { key: "tasks", label: "Tareas", icon: CheckSquare },
  { key: "expense", label: "Gasto", icon: DollarSign },
  { key: "mood", label: "Mood", icon: Smile },
  { key: "sleep", label: "Sueño", icon: Moon },
  { key: "meals", label: "Comidas", icon: Utensils },
  { key: "energy", label: "Energía", icon: Battery },
];

function LogPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<TabKey>(search.tab ?? "habits");

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-5 pb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Captura rápida</div>
        <h1 className="font-display text-2xl font-bold mt-0.5">Registrar</h1>
      </header>

      {/* Tabs */}
      <div className="px-3 pt-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`no-tap-highlight flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-secondary/30 border-border text-foreground/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto">
        {tab === "habits" && <HabitsQuick />}
        {tab === "tasks" && <TasksQuick />}
        {tab === "expense" && <ExpenseQuick />}
        {tab === "mood" && <MoodQuick />}
        {tab === "sleep" && <SleepQuick />}
        {tab === "meals" && <MealsQuick />}
        {tab === "energy" && <EnergyQuick />}
      </div>
    </div>
  );
}

/* ---------------- Gasto ---------------- */
function ExpenseQuick() {
  const { cards, categories, createExpense } = useFinance();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayCDMX());
  const [category, setCategory] = useState("Otros");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cardId, setCardId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runScan = scanReceipt;

  const allCats = [
    ...DEFAULT_CATEGORIES.filter((d) => d.kind === "expense").map((d) => ({ name: d.name, emoji: d.emoji })),
    ...categories.filter((c) => c.kind === "expense").map((c) => ({ name: c.name, emoji: c.emoji })),
  ];

  const activeCards = cards.filter((c) => c.status === "active");

  const onPickReceipt = async (file: File) => {
    if (!file) return;
    setScanning(true);
    try {
      // Downscale a máximo 1600px de lado para bajar tokens/latencia
      const dataUrl = await compressImage(file, 1600, 0.85);
      const result = await runScan({
        data: {
          imageDataUrl: dataUrl,
          categories: allCats.map((c) => c.name),
          today: todayCDMX(),
        },
      });
      if (result.amount) setAmount(String(result.amount));
      if (result.date) setDate(result.date);
      if (result.category && allCats.some((c) => c.name === result.category)) {
        setCategory(result.category);
      }
      if (result.payment_method) setPaymentMethod(result.payment_method);
      const noteBits = [result.merchant, result.note].filter(Boolean);
      if (noteBits.length > 0) setNote(noteBits.join(" · "));
      toast.success(
        `Recibo leído${result.confidence === "low" ? " (revisa los datos)" : ""}`,
      );
    } catch (e) {
      console.error(e);
      toast.error("No se pudo leer el recibo");
    } finally {
      setScanning(false);
    }
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Monto inválido");
    if (paymentMethod === "credit" && !cardId) return toast.error("Selecciona tarjeta");
    setSaving(true);
    const err = await createExpense({
      amount: amt,
      date,
      category,
      payment_method: paymentMethod,
      card_id: paymentMethod === "credit" ? cardId || null : null,
      note,
      tags: [],
      kind: "expense",
      expense_type: "normal",
      msi_plan_id: null,
    });
    setSaving(false);
    if (err) return toast.error("No se pudo guardar");
    toast.success(`Gasto registrado · $${amt.toFixed(2)}`);
    setAmount("");
    setNote("");
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
        className="w-full p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center gap-2 text-sm font-medium text-primary disabled:opacity-60"
      >
        {scanning ? (
          <>
            <Sparkles className="w-4 h-4 animate-pulse" /> Leyendo recibo con IA…
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" /> Escanear recibo con IA
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickReceipt(f);
          e.target.value = "";
        }}
      />
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Monto
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-base mt-1 outline-none"
              autoFocus
            />
          </label>
          <label className="text-xs text-muted-foreground space-y-1">
            Fecha
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm mt-1"
            />
          </label>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Categoría</div>
          <div className="flex flex-wrap gap-1.5">
            {allCats.map((c) => {
              const on = category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className={`px-2.5 py-1.5 rounded-full text-xs border ${
                    on ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {c.emoji} {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Método de pago</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => {
              const on = paymentMethod === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-2.5 py-1.5 rounded-full text-xs border ${
                    on ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>

        {paymentMethod === "credit" && activeCards.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Tarjeta</div>
            <div className="flex flex-wrap gap-1.5">
              {activeCards.map((c) => {
                const on = cardId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCardId(c.id)}
                    className={`px-2.5 py-1.5 rounded-full text-xs border ${
                      on ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {c.icon} {c.name} ····{c.last_four}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          rows={2}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!amount || saving}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> {saving ? "Guardando…" : "Registrar gasto"}
        </button>
      </div>

      <Link
        to="/finance"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
      >
        Ver finanzas <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------------- Hábitos ---------------- */
function HabitsQuick() {
  const { state, toggleHabitForDate } = useAppState();
  const today = todayCDMX();
  const habits = state.habits;

  if (habits.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes hábitos"
        cta={{ to: "/habits", label: "Crear hábito" }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <SectionHint text="Toca para marcar como hecho hoy" />
      {habits.map((h) => {
        const done = h.history.includes(today);
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              toggleHabitForDate(h.id, today);
              toast.success(done ? "Desmarcado" : `+${h.points} XP · ${h.name}`);
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
              done
                ? "bg-primary/10 border-primary/40"
                : "bg-card border-border active:bg-secondary/40"
            }`}
          >
            <div className="text-2xl">{h.emoji}</div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium truncate">{h.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" />{h.streak}</span>
                <span>· +{h.points} XP</span>
              </div>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                done ? "bg-primary border-primary text-primary-foreground" : "border-border"
              }`}
            >
              {done && <Check className="w-4 h-4" />}
            </div>
          </button>
        );
      })}
      <Link
        to="/habits"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
      >
        Gestionar hábitos <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------------- Tareas ---------------- */
function TasksQuick() {
  const { state, addTask } = useAppState();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState<string>("");

  const listId = state.taskLists[0]?.id ?? "";

  const pendingToday = useMemo(() => {
    const today = todayCDMX();
    return state.tasks
      .filter((t) => t.status !== "completed" && (t.due ?? "").slice(0, 10) === today)
      .slice(0, 5);
  }, [state.tasks]);

  const submit = () => {
    if (!title.trim() || !listId) return;
    addTask({
      title: title.trim(),
      priority,
      listId,
      tags: [],
      due: due || undefined,
    });
    setTitle("");
    setDue("");
    setPriority("medium");
    toast.success("Tarea creada");
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué tienes que hacer?"
          className="w-full bg-transparent border-0 outline-none text-base"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="flex flex-wrap gap-2">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                priority === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
              }`}
            >
              {p === "high" ? "Alta" : p === "medium" ? "Media" : "Baja"}
            </button>
          ))}
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="ml-auto text-xs bg-secondary/30 border border-border rounded-full px-3 py-1.5"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim()}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar tarea
        </button>
      </div>

      {pendingToday.length > 0 && (
        <div>
          <SectionHint text="Pendientes de hoy" />
          <div className="space-y-2">
            {pendingToday.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-border bg-secondary/20 text-sm">
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/tasks"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
      >
        Ver todas <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------------- Mood ---------------- */
function MoodQuick() {
  const { add, logs } = useMood();
  const [mood, setMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    if (!mood) return;
    setSaving(true);
    const err = await add({ mood, intensity, tags, note: note || undefined });
    setSaving(false);
    if (err) return toast.error("No se pudo guardar");
    toast.success("Mood registrado");
    setMood(null);
    setTags([]);
    setNote("");
    setIntensity(3);
  };

  const last = logs[0];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-border bg-card space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(m.key)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                mood === m.key ? "bg-primary/10 border-primary/50" : "border-border"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Intensidad</span>
            <span className="font-display text-lg font-bold">{intensity}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Etiquetas</div>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border ${
                    on
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          rows={2}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!mood || saving}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Registrar mood"}
        </button>
      </div>

      {last && (
        <div className="text-xs text-muted-foreground text-center">
          Último registro:{" "}
          {MOOD_OPTIONS.find((m) => m.key === last.mood)?.emoji}{" "}
          {new Date(last.logged_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sueño ---------------- */
function SleepQuick() {
  const { upsert, logs, avgDurationMin, sleepDebtMin } = useSleep();
  const [date, setDate] = useState(todayCDMX());
  const [bedtime, setBedtime] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const durationMin = useMemo(() => {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }, [bedtime, wake]);

  const submit = async () => {
    setSaving(true);
    // bedtime/wake_time son TIMESTAMPTZ en la DB. Convertimos las horas locales
    // asumiendo que la fecha "date" es la del despertar; si dormí >=18h, es el día anterior.
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    const bed = new Date(`${date}T${bedtime}:00`);
    if (bh >= 18) bed.setDate(bed.getDate() - 1);
    const wk = new Date(`${date}T${wake}:00`);
    void bm; void wh; void wm;
    const err = await upsert({
      date,
      bedtime: bed.toISOString(),
      wake_time: wk.toISOString(),
      duration_minutes: durationMin,
      quality,
      notes: notes || null,
    });

    setSaving(false);
    if (err) return toast.error("No se pudo guardar");
    toast.success("Sueño registrado");
    setNotes("");
  };

  const hh = Math.floor(durationMin / 60);
  const mm = durationMin % 60;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Promedio 7d" value={`${Math.floor(avgDurationMin / 60)}h ${Math.round(avgDurationMin % 60)}m`} />
        <StatCard label="Deuda 7d" value={`${Math.floor(sleepDebtMin / 60)}h`} tone={sleepDebtMin > 300 ? "warn" : "ok"} />
      </div>

      <div className="p-4 rounded-2xl border border-border bg-card space-y-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            Dormí a
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm mt-1" />
          </label>
          <label className="text-xs text-muted-foreground space-y-1">
            Desperté
            <input type="time" value={wake} onChange={(e) => setWake(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm mt-1" />
          </label>
        </div>
        <div className="text-center text-sm">
          Total: <span className="font-display font-bold text-lg">{hh}h {mm}m</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Calidad</span>
            <span className="font-display text-lg font-bold">{quality}/5</span>
          </div>
          <input type="range" min={1} max={5} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (sueños, despertares…)"
          rows={2}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar sueño"}
        </button>
      </div>

      {logs[0] && (
        <div className="text-xs text-muted-foreground text-center">
          Último: {logs[0].date} · {Math.floor((logs[0].duration_minutes ?? 0) / 60)}h {(logs[0].duration_minutes ?? 0) % 60}m
        </div>
      )}
    </div>
  );
}

/* ---------------- Comidas ---------------- */
const MEAL_TYPES = [
  { key: "desayuno", label: "Desayuno", emoji: "🍳" },
  { key: "comida", label: "Comida", emoji: "🍲" },
  { key: "snack", label: "Snack", emoji: "🥜" },
  { key: "cena", label: "Cena", emoji: "🍽️" },
] as const;

function MealsQuick() {
  // Import dinámico ligero: usamos useMeals directo si existe. Fallback a link.
  // Nota: use-meals expone setPlanEntry(date, meal_type, dish_id, custom_name)
  const [date, setDate] = useState(todayCDMX());
  const [type, setType] = useState<typeof MEAL_TYPES[number]["key"]>("comida");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const meals = useMeals();

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await meals.setPlanEntry(date, type as never, null, name.trim());
      toast.success("Comida registrada");
      setName("");
    } catch {
      toast.error("No se pudo guardar");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-border bg-card space-y-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setType(m.key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border ${
                type === m.key ? "bg-primary/10 border-primary/50" : "border-border"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="¿Qué comiste?"
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm outline-none"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || saving}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Registrar comida"}
        </button>
      </div>

      <Link
        to="/meals"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
      >
        Plan semanal <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------------- Energía ---------------- */
function EnergyQuick() {
  const { state, today, logEnergy } = useAppState();
  const existing = state.energy.find((e) => e.date === today);
  const [physical, setPhysical] = useState(existing?.physical ?? 7);
  const [mental, setMental] = useState(existing?.mental ?? 7);
  const [emotional, setEmotional] = useState(existing?.emotional ?? 7);
  const [sleep, setSleep] = useState(existing?.sleep ?? 7);
  const [pain, setPain] = useState(existing?.pain ?? 1);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const submit = () => {
    logEnergy({ date: today, physical, mental, emotional, sleep, pain, notes: notes || undefined });
    toast.success("Energía registrada");
  };

  const Row = ({ label, value, onChange, color }: { label: string; value: number; onChange: (n: number) => void; color: string }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color }}>{label}</span>
        <span className="font-display font-bold" style={{ color }}>{value}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-border bg-card space-y-4">
        <Row label="Físico"   value={physical}  onChange={setPhysical}  color="#f59e0b" />
        <Row label="Mental"   value={mental}    onChange={setMental}    color="#3b82f6" />
        <Row label="Emocional" value={emotional} onChange={setEmotional} color="#ec4899" />
        <Row label="Sueño"    value={sleep}     onChange={setSleep}     color="#8b5cf6" />
        <Row label="Dolor"    value={pain}      onChange={setPain}      color="#ef4444" />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas del día (opcional)"
          rows={2}
          className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={submit}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium"
        >
          Guardar energía de hoy
        </button>
      </div>

      <Link
        to="/energy"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
      >
        Ver historial <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function SectionHint({ text }: { text: string }) {
  return <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2 mt-1">{text}</div>;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`p-3 rounded-2xl border ${tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState({ title, cta }: { title: string; cta: { to: string; label: string } }) {
  return (
    <div className="p-8 text-center rounded-2xl border border-dashed border-border">
      <div className="text-sm text-muted-foreground mb-4">{title}</div>
      <Link to={cta.to} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        <Plus className="w-4 h-4" /> {cta.label}
      </Link>
    </div>
  );
}

/* ---------------- Utils ---------------- */
async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
