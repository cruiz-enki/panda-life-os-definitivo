import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "list_recent_expenses",
  title: "Listar gastos recientes",
  description: "Devuelve los gastos más recientes con opción de filtrar por categoría.",
  inputSchema: {
    category: z.string().optional(),
    limit: z.number().int().positive().default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    let q = supabaseForUser(ctx)
      .from("finance_expenses")
      .select("id,amount,category,payment_method,date,note,kind,tags")
      .eq("user_id", ctx.getUserId())
      .order("date", { ascending: false })
      .limit(input.limit);
    if (input.category) q = q.eq("category", input.category);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok(`${data?.length ?? 0} movimientos`, data);
  },
});
