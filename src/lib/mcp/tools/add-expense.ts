import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "add_expense",
  title: "Registrar gasto",
  description: "Registra un gasto en Panda OS para el usuario autenticado.",
  inputSchema: {
    amount: z.number().positive().describe("Monto en MXN"),
    category: z.string().describe("Categoría (ej. comida, transporte, salud)"),
    payment_method: z.enum(["cash", "debit", "credit", "transfer", "mercadopago", "other"])
      .default("cash").describe("Método de pago"),
    date: z.string().optional().describe("Fecha YYYY-MM-DD (default hoy CDMX)"),
    note: z.string().optional().describe("Nota corta"),
    tags: z.array(z.string()).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("finance_expenses")
      .insert({
        user_id: ctx.getUserId(),
        amount: input.amount,
        category: input.category,
        payment_method: input.payment_method,
        date: input.date ?? todayCDMX(),
        note: input.note ?? "",
        tags: input.tags ?? [],
        kind: "expense",
        expense_type: "normal",
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Gasto registrado: $${input.amount} en ${input.category}`, data);
  },
});
