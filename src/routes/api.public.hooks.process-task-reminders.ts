/**
 * **Server Route** — Cron: dispara recordatorios por tarea, según los offsets y canales configurados.
 *
 * Cada tarea puede tener:
 *   - `reminders: number[]` — minutos antes de `due` para cada aviso.
 *   - `reminder_channels: string[]` — canales (push/telegram/email/inapp).
 *
 * `reminders_sent` es un array de offsets ya enviados; se usa como dedupe idempotente.
 * Se considera "hora de enviar" cuando el offset cae dentro de una ventana ±10 min alrededor del cron.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/server/telegram.server";
import { titoReminderMessage, toneLevelFromSentCount } from "@/lib/tito-tone";

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  due: string | null;
  reminders: number[] | null;
  reminder_channels: string[] | null;
  reminders_sent: number[] | null;
  status: string;
  snoozed_until: string | null;
};

const WINDOW_MIN = 10; // ± minutos

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
      url: "https://os.cmrs.mx/tasks",
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.errors) throw new Error(`OneSignal ${res.status}: ${JSON.stringify(json)}`);
  if (json?.recipients === 0) throw new Error("OneSignal: 0 recipientes");
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
      from: "Panda OS <onboarding@resend.dev>",
      to: [to],
      subject: title,
      html: `<div style="font-family:sans-serif;line-height:1.6"><h2>${title}</h2><p>${body.replace(/\n/g, "<br/>")}</p></div>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function fmtOffset(m: number): string {
  if (m <= 0) return "ahora";
  if (m < 60) return `en ${m} min`;
  if (m < 1440) return `en ${Math.round(m / 60)} h`;
  return `en ${Math.round(m / 1440)} día(s)`;
}

export const Route = createFileRoute("/api/public/hooks/process-task-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const headerSecret = request.headers.get("x-cron-secret");
        if (!cronSecret || headerSecret !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const now = Date.now();
        const upper = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30d ahead
        const lower = new Date(now - 1000 * 60 * 60).toISOString(); // 1h back (para offsets 0)

        const { data: rows, error } = await supabase
          .from("tasks")
          .select("id, user_id, title, due, reminders, reminder_channels, reminders_sent, status, snoozed_until")
          .eq("status", "pending")
          .gte("due", lower)
          .lte("due", upper)
          .limit(500);

        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

        let processed = 0;
        let dispatched = 0;

        for (const t of (rows ?? []) as TaskRow[]) {
          if (!t.due) continue;
          if (t.snoozed_until && new Date(t.snoozed_until).getTime() > now) continue;
          const reminders = (t.reminders ?? []).filter((n) => Number.isFinite(n) && n >= 0);
          if (reminders.length === 0) continue;
          const channels = (t.reminder_channels ?? ["push"]).filter(
            (c) => c === "push" || c === "telegram" || c === "email" || c === "inapp",
          );
          if (channels.length === 0) continue;
          const sent = new Set((t.reminders_sent ?? []).map((n) => Number(n)));
          const dueMs = new Date(t.due).getTime();

          const dueNow = reminders.filter((offset) => {
            if (sent.has(offset)) return false;
            const target = dueMs - offset * 60_000;
            return Math.abs(target - now) <= WINDOW_MIN * 60_000;
          });
          if (dueNow.length === 0) continue;

          for (const offset of dueNow) {
            const level = toneLevelFromSentCount(sent.size);
            const detail = `Vence ${fmtOffset(offset)} · ${new Date(t.due).toLocaleString("es-MX")}`;
            const { title, body } = titoReminderMessage({
              kind: "task",
              subject: t.title,
              detail,
              level,
              seed: t.id,
            });

            for (const ch of channels) {
              try {
                if (ch === "push") {
                  await sendPush(t.user_id, title, body);
                } else if (ch === "telegram") {
                  const { data: cfg } = await supabase
                    .from("telegram_config")
                    .select("chat_id")
                    .eq("user_id", t.user_id)
                    .maybeSingle();
                  if (!cfg?.chat_id) throw new Error("Telegram no vinculado");
                  await sendTelegramMessage(
                    cfg.chat_id as number,
                    `${body}\n\nhttps://os.cmrs.mx/tasks`,
                  );
                } else if (ch === "email") {
                  const { data: u } = await supabase.auth.admin.getUserById(t.user_id);
                  const email = u?.user?.email;
                  if (!email) throw new Error("Usuario sin email");
                  await sendEmail(email, title, body);
                } else if (ch === "inapp") {
                  await supabase.from("scheduled_messages").insert({
                    user_id: t.user_id,
                    title,
                    body,
                    channels: ["inapp"],
                    scheduled_at: new Date().toISOString(),
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    delivery_log: { inapp: { ok: true, tito_level: level } },
                  } as never);
                }
                dispatched++;
              } catch (e) {
                console.error("[task-reminder]", t.id, ch, offset, e);
              }
            }
            sent.add(offset);
          }

          await supabase
            .from("tasks")
            .update({ reminders_sent: Array.from(sent) } as never)
            .eq("id", t.id);
          processed++;
        }

        return new Response(JSON.stringify({ ok: true, processed, dispatched }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
