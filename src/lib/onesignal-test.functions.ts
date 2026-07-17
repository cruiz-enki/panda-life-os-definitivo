/**
 * **Server fn** — Envía una notificación de prueba vía OneSignal al usuario
 * autenticado, usando el `onesignal_player_id` guardado en `notification_preferences`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export const sendOneSignalTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .select("onesignal_player_id, onesignal_push_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const playerId = prefs?.onesignal_player_id;
    if (!playerId) {
      return {
        ok: false,
        reason:
          "No tienes onesignal_player_id guardado. Activa Push y acepta el permiso del navegador.",
      };
    }

    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !restKey) {
      return { ok: false, reason: "OneSignal no está configurado en el servidor." };
    }
    if (prefs?.onesignal_push_token) {
      await repairSubscription(appId, restKey, playerId, prefs.onesignal_push_token);
    }

    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${restKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        include_external_user_ids: [userId],
        channel_for_external_user_ids: "push",
        headings: { en: "🐼 Notificación de prueba", es: "🐼 Notificación de prueba" },
        contents: {
          en: "¡Funciona! OneSignal está enviando push reales.",
          es: "¡Funciona! OneSignal está enviando push reales.",
        },
        web_url: "https://os.cmrs.mx/",
      }),
    });
    const json = (await res.json()) as {
      id?: string;
      recipients?: number;
      errors?: unknown;
    };
    if (!res.ok || json.errors) {
      return { ok: false, reason: JSON.stringify(json.errors ?? json) };
    }
    return { ok: true, recipients: json.recipients ?? 0, id: json.id };
  });

export const runOneSignalDeliveryDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .select("onesignal_player_id, onesignal_push_token, global_notifications_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false, stage: "database", reason: error.message };

    const subscriptionId = prefs?.onesignal_player_id;
    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!subscriptionId) return { ok: false, stage: "database", reason: "No hay subscription_id guardado." };
    if (!appId || !restKey) return { ok: false, stage: "secrets", reason: "Faltan credenciales de OneSignal." };

    const playerBefore = await fetchPlayer(appId, restKey, subscriptionId);
    const repairResponse = prefs?.onesignal_push_token
      ? await repairSubscription(appId, restKey, subscriptionId, prefs.onesignal_push_token)
      : null;
    if (repairResponse) await new Promise((resolve) => setTimeout(resolve, 1500));
    const playerAfter = await fetchPlayer(appId, restKey, subscriptionId);

    const sendRes = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${restKey}` },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        include_external_user_ids: [userId],
        channel_for_external_user_ids: "push",
        headings: { en: "🐼 Diagnóstico Panda", es: "🐼 Diagnóstico Panda" },
        contents: { en: "Prueba técnica de entrega Android.", es: "Prueba técnica de entrega Android." },
        web_url: "https://os.cmrs.mx/notifications",
        data: { kind: "diagnostic", deep_link: "/notifications", at: new Date().toISOString() },
      }),
    });
    const sendJson = await safeJson(sendRes);
    let messageJson: JsonValue = null;
    const messageId = getStringProp(sendJson, "id");
    if (messageId) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const msgRes = await fetch(`https://onesignal.com/api/v1/notifications/${messageId}?app_id=${appId}`, {
        headers: { Authorization: `Key ${restKey}` },
      });
      messageJson = await safeJson(msgRes);
    }

    return {
      ok: sendRes.ok && !hasProp(sendJson, "errors"),
      stage: "onesignal",
      storedSubscriptionId: subscriptionId,
      storedPushTokenPresent: Boolean(prefs?.onesignal_push_token),
      globalNotificationsEnabled: prefs?.global_notifications_enabled ?? null,
      oneSignalPlayerBefore: redactPlayer(playerBefore),
      oneSignalRepairResponse: repairResponse,
      oneSignalPlayerAfter: redactPlayer(playerAfter),
      createStatus: sendRes.status,
      createResponse: sendJson,
      messageStatus: messageJson,
    };
  });

async function safeJson(res: Response): Promise<JsonValue> {
  try {
    return toJsonValue(await res.json());
  } catch {
    return await res.text();
  }
}

async function fetchPlayer(appId: string, restKey: string, subscriptionId: string): Promise<JsonValue> {
  const res = await fetch(`https://onesignal.com/api/v1/players/${subscriptionId}?app_id=${appId}`, {
    headers: { Authorization: `Key ${restKey}` },
  });
  return safeJson(res);
}

async function repairSubscription(
  appId: string,
  restKey: string,
  subscriptionId: string,
  token: string,
): Promise<JsonValue> {
  const res = await fetch(`https://onesignal.com/api/v1/players/${subscriptionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Key ${restKey}` },
    body: JSON.stringify({ app_id: appId, identifier: token, notification_types: 1 }),
  });
  return safeJson(res);
}

function redactPlayer(value: JsonValue): JsonValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const copy = { ...value } as Record<string, JsonValue>;
  const identifier = copy.identifier;
  if (typeof identifier === "string") {
    copy.identifierPresent = Boolean(identifier);
    copy.identifierPrefix = identifier.slice(0, 24);
    delete copy.identifier;
  }
  return copy;
}

function hasProp(value: JsonValue, prop: string): boolean {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && prop in value);
}

function getStringProp(value: JsonValue, prop: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value[prop];
  return typeof v === "string" ? v : null;
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as JsonValue;
}
