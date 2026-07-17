/**
 * **Server Route** — Cron público: dispara recordatorios del módulo Identidad.
 *
 * Protegido por secreto compartido (verifica `x-cron-secret`).
 */

import { createFileRoute } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/server/telegram.server";


type Body = { mode?: "daily" | "weekly" };

export const Route = createFileRoute("/api/public/hooks/identity-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        let payload: Body = {};
        try { payload = (await request.json()) as Body; } catch { /* ignore */ }
        const mode = payload.mode ?? "daily";

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        // Obtener todos los usuarios con OneSignal registrado y notificaciones activas
        const { data: subs, error } = await supabase
          .from("notification_preferences")
          .select("user_id")
          .eq("global_notifications_enabled", true)
          .not("onesignal_player_id", "is", null);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

        const userIds = Array.from(new Set((subs || []).map((s) => s.user_id)));
        const today = todayCDMX();

        let sent = 0;
        for (const user_id of userIds) {
          // Check global notifications preference
          const { data: globalPrefs } = await supabase
            .from("notification_preferences")
            .select("global_notifications_enabled, identity_reminders_enabled")
            .eq("user_id", user_id)
            .maybeSingle();
          
          if (globalPrefs && (globalPrefs.global_notifications_enabled === false || globalPrefs.identity_reminders_enabled === false)) {
            continue;
          }


          let title = "";

          let body = "";
          let url = "/identity";

          if (mode === "daily") {
            // Saltar si ya escribió diario hoy
            const { data: j } = await supabase.from("identity_journal").select("id").eq("user_id", user_id).eq("date", today).maybeSingle();
            if (j) continue;
            title = "🪞 Tu diario te espera";
            body = "Reflexiona sobre tu día y mide tu alineación con quien quieres ser.";
          } else {
            title = "🎯 Reflexión semanal";
            body = "Es domingo. Genera tu análisis semanal con IA y planea la próxima.";
          }

          // Enviar Telegram si está configurado
          const { data: tgCfg } = await supabase
            .from("telegram_config")
            .select("chat_id, enabled, notify_identity")
            .eq("user_id", user_id)
            .maybeSingle();

          if (tgCfg && tgCfg.enabled && tgCfg.chat_id && tgCfg.notify_identity) {
            try {
              await sendTelegramMessage(Number(tgCfg.chat_id), `*${title}*\n${body}\n\nhttps://app.cmrs.mx${url}`);
            } catch (e) {
              console.error("Telegram send failed in identity-reminders", e);
            }
          }

          // Llamar al endpoint send-push internamente
          const baseUrl = new URL(request.url);
          const pushUrl = `${baseUrl.protocol}//${baseUrl.host}/api/public/hooks/send-push`;
          await fetch(pushUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
            body: JSON.stringify({ user_id, title, body, url, tag: `identity-${mode}` }),
          });

          sent++;
        }

        return new Response(JSON.stringify({ ok: true, mode, sent, users: userIds.length }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
