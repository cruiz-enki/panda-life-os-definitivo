import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "Listar tareas",
  description: "Lista tareas del usuario con filtros básicos.",
  inputSchema: {
    status: z.enum(["pending", "done", "all"]).default("pending"),
    query: z.string().optional(),
    limit: z.number().int().positive().default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    let q = supabaseForUser(ctx)
      .from("tasks")
      .select("id,title,notes,due_date,priority,status,tags,list_id,updated_at")
      .eq("user_id", ctx.getUserId())
      .order("updated_at", { ascending: false })
      .limit(input.limit);
    if (input.status !== "all") q = q.eq("status", input.status);
    if (input.query) q = q.ilike("title", `%${input.query}%`);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok(`${data?.length ?? 0} tareas`, data);
  },
});
