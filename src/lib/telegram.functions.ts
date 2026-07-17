/**
 * Server functions para **integración con Telegram**: envío de mensajes
 * desde la app al bot del usuario.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTelegramMessage } from "../server/telegram.server";
import { pollTelegramUpdates } from "../server/telegram-bot.server";

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ chatId: z.union([z.string(), z.number()]) }).parse(data),
  )
  .handler(async ({ data }) => {
    await sendTelegramMessage(
      data.chatId,
      "✅ *Conexión OK*\n\nPanda's LIFE OS está conectado. Te avisaré de tus tareas vencidas y puedes escribirme cualquier captura.",
    );
    return { ok: true };
  });

export const syncTelegramNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const result = await pollTelegramUpdates("https://os.cmrs.mx", 12_000);
    return { ok: true, ...result };
  });
