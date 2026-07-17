/**
 * Server fn que expone el ONESIGNAL_APP_ID (clave pública) al cliente.
 * Evita tener que duplicarlo como VITE_ env var.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOneSignalConfig = createServerFn({ method: "GET" }).handler(async () => {
  return { appId: process.env.ONESIGNAL_APP_ID ?? null };
});

export const repairOneSignalSavedSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscriptionId: string; token: string }) => input)
  .handler(async ({ data, context }) => {
    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !restKey) return { ok: false, reason: "OneSignal no configurado." };
    if (!data.subscriptionId || !data.token) return { ok: false, reason: "Suscripción incompleta." };

    await context.supabase.from("notification_preferences").upsert(
      {
        user_id: context.userId,
        onesignal_player_id: data.subscriptionId,
        onesignal_push_token: data.token,
        global_notifications_enabled: true,
      },
      { onConflict: "user_id" },
    );

    const res = await fetch(`https://onesignal.com/api/v1/players/${data.subscriptionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Key ${restKey}` },
      body: JSON.stringify({ app_id: appId, identifier: data.token, notification_types: 1 }),
    });
    const json = await safeOneSignalJson(res);
    return { ok: res.ok && json?.success !== false, status: res.status, response: json };
  });

async function safeOneSignalJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { raw: await res.text().catch(() => "") };
  }
}
