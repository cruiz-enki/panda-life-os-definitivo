/**
 * **Server fns** — Helpers de quests para debug/UI:
 *   - sendQuestTestNotification: envía push de prueba de quest al usuario actual.
 *   - createDemoQuest: crea una quest activa de demo con due_date = hoy.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODULE_COPY: Record<string, { emoji: string; body: string; link: string }> = {
  learning: { emoji: "📚", body: "Tu misión de hoy: registra un aprendizaje y alimenta tu Skill Tree.", link: "/learnings-history" },
  money: { emoji: "💰", body: "Tu misión de hoy: registra un gasto o revisa tu Money OS por 5 minutos.", link: "/finance" },
  home: { emoji: "🏠", body: "Tu misión de hoy: completa una tarea rápida y sube el score de tu casa.", link: "/home" },
  health: { emoji: "🏋️", body: "Operación Fénix: una victoria mínima mantiene vivo el progreso.", link: "/health" },
  goals: { emoji: "🧭", body: "Tu visión necesita una acción hoy. Completa una misión pequeña.", link: "/goals" },
};

export const sendQuestTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
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

    const copy = MODULE_COPY.learning;
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${restKey}` },
      body: JSON.stringify({
        app_id: appId,
        include_subscription_ids: [playerId],
        headings: { en: `${copy.emoji} Misión de prueba`, es: `${copy.emoji} Misión de prueba` },
        contents: { en: copy.body, es: copy.body },
        web_url: `https://os.cmrs.mx${copy.link}`,
        data: { kind: "quest", deep_link: copy.link, test: true },
      }),
    });
    const j = (await res.json()) as { id?: string; recipients?: number; errors?: unknown };
    if (!res.ok || j.errors) return { ok: false, reason: JSON.stringify(j.errors ?? j) };
    return { ok: true, recipients: j.recipients ?? 0, id: j.id };
  });

export const createDemoQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    const { data, error } = await supabase
      .from("custom_quests")
      .insert({
        user_id: userId,
        title: "Misión demo: Aprende algo nuevo",
        description: "Registra 1 aprendizaje hoy. Esta misión fue creada desde Debug.",
        emoji: "📚",
        xp: 50,
        target: 1,
        tracking: "manual",
        scope: "daily",
        active: true,
        status: "active",
        priority: "high",
        module_key: "learning",
        estimated_minutes: 10,
        due_date: today.toISOString(),
      })
      .select("id")
      .single();
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data.id };
  });

export const completeQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { questId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quest, error: qErr } = await supabase
      .from("custom_quests")
      .select("id, user_id, xp, status")
      .eq("id", data.questId)
      .eq("user_id", userId)
      .maybeSingle();
    if (qErr) return { ok: false, reason: qErr.message };
    if (!quest) return { ok: false, reason: "Quest no encontrada" };
    if (quest.status === "completed") return { ok: true, alreadyCompleted: true, xp: quest.xp };

    const { error: updErr } = await supabase
      .from("custom_quests")
      .update({ status: "completed", active: false, completed_at: new Date().toISOString() })
      .eq("id", quest.id);
    if (updErr) return { ok: false, reason: updErr.message };

    return { ok: true, xp: quest.xp };
  });

export const listActiveQuests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("custom_quests")
      .select("id, title, description, module_key, priority, due_date, xp, emoji, estimated_minutes")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return { quests: data ?? [] };
  });
