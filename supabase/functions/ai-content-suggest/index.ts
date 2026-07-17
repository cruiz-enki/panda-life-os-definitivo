// Sugiere qué consumir hoy (auth requerido)
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const MAX_BYTES = 30_000;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyUser(req);
    if ("error" in auth) return auth.error;

    const { wishlist, energy, availableMinutes } = await req.json();

    const ctx = {
      wishlist: (wishlist ?? []).slice(0, 30),
      energia: energy ?? null,
      tiempo_disponible_min: availableMinutes ?? null,
    };
    const ctxStr = JSON.stringify(ctx);
    if (ctxStr.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "payload demasiado grande" }), { status: 413, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const response = await callAI({
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que recomienda contenido para consumir. Recibes una wishlist y el contexto del usuario (energía y tiempo disponible). Escoge 1-3 elementos óptimos y explica brevemente por qué encajan ahora. Responde en español, conciso, en formato markdown con bullets. Si energía es baja sugiere contenido ligero (podcast, artículo, película); si hay mucho tiempo sugiere libro/curso. Máximo 6 líneas.",
        },
        { role: "user", content: ctxStr },
      ],
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content ?? "Sin sugerencias.";
    return new Response(JSON.stringify({ suggestion }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-content-suggest error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
