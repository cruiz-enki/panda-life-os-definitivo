// Chat coach personal con streaming. Auth requerido; userId se deriva del JWT.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

type ChatMsg = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 50;
const MAX_CONTENT_LEN = 8000;

async function buildContextSnapshot(userId: string, supabaseUrl: string, serviceKey: string): Promise<string> {
  const admin = createClient(supabaseUrl, serviceKey);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [profile, tasks, habits, energy, identityAreas, identityProfile, identityJournal, expenses, learnings] = await Promise.all([
    admin.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
    admin.from("tasks").select("title, due, priority, status, completed_at").eq("user_id", userId).neq("status", "completed").order("due", { ascending: true, nullsFirst: false }).limit(10),
    admin.from("habits").select("name, streak, last_completed").eq("user_id", userId).order("streak", { ascending: false }).limit(10),
    admin.from("energy_entries").select("date, physical, mental, emotional, sleep").eq("user_id", userId).order("date", { ascending: false }).limit(7),
    admin.from("identity_areas").select("area, score").eq("user_id", userId).order("updated_at", { ascending: false }),
    admin.from("identity_profile").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("identity_journal").select("date, did_well, did_not_well, learned, energy, alignment").eq("user_id", userId).order("date", { ascending: false }).limit(3),
    admin.from("finance_expenses").select("amount, category, date").eq("user_id", userId).gte("date", monthStart),
    admin.from("learnings").select("title, category, date").eq("user_id", userId).order("date", { ascending: false }).limit(3),
  ]);

  const ctx: Record<string, unknown> = { fecha_actual: today };
  if (profile.data) ctx.usuario = profile.data;
  if (tasks.data) {
    const overdue = tasks.data.filter((t: { due: string | null }) => t.due && t.due.slice(0, 10) < today);
    const todayTasks = tasks.data.filter((t: { due: string | null }) => t.due?.slice(0, 10) === today);
    ctx.tareas = {
      total_pendientes: tasks.data.length,
      vencidas: overdue.slice(0, 5),
      hoy: todayTasks.slice(0, 5),
      proximas: tasks.data.slice(0, 5),
    };
  }
  if (habits.data) {
    ctx.habitos = habits.data.map((h: { name: string; streak: number; last_completed: string | null }) => ({
      nombre: h.name,
      racha: h.streak,
      hecho_hoy: h.last_completed === today,
    }));
  }
  if (energy.data?.[0]) ctx.energia = { hoy: energy.data[0], ultimos_dias: energy.data };
  if (identityProfile.data) ctx.identidad_perfil = identityProfile.data;
  if (identityAreas.data?.length) ctx.rueda_de_la_vida = identityAreas.data;
  if (identityJournal.data?.length) ctx.diario_reciente = identityJournal.data;
  if (expenses.data?.length) {
    const total = expenses.data.reduce((s: number, e: { amount: number }) => s + Number(e.amount || 0), 0);
    ctx.finanzas_mes = { total_gastado: total, transacciones: expenses.data.length };
  }
  if (learnings.data?.length) ctx.aprendizajes_recientes = learnings.data;

  return JSON.stringify(ctx, null, 2);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyUser(req);
    if ("error" in auth) return auth.error;
    const userId = auth.userId;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = (await req.json()) as { messages?: ChatMsg[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "messages inválido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    for (const m of messages) {
      if (!m || typeof m.content !== "string" || m.content.length > MAX_CONTENT_LEN || (m.role !== "user" && m.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "mensaje inválido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      }
    }

    let contextBlock = "";
    try {
      const snap = await buildContextSnapshot(userId, SUPABASE_URL, SERVICE_KEY);
      contextBlock = `\n\nCONTEXTO ACTUAL DEL USUARIO (datos reales de su vida hoy):\n${snap}\n`;
    } catch (e) {
      console.warn("No se pudo cargar snapshot:", e);
    }

    const systemPrompt = `Eres el coach personal del usuario en ENKI LIFE OS, su sistema operativo de vida.
Tu personalidad: cercano, directo, motivador pero realista. Hablas en español. Usas emojis con moderación.
Conoces sus tareas, hábitos, energía, finanzas, salud e identidad porque te paso un contexto en cada turno.
Reglas:
- Responde con markdown (negritas, listas, bloques de código si hay datos).
- Sé conciso. Máximo 200 palabras salvo que pidan análisis profundo.
- Cuando tengas datos del contexto úsalos: cita números, fechas, métricas concretas.
- Si no tienes datos suficientes, dilo y pregunta lo necesario.
- No inventes datos que no estén en el contexto.
- Cuando el usuario te pida una acción (planear, decidir, priorizar), entrega pasos concretos.${contextBlock}`;

    const response = await callAI({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    return new Response(response.body, {
      headers: { ...cors, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
