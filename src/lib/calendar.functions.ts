/**
 * Server functions para **Google Calendar** vía el connector gateway de
 * Lovable. Listar, crear, actualizar y borrar eventos del usuario
 * autenticado.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!GOOGLE_CALENDAR_API_KEY) throw new Error("GOOGLE_CALENDAR_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
  status?: string;
  colorId?: string;
};

// Google Calendar IDs: email-like o "primary". Restringimos a charset seguro
// para prevenir path injection (no permitir "/", "?", "#", "..").
const CalendarIdSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9._\-@+]+$/, "calendarId inválido")
  .optional();

// Event IDs de Google: base32hex, hasta 1024 chars según docs.
const EventIdSchema = z
  .string()
  .min(1)
  .max(1024)
  .regex(/^[A-Za-z0-9_\-@]+$/, "eventId inválido");

const ISODateTimeSchema = z.string().datetime({ offset: true });
const TimeZoneSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_\-+/]+$/).optional();
const ColorIdSchema = z.string().regex(/^[0-9]{1,2}$/).optional();

const ListInputSchema = z.object({
  timeMin: ISODateTimeSchema,
  timeMax: ISODateTimeSchema,
  calendarId: CalendarIdSchema,
});

const CreateInputSchema = z.object({
  summary: z.string().trim().min(1).max(1024),
  description: z.string().max(8192).optional(),
  startISO: ISODateTimeSchema,
  endISO: ISODateTimeSchema,
  timeZone: TimeZoneSchema,
  colorId: ColorIdSchema,
  calendarId: CalendarIdSchema,
});

const UpdateInputSchema = z.object({
  eventId: EventIdSchema,
  summary: z.string().trim().min(1).max(1024).optional(),
  description: z.string().max(8192).optional(),
  startISO: ISODateTimeSchema.optional(),
  endISO: ISODateTimeSchema.optional(),
  timeZone: TimeZoneSchema,
  colorId: ColorIdSchema,
  calendarId: CalendarIdSchema,
});

const DeleteInputSchema = z.object({
  eventId: EventIdSchema,
  calendarId: CalendarIdSchema,
});

export const listCalendarEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const calendarId = encodeURIComponent(data.calendarId ?? "primary");
      const params = new URLSearchParams({
        timeMin: data.timeMin,
        timeMax: data.timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });
      const res = await fetch(`${GATEWAY_URL}/calendars/${calendarId}/events?${params}`, {
        method: "GET",
        headers: authHeaders(),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`Google Calendar list failed [${res.status}]: ${body}`);
        return { events: [] as GCalEvent[], error: `No se pudieron cargar eventos (${res.status})` };
      }
      const json = JSON.parse(body) as { items?: GCalEvent[] };
      return { events: json.items ?? [], error: null as string | null };
    } catch (err) {
      console.error("Calendar list error", err);
      return { events: [] as GCalEvent[], error: "Error de red al consultar Google Calendar" };
    }
  });

export const createCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const calendarId = encodeURIComponent(data.calendarId ?? "primary");
      const tz = data.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const res = await fetch(`${GATEWAY_URL}/calendars/${calendarId}/events`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          summary: data.summary,
          description: data.description,
          start: { dateTime: data.startISO, timeZone: tz },
          end: { dateTime: data.endISO, timeZone: tz },
          colorId: data.colorId,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`Google Calendar create failed [${res.status}]: ${body}`);
        return { event: null as GCalEvent | null, error: `No se pudo crear el evento (${res.status})` };
      }
      return { event: JSON.parse(body) as GCalEvent, error: null as string | null };
    } catch (err) {
      console.error("Calendar create error", err);
      return { event: null as GCalEvent | null, error: "Error de red al crear evento" };
    }
  });

export const updateCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const calendarId = encodeURIComponent(data.calendarId ?? "primary");
      const tz = data.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const patch: Record<string, unknown> = {};
      if (data.summary !== undefined) patch.summary = data.summary;
      if (data.description !== undefined) patch.description = data.description;
      if (data.startISO) patch.start = { dateTime: data.startISO, timeZone: tz };
      if (data.endISO) patch.end = { dateTime: data.endISO, timeZone: tz };
      if (data.colorId !== undefined) patch.colorId = data.colorId;
      const res = await fetch(`${GATEWAY_URL}/calendars/${calendarId}/events/${encodeURIComponent(data.eventId)}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`Google Calendar update failed [${res.status}]: ${body}`);
        return { event: null as GCalEvent | null, error: `No se pudo actualizar (${res.status})` };
      }
      return { event: JSON.parse(body) as GCalEvent, error: null as string | null };
    } catch (err) {
      console.error("Calendar update error", err);
      return { event: null as GCalEvent | null, error: "Error de red al actualizar" };
    }
  });

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const calendarId = encodeURIComponent(data.calendarId ?? "primary");
      const res = await fetch(`${GATEWAY_URL}/calendars/${calendarId}/events/${encodeURIComponent(data.eventId)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 410) {
        const body = await res.text();
        console.error(`Google Calendar delete failed [${res.status}]: ${body}`);
        return { ok: false, error: `No se pudo eliminar (${res.status})` };
      }
      return { ok: true, error: null as string | null };
    } catch (err) {
      console.error("Calendar delete error", err);
      return { ok: false, error: "Error de red al eliminar" };
    }
  });
