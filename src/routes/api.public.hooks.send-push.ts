/**
 * **Server Route** — Endpoint público para enviar push al usuario vía OneSignal.
 *
 * Llamado por jobs internos con secreto. Envia usando External User ID
 * (Supabase user.id, registrado con OneSignal.login en el cliente). OneSignal
 * rutea automáticamente a todas las suscripciones activas del usuario.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type SendBody = {
  user_id?: string; // optional: send to one user; if absent, send to all eligible
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export const Route = createFileRoute("/api/public/hooks/send-push")({
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

        const onesignalAppId = process.env.ONESIGNAL_APP_ID;
        const onesignalKey = process.env.ONESIGNAL_REST_API_KEY;
        if (!onesignalAppId || !onesignalKey) {
          return new Response(
            JSON.stringify({ error: "OneSignal not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let payload: SendBody;
        try {
          payload = (await request.json()) as SendBody;
        } catch {
          return new Response(JSON.stringify({ error: "invalid body" }), { status: 400 });
        }
        if (!payload.title || !payload.body) {
          return new Response(JSON.stringify({ error: "title and body required" }), {
            status: 400,
          });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Pull preferences to enforce granular toggles + global flag
        let q = supabase
          .from("notification_preferences")
          .select(
            "user_id, global_notifications_enabled, task_reminders_enabled, habit_reminders_enabled, medical_reminders_enabled, meal_reminders_enabled, exercise_reminders_enabled, identity_reminders_enabled, daily_summary_enabled, onesignal_player_id",
          )
          .eq("global_notifications_enabled", true);

        if (payload.user_id) q = q.eq("user_id", payload.user_id);

        const { data: prefs, error } = await q;
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        const tag = payload.tag || "";
        const eligible = (prefs || []).filter((p: any) => {
          if (tag.startsWith("identity-") && !p.identity_reminders_enabled) return false;
          if (tag.startsWith("med-") && !p.medical_reminders_enabled) return false;
          if (tag.startsWith("appt-") && !p.medical_reminders_enabled) return false;
          if (tag.startsWith("meal-") && !p.meal_reminders_enabled) return false;
          if (tag.startsWith("exercise") && !p.exercise_reminders_enabled) return false;
          if (tag.startsWith("habits") && !p.habit_reminders_enabled) return false;
          if (tag.startsWith("overdue-tasks") && !p.task_reminders_enabled) return false;
          if (tag === "daily-summary" && !p.daily_summary_enabled) return false;
          return true;
        });

        if (eligible.length === 0) {
          return new Response(
            JSON.stringify({ ok: 0, failed: 0, total: 0, skipped: "no eligible users" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        const externalUserIds = eligible.map((p: any) => p.user_id);

        const url = payload.url || "/";
        const fullUrl = url.startsWith("http") ? url : `https://os.cmrs.mx${url}`;

        const body: Record<string, unknown> = {
          app_id: onesignalAppId,
          include_external_user_ids: externalUserIds,
          channel_for_external_user_ids: "push",
          headings: { en: payload.title, es: payload.title },
          contents: { en: payload.body, es: payload.body },
          url: fullUrl,
          web_url: fullUrl,
          chrome_web_icon: "https://os.cmrs.mx/icon-192.png",
          chrome_web_badge: "https://os.cmrs.mx/icon-192.png",
        };
        if (tag) body.web_push_topic = tag;

        let osStatus = 0;
        let osJson: any = null;
        try {
          const res = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Key ${onesignalKey}`,
            },
            body: JSON.stringify(body),
          });
          osStatus = res.status;
          osJson = await res.json().catch(() => null);
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: 0, failed: externalUserIds.length, error: String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const recipients = Number(osJson?.recipients ?? 0);
        const hasErrors = osJson && (osJson.errors || osStatus >= 400);

        return new Response(
          JSON.stringify({
            ok: hasErrors ? 0 : externalUserIds.length,
            failed: hasErrors ? externalUserIds.length : 0,
            total: externalUserIds.length,
            recipients,
            onesignal_status: osStatus,
            onesignal_response: osJson,
          }),
          {
            status: hasErrors ? 502 : 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
