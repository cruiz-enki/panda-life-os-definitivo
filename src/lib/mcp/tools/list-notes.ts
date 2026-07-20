import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "list_notes",
  title: "Listar notas",
  description: "Lista notas recientes del usuario. Opcionalmente busca por texto.",
  inputSchema: {
    query: z.string().optional().describe("Texto para buscar en título o contenido"),
    limit: z.number().int().positive().default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    let q = supabaseForUser(ctx)
      .from("notes")
      .select("id,title,content,category,tags,importance,updated_at")
      .eq("user_id", ctx.getUserId())
      .order("updated_at", { ascending: false })
      .limit(input.limit);
    if (input.query) q = q.or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok(`${data?.length ?? 0} notas`, data);
  },
});
