import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "list_medications",
  title: "Listar medicamentos",
  description: "Lista los medicamentos activos del usuario con dosis y frecuencia.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("health_medications")
      .select("id,name,dose,unit,frequency,emoji,notes")
      .eq("user_id", ctx.getUserId());
    if (error) return err(error.message);
    return ok(`${data?.length ?? 0} medicamentos`, data);
  },
});
