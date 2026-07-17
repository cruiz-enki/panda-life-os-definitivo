/**
 * **Feature** — Componentes (parts) del módulo **Calendario**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type GCalEvent,
} from "@/lib/calendar.functions";
import {
  buildDayPlan,
  detectOverload,
  estimateTaskMinutes,
  formatDuration,
  formatTime,
  freeSlotsForDay,
  nextWorkdayISO,
  suggestTasksForSlots,
  tasksToReprogram,
  weekBounds,
  weeklyAnalysis,
  DEFAULT_WORKING_HOURS,
  type ScheduledBlock,
} from "@/lib/planner";
import { useAppState, avgEnergy, isOverdue } from "@/lib/storage";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Zap,
  CheckSquare,
  StickyNote,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Pencil,
  Save,
} from "lucide-react";
import { CALENDAR_CATEGORIES, categoryFromColorId, categoryById } from "@/lib/calendar-categories";

export type EventFormSubmit =
  | { mode: "create"; summary: string; description?: string; startISO: string; endISO: string; colorId?: string }
  | { mode: "edit"; eventId: string; summary: string; description?: string; startISO: string; endISO: string; colorId?: string };

export function EventFormModal({
  mode,
  defaultDate,
  initialEvent,
  submitting,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  defaultDate: Date;
  initialEvent?: GCalEvent;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: EventFormSubmit) => Promise<boolean>;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocalInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const computeInitial = () => {
    if (mode === "edit" && initialEvent) {
      const sStr = initialEvent.start.dateTime ?? initialEvent.start.date;
      const eStr = initialEvent.end.dateTime ?? initialEvent.end.date;
      const s = sStr ? new Date(sStr) : new Date(defaultDate);
      const e = eStr ? new Date(eStr) : new Date(s.getTime() + 60 * 60 * 1000);
      const cat = categoryFromColorId(initialEvent.colorId);
      return {
        summary: initialEvent.summary ?? "",
        description: initialEvent.description ?? "",
        start: toLocalInput(s),
        end: toLocalInput(e),
        categoryId: cat?.id ?? "personal",
      };
    }
    const initialStart = new Date(defaultDate);
    const now = new Date();
    initialStart.setHours(now.getHours() + 1, 0, 0, 0);
    const initialEnd = new Date(initialStart);
    initialEnd.setHours(initialEnd.getHours() + 1);
    return {
      summary: "",
      description: "",
      start: toLocalInput(initialStart),
      end: toLocalInput(initialEnd),
      categoryId: "personal",
    };
  };

  const init = computeInitial();
  const [summary, setSummary] = useState(init.summary);
  const [description, setDescription] = useState(init.description);
  const [start, setStart] = useState(init.start);
  const [end, setEnd] = useState(init.end);
  const [categoryId, setCategoryId] = useState<string>(init.categoryId);
  const [localError, setLocalError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!summary.trim()) {
      setLocalError("El título es obligatorio");
      return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setLocalError("Fechas inválidas");
      return;
    }
    if (endDate <= startDate) {
      setLocalError("El fin debe ser posterior al inicio");
      return;
    }
    const colorId = categoryById(categoryId)?.colorId;
    if (isEdit && initialEvent) {
      await onSubmit({
        mode: "edit",
        eventId: initialEvent.id,
        summary: summary.trim(),
        description: description.trim() || undefined,
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        colorId,
      });
    } else {
      await onSubmit({
        mode: "create",
        summary: summary.trim(),
        description: description.trim() || undefined,
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        colorId,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            {isEdit ? <Pencil className="w-5 h-5 text-primary" /> : <CalendarIcon className="w-5 h-5 text-primary" />}
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Título</label>
          <input
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ej. Reunión con equipo"
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Inicio</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fin</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notas, agenda, enlaces…"
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Categoría</label>
          <div className="flex flex-wrap gap-1.5">
            {CALENDAR_CATEGORIES.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active ? "border-foreground" : "border-border opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: active ? `${cat.hex}33` : "transparent",
                    color: active ? cat.hex : undefined,
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {localError && (
          <div className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {localError}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isEdit ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting
              ? isEdit
                ? "Guardando…"
                : "Creando…"
              : isEdit
                ? "Guardar cambios"
                : "Crear en Google"}
          </button>
        </div>
      </form>
    </div>
  );
}


export function DayView({
  date,
  events,
  plan,
  slots,
  blocks,
  overload,
  reprogramables,
  energyAvg,
  scheduling,
  onBlock,
  onBlockAll,
  onReprogramAll,
  onDeleteEvent,
  onTaskFromEvent,
  onNoteFromEvent,
  onEditEvent,
}: {
  date: Date;
  events: GCalEvent[];
  plan: ReturnType<typeof buildDayPlan>;
  slots: ReturnType<typeof freeSlotsForDay>;
  blocks: ScheduledBlock[];
  overload: ReturnType<typeof detectOverload>;
  reprogramables: ReturnType<typeof tasksToReprogram>;
  energyAvg: number | null;
  scheduling: string | null;
  onBlock: (b: ScheduledBlock) => void;
  onBlockAll: () => void;
  onReprogramAll: () => void;
  onDeleteEvent: (id: string) => void;
  onTaskFromEvent: (e: GCalEvent) => void;
  onNoteFromEvent: (e: GCalEvent) => void;
  onEditEvent: (e: GCalEvent) => void;
}) {
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(date.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }));
  }, [date]);

  const totalFree = slots.reduce((acc, s) => acc + s.durationMin, 0);
  const overloadTone =
    overload.tone === "danger"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : overload.tone === "warning"
        ? "border-[var(--xp)]/40 bg-[var(--xp)]/10 text-[var(--xp)]"
        : overload.tone === "success"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-secondary text-muted-foreground";

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground capitalize">{dateLabel}</p>

      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${overloadTone}`}>
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div className="flex-1">
          <div className="font-medium">{overload.message}</div>
          <div className="text-xs opacity-80 mt-0.5">
            {formatDuration(totalFree)} libres · {events.length} eventos
            {energyAvg !== null && ` · energía ${energyAvg.toFixed(1)}/10`}
          </div>
        </div>
      </div>

      {reprogramables.length > 0 && (
        <div className="p-4 rounded-2xl border border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium text-destructive">{reprogramables.length} tarea{reprogramables.length > 1 ? "s" : ""} vencida{reprogramables.length > 1 ? "s" : ""}</span>
            <span className="text-muted-foreground"> · reprogramar para mañana</span>
          </div>
          <button
            onClick={onReprogramAll}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium"
          >
            Reprogramar todo
          </button>
        </div>
      )}

      {/* Suggested blocks */}
      {blocks.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Sugerencias para tus huecos</h2>
            </div>
            <button
              onClick={onBlockAll}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Bloquear todo
            </button>
          </div>
          <div className="space-y-2">
            {blocks.map((b) => (
              <div
                key={b.task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60"
              >
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.task.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(b.blockStart)} – {formatTime(b.blockEnd)} · {formatDuration(b.durationMin)} · {b.task.priority}
                  </div>
                </div>
                <button
                  onClick={() => onBlock(b)}
                  disabled={scheduling === b.task.id}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {scheduling === b.task.id ? "..." : "Bloquear"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Day plan */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" /> Plan del día
        </h2>
        {plan.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos ni tareas para hoy. Día abierto 🐼</p>
        ) : (
          <div className="space-y-2">
            {plan.map((item, i) => {
              const time = `${formatTime(item.start)} – ${formatTime(item.end)}`;
              if (item.kind === "event") {
                return (
                  <div key={`e-${item.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-1 self-stretch rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{time}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        title="Editar evento"
                        onClick={() => {
                          const ev = events.find((e) => e.id === item.id);
                          if (ev) onEditEvent(ev);
                        }}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Crear tarea desde evento"
                        onClick={() => onTaskFromEvent(events.find((e) => e.id === item.id)!)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Crear nota desde evento"
                        onClick={() => onNoteFromEvent(events.find((e) => e.id === item.id)!)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Eliminar evento"
                        onClick={() => onDeleteEvent(item.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
              if (item.kind === "block") {
                return (
                  <div key={`b-${item.task.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{time} · sugerido</div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={`f-${i}`} className="flex items-center gap-3 p-2 rounded-xl text-xs text-muted-foreground">
                  <div className="w-1 self-stretch rounded-full bg-border" />
                  <span>{time} · {formatDuration(item.durationMin)} libres</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Free slots */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Espacios libres
        </h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin huecos disponibles en horario laboral.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {slots.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-secondary/60 text-sm">
                <div className="font-medium">{formatTime(s.start)} – {formatTime(s.end)}</div>
                <div className="text-xs text-muted-foreground">{formatDuration(s.durationMin)} libres</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function WeekView({ date, events, onEditEvent }: { date: Date; events: GCalEvent[]; onEditEvent: (e: GCalEvent) => void }) {
  const wb = weekBounds(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wb.start);
    d.setDate(wb.start.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d) => {
        const dayEvs = events
          .filter((ev) => {
            const s = ev.start.dateTime ?? ev.start.date;
            return s && new Date(s).toDateString() === d.toDateString();
          })
          .sort((a, b) => {
            const sa = a.start.dateTime ?? a.start.date ?? "";
            const sb = b.start.dateTime ?? b.start.date ?? "";
            return sa.localeCompare(sb);
          });
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <div
            key={d.toISOString()}
            className={`rounded-2xl border p-3 min-h-[180px] ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {d.toLocaleDateString("es", { weekday: "short" })}
            </div>
            <div className="font-display text-2xl font-bold mb-2">{d.getDate()}</div>
            <div className="space-y-1">
              {dayEvs.length === 0 && <div className="text-xs text-muted-foreground/60">Libre</div>}
              {dayEvs.map((ev) => {
                const s = ev.start.dateTime ?? ev.start.date;
                const time = s && ev.start.dateTime ? formatTime(new Date(s)) : "Todo el día";
                const cat = categoryFromColorId(ev.colorId);
                return (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={() => onEditEvent(ev)}
                    className="w-full text-left text-xs p-1.5 rounded-md truncate flex items-center gap-1.5 hover:ring-1 hover:ring-primary/40 transition"
                    style={{
                      backgroundColor: cat ? `${cat.hex}22` : undefined,
                      borderLeft: cat ? `3px solid ${cat.hex}` : undefined,
                    }}
                    title={`Editar · ${ev.summary ?? ""}`}
                  >
                    {cat ? null : <span className="w-1 h-1 rounded-full bg-muted-foreground" />}
                    <span className="text-muted-foreground">{time}</span>
                    <span className="truncate">{ev.summary ?? "(sin título)"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalysisView({ weekly }: { weekly: ReturnType<typeof weeklyAnalysis> }) {
  const total = weekly.totalBusyMin + weekly.totalFreeMin;
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Uso del tiempo esta semana
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Ocupado" value={formatDuration(weekly.totalBusyMin)} sub={`${total ? Math.round((weekly.totalBusyMin / total) * 100) : 0}%`} />
          <Stat label="Libre" value={formatDuration(weekly.totalFreeMin)} sub="en horario laboral" />
          <Stat
            label="Día más cargado"
            value={weekly.busiestDay ? weekly.busiestDay.date.toLocaleDateString("es", { weekday: "short" }) : "—"}
            sub={weekly.busiestDay ? formatDuration(weekly.busiestDay.minutes) : ""}
          />
        </div>

        <h3 className="font-medium text-sm mb-3 text-muted-foreground">Por categoría</h3>
        {weekly.byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos en la semana.</p>
        ) : (
          <div className="space-y-2">
            {weekly.byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{c.category}</span>
                  <span className="text-muted-foreground text-xs">{formatDuration(c.minutes)} · {Math.round(c.share * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mt-1">
                  <div className="h-full bg-gradient-primary" style={{ width: `${c.share * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-muted-foreground text-center">
        <Link to="/tasks" className="text-primary hover:underline inline-flex items-center gap-1">
          Ver tareas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-secondary/50">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function MonthView({
  date,
  events,
  onPickDay,
  onEditEvent,
}: {
  date: Date;
  events: GCalEvent[];
  onPickDay: (d: Date) => void;
  onEditEvent: (e: GCalEvent) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const monthLabel = firstOfMonth.toLocaleDateString("es", { month: "long", year: "numeric" });
  const today = new Date();
  const todayStr = today.toDateString();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GCalEvent[]>();
    for (const ev of events) {
      const s = ev.start.dateTime ?? ev.start.date;
      if (!s) continue;
      const key = new Date(s).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const monthSummary = useMemo(() => {
    const counts = new Map<string, { label: string; emoji: string; hex: string; count: number }>();
    let uncategorized = 0;
    for (const ev of events) {
      const s = ev.start.dateTime ?? ev.start.date;
      if (!s) continue;
      const d = new Date(s);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      const cat = categoryFromColorId(ev.colorId);
      if (!cat) {
        uncategorized++;
        continue;
      }
      const cur = counts.get(cat.id) ?? { label: cat.label, emoji: cat.emoji, hex: cat.hex, count: 0 };
      cur.count++;
      counts.set(cat.id, cur);
    }
    return { items: Array.from(counts.values()).sort((a, b) => b.count - a.count), uncategorized };
  }, [events, month, year]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold capitalize">{monthLabel}</h2>
      </div>

      <div className="rounded-3xl border border-border bg-card p-3 md:p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((w) => (
            <div key={w} className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground text-center py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const inMonth = d.getMonth() === month;
            const isToday = d.toDateString() === todayStr;
            const dayEvs = eventsByDay.get(d.toDateString()) ?? [];
            const visible = dayEvs.slice(0, 3);
            const extra = dayEvs.length - visible.length;
            return (
              <div
                key={d.toISOString()}
                className={`min-h-[68px] md:min-h-[88px] rounded-xl p-1.5 text-left border transition-all flex flex-col ${
                  isToday
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/40 hover:bg-secondary/60"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                <button
                  type="button"
                  onClick={() => onPickDay(d)}
                  className={`text-xs md:text-sm font-semibold text-left ${isToday ? "text-primary" : ""} hover:underline`}
                  title="Abrir día"
                >
                  {d.getDate()}
                </button>
                <div className="mt-1 space-y-0.5 flex-1">
                  {visible.map((ev) => {
                    const cat = categoryFromColorId(ev.colorId);
                    const color = cat?.hex ?? "#888";
                    return (
                      <button
                        type="button"
                        key={ev.id}
                        onClick={() => onEditEvent(ev)}
                        className="w-full flex items-center gap-1 text-[10px] truncate text-left rounded px-0.5 hover:bg-secondary/80"
                        title={`Editar · ${ev.summary ?? ""}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{ev.summary ?? "(sin título)"}</span>
                      </button>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={() => onPickDay(d)}
                      className="text-[10px] text-muted-foreground hover:underline"
                    >
                      +{extra} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h3 className="font-display text-base font-bold mb-3">Resumen del mes</h3>
        {monthSummary.items.length === 0 && monthSummary.uncategorized === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos este mes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {monthSummary.items.map((c) => (
              <div
                key={c.label}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{ backgroundColor: `${c.hex}22`, borderColor: `${c.hex}66`, color: c.hex }}
              >
                {c.emoji} {c.label} · {c.count}
              </div>
            ))}
            {monthSummary.uncategorized > 0 && (
              <div className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground bg-secondary/40">
                📌 Sin categoría · {monthSummary.uncategorized}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
// silence unused import lint when estimateTaskMinutes/isOverdue not directly used in render
void estimateTaskMinutes;
void isOverdue;
void DEFAULT_WORKING_HOURS;
