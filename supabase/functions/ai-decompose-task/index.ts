// Descompone una tarea grande en subtareas accionables.
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { title, description, context } = await req.json();
    if (!title || typeof title !== "string") {
      return new Response(JSON.stringify({ error: "Título requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "decompose_task",
        description: "Descompone una tarea grande en subtareas accionables y ordenadas.",
        parameters: {
          type: "object",
          properties: {
            subtasks: {
              type: "array",
              minItems: 2,
              maxItems: 10,
              items: { type: "string", description: "Subtarea concreta con verbo, orden lógico. Máx 80 chars." },
            },
            reasoning: { type: "string", description: "1 frase de por qué este desglose." },
          },
          required: ["subtasks"],
          additionalProperties: false,
        },
      },
    }];

    const userText = [
      `Tarea: ${title}`,
      description ? `Descripción: ${description}` : "",
      context ? `Contexto: ${context}` : "",
    ].filter(Boolean).join("\n");

    const response = await callAI({
      messages: [
        { role: "system", content: "Eres un asistente experto en descomponer tareas en pasos concretos y accionables en español. Cada subtarea empieza con verbo en infinitivo, es específica y ejecutable en < 30 min. Ordena lógicamente. Entre 3 y 8 subtareas típicamente." },
        { role: "user", content: userText },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "decompose_task" } },
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
    console.error("ai-decompose-task error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
