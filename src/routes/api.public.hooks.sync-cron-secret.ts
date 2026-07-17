/**
 * **Server Route** — Endpoint público para sincronizar el secreto de cron.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/hooks/sync-cron-secret")({
  server: {
    handlers: {
      POST: async () => {
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
          return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        // Try update first; if no row, insert
        const { data: existing } = await supabase
          .schema("vault" as never)
          .from("secrets" as never)
          .select("id" as never)
          .eq("name" as never, "CRON_SECRET")
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.rpc("vault_update_cron_secret" as never, {
            new_value: cronSecret,
          } as never);
          if (error) {
            return new Response(JSON.stringify({ error: error.message, step: "update" }), {
              status: 500,
            });
          }
        } else {
          const { error } = await supabase.rpc("vault_insert_cron_secret" as never, {
            new_value: cronSecret,
          } as never);
          if (error) {
            return new Response(JSON.stringify({ error: error.message, step: "insert" }), {
              status: 500,
            });
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
