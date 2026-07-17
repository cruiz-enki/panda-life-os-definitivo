// Resumen diario (auth requerido)
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const MAX_SNAPSHOT_BYTES = 50_000;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyUser(req);
    if ("error" in auth) return auth.error;

    const { snapshot } = await req.json();
    const snapStr = JSON.stringify(snapshot ?? {});
    if (snapStr.length > MAX_SNAPSHOT_BYTES) {
      return new Response(JSON.stringify({ error: "snapshot demasiado grande" }), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const systemPrompt = `Eres el coach personal de un usuario en "Panda's LIFE OS", una app de productividad y bienestar.
Tu tono: cercano, motivador pero realista, conciso, en español. Usa emojis con moderación.
Devuelves un resumen ESTRUCTURADO en markdown con estas secciones cortas:
**🎯 Foco del día**: 1 frase con la prioridad más importante.
**✅ Logros**: 1-2 bullets celebrando lo hecho hoy.
**⚠️ Atención**: 1-2 bullets con riesgos (tareas vencidas, energía baja, hábitos rotos).
**💡 Sugerencia**: 1 acción concreta y pequeña que puede hacer ahora.
**⚖️ Balance**: 1 frase breve sobre el equilibrio vida-trabajo hoy.
Máximo 150 palabras totales. No repitas datos crudos, interpreta.`;

    const userPrompt = `Datos de hoy del usuario (JSON):\n${snapStr}`;

    let response: Response | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      response = await callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      if (response.status !== 429) break;
      attempt++;
      if (attempt >= maxAttempts) break;
      const delay = 800 * Math.pow(2, attempt) + Math.random() * 400;
      await new Promise((r) => setTimeout(r, delay));
    }

    if (response && response.status === 429) {
      const fallback = `**🎯 Foco del día**: Avanza una tarea importante, sin distracciones.\n\n**✅ Logros**: Cada paso cuenta, sigue construyendo tu racha.\n\n**⚠️ Atención**: El coach IA está saturado ahora mismo, intenta regenerar en un momento.\n\n**💡 Sugerencia**: Toma 2 minutos para revisar tu lista de tareas y elegir la siguiente acción.\n\n**⚖️ Balance**: Recuerda hacer una pausa breve antes de seguir 🐼`;
      return new Response(JSON.stringify({ summary: fallback }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const errorResponse = await handleAIResponse(response!, req);
    if (errorResponse) return errorResponse;

    const data = await response!.json();
    const summary = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ summary }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-daily-summary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
