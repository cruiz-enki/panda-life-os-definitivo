// Genera un resumen semanal de tareas: qué se cerró, qué se arrastra, qué eliminar.
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { snapshot } = await req.json();
    if (!snapshot) {
      return new Response(JSON.stringify({ error: "snapshot requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "weekly_review",
        description: "Analiza la semana de tareas del usuario y devuelve un review estructurado.",
        parameters: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Titular corto de la semana (max 90 chars)." },
            closed: {
              type: "array",
              items: { type: "string" },
              description: "Highlights de lo que se cerró (max 6). Menciona victorias concretas.",
            },
            dragging: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string", description: "Por qué crees que se arrastra." },
                  suggestion: { type: "string", description: "Acción sugerida (descomponer, agendar, delegar, snooze)." },
                },
                required: ["title", "suggestion"],
                additionalProperties: false,
              },
              description: "Tareas que arrastras y siguen abiertas (max 6).",
            },
            drop: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["title", "reason"],
                additionalProperties: false,
              },
              description: "Tareas candidatas a eliminar/archivar (max 5). Sé honesto: cosas viejas sin momentum.",
            },
            next_week_focus: {
              type: "array",
              items: { type: "string" },
              description: "1-3 prioridades sugeridas para la próxima semana.",
            },
          },
          required: ["headline", "closed", "dragging", "drop", "next_week_focus"],
          additionalProperties: false,
        },
      },
    }];

    const response = await callAI({
      messages: [
        { role: "system", content: "Eres un coach de productividad honesto y conciso en español. Analizas la semana con datos reales. No inflas victorias, señalas patrones. Sugieres eliminar tareas antiguas sin momentum en lugar de posponerlas eternamente." },
        { role: "user", content: `Semana del usuario:\n${JSON.stringify(snapshot, null, 2)}` },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "weekly_review" } },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Sin resultado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const args = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-weekly-review error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
