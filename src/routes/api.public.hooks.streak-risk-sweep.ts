/**
 * **Server Route** — Sweep diario para detectar pérdidas de racha y aplicar Freeze Days.
 *
 * Se ejecuta de madrugada (cron). Por cada streak con last_completed_at < ayer:
 *  - Si freeze_days_available > 0 → consume 1, marca streak_status = 'frozen', encola notif "streak_saved".
 *  - Si no → resetea current_streak = 0, streak_status = 'lost'.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/hooks/streak-risk-sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        if (request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );

        const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
        const { data: streaks, error } = await supabase
          .from("streaks")
          .select("id, user_id, module_key, current_streak, freeze_days_available, streak_status, last_completed_at")
          .gt("current_streak", 0)
          .lt("last_completed_at", cutoff)
          .in("streak_status", ["active", "at_risk"]);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

        let frozen = 0;
        let lost = 0;

        for (const s of streaks ?? []) {
          if ((s.freeze_days_available ?? 0) > 0) {
            await supabase
              .from("streaks")
              .update({
                streak_status: "frozen",
                freeze_days_available: (s.freeze_days_available ?? 0) - 1,
                last_completed_at: new Date().toISOString(),
              })
              .eq("id", s.id);

            // Encolar notif "streak_saved"
            const { data: tpl } = await supabase
              .from("notification_templates")
              .select("id, title, body, deep_link, tone, priority")
              .eq("module_key", s.module_key)
              .eq("notification_type", "streak_saved")
              .eq("is_active", true)
              .limit(1)
              .maybeSingle();
            const title = (tpl?.title ?? "🐼 Panda salvó tu racha").replaceAll(
              "{streak}",
              String(s.current_streak),
            );
            const body = (tpl?.body ?? "Usamos un Freeze Day por ti. Mañana volvemos con todo.").replaceAll(
              "{streak}",
              String(s.current_streak),
            );
            await supabase.from("notification_queue").insert({
              user_id: s.user_id,
              module_key: s.module_key,
              title,
              body,
              notification_type: "streak_saved",
              tone: tpl?.tone ?? "panda",
              priority: tpl?.priority ?? 7,
              deep_link: tpl?.deep_link ?? `/${s.module_key}`,
              dedupe_key: `streak_saved:${s.module_key}:${new Date().toISOString().slice(0, 10)}`,
              status: "pending",
            });
            frozen += 1;
          } else {
            await supabase
              .from("streaks")
              .update({ streak_status: "lost", current_streak: 0 })
              .eq("id", s.id);
            lost += 1;
          }
        }

        return new Response(JSON.stringify({ frozen, lost, scanned: streaks?.length ?? 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
