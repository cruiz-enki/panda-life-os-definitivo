// Extrae datos estructurados de la foto de un recibo/ticket con GPT-4o vision.
import { callAI, handleAIResponse, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const { imageDataUrl, categories = [], today } = await req.json();
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return new Response(JSON.stringify({ error: "imageDataUrl requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catsHint = categories.length > 0
      ? `Elige la categoría más parecida SOLO de esta lista (respeta el texto exacto): ${categories.join(", ")}. Si nada encaja, usa "Otros".`
      : `Deja category como "Otros".`;

    const system = `Eres un extractor de datos de recibos/tickets de compra mexicanos.
Analizas la imagen y devuelves SOLO un JSON válido con estos campos:
{
  "amount": número total pagado en MXN (usa el TOTAL final, no subtotal),
  "date": fecha en formato YYYY-MM-DD (si no ves fecha, usa "${today}"),
  "merchant": nombre del comercio,
  "category": una categoría,
  "payment_method": "cash" | "debit" | "credit" | "transfer" | "other",
  "note": descripción corta (máx 60 chars),
  "confidence": "high" | "medium" | "low"
}
${catsHint}
Si no puedes leer un campo, ponlo en null (excepto date que usa hoy).
Responde SOLO el JSON, sin markdown.`;

    const response = await callAI({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae los datos de este recibo:" },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ] as unknown as string,
        },
      ],
      response_format: { type: "json_object" },
    });

    const errorResponse = await handleAIResponse(response, req);
    if (errorResponse) return errorResponse;

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const result = {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      date: (parsed.date as string) ?? today,
      merchant: (parsed.merchant as string) ?? null,
      category: (parsed.category as string) ?? null,
      payment_method: (parsed.payment_method as string) ?? null,
      note: (parsed.note as string) ?? null,
      confidence: (parsed.confidence as string) ?? "low",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-scan-receipt error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
