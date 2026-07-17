/**
 * **Planificador**: huecos libres, time-blocking, plan diario, análisis
 * semanal y reprogramación de tareas a partir de eventos de Google Calendar.
 */
import type { GCalEvent } from "./calendar.functions";
import type { Task, EnergyEntry } from "./storage";
import { isOverdue, priorityRank, avgEnergy } from "./storage";

export type TimeRange = { start: Date; end: Date };
export type FreeSlot = TimeRange & { durationMin: number };
export type WorkingHours = { startHour: number; endHour: number }; // 0-24

export const DEFAULT_WORKING_HOURS: WorkingHours = { startHour: 8, endHour: 21 };

/**
 * Convierte un evento de Google Calendar a un rango de tiempo, o `null`
 * si es all-day.
 */
export function eventToRange(ev: GCalEvent): TimeRange | null {
  const startStr = ev.start?.dateTime ?? ev.start?.date;
  const endStr = ev.end?.dateTime ?? ev.end?.date;
  if (!startStr || !endStr) return null;
  return { start: new Date(startStr), end: new Date(endStr) };
}

/**
 * Detecta si un evento es de día completo (sin hora de inicio).
 */
export function isAllDay(ev: GCalEvent): boolean {
  return !!ev.start?.date && !ev.start?.dateTime;
}

/**
 * Rango horario laborable del día (por defecto 8h-21h).
 */
