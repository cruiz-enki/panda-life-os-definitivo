import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

// Recalcula la racha de días consecutivos hasta hoy (America/Mexico_City).
function recalcStreak(history: string[]): number {
  const set = new Set(history);
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);
  };
  let offset = 0;
  if (!set.has(daysAgo(0))) {
    if (!set.has(daysAgo(1))) return 0;
    offset = 1;
  }
  let streak = 0;
  while (set.has(daysAgo(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

export default defineTool({
  name: "complete_habit",
  title: "Marcar hábito hecho",
  description: "Marca (o desmarca) un hábito como hecho hoy y recalcula la racha.",
  inputSchema: {
    habitId: z.string().uuid().optional().describe("ID del hábito. Si no se da, usa `name`."),
    name: z.string().optional().describe("Nombre exacto o parcial del hábito."),
    undo: z.boolean().default(false).describe("Si true, desmarca la fecha en vez de marcar."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    if (!input.habitId && !input.name) return err("Da `habitId` o `name`.");
    const sb = supabaseForUser(ctx);

    // Buscar hábito
    let query = sb.from("habits").select("id,name,emoji,points,streak,history").eq("user_id", ctx.getUserId());
    if (input.habitId) query = query.eq("id", input.habitId);
    else query = query.ilike("name", `%${input.name}%`);
    const { data: found, error: findErr } = await query.limit(2);
    if (findErr) return err(findErr.message);
    if (!found || found.length === 0) return err("No encontré ese hábito.");
    if (found.length > 1) return err(`Ambiguo, hay varios que coinciden: ${found.map((h) => h.name).join(", ")}`);
    const habit = found[0];

    const today = todayCDMX();
    const currentHistory: string[] = Array.isArray(habit.history) ? habit.history : [];
    const already = currentHistory.includes(today);
    let newHistory: string[];
    if (input.undo) {
      if (!already) return ok(`${habit.emoji} ${habit.name} no estaba marcado hoy.`);
      newHistory = currentHistory.filter((d) => d !== today);
    } else {
      if (already) return ok(`${habit.emoji} ${habit.name} ya estaba hecho hoy. Racha: ${habit.streak}.`);
      newHistory = [...currentHistory, today].sort();
    }
    const newStreak = recalcStreak(newHistory);
    const lastCompleted = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

    const { error: updErr } = await sb
      .from("habits")
      .update({ history: newHistory, streak: newStreak, last_completed: lastCompleted })
      .eq("id", habit.id)
      .eq("user_id", ctx.getUserId());
    if (updErr) return err(updErr.message);

    const verb = input.undo ? "Desmarcado" : "Hecho";
    return ok(`${verb}: ${habit.emoji} ${habit.name}. Racha: ${newStreak} 🔥`, {
      id: habit.id, streak: newStreak, last_completed: lastCompleted,
    });
  },
});
