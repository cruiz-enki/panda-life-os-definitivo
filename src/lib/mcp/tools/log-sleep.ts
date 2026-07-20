import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "log_sleep",
  title: "Registrar sueño",
  description: "Registra (upsert) sueño para una fecha.",
  inputSchema: {
    date: z.string().optional().describe("YYYY-MM-DD (default hoy)"),
    bedtime: z.string().optional().describe("ISO datetime"),
    wake_time: z.string().optional().describe("ISO datetime"),
    duration_minutes: z.number().int().positive().optional(),
    quality: z.number().int().min(1).max(5).optional(),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const payload = {
      user_id: ctx.getUserId(),
      date: input.date ?? todayCDMX(),
      bedtime: input.bedtime ?? null,
      wake_time: input.wake_time ?? null,
      duration_minutes: input.duration_minutes ?? null,
      quality: input.quality ?? null,
      notes: input.notes ?? null,
      source: "mcp",
    };
    const { data, error } = await supabaseForUser(ctx)
      .from("sleep_logs")
      .upsert(payload, { onConflict: "user_id,date" })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Sueño registrado para ${payload.date}`, data);
  },
});
