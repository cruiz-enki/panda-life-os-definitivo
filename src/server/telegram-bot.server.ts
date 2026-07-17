import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";
import { sendTelegramMessage, getUpdates, type TgUpdate } from "./telegram.server";

const DEFAULT_BASE_URL = "https://os.cmrs.mx";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

type ProcessCtx = {
  supabase: any;
  ownerUserId: string | null;
  ownerChatId: number | null;
  baseUrl: string;
  publishableKey: string;
};

export function deriveTelegramWebhookSecret(telegramApiKey: string): string {
  return createHash("sha256").update(`telegram-webhook:${telegramApiKey}`).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function getServerEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SERVICE || !PUBLISHABLE) {
    throw new Error("Backend env missing");
  }
  return { SUPABASE_URL, SERVICE, PUBLISHABLE };
}

async function resolveOwner(supabase: any) {
  const { data: roles } = await (supabase as any)
    .from("user_roles")
    .select("user_id")
    .eq("role", "owner")
    .limit(1);
  const ownerUserId = (roles && roles[0]?.user_id) ?? null;
  if (!ownerUserId) return { ownerUserId: null, ownerChatId: null };
  const { data: cfg } = await (supabase as any)
    .from("telegram_config")
    .select("chat_id")
    .eq("user_id", ownerUserId)
    .maybeSingle();
  return { ownerUserId, ownerChatId: cfg?.chat_id ? Number(cfg.chat_id) : null };
}

async function ensureConfig(supabase: any, userId: string) {
  await (supabase as any)
    .from("telegram_config")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
}

async function handleStart(ctx: ProcessCtx, msg: NonNullable<TgUpdate["message"]>): Promise<string> {
  if (!ctx.ownerUserId) return "🚫 No hay un usuario owner configurado en la app.";
  await ensureConfig(ctx.supabase, ctx.ownerUserId);
  const { error } = await (ctx.supabase as any)
    .from("telegram_config")
    .update({ chat_id: msg.chat.id })
    .eq("user_id", ctx.ownerUserId);
  if (error) return `❌ Error al vincular: ${error.message}`;
  const name = msg.from?.first_name ?? "tú";
  ctx.ownerChatId = msg.chat.id;
  return `✅ *¡Vinculado, ${name}!*\n\nA partir de ahora puedes:\n• Recibir aviso de tareas vencidas\n• Escribir capturas: tareas, gastos, notas\n• Conversar con tu coach\n\nEscribe /ayuda para ver comandos.`;
}

async function handleAyuda(): Promise<string> {
  return [
    "*Panda's LIFE OS — comandos*",
    "",
    "/tareas — ver tareas pendientes",
    "/ayuda — este menú",
    "",
    "*Captura libre:* escribe lo que quieras y lo clasifico:",
    "• `comprar pan` → tarea",
    "• `gasté 200 en uber` → gasto",
    "• `idea: rediseñar dashboard` → nota",
    "",
    "Cualquier otra cosa va al coach.",
  ].join("\n");
}

async function handleTareas(ctx: ProcessCtx): Promise<string> {
  if (!ctx.ownerUserId) return "🚫 Sin owner.";
  const { data: tasks } = await (ctx.supabase as any)
    .from("tasks")
    .select("title, due, completed_at, status")
    .eq("user_id", ctx.ownerUserId)
    .is("completed_at", null)
    .order("due", { ascending: true, nullsFirst: false })
    .limit(15);
  if (!tasks || tasks.length === 0) return "🎉 No tienes tareas pendientes.";
  const lines = (tasks as any[]).map((t) => {
    const due = t.due ? ` _(${new Date(t.due).toLocaleDateString("es-MX")})_` : "";
    return `• ${t.title}${due}`;
  });
  return `📋 *Pendientes (${tasks.length})*\n\n${lines.join("\n")}\n\n${ctx.baseUrl}/tasks`;
}

async function callEdgeFn(ctx: ProcessCtx, fnName: string, body: unknown): Promise<Response> {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  return fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ctx.publishableKey,
      Authorization: `Bearer ${ctx.publishableKey}`,
    },
    body: JSON.stringify(body),
  });
}

