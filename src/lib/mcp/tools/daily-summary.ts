import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "daily_summary",
  title: "Resumen del día",
  description: "Resumen consolidado del día: gastos, sueño, mood, agua, tareas y check-ins.",
  inputSchema: {
    date: z.string().optional().describe("YYYY-MM-DD (default hoy CDMX)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    const date = input.date ?? todayCDMX();
    const uid = ctx.getUserId();
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    const [expenses, sleep, water, mood, tasks, checkins] = await Promise.all([
      supabase.from("finance_expenses").select("amount,category,kind,note").eq("user_id", uid).eq("date", date),
      supabase.from("sleep_logs").select("*").eq("user_id", uid).eq("date", date).maybeSingle(),
      supabase.from("health_water_logs").select("amount_ml").eq("user_id", uid).eq("date", date).maybeSingle(),
      supabase.from("mood_logs").select("mood,intensity,energy,pain,note").eq("user_id", uid).gte("logged_at", start).lte("logged_at", end),
      supabase.from("tasks").select("title,status").eq("user_id", uid).gte("updated_at", start).lte("updated_at", end),
      supabase.from("location_checkins").select("name,category").eq("user_id", uid).eq("visited_at", date),
    ]);

    const spent = (expenses.data ?? []).filter((e) => e.kind === "expense").reduce((s, e) => s + Number(e.amount), 0);
    const income = (expenses.data ?? []).filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount), 0);

    return ok(`Resumen ${date}`, {
      date,
      expenses_total: spent,
      income_total: income,
      expenses: expenses.data ?? [],
      sleep: sleep.data ?? null,
      water_ml: water.data?.amount_ml ?? 0,
      moods: mood.data ?? [],
      tasks: tasks.data ?? [],
      checkins: checkins.data ?? [],
    });
  },
});
