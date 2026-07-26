/**
 * **Server Route** — Cron: procesa mensajes programados y los envía por los canales elegidos.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/server/telegram.server";

type ScheduledRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  channels: string[];
  scheduled_at: string;
};

async function sendPush(userId: string, title: string, body: string) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const key = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !key) throw new Error("ONESIGNAL not configured");
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${key}` },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      headings: { en: title, es: title },
      contents: { en: body, es: body },
      url: "https://os.cmrs.mx/scheduled",
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.errors) throw new Error(`OneSignal ${res.status}: ${JSON.stringify(json)}`);
  if (json?.recipients === 0) throw new Error(`OneSignal: 0 recipientes (external_id ${userId} sin suscripción push)`);
}

async function sendEmail(to: string, title: string, body: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY_1 || process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) throw new Error("Email no configurado (falta Resend)");
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: "Pandus Maximus <onboarding@resend.dev>",
      to: [to],
      subject: title,
      html: `<div style="font-family:sans-serif;line-height:1.6"><h2>${title}</h2><p>${body.replace(/\n/g, "<br/>")}</p><hr/><p style="color:#888;font-size:12px">Mensaje que te agendaste desde <a href="https://os.cmrs.mx/scheduled">os.cmrs.mx</a></p></div>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export const Route = createFileRoute("/api/public/hooks/process-scheduled-messages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const now = new Date().toISOString();

        const { data: rows, error } = await supabase
          .from("scheduled_messages")
          .select("id, user_id, title, body, channels, scheduled_at")
          .eq("status", "pending")
          .lte("scheduled_at", now)
          .limit(100);

        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        const messages = (rows ?? []) as ScheduledRow[];

        let processed = 0;
        for (const m of messages) {
          const log: Record<string, { ok: boolean; error?: string }> = {};
          let anyOk = false;

          for (const ch of m.channels) {
            try {
              if (ch === "inapp") {
                log[ch] = { ok: true };
                anyOk = true;
              } else if (ch === "telegram") {
                const { data: cfg } = await supabase
                  .from("telegram_config")
                  .select("chat_id")
                  .eq("user_id", m.user_id)
                  .maybeSingle();
                if (!cfg?.chat_id) throw new Error("Telegram no vinculado");
                await sendTelegramMessage(cfg.chat_id as number, `*${m.title}*\n\n${m.body}`);
                log[ch] = { ok: true };
                anyOk = true;
              } else if (ch === "push") {
                await sendPush(m.user_id, m.title, m.body);
                log[ch] = { ok: true };
                anyOk = true;
              } else if (ch === "email") {
                const { data: u } = await supabase.auth.admin.getUserById(m.user_id);
                const email = u?.user?.email;
                if (!email) throw new Error("Usuario sin email");
                await sendEmail(email, m.title, m.body);
                log[ch] = { ok: true };
                anyOk = true;
              } else if (ch === "whatsapp") {
                log[ch] = { ok: false, error: "WhatsApp aún no conectado" };
              } else {
                log[ch] = { ok: false, error: "Canal desconocido" };
              }
            } catch (e) {
              log[ch] = { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
          }

          await supabase
            .from("scheduled_messages")
            .update({
              status: anyOk ? "sent" : "failed",
              delivery_log: log,
              sent_at: new Date().toISOString(),
            })
            .eq("id", m.id);
          processed++;
        }

        return new Response(JSON.stringify({ ok: true, processed }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
