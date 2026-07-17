/**
 * **Server Route** — Cron público: hace polling de Telegram para procesar updates
 *
 * del bot del usuario (modo long-poll).
 */

import { createFileRoute } from "@tanstack/react-router";
import { pollTelegramUpdates } from "@/server/telegram-bot.server";

export const Route = createFileRoute("/api/public/hooks/telegram-poll")({
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

        try {
          const result = await pollTelegramUpdates(new URL(request.url).origin);
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "telegram poll failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
