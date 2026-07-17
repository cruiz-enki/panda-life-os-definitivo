// Reflexión semanal de identidad (auth requerido)
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const MAX_SNAPSHOT_BYTES = 80_000;

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

    const systemPrompt = `Eres el coach de identidad personal en "ENKI LIFE OS". Analizas la semana del usuario y le devuelves
una reflexión profunda pero accionable, en español, tono cercano. Devuelves SIEMPRE JSON con tres campos:
- analysis: análisis de desempeño semanal (3-4 frases, máximo 80 palabras)
- patterns: patrones detectados conectando sueño/energía/decisiones/resultados (2-3 frases, máximo 60 palabras)
- recommendations: 3 recomendaciones concretas en bullets markdown (-)
                Sé específico: usa los datos. No repitas el JSON crudo.`;

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Datos de la semana del usuario:\n${snapStr}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "weekly_reflection",
          description: "Devuelve la reflexión semanal estructurada",
          parameters: {
            type: "object",
            properties: {
              analysis: { type: "string" },
              patterns: { type: "string" },
              recommendations: { type: "string" },
            },
            required: ["analysis", "patterns", "recommendations"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "weekly_reflection" } },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { analysis: "", patterns: "", recommendations: "" };
    return new Response(JSON.stringify(parsed), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-identity-reflection error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
