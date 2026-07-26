import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "add_note",
  title: "Crear nota",
  description: "Crea una nota rápida en Pandus Maximus.",
  inputSchema: {
    title: z.string().min(1),
    content: z.string().default(""),
    category: z.string().optional().describe("Categoría / carpeta"),
    tags: z.array(z.string()).optional(),
    importance: z.enum(["low", "normal", "high"]).default("normal"),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("notes")
      .insert({
        user_id: ctx.getUserId(),
        title: input.title,
        content: input.content,
        category: input.category ?? "general",
        tags: input.tags ?? [],
        importance: input.importance,
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Nota creada: ${input.title}`, data);
  },
});
