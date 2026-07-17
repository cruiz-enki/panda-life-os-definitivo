/**
 * **Server Route** — Endpoint público que devuelve la VAPID public key para que el
 *
 * cliente pueda registrarse a Web Push.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/vapid-key")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.VAPID_PUBLIC_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "VAPID public key not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ publicKey: key }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
