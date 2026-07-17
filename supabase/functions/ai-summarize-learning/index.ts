import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { text } = await req.json();

    const response = await callAI({
      messages: [
        {
          role: "system",
          content: "Eres un mentor experto en aprendizaje acelerado. Tu tarea es recibir un aprendizaje o nota y generar un resumen MUY conciso (máximo 150 caracteres) que capture la esencia, la utilidad práctica o una conexión profunda. Usa un tono inspirador y directo en español. Evita frases vacías como 'Este aprendizaje trata sobre'.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
