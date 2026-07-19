/**
 * Server function **Scan Receipt**: recibe una imagen (data URL base64) de
 * un recibo/ticket y devuelve los campos extraídos por IA (monto, fecha,
 * categoría, comercio, método de pago sugerido, nota).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ScanInput = z.object({
  imageDataUrl: z.string().min(20),
  categories: z.array(z.string()).default([]),
  today: z.string(),
});

export type ScannedReceipt = {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;
  payment_method: "cash" | "debit" | "credit" | "transfer" | "other" | null;
  note: string | null;
  confidence: "high" | "medium" | "low";
};

export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScanInput.parse(input))
  .handler(async ({ data }): Promise<ScannedReceipt> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY no configurada");

    const catsHint =
      data.categories.length > 0
        ? `Elige la categoría más parecida SOLO de esta lista (respeta el texto exacto): ${data.categories.join(", ")}. Si nada encaja, usa "Otros".`
        : `Deja category como "Otros".`;

    const system = `Eres un extractor de datos de recibos/tickets de compra mexicanos.
Analizas la imagen y devuelves SOLO un JSON válido con estos campos:
{
  "amount": número total pagado en MXN (usa el TOTAL final, no subtotal),
  "date": fecha en formato YYYY-MM-DD (si no ves fecha, usa "${data.today}"),
  "merchant": nombre del comercio (ej "Oxxo", "Walmart", "Starbucks"),
  "category": una categoría (ver instrucciones),
  "payment_method": "cash" | "debit" | "credit" | "transfer" | "other",
  "note": descripción corta de qué se compró (máx 60 chars),
  "confidence": "high" | "medium" | "low"
}
${catsHint}
Si no puedes leer un campo, ponlo en null (excepto date que usa hoy).
Responde SOLO el JSON, sin markdown, sin explicación.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae los datos de este recibo:" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway ${res.status}: ${t.slice(0, 300)}`);
    }
    const j = await res.json();
    const raw: string = j.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    let parsed: Partial<ScannedReceipt> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    return {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      date: parsed.date ?? data.today,
      merchant: parsed.merchant ?? null,
      category: parsed.category ?? null,
      payment_method: (parsed.payment_method as ScannedReceipt["payment_method"]) ?? null,
      note: parsed.note ?? null,
      confidence: (parsed.confidence as ScannedReceipt["confidence"]) ?? "low",
    };
  });
