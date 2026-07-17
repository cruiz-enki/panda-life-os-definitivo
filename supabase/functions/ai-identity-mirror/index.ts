// Modo espejo (auth requerido)
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

    const systemPrompt = `Eres el "Modo Espejo" de ENKI LIFE OS. Hablas en español, directo, sin rodeos pero con respeto.
Tu rol: confrontar al usuario con la diferencia entre la persona que dice querer ser y lo que está haciendo HOY.
Devuelves UN solo párrafo de máximo 90 palabras: empieza reconociendo lo concreto que sí está alineado, luego nombra
con honestidad lo que no, y cierra con una pregunta o acción directa. Sin emojis excesivos (máximo 1).`;

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Datos del usuario hoy:\n${snapStr}` },
      ],
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ feedback }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-identity-mirror error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
