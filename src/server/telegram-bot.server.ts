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
    "/t <texto> — crear tarea directa (NLP)",
    "/ayuda — este menú",
    "",
    "*Captura libre:* escribe lo que quieras y lo clasifico:",
    "• `comprar pan` → tarea",
    "• `gasté 200 en uber` → gasto",
    "• `idea: rediseñar dashboard` → nota",
    "",
    "*Tarea rápida:* `/t Llamar a Juan mañana 3pm #trabajo !alta`",
    "",
    "Cualquier otra cosa va al coach.",
  ].join("\n");
}

async function createTaskFromText(ctx: ProcessCtx, text: string): Promise<string> {
  if (!ctx.ownerUserId) return "🚫 Sin owner.";
  const raw = text.trim();
  if (!raw) return "❌ Escribe algo después de /t. Ejemplo: `/t Comprar pan mañana 9am !alta`";

  // Parser NLP ligero (fecha relativa, hora, prioridad, tags)
  let title = raw;
  let due: string | null = null;
  let priority: "high" | "medium" | "low" = "medium";
  const tags: string[] = [];

  // Prioridad !alta !media !baja o !!/!!!
  const prio = title.match(/(?:^|\s)!(alta|media|baja|high|medium|low|!{0,2})(?=\s|$)/i);
  if (prio) {
    const p = prio[1].toLowerCase();
    if (p === "alta" || p === "high" || p === "!!" || p === "!!!") priority = "high";
    else if (p === "baja" || p === "low") priority = "low";
    title = title.replace(prio[0], " ").trim();
  }

  // Tags #foo
  title = title.replace(/(?:^|\s)#([\wáéíóúñ-]+)/gi, (_m, t) => {
    tags.push(String(t).toLowerCase());
    return " ";
  }).replace(/\s+/g, " ").trim();

  // Fecha relativa
  const now = new Date();
  const tz = (d: Date) => d.toISOString();
  const setTime = (d: Date, hh: number, mm: number) => { d.setHours(hh, mm, 0, 0); return d; };
  const timeMatch = title.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  let hh = 9, mm = 0, hasTime = false;
  if (timeMatch) {
    hh = parseInt(timeMatch[1], 10);
    mm = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ap = timeMatch[3]?.toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    if (hh <= 23 && mm <= 59 && (timeMatch[3] || timeMatch[2] || (hh >= 6 && hh <= 22))) {
      hasTime = true;
      title = title.replace(timeMatch[0], " ").replace(/\s+/g, " ").trim();
    }
  }
  const lower = title.toLowerCase();
  const dayRe = /\b(hoy|mañana|pasado\s+mañana|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i;
  const dayMatch = lower.match(dayRe);
  if (dayMatch) {
    const w = dayMatch[1].toLowerCase();
    const d = new Date(now);
    if (w === "hoy") { /* today */ }
    else if (w === "mañana") d.setDate(d.getDate() + 1);
    else if (w.startsWith("pasado")) d.setDate(d.getDate() + 2);
    else {
      const map: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, "miércoles": 3, "miercoles": 3, jueves: 4, viernes: 5, "sábado": 6, "sabado": 6 };
      const target = map[w] ?? d.getDay();
      const diff = ((target - d.getDay()) + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    }
    setTime(d, hasTime ? hh : 9, hasTime ? mm : 0);
    due = tz(d);
    title = title.replace(new RegExp(dayMatch[0], "i"), " ").replace(/\s+/g, " ").trim();
  } else if (hasTime) {
    const d = new Date(now);
    setTime(d, hh, mm);
    if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
    due = tz(d);
  }

  if (!title) return "❌ No entendí el título.";

  const { data: inserted, error } = await (ctx.supabase as any)
    .from("tasks")
    .insert({
      user_id: ctx.ownerUserId,
      title,
      due,
      priority,
      tags: tags.length ? tags : undefined,
    })
    .select("id")
    .single();
  if (error) return `❌ Error: ${error.message}`;

  const parts = [`📝 *Tarea creada:* ${title}`];
  if (due) parts.push(`📅 ${new Date(due).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: hh || mm ? "short" : undefined })}`);
  if (priority !== "medium") parts.push(`⚡ Prioridad: ${priority === "high" ? "alta" : "baja"}`);
  if (tags.length) parts.push(`🏷️ ${tags.map((t) => `#${t}`).join(" ")}`);
  parts.push(`\n${ctx.baseUrl}/tasks`);
  return parts.join("\n");
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
