/**
 * **Server Route** — Endpoint de prueba para verificar el envío de Web Push.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/test-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate the user via their session token (publishable key + Authorization header)
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "missing auth" }), { status: 401 });
        }
        const userClient = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData.user) {
          return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 });
        }
        const userId = userData.user.id;

        // Call the send-push endpoint with the cron secret
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
          return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), { status: 500 });
        }

        // Use the relative path or current host to avoid hardcoded domain issues
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const sendUrl = `${protocol}://${host}/api/public/hooks/send-push`;
        
        console.log("[test-push] sending to", sendUrl, "user", userId);
        const res = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-secret": cronSecret,
          },
          body: JSON.stringify({
            user_id: userId,
            title: "🐼 Notificación de prueba",
            body: "¡Funciona! Tus push notifications están activas.",
            url: "/",
            tag: "test-push",
          }),
        });
        const text = await res.text();
        console.log("[test-push] send-push response", res.status, text);
        
        let result: any = {};
        try { 
          result = JSON.parse(text); 
        } catch (e) {
          result = { error: "Failed to parse send-push response", raw: text };
        }

        return new Response(JSON.stringify({ 
          ok: res.ok && result.ok > 0, 
          status: res.status, 
          ...result 
        }), {
          status: res.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
