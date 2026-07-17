// Clasifica una captura rápida: decide si es nota/idea/tarea/aprendizaje y propone metadata
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Texto vacío" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [{
      type: "function",
      function: {
        name: "classify_capture",
        description: "Clasifica una captura del usuario y propone metadata estructurada.",
        parameters: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["task", "note", "idea", "learning"], description: "Tipo de captura más apropiado." },
            title: { type: "string", description: "Título corto y claro (max 60 chars)." },
            summary: { type: "string", description: "Resumen breve y útil del contenido (max 200 chars)." },
            category: {
              type: "string",
              enum: ["negocio", "marketing", "personal", "clientes", "contenido", "otro"],
              description: "Categoría principal."
            },
            importance: { type: "string", enum: ["normal", "important", "high", "money"] },
            priority: { type: "string", enum: ["low", "medium", "high"], description: "Solo si kind=task." },
            tags: { type: "array", items: { type: "string" }, description: "1-3 etiquetas en minúscula." },
          },
          required: ["kind", "title", "summary", "category", "importance", "tags"],
          additionalProperties: false,
        },
      },
    }];

    const response = await callAI({
      messages: [
        { role: "system", content: "Eres un asistente que clasifica capturas rápidas en español. Si parece acción concreta con verbo → task. Si es reflexión/aprendizaje → learning. Si es chispazo creativo → idea. Si es información de referencia → note. Sé conciso." },
        { role: "user", content: text },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "classify_capture" } },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Sin clasificación" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const args = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ classification: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-classify-capture error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
