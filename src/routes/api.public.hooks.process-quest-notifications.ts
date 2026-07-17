/**
 * **Server Route** — Quest Notifications Engine (Fase 2).
 *
 * Cron lo invoca cada 30 min. Por cada usuario activo:
 *  1. Detecta quests con due_date = hoy y status = active → push "tu misión de hoy".
 *  2. Si priority = high y ya pasó la tarde, envía un segundo recordatorio.
 *  3. Detecta quests con due_date = mañana → push "vence pronto".
 *  4. Anti-spam: máximo 2 quest notifications/día, respeta quiet hours,
 *     no envía si hubo streak at_risk en los últimos 60 min, dedupe por día+quest+tipo.
 *  5. Envía vía OneSignal (onesignal_player_id) y registra en notification_queue.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Prefs = {
  user_id: string;
  global_notifications_enabled: boolean;
  timezone: string;
  preferred_evening_time: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  allow_quest_notifications: boolean;
  max_daily_notifications: number;
  onesignal_player_id: string | null;
};

type Quest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  module_key: string | null;
  priority: string;
  due_date: string | null;
  xp: number;
  emoji: string;
};

const MODULE_COPY: Record<string, { emoji: string; body: string; link: string }> = {
  learning: {
    emoji: "📚",
    body: "Tu misión de hoy: registra un aprendizaje y alimenta tu Skill Tree.",
    link: "/learnings",
  },
  money: {
    emoji: "💰",
    body: "Tu misión de hoy: registra un gasto o revisa tu Money OS por 5 minutos.",
    link: "/finance",
  },
  home: {
    emoji: "🏠",
    body: "Tu misión de hoy: completa una tarea rápida y sube el score de tu casa.",
    link: "/home",
  },
  health: {
    emoji: "🏋️",
    body: "Operación Fénix: una victoria mínima mantiene vivo el progreso.",
    link: "/health",
  },
  goals: {
    emoji: "🧭",
    body: "Tu visión necesita una acción hoy. Completa una misión pequeña.",
    link: "/goals",
  },
};

export const Route = createFileRoute("/api/public/hooks/process-quest-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return json({ error: "unauthorized" }, 401);
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
            "user_id, global_notifications_enabled, timezone, preferred_evening_time, quiet_hours_start, quiet_hours_end, allow_quest_notifications, max_daily_notifications, onesignal_player_id",
          )
          .eq("global_notifications_enabled", true)
          .eq("allow_quest_notifications", true);
        if (prefsErr) return json({ error: prefsErr.message }, 500);

        const summary = { processed: 0, sent: 0, skipped: 0, errors: [] as string[] };

        for (const prefs of (prefsRows ?? []) as Prefs[]) {
          summary.processed += 1;
          try {
            await processUserQuests(supabase, prefs, { onesignalAppId, onesignalKey, summary });
          } catch (e) {
            summary.errors.push(`${prefs.user_id}: ${(e as Error).message}`);
          }
        }

        return json(summary, 200);
      },
    },
  },
});

async function processUserQuests(
  supabase: SupabaseClient,
  prefs: Prefs,
  ctx: {
    onesignalAppId?: string;
    onesignalKey?: string;
    summary: { sent: number; skipped: number; errors: string[] };
  },
) {
  const nowUtc = new Date();
  const local = nowInTz(nowUtc, prefs.timezone);
  const localDate = local.toISOString().slice(0, 10);
  const localHour = local.getUTCHours();
  const tomorrowDate = new Date(local.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (isQuiet(localHour, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    ctx.summary.skipped += 1;
    return;
  }

  // Anti-spam: streak at_risk en los últimos 60 min
  const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentStreakRisk } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("notification_type", "streak_at_risk")
    .eq("status", "sent")
    .gte("sent_at", sixtyMinAgo);
  if ((recentStreakRisk ?? 0) > 0) {
    ctx.summary.skipped += 1;
    return;
  }

  // Quest notifications enviadas hoy (UTC del local date)
  const startOfDayLocal = new Date(local);
  startOfDayLocal.setUTCHours(0, 0, 0, 0);
  const startUtc = new Date(startOfDayLocal.getTime() - tzOffsetMs(prefs.timezone, nowUtc));
  const { count: questsSentToday } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("module_key", "quests")
    .eq("status", "sent")
    .gte("sent_at", startUtc.toISOString());

  if ((questsSentToday ?? 0) >= 2) {
    ctx.summary.skipped += 1;
    return;
  }

  const eveningHour = parseInt((prefs.preferred_evening_time ?? "20:00:00").split(":")[0], 10);

  const { data: quests } = await supabase
    .from("custom_quests")
    .select("id, user_id, title, description, module_key, priority, due_date, xp, emoji")
    .eq("user_id", prefs.user_id)
    .eq("status", "active")
    .not("due_date", "is", null);

  const candidates: Array<{
    quest: Quest;
    type: "quest_today" | "quest_today_evening" | "quest_due_soon";
    dedupeKey: string;
    title: string;
    body: string;
    link: string;
    priority: number;
  }> = [];

  for (const q of (quests ?? []) as Quest[]) {
    const dueDate = q.due_date!.slice(0, 10);
    const copy = MODULE_COPY[q.module_key ?? ""] ?? {
      emoji: q.emoji ?? "🎯",
      body: `Tu misión de hoy: ${q.title}`,
      link: `/quests/${q.id}`,
    };
    if (dueDate === localDate) {
      candidates.push({
        quest: q,
        type: "quest_today",
        dedupeKey: `quest_today:${q.id}:${localDate}`,
        title: `${copy.emoji} ${q.title}`,
        body: copy.body,
        link: copy.link,
        priority: q.priority === "high" ? 10 : q.priority === "medium" ? 7 : 4,
      });
      // Segunda push si priority=high y ya pasó la tarde
      if (q.priority === "high" && localHour >= eveningHour) {
        candidates.push({
          quest: q,
          type: "quest_today_evening",
          dedupeKey: `quest_today_evening:${q.id}:${localDate}`,
          title: `🔥 Aún puedes cerrar: ${q.title}`,
          body: "Misión de alta prioridad sin completar. Un avance corto cuenta.",
          link: copy.link,
          priority: 12,
        });
      }
    } else if (dueDate === tomorrowDate) {
      candidates.push({
        quest: q,
        type: "quest_due_soon",
        dedupeKey: `quest_due_soon:${q.id}:${localDate}`,
        title: `⚠️ ${q.title} vence pronto`,
        body: "Un avance pequeño hoy evita presión mañana.",
        link: copy.link,
        priority: q.priority === "high" ? 9 : 5,
      });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const remaining = Math.max(0, 2 - (questsSentToday ?? 0));
  const picks = candidates.slice(0, remaining);

  for (const pick of picks) {
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

    const { data: row, error: insErr } = await supabase
      .from("notification_queue")
      .insert({
        user_id: prefs.user_id,
        module_key: "quests",
        title: pick.title,
        body: pick.body,
        notification_type: pick.type,
        tone: "motivational",
        priority: pick.priority,
        deep_link: pick.link,
        dedupe_key: pick.dedupeKey,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr || !row) {
      ctx.summary.errors.push(`insert: ${insErr?.message}`);
      continue;
    }

    if (prefs.onesignal_player_id && ctx.onesignalAppId && ctx.onesignalKey) {
      try {
        const res = await sendOneSignal({
          appId: ctx.onesignalAppId,
          restKey: ctx.onesignalKey,
          playerId: prefs.onesignal_player_id,
          title: pick.title,
          body: pick.body,
          url: pick.link,
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
          metadata: { provider: "onesignal", quest_id: pick.quest.id, type: pick.type },
        });
        ctx.summary.sent += 1;
      } catch (e) {
        const msg = (e as Error).message;
        await supabase
          .from("notification_queue")
          .update({ status: "failed", error_message: msg })
          .eq("id", row.id);
        ctx.summary.errors.push(`onesignal: ${msg}`);
      }
    } else {
      ctx.summary.skipped += 1;
    }
  }
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
  const base = process.env.PUBLIC_APP_URL || "https://app.cmrs.mx";
  const fullUrl = opts.url.startsWith("http") ? opts.url : `${base}${opts.url}`;
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
      data: { notification_id: opts.notificationId, deep_link: opts.url, kind: "quest" },
      web_url: fullUrl,
    }),
  });
  const j = (await res.json()) as { id?: string; recipients?: number; errors?: unknown };
  if (!res.ok || j.errors) throw new Error(JSON.stringify(j));
  return j;
}

function isQuiet(hour: number, start: number | null, end: number | null): boolean {
  if (start == null || end == null) return false;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
function nowInTz(date: Date, tz: string): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: tz }));
}
function tzOffsetMs(tz: string, ref: Date): number {
  const local = new Date(ref.toLocaleString("en-US", { timeZone: tz }));
  return local.getTime() - ref.getTime();
}
function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
