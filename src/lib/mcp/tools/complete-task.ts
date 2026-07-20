import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "complete_task",
  title: "Marcar tarea como completada",
  description: "Marca una tarea como done por id o por match parcial de título.",
  inputSchema: {
    id: z.string().optional(),
    title_match: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    let taskId = input.id;
    if (!taskId && input.title_match) {
      const { data } = await supabase
        .from("tasks")
        .select("id,title")
        .eq("user_id", ctx.getUserId())
        .eq("status", "pending")
        .ilike("title", `%${input.title_match}%`)
        .limit(1)
        .maybeSingle();
      taskId = data?.id;
    }
    if (!taskId) return err("Especifica id o title_match");
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", ctx.getUserId())
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`✅ Tarea completada`, data);
  },
});
