/**
 * **Server Route** — Identity Notifications Engine (Fase 3).
 *
 * Cron lo invoca 1×/día (mañana). Por cada usuario:
 *  1. Selecciona identidad: focus_identity_key si existe; si no, identidad activa de mayor priority.
 *  2. Anti-spam:
 *     - Máximo 1 identity push/día.
 *     - No enviar si ya hubo streak/quest enviada hoy.
 *     - Respetar quiet hours.
 *  3. Envía vía OneSignal usando el copy de la identidad y registra en notification_queue.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const IDENTITY_COPY: Record<string, { title: string; body: string; link: string; emoji: string }> = {
  ceo: { title: "👑 Mensaje del CEO", body: "Los sistemas crean libertad. Una acción pequeña hoy reduce caos mañana.", link: "/projects", emoji: "👑" },
  builder: { title: "🤖 Builder", body: "Panda se construye una mejora a la vez. Avanza 10 minutos.", link: "/projects", emoji: "🤖" },
  learner: { title: "📚 Aprendiz", body: "Tu mente también necesita entrenamiento diario.", link: "/learnings", emoji: "📚" },
  health_warrior: { title: "🏋️ Guerrero de salud", body: "Operación Fénix sigue viva. Una victoria mínima cuenta.", link: "/health", emoji: "🏋️" },
  home_guardian: { title: "🏠 Guardián del hogar", body: "Tu casa también refleja tu energía. Recupera un pequeño espacio.", link: "/home", emoji: "🏠" },
  future_self: { title: "🔮 Yo futuro", body: "Soy tu versión futura. Gracias por no abandonar hoy.", link: "/goals", emoji: "🔮" },
  money_guardian: { title: "💰 Guardián financiero", body: "La claridad financiera se construye con pequeños registros.", link: "/finance", emoji: "💰" },
};

type Prefs = {
  user_id: string;
  global_notifications_enabled: boolean;
  timezone: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  onesignal_player_id: string | null;
  focus_identity_key: string | null;
};

export const Route = createFileRoute("/api/public/hooks/process-identity-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) return json({ error: "unauthorized" }, 401);

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        const appId = process.env.ONESIGNAL_APP_ID;
        const restKey = process.env.ONESIGNAL_REST_API_KEY;

        const { data: prefsRows, error: prefsErr } = await supabase
          .from("notification_preferences")
          .select(
            "user_id, global_notifications_enabled, timezone, quiet_hours_start, quiet_hours_end, onesignal_player_id, focus_identity_key",
          )
          .eq("global_notifications_enabled", true);
        if (prefsErr) return json({ error: prefsErr.message }, 500);

        const summary = { processed: 0, sent: 0, skipped: 0, errors: [] as string[] };

        for (const prefs of (prefsRows ?? []) as Prefs[]) {
          summary.processed += 1;
          try {
            await processOne(supabase, prefs, { appId, restKey, summary });
          } catch (e) {
            summary.errors.push(`${prefs.user_id}: ${(e as Error).message}`);
          }
        }
        return json(summary, 200);
      },
    },
  },
});

async function processOne(
  supabase: SupabaseClient,
  prefs: Prefs,
  ctx: { appId?: string; restKey?: string; summary: { sent: number; skipped: number; errors: string[] } },
) {
  const nowUtc = new Date();
  const local = new Date(nowUtc.toLocaleString("en-US", { timeZone: prefs.timezone || "America/Mexico_City" }));
  const localDate = local.toISOString().slice(0, 10);
  const localHour = local.getUTCHours();

  if (isQuiet(localHour, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    ctx.summary.skipped += 1;
    return;
  }

  // Anti-spam: si hubo streak/quest enviadas hoy, skip.
  const startOfDayUtc = new Date(local);
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const startIso = startOfDayUtc.toISOString();

  const { count: heavyToday } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("status", "sent")
    .gte("sent_at", startIso)
    .in("module_key", ["streaks", "quests"]);
  if ((heavyToday ?? 0) > 0) {
    ctx.summary.skipped += 1;
    return;
  }

  // Máximo 1 identity push/día
  const { count: identityToday } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("module_key", "identity")
    .eq("status", "sent")
    .gte("sent_at", startIso);
  if ((identityToday ?? 0) >= 1) {
    ctx.summary.skipped += 1;
    return;
  }

  // Selecciona identidad: focus o la activa de mayor priority
  let key = prefs.focus_identity_key;
  if (!key) {
    const { data: active } = await supabase
      .from("user_identities")
      .select("identity_key, priority")
      .eq("user_id", prefs.user_id)
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(1);
    key = active?.[0]?.identity_key ?? null;
  }
  if (!key || !IDENTITY_COPY[key]) {
    ctx.summary.skipped += 1;
    return;
  }
  const copy = IDENTITY_COPY[key];
  const dedupeKey = `identity:${key}:${localDate}`;

  const { count: existing } = await supabase
    .from("notification_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", prefs.user_id)
    .eq("dedupe_key", dedupeKey)
    .in("status", ["pending", "sent"]);
  if ((existing ?? 0) > 0) {
    ctx.summary.skipped += 1;
    return;
  }

  const { data: row, error: insErr } = await supabase
    .from("notification_queue")
    .insert({
      user_id: prefs.user_id,
      module_key: "identity",
      title: copy.title,
      body: copy.body,
      notification_type: "insight",
      tone: "epic",
      priority: 6,
      deep_link: copy.link,
      identity_key: key,
      dedupe_key: dedupeKey,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !row) {
    ctx.summary.errors.push(`insert: ${insErr?.message}`);
    return;
  }

  if (prefs.onesignal_player_id && ctx.appId && ctx.restKey) {
    try {
      const fullUrl = `https://os.cmrs.mx${copy.link}`;
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Key ${ctx.restKey}` },
        body: JSON.stringify({
          app_id: ctx.appId,
          include_subscription_ids: [prefs.onesignal_player_id],
          headings: { en: copy.title, es: copy.title },
          contents: { en: copy.body, es: copy.body },
          web_url: fullUrl,
          data: { notification_id: row.id, deep_link: copy.link, kind: "identity", identity_key: key },
        }),
      });
      const j = (await res.json()) as { id?: string; recipients?: number; errors?: unknown };
      if (!res.ok || j.errors) throw new Error(JSON.stringify(j));
      await supabase
        .from("notification_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), onesignal_response: j as any })
        .eq("id", row.id);
      await supabase.from("notification_events").insert({
        user_id: prefs.user_id,
        notification_id: row.id,
        event_type: "sent",
        metadata: { provider: "onesignal", identity_key: key },
      });
      ctx.summary.sent += 1;
    } catch (e) {
      const msg = (e as Error).message;
      await supabase.from("notification_queue").update({ status: "failed", error_message: msg }).eq("id", row.id);
      ctx.summary.errors.push(`onesignal: ${msg}`);
    }
  } else {
    ctx.summary.skipped += 1;
  }
}

function isQuiet(hour: number, start: number | null, end: number | null): boolean {
  if (start == null || end == null) return false;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
