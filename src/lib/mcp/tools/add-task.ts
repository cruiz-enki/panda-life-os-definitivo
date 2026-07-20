import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "add_task",
  title: "Crear tarea",
  description: "Crea una tarea en la bandeja del usuario.",
  inputSchema: {
    title: z.string().min(1),
    notes: z.string().optional(),
    due_date: z.string().optional().describe("YYYY-MM-DD"),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    list: z.string().optional().describe("Nombre de la lista"),
    tags: z.array(z.string()).optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    // Resolver list_id si viene por nombre
    let list_id: string | null = null;
    if (input.list) {
      const { data: lst } = await supabase
        .from("task_lists")
        .select("id")
        .eq("user_id", ctx.getUserId())
        .ilike("name", input.list)
        .maybeSingle();
      list_id = lst?.id ?? null;
    }
    const payload: Record<string, unknown> = {
      user_id: ctx.getUserId(),
      title: input.title,
      notes: input.notes ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? "normal",
      status: "pending",
      tags: input.tags ?? [],
    };
    if (list_id) payload.list_id = list_id;
    const { data, error } = await supabase.from("tasks").insert(payload).select().single();
    if (error) return err(error.message);
    return ok(`Tarea creada: ${input.title}`, data);
  },
});
