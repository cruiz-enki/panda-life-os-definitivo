// Future simulation (auth requerido)
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const MAX_BYTES = 50_000;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyUser(req);
    if ("error" in auth) return auth.error;

    const { metrics, habits, goals } = await req.json();
    const m = JSON.stringify(metrics ?? {});
    const h = JSON.stringify(habits ?? {});
    const g = JSON.stringify(goals ?? {});
    if (m.length + h.length + g.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "payload demasiado grande" }), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const systemPrompt = `Eres el simulador "FUTURE SIMULATION" de ENKI LIFE OS. 
Hablas en español, directo y orientador. Tu objetivo es proyectar el futuro del usuario basándote en sus datos actuales.

No asustes, orienta.
Debes devolver un JSON con el siguiente formato:
{
  "scenarios": [
    {
      "title": "Si sigues igual",
      "timeframe": "1 año",
      "projections": [
        { "category": "Salud", "impact": "↑", "description": "Mejora cardiovascular si mantienes el ritmo" },
        { "category": "Negocios", "impact": "↓", "description": "Estancamiento por falta de nuevos proyectos" }
      ],
      "summary": "Un párrafo breve proyectando este escenario."
    },
    {
      "title": "Si mantienes tus hábitos",
      "timeframe": "1 año",
      "projections": [
        { "category": "Salud", "impact": "↑↑", "description": "Peso menor y más energía diaria" },
        { "category": "Mental", "impact": "↑", "description": "Dolor lumbar menor por consistencia en estiramientos" }
      ],
      "summary": "Un párrafo breve proyectando los beneficios de la disciplina."
    }
  ],
  "ai_insight": "Una frase final poderosa de sabiduría/orientación."
}

Analiza:
- Metrics: ${m}
- Habits: ${h}
- Goals: ${g}
`;

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Genera la simulación de futuro basada en mis datos." },
      ],
      response_format: { type: "json_object" }
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-future-simulation error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
