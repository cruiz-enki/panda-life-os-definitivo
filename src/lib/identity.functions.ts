/**
 * **Server fns** — Identidades del usuario (Fase 3).
 *  - listUserIdentities: lista identidades del usuario (seed automático).
 *  - setIdentityActive: activa/desactiva una identidad.
 *  - setFocusIdentity: identidad de foco semanal (notification_preferences.focus_identity_key).
 *  - sendIdentityTestNotification: dispara push con el copy de una identidad.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IDENTITY_BY_KEY, IDENTITY_DEFS, type IdentityKey } from "@/lib/identities";

async function ensureSeeded(supabase: any, userId: string) {
  const { data: existing } = await supabase
    .from("user_identities")
    .select("identity_key")
    .eq("user_id", userId);
  const have = new Set((existing ?? []).map((r: { identity_key: string }) => r.identity_key));
  const missing = IDENTITY_DEFS.filter((d) => !have.has(d.key));
  if (missing.length === 0) return;
  await supabase.from("user_identities").insert(
    missing.map((d, i) => ({
      user_id: userId,
      identity_key: d.key,
      name: d.name,
      emoji: d.emoji,
      description: d.description,
      active: d.key === "ceo" || d.key === "builder",
      priority: 100 - i,
    })),
  );
}

export const listUserIdentities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureSeeded(supabase, userId);
    const [identities, prefs] = await Promise.all([
      supabase
        .from("user_identities")
        .select("id, identity_key, name, emoji, description, active, priority")
        .eq("user_id", userId)
        .order("priority", { ascending: false }),
      supabase
        .from("notification_preferences")
        .select("focus_identity_key")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (identities.error) throw new Error(identities.error.message);
    return {
      identities: identities.data ?? [],
      focus_identity_key: prefs.data?.focus_identity_key ?? null,
    };
  });

export const setIdentityActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { identity_key: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureSeeded(supabase, userId);
    const { error } = await supabase
      .from("user_identities")
      .update({ active: data.active })
      .eq("user_id", userId)
      .eq("identity_key", data.identity_key);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  });

export const setFocusIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { identity_key: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: userId, focus_identity_key: data.identity_key },
        { onConflict: "user_id" },
      );
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  });

export const sendIdentityTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { identity_key: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const def = IDENTITY_BY_KEY[data.identity_key as IdentityKey];
    if (!def) return { ok: false, reason: "Identidad desconocida." };
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("onesignal_player_id")
      .eq("user_id", userId)
      .maybeSingle();
    const playerId = prefs?.onesignal_player_id;
    if (!playerId) return { ok: false, reason: "Sin onesignal_player_id. Activa push primero." };

    const appId = process.env.ONESIGNAL_APP_ID;
    const restKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !restKey) return { ok: false, reason: "OneSignal no configurado." };

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${restKey}` },
      body: JSON.stringify({
        app_id: appId,
        include_subscription_ids: [playerId],
        headings: { en: def.title, es: def.title },
        contents: { en: def.body, es: def.body },
        web_url: `https://app.cmrs.mx${def.link}`,
        data: { kind: "identity", identity_key: def.key, deep_link: def.link, test: true },
      }),
    });
    const j = (await res.json()) as { id?: string; recipients?: number; errors?: unknown };
    if (!res.ok || j.errors) return { ok: false, reason: JSON.stringify(j.errors ?? j) };

    // Registrar también en notification_queue para historial
    await supabase.from("notification_queue").insert({
      user_id: userId,
      module_key: "identity",
      title: def.title,
      body: def.body,
      notification_type: "insight",
      tone: "epic",
      priority: 6,
      deep_link: def.link,
      identity_key: def.key,
      dedupe_key: `identity_test:${def.key}:${new Date().toISOString().slice(0, 10)}:${Date.now()}`,
      status: "sent",
      sent_at: new Date().toISOString(),
      onesignal_response: j as any,
    });

    return { ok: true, recipients: j.recipients ?? 0, id: j.id };
  });