async function handleFreeText(ctx: ProcessCtx, text: string): Promise<string> {
  if (!ctx.ownerUserId) return "🚫 Sin owner.";

  try {
    const res = await callEdgeFn(ctx, "ai-classify-capture", { text, userId: ctx.ownerUserId });
    if (res.ok) {
      const j = await res.json();
      if (j?.type === "task" && j.task) {
        const { error } = await (ctx.supabase as any).from("tasks").insert({
          user_id: ctx.ownerUserId,
          title: j.task.title,
          description: j.task.notes ?? null,
          due: j.task.due ?? null,
          priority: j.task.priority ?? "medium",
        });
        if (!error) return `📝 *Tarea creada:* ${j.task.title}`;
      }
    }
  } catch {
    // fallthrough al chat
  }

  try {
    const res = await callEdgeFn(ctx, "ai-chat", {
      messages: [{ role: "user", content: text }],
      userId: ctx.ownerUserId,
      stream: false,
    });
    if (res.ok) {
      const txt = await res.text();
      if (txt.startsWith("data:")) {
        let assembled = "";
        for (const line of txt.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) assembled += delta;
          } catch {
            // ignore
          }
        }
        if (assembled.trim()) return assembled.trim();
      } else {
        try {
          const j = JSON.parse(txt);
          const c = j.content ?? j.message ?? j.choices?.[0]?.message?.content;
          if (typeof c === "string" && c.trim()) return c.trim();
        } catch {
          // ignore
        }
        if (txt.trim()) return txt.trim();
      }
    }
  } catch {
    // ignore
  }

  return "🤔 No pude procesar eso ahora. Intenta de nuevo o escribe /ayuda.";
}

export async function createTelegramContext(baseUrl = DEFAULT_BASE_URL): Promise<ProcessCtx> {
  const { SUPABASE_URL, SERVICE, PUBLISHABLE } = getServerEnv();
  const supabase = createClient(SUPABASE_URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { ownerUserId, ownerChatId } = await resolveOwner(supabase);
  return { supabase, ownerUserId, ownerChatId, baseUrl, publishableKey: PUBLISHABLE };
}

export async function processTelegramUpdate(ctx: ProcessCtx, upd: TgUpdate): Promise<boolean> {
  const msg = upd.message;
  if (!msg || !msg.chat?.id) return false;

  // Check if bot is enabled for this chat/user
  const { data: cfg } = await (ctx.supabase as any)
    .from("telegram_config")
    .select("enabled")
    .eq("chat_id", msg.chat.id)
    .maybeSingle();

  if (cfg && cfg.enabled === false) {
    // Optionally log that it was ignored
    return false;
  }


  await (ctx.supabase as any).from("telegram_messages").upsert({
    update_id: upd.update_id,
    chat_id: msg.chat.id,
    user_id: null,
    text: msg.text ?? null,
    raw_update: upd as unknown as Record<string, unknown>,
    processed: false,
  }, { onConflict: "update_id" });

  const text = (msg.text ?? "").trim();
  const lc = text.toLowerCase();
  const isCommand = text.startsWith("/");
  const cmd = isCommand ? lc.split(/\s|@/)[0] : "";

  let response: string;
  if (cmd === "/start" || cmd === "/setup") {
    response = await handleStart(ctx, msg);
  } else if (!ctx.ownerChatId || msg.chat.id !== ctx.ownerChatId) {
    response = "🚫 Bot privado. Pide al dueño que te dé acceso.";
  } else if (cmd === "/ayuda" || cmd === "/help") {
    response = await handleAyuda();
  } else if (cmd === "/tareas" || cmd === "/tasks") {
    response = await handleTareas(ctx);
  } else if (text) {
    response = await handleFreeText(ctx, text);
  } else {
    response = "📎 Solo proceso mensajes de texto por ahora.";
  }

  try {
    await sendTelegramMessage(msg.chat.id, response);
  } catch (err) {
    console.error("sendTelegramMessage failed", err);
  }

  await (ctx.supabase as any).from("telegram_messages").update({
    processed: true,
    user_id: ctx.ownerUserId,
    response,
  }).eq("update_id", upd.update_id);

  return true;
}

export async function pollTelegramUpdates(baseUrl = DEFAULT_BASE_URL, maxRuntimeMs = MAX_RUNTIME_MS) {
  const ctx = await createTelegramContext(baseUrl);
  const { data: state, error: stateErr } = await (ctx.supabase as any)
    .from("telegram_bot_state")
    .select("update_offset")
    .eq("id", 1)
    .single();
  if (stateErr) throw new Error(stateErr.message);

  let currentOffset: number = state.update_offset ?? 0;
  let processed = 0;
  const startedAt = Date.now();

  while (true) {
    const elapsed = Date.now() - startedAt;
    const remaining = maxRuntimeMs - elapsed;
    if (remaining < MIN_REMAINING_MS) break;
    const timeout = Math.max(1, Math.min(50, Math.floor(remaining / 1000) - 2));

    let updates: TgUpdate[] = [];
    try {
      updates = await getUpdates(currentOffset, timeout);
    } catch (err) {
      console.error("getUpdates failed", err);
      break;
    }
    if (updates.length === 0) break;

    for (const upd of updates) {
      try {
        if (await processTelegramUpdate(ctx, upd)) processed++;
      } catch (err) {
        console.error("processUpdate failed", err);
      }
    }

    currentOffset = Math.max(...updates.map((u) => u.update_id)) + 1;
    await (ctx.supabase as any)
      .from("telegram_bot_state")
      .update({ update_offset: currentOffset, updated_at: new Date().toISOString() })
      .eq("id", 1);
  }

  return { processed, finalOffset: currentOffset };
}
