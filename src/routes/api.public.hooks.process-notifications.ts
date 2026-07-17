/**
 * **Server Route** — Behavioral Notifications Engine.
 *
 * Cron lo invoca cada 15 minutos. Hace, por cada usuario activo:
 *  1. Detecta rachas en riesgo (no completaron acción y pasó su evening_time).
 *  2. Aplica Freeze Day automático si la racha se perderá hoy y hay freeze_days_available.
 *  3. Genera mensajes desde notification_templates.
 *  4. Respeta quiet hours, tope diario y deduplicación por dedupe_key.
 *  5. Inserta en notification_queue y envía vía OneSignal REST API.
 *  6. Registra evento en notification_events.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Prefs = {
  user_id: string;
  global_notifications_enabled: boolean;
  timezone: string;
  preferred_morning_time: string; // HH:MM:SS
  preferred_evening_time: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  allow_streak_notifications: boolean;
  allow_quest_notifications: boolean;
  allow_money_notifications: boolean;
  allow_home_notifications: boolean;
  allow_learning_notifications: boolean;
  allow_health_notifications: boolean;
  allow_motivational_notifications: boolean;
  max_daily_notifications: number;
  onesignal_player_id: string | null;
};

type Template = {
  id: string;
  module_key: string;
  notification_type: string;
  tone: string;
  title: string;
  body: string;
  priority: number;
  deep_link: string | null;
};

type Streak = {
  id: string;
  user_id: string;
  module_key: string;
  current_streak: number;
  last_completed_at: string | null;
  streak_status: string;
  freeze_days_available: number;
};

export const Route = createFileRoute("/api/public/hooks/process-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        const onesignalAppId = process.env.ONESIGNAL_APP_ID;
        const onesignalKey = process.env.ONESIGNAL_REST_API_KEY;

        const { data: prefsRows, error: prefsErr } = await supabase
          .from("notification_preferences")
          .select(
            "user_id, global_notifications_enabled, timezone, preferred_morning_time, preferred_evening_time, quiet_hours_start, quiet_hours_end, allow_streak_notifications, allow_quest_notifications, allow_money_notifications, allow_home_notifications, allow_learning_notifications, allow_health_notifications, allow_motivational_notifications, max_daily_notifications, onesignal_player_id",
          )
          .eq("global_notifications_enabled", true);
        if (prefsErr) {
          return jsonError(500, prefsErr.message);
        }

        const { data: templates } = await supabase
          .from("notification_templates")
          .select("id, module_key, notification_type, tone, title, body, priority, deep_link")
          .eq("is_active", true);

        const summary = { processed: 0, queued: 0, sent: 0, skipped: 0, freezes: 0, errors: [] as string[] };

        for (const prefs of (prefsRows ?? []) as Prefs[]) {
          summary.processed += 1;
          try {
            await processUser(supabase, prefs, templates ?? [], {
              onesignalAppId,
              onesignalKey,
              summary,
            });
          } catch (e) {
            summary.errors.push(`${prefs.user_id}: ${(e as Error).message}`);
          }
        }

        return new Response(JSON.stringify(summary), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

async function processUser(
  supabase: SupabaseClient,
  prefs: Prefs,
  templates: Template[],
  ctx: {
    onesignalAppId?: string;
    onesignalKey?: string;
    summary: { queued: number; sent: number; skipped: number; freezes: number; errors: string[] };
  },
) {
  // Hora local
  const nowUtc = new Date();
  const local = nowInTimezone(nowUtc, prefs.timezone);
  const localDate = local.toISOString().slice(0, 10);
  const localHour = local.getUTCHours();

  // Quiet hours check
  if (isQuiet(localHour, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    ctx.summary.skipped += 1;
    return;
  }

  // Cuenta enviadas hoy (UTC del local date)
  const startOfDayLocal = new Date(local);
  startOfDayLocal.setUTCHours(0, 0, 0, 0);
  const startUtc = new Date(startOfDayLocal.getTime() - tzOffsetMs(prefs.timezone, nowUtc));
  const { count: sentToday } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("status", "sent")
    .gte("sent_at", startUtc.toISOString());

  if ((sentToday ?? 0) >= (prefs.max_daily_notifications ?? 3)) {
    ctx.summary.skipped += 1;
    return;
  }

  // Trae rachas del usuario
  const { data: streaks } = await supabase
    .from("streaks")
    .select("id, user_id, module_key, current_streak, last_completed_at, streak_status, freeze_days_available")
    .eq("user_id", prefs.user_id);

  const eveningHour = parseInt((prefs.preferred_evening_time ?? "20:00:00").split(":")[0], 10);
  const candidates: Array<{
    template: Template;
    moduleKey: string;
    priority: number;
    dedupeKey: string;
  }> = [];

  for (const s of (streaks ?? []) as Streak[]) {
    if (!moduleAllowed(s.module_key, prefs)) continue;
    if (!prefs.allow_streak_notifications) continue;
    if ((s.current_streak ?? 0) <= 0) continue;

    const lastDate = s.last_completed_at ? new Date(s.last_completed_at) : null;
    const completedToday = lastDate ? sameLocalDay(lastDate, local, prefs.timezone) : false;
    if (completedToday) continue;

    // Si pasó evening_time y aún no completó → at_risk
    if (localHour >= eveningHour) {
      // Marcar at_risk
      if (s.streak_status === "active") {
        await supabase.from("streaks").update({ streak_status: "at_risk" }).eq("id", s.id);
      }

      const tpl = pickTemplate(templates, s.module_key, "streak_at_risk");
      if (tpl) {
        candidates.push({
          template: tpl,
          moduleKey: s.module_key,
          priority: tpl.priority + 4,
          dedupeKey: `streak_at_risk:${s.module_key}:${localDate}`,
        });
      }
    } else if (localHour >= parseInt((prefs.preferred_morning_time ?? "08:30:00").split(":")[0], 10)) {
      // Mañana → recordatorio normal de streak
      const tpl = pickTemplate(templates, s.module_key, "streak") || pickTemplate(templates, s.module_key, "reminder");
      if (tpl) {
        candidates.push({
          template: tpl,
          moduleKey: s.module_key,
          priority: tpl.priority,
          dedupeKey: `streak_reminder:${s.module_key}:${localDate}`,
        });
      }
    }
  }

  // Si no hay candidatos por rachas → mensaje motivacional si está activo y es horario adecuado
  if (candidates.length === 0 && prefs.allow_motivational_notifications && localHour >= 9 && localHour < 21) {
    const tpl = pickTemplate(templates, "motivational", "momentum");
    if (tpl) {
      candidates.push({
        template: tpl,
        moduleKey: "motivational",
        priority: tpl.priority,
        dedupeKey: `motivational:${localDate}`,
      });
    }
  }

  // Ordena por prioridad desc
  candidates.sort((a, b) => b.priority - a.priority);
  const remaining = Math.max(0, (prefs.max_daily_notifications ?? 3) - (sentToday ?? 0));
  const picks = candidates.slice(0, remaining);

  for (const pick of picks) {
    // Dedupe: si ya existe pending/sent con ese dedupe_key, saltar
    const { count: existing } = await supabase
      .from("notification_queue")
      .select("id", { count: "exact", head: true })
      .eq("user_id", prefs.user_id)
      .eq("dedupe_key", pick.dedupeKey)
      .in("status", ["pending", "sent"]);
    if ((existing ?? 0) > 0) {
      ctx.summary.skipped += 1;
      continue;
    }

    const title = renderText(pick.template.title, streaks ?? [], pick.moduleKey);
    const body = renderText(pick.template.body, streaks ?? [], pick.moduleKey);

    const { data: row, error: insErr } = await supabase
      .from("notification_queue")
      .insert({
        user_id: prefs.user_id,
        module_key: pick.moduleKey,
        title,
        body,
        notification_type: pick.template.notification_type,
        tone: pick.template.tone,
        priority: pick.template.priority,
        deep_link: pick.template.deep_link,
        dedupe_key: pick.dedupeKey,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr || !row) {
      ctx.summary.errors.push(`queue insert: ${insErr?.message}`);
      continue;
    }
    ctx.summary.queued += 1;

    // Envío real vía OneSignal
    if (prefs.onesignal_player_id && ctx.onesignalAppId && ctx.onesignalKey) {
      try {
        const res = await sendOneSignal({
          appId: ctx.onesignalAppId,
          restKey: ctx.onesignalKey,
          playerId: prefs.onesignal_player_id,
          title,
          body,
          url: pick.template.deep_link ?? "/",
          notificationId: row.id,
        });
        await supabase
          .from("notification_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            onesignal_response: res,
          })
          .eq("id", row.id);
        await supabase.from("notification_events").insert({
          user_id: prefs.user_id,
          notification_id: row.id,
          event_type: "sent",
          metadata: { provider: "onesignal", recipients: res.recipients ?? null },
        });
        ctx.summary.sent += 1;
      } catch (e) {
        const msg = (e as Error).message;
        await supabase
          .from("notification_queue")
          .update({ status: "failed", error_message: msg })
          .eq("id", row.id);
        await supabase.from("notification_events").insert({
          user_id: prefs.user_id,
          notification_id: row.id,
          event_type: "failed",
          metadata: { provider: "onesignal", error: msg },
        });
        ctx.summary.errors.push(`onesignal: ${msg}`);
      }
    } else {
      ctx.summary.skipped += 1;
    }
  }
}

function moduleAllowed(moduleKey: string, prefs: Prefs): boolean {
  switch (moduleKey) {
    case "money":
      return prefs.allow_money_notifications;
    case "home":
      return prefs.allow_home_notifications;
    case "learning":
      return prefs.allow_learning_notifications;
    case "health":
      return prefs.allow_health_notifications;
    case "goals":
    case "habits":
    case "journal":
    case "identity":
    case "relationship":
      return true;
    default:
      return true;
  }
}

function pickTemplate(templates: Template[], moduleKey: string, type: string): Template | null {
  const candidates = templates.filter(
    (t) => t.module_key === moduleKey && t.notification_type === type,
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function renderText(text: string, streaks: Streak[], moduleKey: string): string {
  const s = streaks.find((x) => x.module_key === moduleKey);
  return text.replaceAll("{streak}", String(s?.current_streak ?? 0));
}

function isQuiet(localHour: number, start: number | null, end: number | null): boolean {
  if (start == null || end == null) return false;
  if (start === end) return false;
  if (start < end) return localHour >= start && localHour < end;
  // Cruza medianoche, ej 22 → 7
  return localHour >= start || localHour < end;
}

function nowInTimezone(date: Date, tz: string): Date {
  // Convierte UTC → "como si fuera UTC pero los componentes son la hora local"
  const local = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return local;
}

function tzOffsetMs(tz: string, ref: Date): number {
  const local = new Date(ref.toLocaleString("en-US", { timeZone: tz }));
  return local.getTime() - ref.getTime();
}

function sameLocalDay(a: Date, bLocal: Date, tz: string): boolean {
  const aLocal = nowInTimezone(a, tz);
  return (
    aLocal.getUTCFullYear() === bLocal.getUTCFullYear() &&
    aLocal.getUTCMonth() === bLocal.getUTCMonth() &&
    aLocal.getUTCDate() === bLocal.getUTCDate()
  );
}

async function sendOneSignal(opts: {
  appId: string;
  restKey: string;
  playerId: string;
  title: string;
  body: string;
  url: string;
  notificationId: string;
}): Promise<{ id?: string; recipients?: number; errors?: unknown }> {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${opts.restKey}`,
    },
    body: JSON.stringify({
      app_id: opts.appId,
      include_subscription_ids: [opts.playerId],
      headings: { en: opts.title, es: opts.title },
      contents: { en: opts.body, es: opts.body },
      data: { notification_id: opts.notificationId, deep_link: opts.url },
      web_url: absoluteUrl(opts.url),
    }),
  });
  const json = (await res.json()) as { id?: string; recipients?: number; errors?: unknown };
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json));
  }
  return json;
}

function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = process.env.PUBLIC_APP_URL || "https://os.cmrs.mx";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
