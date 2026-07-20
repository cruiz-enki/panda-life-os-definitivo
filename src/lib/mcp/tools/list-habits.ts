import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "list_habits",
  title: "Listar hábitos",
  description: "Lista los hábitos con su racha actual y si ya están hechos hoy.",
  inputSchema: {
    pendingOnly: z.boolean().default(false).describe("Solo los que no están hechos hoy"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const { data, error } = await supabaseForUser(ctx)
      .from("habits")
      .select("id,name,emoji,points,streak,frequency,target_count,last_completed,history")
      .eq("user_id", ctx.getUserId())
      .order("streak", { ascending: false });
    if (error) return err(error.message);
    const today = todayCDMX();
    const rows = (data ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      streak: h.streak,
      points: h.points,
      frequency: h.frequency,
      target_count: h.target_count,
      done_today: Array.isArray(h.history) ? h.history.includes(today) : false,
    }));
    const filtered = input.pendingOnly ? rows.filter((r) => !r.done_today) : rows;
    const text = filtered.length === 0
      ? (input.pendingOnly ? "Todos los hábitos completados hoy 🎉" : "Sin hábitos.")
      : filtered.map((r) => `${r.emoji} ${r.name} — racha ${r.streak}${r.done_today ? " ✓ hoy" : ""}`).join("\n");
    return ok(text, filtered);
  },
});
