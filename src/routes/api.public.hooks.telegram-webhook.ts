/**
 * **Server Route** — Webhook público de Telegram: recibe actualizaciones del bot.
 *
 * Valida firma/secret antes de procesar.
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  createTelegramContext,
  deriveTelegramWebhookSecret,
  processTelegramUpdate,
  safeEqual,
} from "@/server/telegram-bot.server";

export const Route = createFileRoute("/api/public/hooks/telegram-webhook")({
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      }),
      POST: async ({ request }) => {
        const telegramApiKey = process.env.TELEGRAM_API_KEY;
        if (!telegramApiKey) {
          return new Response(JSON.stringify({ error: "telegram not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const expected = deriveTelegramWebhookSecret(telegramApiKey);
        const actual = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!safeEqual(actual, expected)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const update = await request.json();
          const ctx = await createTelegramContext(new URL(request.url).origin);
          const processed = await processTelegramUpdate(ctx, update);
          return new Response(JSON.stringify({ ok: true, processed }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("telegram webhook failed", err);
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "webhook failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
