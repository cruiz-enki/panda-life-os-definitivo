import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err } from "../supabase";

export default defineTool({
  name: "log_mood",
  title: "Check-in emocional",
  description: "Registra estado de ánimo, energía y dolor.",
  inputSchema: {
    mood: z.enum(["great", "good", "meh", "low", "bad"]).default("good"),
    intensity: z.number().int().min(1).max(5).default(3),
    energy: z.number().int().min(1).max(5).optional(),
    pain: z.number().int().min(0).max(10).optional(),
    tags: z.array(z.string()).optional(),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("mood_logs")
      .insert({
        user_id: ctx.getUserId(),
        mood: input.mood,
        intensity: input.intensity,
        tags: input.tags ?? [],
        note: input.note ?? null,
        energy: input.energy ?? null,
        pain: input.pain ?? null,
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`Mood ${input.mood} registrado`, data);
  },
});
