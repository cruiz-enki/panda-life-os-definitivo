import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "checkin_location",
  title: "Check-in de ubicación",
  description: "Registra un lugar visitado.",
  inputSchema: {
    name: z.string().min(1),
    category: z.string().default("momento"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    note: z.string().optional(),
    rating: z.number().int().min(1).max(5).optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("location_checkins")
      .insert({
        user_id: ctx.getUserId(),
        name: input.name,
        category: input.category,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        note: input.note ?? null,
        rating: input.rating ?? null,
        visited_at: todayCDMX(),
      })
      .select()
      .single();
    if (error) return err(error.message);
    return ok(`📍 ${input.name}`, data);
  },
});
