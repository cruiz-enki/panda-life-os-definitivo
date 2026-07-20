import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, ok, err, todayCDMX } from "../supabase";

export default defineTool({
  name: "log_medication",
  title: "Registrar toma de medicamento",
  description: "Marca uno o más medicamentos como tomados. Busca por nombre parcial.",
  inputSchema: {
    names: z.array(z.string().min(1)).describe("Nombres (match parcial, case-insensitive)"),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return err("No autenticado");
    const supabase = supabaseForUser(ctx);
    const { data: meds, error: e1 } = await supabase
      .from("health_medications")
      .select("id,name,dose,unit,emoji")
      .eq("user_id", ctx.getUserId());
    if (e1) return err(e1.message);

    const now = new Date();
    const scheduled = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const found: string[] = [];
    const missing: string[] = [];
    for (const q of input.names) {
      const m = (meds ?? []).find((x) => x.name.toLowerCase().includes(q.toLowerCase()));
      if (!m) { missing.push(q); continue; }
      const { error } = await supabase.from("health_medication_logs").insert({
        user_id: ctx.getUserId(),
        medication_id: m.id,
        date: todayCDMX(),
        scheduled_time: scheduled,
        taken: true,
        taken_at: now.toISOString(),
        notes: input.note ?? "",
      });
      if (error) missing.push(q);
      else found.push(`${m.emoji ?? "💊"} ${m.name} ${m.dose ?? ""}${m.unit ?? ""}`.trim());
    }
    if (!found.length) return err(`No encontré: ${missing.join(", ")}`);
    return ok(
      `Registrados: ${found.join(", ")}${missing.length ? ` — sin match: ${missing.join(", ")}` : ""}`,
      { taken: found, missing },
    );
  },
});
