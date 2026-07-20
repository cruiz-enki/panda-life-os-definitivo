/**
 * **Ruta** — Timeline unificado por día. Aglutina eventos de todos los módulos.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppState } from "@/lib/storage";
import { useFinance } from "@/hooks/use-finance";
import { useSleep } from "@/hooks/use-sleep";
import { useMood } from "@/hooks/use-mood";
import { useHealth } from "@/hooks/use-health";
import { useMeals } from "@/hooks/use-meals";
import { useLocations } from "@/hooks/use-locations";
import { useContacts } from "@/hooks/use-contacts";
import {
  CheckSquare, DollarSign, Moon, Smile, Pill, Utensils, MapPin, Users, Activity, StickyNote,
} from "lucide-react";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · Panda's LIFE OS" },
      { name: "description", content: "Un día, todo lo que pasó: sueño, gastos, comidas, meds, mood, tareas, contactos." },
    ],
  }),
  component: TimelinePage,
});

type Event = {
  id: string;
  ts: string; // ISO
  category: "sleep" | "expense" | "mood" | "med" | "meal" | "location" | "contact" | "task" | "symptom" | "body" | "note";
  title: string;
  detail?: string;
  href?: string;
};

const CAT_META: Record<Event["category"], { icon: typeof CheckSquare; color: string; label: string }> = {
  sleep: { icon: Moon, color: "text-indigo-400", label: "Sueño" },
  expense: { icon: DollarSign, color: "text-amber-400", label: "Gasto" },
  mood: { icon: Smile, color: "text-pink-400", label: "Mood" },
  med: { icon: Pill, color: "text-emerald-400", label: "Medicación" },
  meal: { icon: Utensils, color: "text-orange-400", label: "Comida" },
  location: { icon: MapPin, color: "text-cyan-400", label: "Lugar" },
  contact: { icon: Users, color: "text-purple-400", label: "Contacto" },
  task: { icon: CheckSquare, color: "text-green-400", label: "Tarea" },
  symptom: { icon: Activity, color: "text-red-400", label: "Malestar" },
  body: { icon: Activity, color: "text-teal-400", label: "Cuerpo" },
  note: { icon: StickyNote, color: "text-slate-400", label: "Nota" },
};

const ALL_CATS = Object.keys(CAT_META) as Event["category"][];

const dayKey = (iso: string) => iso.slice(0, 10);
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};
const fmtDayLabel = (isoDay: string) => {
  const d = new Date(isoDay + "T12:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const currency = (n: number) => `$${Math.abs(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

function TimelinePage() {
  const { state } = useAppState();
  const { expenses, cards } = useFinance();
  const { logs: sleepLogs } = useSleep();
  const { logs: moodLogs } = useMood();
  const { medications, medLogs, symptoms, body } = useHealth();
  const { plan: mealPlan, dishes } = useMeals();
  const { checkins } = useLocations();
  const { contacts, interactions } = useContacts();

  const [enabled, setEnabled] = useState<Set<Event["category"]>>(new Set(ALL_CATS));
  const toggle = (c: Event["category"]) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];

    // Sleep — bedtime prev + wake_time
    for (const s of sleepLogs) {
      const hours = s.duration_minutes ? (s.duration_minutes / 60).toFixed(1) : null;
      const parts = [hours ? `${hours}h` : null, s.quality != null ? `⭐ ${s.quality}/10` : null].filter(Boolean).join(" · ");
      out.push({
        id: `sleep-${s.id}`,
        ts: `${s.date}T07:00:00`,
        category: "sleep",
        title: hours ? `Dormiste ${hours}h` : "Registro de sueño",
        detail: parts || undefined,
        href: "/sleep",
      });
    }

    // Expenses
    const cardMap = new Map(cards.map((c) => [c.id, c.name]));
    for (const e of expenses) {
      const label = e.note?.trim() || e.category || "Movimiento";
      const via = e.card_id ? cardMap.get(e.card_id) ?? "" : e.payment_method;
      const sign = e.kind === "income" ? "+" : "−";
      out.push({
        id: `exp-${e.id}`,
        ts: `${e.date}T12:00:00`,
        category: "expense",
        title: `${sign}${currency(e.amount)} · ${label}`,
        detail: [e.category, via].filter(Boolean).join(" · "),
        href: e.card_id ? `/finance/cards/${e.card_id}` : "/finance",
      });
    }

    // Mood
    for (const m of moodLogs) {
      const bits: string[] = [];
      if (m.energy != null) bits.push(`⚡ ${m.energy}`);
      if (m.pain != null) bits.push(`🤕 ${m.pain}`);
      if (m.anxiety != null) bits.push(`😰 ${m.anxiety}`);
      if (m.stress != null) bits.push(`🔥 ${m.stress}`);
      if (m.trigger) bits.push(m.trigger);
      out.push({
        id: `mood-${m.id}`,
        ts: m.logged_at,
        category: "mood",
        title: `Mood: ${m.mood} (${m.intensity}/5)`,
        detail: [m.note ?? "", bits.join(" · ")].filter(Boolean).join(" — ") || undefined,
        href: "/mood",
      });
    }

    // Medications taken
    const medMap = new Map(medications.map((m) => [m.id, m]));
    for (const l of medLogs) {
      if (!l.taken) continue;
      const med = medMap.get(l.medication_id);
      out.push({
        id: `med-${l.id}`,
        ts: l.taken_at ?? `${l.date}T${l.scheduled_time || "08:00"}`,
        category: "med",
        title: `Tomaste ${med?.name ?? "medicamento"}`,
        detail: med ? `${med.dose} ${med.unit}` : undefined,
        href: "/health#meds",
      });
    }

    // Symptoms
    for (const s of symptoms as Array<{ id: string; date: string; symptom_key?: string; name?: string; severity?: number; notes?: string }>) {
      out.push({
        id: `sym-${s.id}`,
        ts: `${s.date}T12:00:00`,
        category: "symptom",
        title: `Malestar: ${s.name ?? s.symptom_key ?? "sin nombre"}`,
        detail: [s.severity != null ? `Intensidad ${s.severity}` : null, s.notes || null].filter(Boolean).join(" · ") || undefined,
        href: "/health#symptoms",
      });
    }

    // Body entries (only weight events)
    for (const b of body) {
      if (b.weight == null) continue;
      out.push({
        id: `body-${b.id}`,
        ts: `${b.date}T07:30:00`,
        category: "body",
        title: `Peso: ${b.weight} kg`,
        detail: [b.body_fat != null ? `Grasa ${b.body_fat}%` : null, b.muscle_mass != null ? `Músculo ${b.muscle_mass}` : null].filter(Boolean).join(" · ") || undefined,
        href: "/health#body",
      });
    }

    // Meals completed
    const dishMap = new Map(dishes.map((d) => [d.id, d]));
    for (const p of mealPlan) {
      if (!p.completed) continue;
      const dish = p.dish_id ? dishMap.get(p.dish_id) : null;
      const name = dish?.name || p.custom_name || "Comida";
      out.push({
        id: `meal-${p.id}`,
        ts: p.completed_at ?? `${p.date}T13:00:00`,
        category: "meal",
        title: `${dish?.emoji ?? "🍽️"} ${name}`,
        detail: p.meal_type,
        href: "/meals",
      });
    }

    // Locations
    for (const l of checkins) {
      out.push({
        id: `loc-${l.id}`,
        ts: l.visited_at,
        category: "location",
        title: l.name,
        detail: [l.category, l.address ?? "", l.note ?? ""].filter(Boolean).join(" · ") || undefined,
        href: "/locations",
      });
    }

    // Contact interactions
    const contactMap = new Map(contacts.map((c) => [c.id, c.name]));
    for (const i of interactions) {
      const name = contactMap.get(i.contact_id) ?? "Contacto";
      out.push({
        id: `int-${i.id}`,
        ts: i.occurred_at,
        category: "contact",
        title: `${i.kind}: ${name}`,
        detail: i.summary ?? i.notes ?? undefined,
        href: "/contacts",
      });
    }

    // Tasks completed
    for (const t of state.tasks) {
      if (t.status !== "completed" || !t.completedAt) continue;
      out.push({
        id: `task-${t.id}`,
        ts: t.completedAt,
        category: "task",
        title: `✓ ${t.title}`,
        detail: t.priority ? `Prioridad ${t.priority}` : undefined,
        href: "/tasks",
      });
    }

    // Notes updated
    for (const n of state.notes) {
      const ts = (n as { updatedAt?: string; createdAt?: string }).updatedAt ?? (n as { createdAt?: string }).createdAt;
      if (!ts) continue;
      out.push({
        id: `note-${n.id}`,
        ts,
        category: "note",
        title: n.title || "(nota sin título)",
        detail: n.content?.slice(0, 120),
        href: "/notes",
      });
    }

    return out.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [sleepLogs, expenses, cards, moodLogs, medications, medLogs, symptoms, body, mealPlan, dishes, checkins, contacts, interactions, state.tasks, state.notes]);

  const filtered = events.filter((e) => enabled.has(e.category));

  const byDay = useMemo(() => {
    const groups = new Map<string, Event[]>();
    for (const e of filtered) {
      const k = dayKey(e.ts);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(e);
    }
    return Array.from(groups.entries()).slice(0, 90); // 90 días máximo
  }, [filtered]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Timeline</h1>
        <p className="text-sm text-muted-foreground">
          Todo lo que pasó cada día, en un solo lugar.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {ALL_CATS.map((c) => {
          const meta = CAT_META[c];
          const Icon = meta.icon;
          const on = enabled.has(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                on ? "bg-secondary border-border text-foreground" : "bg-transparent border-border/40 text-muted-foreground/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${on ? meta.color : ""}`} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {byDay.length === 0 && (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border/40 rounded-2xl">
          Aún no hay eventos para mostrar.
        </div>
      )}

      <div className="space-y-6">
        {byDay.map(([day, evs]) => (
          <section key={day} className="space-y-3">
            <div className="sticky top-0 z-10 backdrop-blur bg-background/80 py-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {fmtDayLabel(day)}
              </h2>
              <p className="text-xs text-muted-foreground/60">{evs.length} evento{evs.length === 1 ? "" : "s"}</p>
            </div>
            <ul className="space-y-2">
              {evs.map((e) => {
                const meta = CAT_META[e.category];
                const Icon = meta.icon;
                const time = fmtTime(e.ts);
                const content = (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-border transition-colors">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{e.title}</span>
                        {time && <span className="text-[10px] text-muted-foreground/70 shrink-0">{time}</span>}
                      </div>
                      {e.detail && <div className="text-xs text-muted-foreground truncate">{e.detail}</div>}
                    </div>
                  </div>
                );
                return (
                  <li key={e.id}>
                    {e.href ? <Link to={e.href}>{content}</Link> : content}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
