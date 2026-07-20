import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "add_habit",
  title: "Crear hábito",
  description: "Crea un nuevo hábito para trackear.",
  inputSchema: {
    name: z.string().min(1),
    emoji: z.string().default("✨"),
    points: z.number().int().min(1).max(100).default(10).describe("XP al completar"),
    frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    targetCount: z.number().int().min(1).default(1),
    category: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("habits")
      .insert({
        user_id: ctx.getUserId(),
        name: input.name,
        emoji: input.emoji,
        points: input.points,
        frequency: input.frequency,
        target_count: input.targetCount,
        streak: 0,
        history: [],
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Hábito creado: ${input.emoji} ${input.name}`, data);
  },
});
