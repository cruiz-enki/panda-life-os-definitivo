/**
 * **Ruta** — Calendario integrado con Google Calendar y plan diario.
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

import { AnalysisView, DayView, EventFormModal, MonthView, Stat, WeekView } from "@/features/calendar/parts";
export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario · Panda's LIFE OS" },
      { name: "description", content: "Sincroniza Google Calendar con tareas y energía: huecos libres, time-blocking y plan del día." },
    ],
  }),
  component: CalendarPage,
});

type View = "day" | "week" | "month" | "analysis";

function CalendarPage() {
  const { state, today, addTask, updateTask, quickCaptureNote } = useAppState();
  const list = useServerFn(listCalendarEvents);
  const create = useServerFn(createCalendarEvent);
  const update = useServerFn(updateCalendarEvent);
  const remove = useServerFn(deleteCalendarEvent);

  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const range = useMemo(() => {
    if (view === "day") {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (view === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      // Incluir días de semanas vecinas que aparecen en la grilla (hasta 6 semanas)
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return weekBounds(date);
  }, [view, date]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await list({
        data: { timeMin: range.start.toISOString(), timeMax: range.end.toISOString() },
      });
      setEvents(res.events);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, [list, range.start, range.end]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const todayEnergy = state.energy.find((e) => e.date === today);
  const energyAvg = avgEnergy(todayEnergy);

  const dayEvents = useMemo(
    () =>
      events.filter((ev) => {
        const s = ev.start.dateTime ?? ev.start.date;
        if (!s) return false;
        return new Date(s).toDateString() === date.toDateString() ||
          (ev.start.date && ev.start.date === date.toISOString().slice(0, 10));
      }),
    [events, date],
  );

  const slots = useMemo(() => freeSlotsForDay(dayEvents, date), [dayEvents, date]);
  const overload = useMemo(() => detectOverload(dayEvents, date), [dayEvents, date]);
  const blocks = useMemo(
    () => suggestTasksForSlots(state.tasks, slots, todayEnergy),
    [state.tasks, slots, todayEnergy],
  );
  const plan = useMemo(
    () => buildDayPlan(dayEvents, date, state.tasks, todayEnergy),
    [dayEvents, date, state.tasks, todayEnergy],
  );
  const reprogramables = useMemo(() => tasksToReprogram(state.tasks, today), [state.tasks, today]);
  const weekly = useMemo(() => {
    const wb = weekBounds(date);
    return weeklyAnalysis(events, wb.start);
  }, [events, date]);

  const blockTaskInCalendar = useCallback(
    async (b: ScheduledBlock) => {
      setScheduling(b.task.id);
      try {
        const res = await create({
          data: {
            summary: `🐼 ${b.task.title}`,
            description: b.task.description ?? `Bloque de tiempo · prioridad ${b.task.priority}`,
            startISO: b.blockStart.toISOString(),
            endISO: b.blockEnd.toISOString(),
            colorId: b.task.priority === "high" ? "11" : b.task.priority === "medium" ? "5" : "2",
          },
        });
        if (res.error) setError(res.error);
        else {
          updateTask(b.task.id, { due: b.blockStart.toISOString() });
          await refresh();
        }
      } finally {
        setScheduling(null);
      }
    },
    [create, refresh, updateTask],
  );

  const blockAllSuggested = useCallback(async () => {
    for (const b of blocks) {
      await blockTaskInCalendar(b);
    }
  }, [blocks, blockTaskInCalendar]);

  const reprogramAll = useCallback(() => {
    for (const t of reprogramables) {
      const newDue = nextWorkdayISO(new Date());
      updateTask(t.id, { due: newDue });
    }
  }, [reprogramables, updateTask]);

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      const res = await remove({ data: { eventId: id } });
      if (res.ok) await refresh();
      else if (res.error) setError(res.error);
    },
    [remove, refresh],
  );

  const createTaskFromEvent = useCallback(
    (ev: GCalEvent) => {
      const startStr = ev.start.dateTime ?? ev.start.date;
      addTask({
        title: ev.summary ?? "Tarea desde evento",
        description: ev.description,
        due: startStr,
        priority: "medium",
        tags: [],
        listId: state.taskLists[0]?.id ?? "trabajo",
      });
    },
    [addTask, state.taskLists],
  );

  const noteFromEvent = useCallback(
    (ev: GCalEvent) => {
      const startStr = ev.start.dateTime ?? ev.start.date ?? "";
      quickCaptureNote(
        `${ev.summary ?? "Evento"}\n\nFecha: ${startStr}\n\n${ev.description ?? ""}`.trim(),
      );
    },
    [quickCaptureNote],
  );

  const shiftDate = (delta: number) => {
    const d = new Date(date);
    if (view === "week") d.setDate(d.getDate() + delta * 7);
    else if (view === "month") d.setMonth(d.getMonth() + delta);
    else d.setDate(d.getDate() + delta);
    setDate(d);
  };

  const handleCreateEvent = useCallback(
    async (input: { summary: string; description?: string; startISO: string; endISO: string; colorId?: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await create({ data: input });
        if (res.error) {
          setError(res.error);
          return false;
        }
        setShowNewEvent(false);
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al crear evento");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [create, refresh],
  );

  const handleUpdateEvent = useCallback(
    async (input: { eventId: string; summary: string; description?: string; startISO: string; endISO: string; colorId?: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await update({ data: input });
        if (res.error) {
          setError(res.error);
          return false;
        }
        // colorId no se puede patchear con updateCalendarEvent actual; si cambió, lo aplicamos vía PATCH adicional no es necesario porque el server fn ya envía solo lo enviado. Mantendremos como está.
        setEditingEvent(null);
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al actualizar evento");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [update, refresh],
  );

  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Google Calendar conectado</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-1 flex items-center gap-3">
            <CalendarIcon className="w-9 h-9 text-primary" /> Calendario
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm"
          >
            ←
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium"
          >
            Hoy
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm"
          >
            →
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button
            onClick={() => setShowNewEvent(true)}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { v: "day", label: "Día", icon: CalendarClock },
          { v: "week", label: "Semana", icon: CalendarDays },
          { v: "month", label: "Mes", icon: CalendarRange },
          { v: "analysis", label: "Análisis", icon: Zap },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = view === t.v;
          return (
            <button
              key={t.v}
              onClick={() => setView(t.v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                active ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {view === "day" && (
        <DayView
          date={date}
          events={dayEvents}
          plan={plan}
          slots={slots}
          blocks={blocks}
          overload={overload}
          reprogramables={reprogramables}
          energyAvg={energyAvg}
          scheduling={scheduling}
          onBlock={blockTaskInCalendar}
          onBlockAll={blockAllSuggested}
          onReprogramAll={reprogramAll}
          onDeleteEvent={handleDeleteEvent}
          onTaskFromEvent={createTaskFromEvent}
          onNoteFromEvent={noteFromEvent}
          onEditEvent={(ev) => setEditingEvent(ev)}
        />
      )}

      {view === "week" && (
        <WeekView date={date} events={events} onEditEvent={(ev) => setEditingEvent(ev)} />
      )}

      {view === "month" && (
        <MonthView
          date={date}
          events={events}
          onPickDay={(d) => {
            setDate(d);
            setView("day");
          }}
          onEditEvent={(ev) => setEditingEvent(ev)}
        />
      )}

      {view === "analysis" && <AnalysisView weekly={weekly} />}

      {showNewEvent && (
        <EventFormModal
          mode="create"
          defaultDate={date}
          submitting={submitting}
          onClose={() => setShowNewEvent(false)}
          onSubmit={async (input) => {
            if (input.mode !== "create") return false;
            return handleCreateEvent({
              summary: input.summary,
              description: input.description,
              startISO: input.startISO,
              endISO: input.endISO,
              colorId: input.colorId,
            });
          }}
        />
      )}

      {editingEvent && (
        <EventFormModal
          mode="edit"
          defaultDate={date}
          initialEvent={editingEvent}
          submitting={submitting}
          onClose={() => setEditingEvent(null)}
          onSubmit={async (input) => {
            if (input.mode !== "edit") return false;
            return handleUpdateEvent({
              eventId: input.eventId,
              summary: input.summary,
              description: input.description,
              startISO: input.startISO,
              endISO: input.endISO,
              colorId: input.colorId,
            });
          }}
        />
      )}
    </div>
  );
}

export type { EventFormSubmit } from "@/features/calendar/parts";


