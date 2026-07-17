/**
 * **Server Route** — Endpoint público para mandar un mensaje por Telegram al chat
 *
 * configurado por el usuario.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendTelegramMessage } from "@/server/telegram.server";

const schema = z.object({
  chat_id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
  text: z.string().min(1).max(4000),
  parse_mode: z.enum(["Markdown", "HTML", "MarkdownV2"]).optional(),
});

export const Route = createFileRoute("/api/public/hooks/telegram-send")({
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

        let parsed: z.infer<typeof schema>;
        try {
          const body = await request.json();
          parsed = schema.parse(body);
        } catch (e) {
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          await sendTelegramMessage(parsed.chat_id, parsed.text, {
            parse_mode: parsed.parse_mode ?? "Markdown",
          });
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "send failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
