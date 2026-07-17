// Server-only helpers para Telegram Bot API vía connector gateway.
// No importar desde código de cliente.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function getKeys() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  return { LOVABLE_API_KEY, TELEGRAM_API_KEY };
}

export type SendOpts = {
  parse_mode?: "Markdown" | "HTML" | "MarkdownV2";
  disable_web_page_preview?: boolean;
  reply_to_message_id?: number;
};

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts: SendOpts = {},
) {
  const { LOVABLE_API_KEY, TELEGRAM_API_KEY } = getKeys();
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts.parse_mode ?? "Markdown",
      disable_web_page_preview: opts.disable_web_page_preview ?? true,
      ...(opts.reply_to_message_id ? { reply_to_message_id: opts.reply_to_message_id } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Telegram sendMessage failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

export type TgMessage = {
  message_id: number;
  from?: { id: number; first_name?: string; username?: string };
  chat: { id: number; type: string; first_name?: string; username?: string };
  date: number;
  text?: string;
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
};

export async function getUpdates(offset: number, timeoutSec = 50): Promise<TgUpdate[]> {
  const { LOVABLE_API_KEY, TELEGRAM_API_KEY } = getKeys();
  const res = await fetch(`${GATEWAY_URL}/getUpdates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      offset,
      timeout: timeoutSec,
      allowed_updates: ["message"],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Telegram getUpdates failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return (data.result ?? []) as TgUpdate[];
}