export function dayBounds(date: Date, hours: WorkingHours = DEFAULT_WORKING_HOURS): TimeRange {
  const start = new Date(date);
  start.setHours(hours.startHour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(hours.endHour, 0, 0, 0);
  return { start, end };
}

/**
 * Rango (lun 00:00 → lun siguiente 00:00) de la semana que contiene `date`.
 */
export function weekBounds(date: Date): TimeRange {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // monday = 0
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

/**
 * Devuelve los huecos libres de un día dado, restando los eventos ocupados.
 */
export function freeSlotsForDay(
  events: GCalEvent[],
  date: Date,
  hours: WorkingHours = DEFAULT_WORKING_HOURS,
  minSlotMin = 20,
): FreeSlot[] {
  const { start, end } = dayBounds(date, hours);
  const dayEvents = events
    .map(eventToRange)
    .filter((r): r is TimeRange => !!r)
    .filter((r) => r.end > start && r.start < end)
    .map((r) => ({
      start: r.start < start ? start : r.start,
      end: r.end > end ? end : r.end,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // merge overlaps
  const merged: TimeRange[] = [];
  for (const r of dayEvents) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ ...r });
    }
  }

  const slots: FreeSlot[] = [];
  let cursor = start;
  for (const r of merged) {
    if (r.start > cursor) {
      const durationMin = (r.start.getTime() - cursor.getTime()) / 60000;
      if (durationMin >= minSlotMin) {
        slots.push({ start: cursor, end: r.start, durationMin });
      }
    }
    if (r.end > cursor) cursor = r.end;
  }
  if (cursor < end) {
    const durationMin = (end.getTime() - cursor.getTime()) / 60000;
    if (durationMin >= minSlotMin) slots.push({ start: cursor, end, durationMin });
  }
  return slots;
}

/**
 * Suma los minutos ocupados por eventos dentro de `range`.
 */
export function totalBusyMin(events: GCalEvent[], range: TimeRange): number {
  const rs = events
    .map(eventToRange)
    .filter((r): r is TimeRange => !!r)
    .filter((r) => r.end > range.start && r.start < range.end)
    .map((r) => ({
      start: r.start < range.start ? range.start : r.start,
      end: r.end > range.end ? range.end : r.end,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeRange[] = [];
  for (const r of rs) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else merged.push({ ...r });
  }
  return merged.reduce((acc, r) => acc + (r.end.getTime() - r.start.getTime()) / 60000, 0);
}

export type OverloadAlert = {
  tone: "danger" | "warning" | "info" | "success";
  message: string;
};

/**
 * Detecta días con sobrecarga (más del umbral configurado).
 */
export function detectOverload(
  events: GCalEvent[],
  date: Date,
  hours: WorkingHours = DEFAULT_WORKING_HOURS,
): OverloadAlert {
  const day = dayBounds(date, hours);
  const total = (day.end.getTime() - day.start.getTime()) / 60000;
  const busy = totalBusyMin(events, day);
  const ratio = busy / total;
  const count = events.filter((e) => {
    const r = eventToRange(e);
    return r && r.end > day.start && r.start < day.end && !isAllDay(e);
  }).length;
  if (ratio >= 0.8 || count >= 8) {
    return { tone: "danger", message: `Agenda saturada: ${Math.round(ratio * 100)}% del día ocupado (${count} eventos)` };
  }
  if (ratio >= 0.6 || count >= 5) {
    return { tone: "warning", message: `Día cargado: ${Math.round(ratio * 100)}% ocupado` };
  }
  if (ratio < 0.15) {
    return { tone: "success", message: `Día abierto: solo ${Math.round(ratio * 100)}% ocupado — ideal para deep work` };
  }
  return { tone: "info", message: `${Math.round(ratio * 100)}% del día ocupado` };
}

/**
 * Estima la duración en minutos de una tarea según su prioridad.
 */
export function estimateTaskMinutes(t: Task): number {
  const base = t.priority === "high" ? 60 : t.priority === "medium" ? 40 : 25;
  const subBoost = t.subtasks.length * 8;
  return Math.min(180, base + subBoost);
}

export type ScheduledBlock = {
  task: Task;
  slot: FreeSlot;
  blockStart: Date;
  blockEnd: Date;
  durationMin: number;
};

/**
 * Empareja tareas pendientes con los huecos libres disponibles.
 */
export function suggestTasksForSlots(
  tasks: Task[],
  slots: FreeSlot[],
  energyToday: EnergyEntry | undefined,
): ScheduledBlock[] {
  const energy = avgEnergy(energyToday) ?? 6;
  const candidates = tasks
    .filter((t) => t.status !== "completed")
    .map((t) => {
      let score = 0;
      if (isOverdue(t)) score += 80;
      if (t.priority === "high") score += 40;
      else if (t.priority === "medium") score += 20;
      const moneyTags = new Set(["dinero", "cliente", "ventas", "urgente"]);
      if (t.tags.some((tg) => moneyTags.has(tg))) score += 15;
      // low energy → prefer light tasks
      if (energy < 4 && t.priority === "high") score -= 30;
      if (energy >= 7 && t.priority === "high") score += 15;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score || priorityRank(a.t.priority) - priorityRank(b.t.priority))
    .map((x) => x.t);

  const used = new Set<string>();
  const blocks: ScheduledBlock[] = [];
  // copy slots so we can shrink them as we fill
  const remaining = slots.map((s) => ({ ...s }));

  for (const slot of remaining) {
    let cursor = new Date(slot.start);
    let available = slot.durationMin;
    for (const t of candidates) {
      if (used.has(t.id)) continue;
      const need = estimateTaskMinutes(t);
      if (need > available) continue;
      const blockStart = new Date(cursor);
      const blockEnd = new Date(cursor.getTime() + need * 60000);
      blocks.push({ task: t, slot, blockStart, blockEnd, durationMin: need });
      used.add(t.id);
      cursor = new Date(blockEnd.getTime() + 5 * 60000); // 5 min buffer
      available = (slot.end.getTime() - cursor.getTime()) / 60000;
      if (available < 20) break;
    }
  }
  return blocks;
}

export type PlanItem =
  | { kind: "event"; start: Date; end: Date; title: string; id: string }
  | { kind: "block"; start: Date; end: Date; title: string; task: Task }
  | { kind: "free"; start: Date; end: Date; durationMin: number };

/**
 * Construye el plan del día mezclando eventos fijos y bloques sugeridos
 * para tareas.
 */
export function buildDayPlan(
  events: GCalEvent[],
  date: Date,
  tasks: Task[],
  energyToday: EnergyEntry | undefined,
  hours: WorkingHours = DEFAULT_WORKING_HOURS,
): PlanItem[] {
  const day = dayBounds(date, hours);
  const items: PlanItem[] = [];
  for (const ev of events) {
    const r = eventToRange(ev);
    if (!r || r.end <= day.start || r.start >= day.end) continue;
    items.push({
      kind: "event",
      start: r.start < day.start ? day.start : r.start,
      end: r.end > day.end ? day.end : r.end,
      title: ev.summary ?? "(sin título)",
      id: ev.id,
    });
  }
  const slots = freeSlotsForDay(events, date, hours, 20);
  const blocks = suggestTasksForSlots(tasks, slots, energyToday);
  for (const b of blocks) {
    items.push({ kind: "block", start: b.blockStart, end: b.blockEnd, title: b.task.title, task: b.task });
  }
  // free space leftover
  for (const s of slots) {
    items.push({ kind: "free", start: s.start, end: s.end, durationMin: s.durationMin });
  }
  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type WeeklyTimeBreakdown = {
  totalBusyMin: number;
  totalFreeMin: number;
  byCategory: { category: string; minutes: number; share: number }[];
  busiestDay: { date: Date; minutes: number } | null;
  lightestDay: { date: Date; minutes: number } | null;
};

function categorize(ev: GCalEvent): string {
  const text = `${ev.summary ?? ""} ${ev.description ?? ""}`.toLowerCase();
  if (/\b(reuni|meeting|call|llamada|sync)\b/.test(text)) return "Reuniones";
  if (/\b(client|cliente)\b/.test(text)) return "Clientes";
  if (/\b(deep|focus|enfoque|trabajo profundo)\b/.test(text)) return "Deep work";
  if (/\b(gym|ejercicio|run|yoga|salud|m[eé]dico)\b/.test(text)) return "Salud";
  if (/\b(personal|familia|comida|almuerzo)\b/.test(text)) return "Personal";
  if (/\b(aprend|curso|study|estudio|lectura)\b/.test(text)) return "Aprendizaje";
  return "Otros";
}

/**
 * Desglosa el uso del tiempo de la semana por categoría.
 */
export function weeklyAnalysis(events: GCalEvent[], weekStart: Date, hours: WorkingHours = DEFAULT_WORKING_HOURS): WeeklyTimeBreakdown {
  const byCat = new Map<string, number>();
  const perDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const day = dayBounds(d, hours);
    perDay.set(d.toDateString(), totalBusyMin(events, day));
  }
  for (const ev of events) {
    const r = eventToRange(ev);
    if (!r || isAllDay(ev)) continue;
    const min = (r.end.getTime() - r.start.getTime()) / 60000;
    if (min <= 0) continue;
    const cat = categorize(ev);
    byCat.set(cat, (byCat.get(cat) ?? 0) + min);
  }
  const totalBusy = Array.from(byCat.values()).reduce((a, b) => a + b, 0);
  const totalAvail = (hours.endHour - hours.startHour) * 60 * 7;
  const totalFree = Math.max(0, totalAvail - totalBusy);
  const byCategory = Array.from(byCat.entries())
    .map(([category, minutes]) => ({ category, minutes, share: totalBusy ? minutes / totalBusy : 0 }))
    .sort((a, b) => b.minutes - a.minutes);

  let busiest: { date: Date; minutes: number } | null = null;
  let lightest: { date: Date; minutes: number } | null = null;
  for (const [k, v] of perDay) {
    const d = new Date(k);
    if (!busiest || v > busiest.minutes) busiest = { date: d, minutes: v };
    if (!lightest || v < lightest.minutes) lightest = { date: d, minutes: v };
  }
  return { totalBusyMin: totalBusy, totalFreeMin: totalFree, byCategory, busiestDay: busiest, lightestDay: lightest };
}

/**
 * Lista de tareas vencidas que deberían reprogramarse hoy.
 */
export function tasksToReprogram(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => {
    if (t.status === "completed") return false;
    if (!t.due) return false;
    const due = t.due.slice(0, 10);
    return due < today; // overdue date
  });
}

export function nextWorkdayISO(fromDate: Date, hourStart = DEFAULT_WORKING_HOURS.startHour): string {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + 1);
  // skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(hourStart + 1, 0, 0, 0);
  return d.toISOString();
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
