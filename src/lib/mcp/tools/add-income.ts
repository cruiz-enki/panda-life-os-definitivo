import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "add_income",
  title: "Registrar ingreso",
  description: "Registra un ingreso (kind=income) en finanzas.",
  inputSchema: {
    amount: z.number().positive(),
    category: z.string().default("ingreso"),
    date: z.string().optional(),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("finance_expenses")
      .insert({
        user_id: ctx.getUserId(),
        amount: input.amount,
        category: input.category,
        payment_method: "transfer",
        date: input.date ?? todayCDMX(),
        note: input.note ?? "",
        kind: "income",
        expense_type: "normal",
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Ingreso registrado: +$${input.amount}`, data);
  },
});
