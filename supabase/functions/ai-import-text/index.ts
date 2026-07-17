// Edge function: parse free-form text into structured ImportPayload (auth requerido)
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const MAX_TEXT = 10000;

const SYSTEM = `Eres un parser que convierte notas en español a JSON estructurado para una app de productividad y salud.
Analiza el texto del usuario y extrae elementos en estas categorías:
- habits: hábitos repetitivos (ej: "tomar agua", "meditar")
- tasks: tareas únicas con fecha o acción concreta
- ingredients: ingredientes de cocina sueltos
- dishes: platillos/recetas con sus ingredientes
- rewards: recompensas o premios
- quests: misiones con meta cuantificable

Solo incluye categorías que detectes. Sé conservador: si dudas, omite. Usa emojis cuando sea claro.`;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyUser(req);
    if ("error" in auth) return auth.error;

    const { text, target } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text requerido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (text.length > MAX_TEXT) {
      return new Response(JSON.stringify({ error: `text excede ${MAX_TEXT} caracteres` }), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const userPrompt = target && target !== "mixed"
      ? `Extrae SOLO elementos del tipo: ${target}.\n\nTexto:\n${text}`
      : `Extrae todos los elementos relevantes.\n\nTexto:\n${text}`;

    const response = await callAI({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "import_payload",
          description: "Estructura el contenido extraído",
          parameters: {
            type: "object",
            properties: {
              habits: { type: "array", items: { type: "object", properties: {
                name: { type: "string" }, emoji: { type: "string" },
                points: { type: "number" }, frequency: { type: "string", enum: ["daily","weekly","monthly"] },
              }, required: ["name"] } },
              tasks: { type: "array", items: { type: "object", properties: {
                title: { type: "string" }, description: { type: "string" },
                priority: { type: "string", enum: ["high","medium","low"] },
              }, required: ["title"] } },
              ingredients: { type: "array", items: { type: "object", properties: {
                name: { type: "string" }, emoji: { type: "string" }, category: { type: "string" },
                default_unit: { type: "string" }, default_qty: { type: "string" },
              }, required: ["name"] } },
              dishes: { type: "array", items: { type: "object", properties: {
                name: { type: "string" }, emoji: { type: "string" },
                dish_type: { type: "string", enum: ["quick","prep"] },
                classification: { type: "string", enum: ["saludable","chatarra"] },
                preparation: { type: "string" }, prep_minutes: { type: "number" },
                servings: { type: "number" },
                ingredient_names: { type: "array", items: { type: "string" } },
              }, required: ["name"] } },
              rewards: { type: "array", items: { type: "object", properties: {
                name: { type: "string" }, description: { type: "string" },
                emoji: { type: "string" }, cost: { type: "number" }, category: { type: "string" },
              }, required: ["name"] } },
              quests: { type: "array", items: { type: "object", properties: {
                title: { type: "string" }, description: { type: "string" },
                emoji: { type: "string" }, xp: { type: "number" }, target: { type: "number" },
                scope: { type: "string", enum: ["daily","weekly","monthly"] },
              }, required: ["title"] } },
            },
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "import_payload" } },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    const payload = args ? JSON.parse(args) : {};

    return new Response(JSON.stringify({ payload }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-import-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
