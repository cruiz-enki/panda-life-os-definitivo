import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "log_water",
  title: "Registrar agua",
  description: "Suma ml de agua al total del día.",
  inputSchema: {
    amount_ml: z.number().int().positive().default(250),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    const today = todayCDMX();
    const { data: existing } = await supabase
      .from("health_water_logs")
      .select("id,amount_ml")
      .eq("user_id", ctx.getUserId())
      .eq("date", today)
      .maybeSingle();
    const total = (existing?.amount_ml ?? 0) + input.amount_ml;
    const { data, error } = await supabase
      .from("health_water_logs")
      .upsert({ user_id: ctx.getUserId(), date: today, amount_ml: total }, { onConflict: "user_id,date" })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`+${input.amount_ml} ml · Hoy: ${total} ml`, data);
  },
});
