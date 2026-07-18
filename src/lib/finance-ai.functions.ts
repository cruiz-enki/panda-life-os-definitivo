/**
 * Server function **Finance Insights**: recibe un snapshot financiero
 * (agregado en el cliente) y devuelve insights con IA vía Lovable AI Gateway.
 * No toca BD directamente — el cliente arma el payload y lo manda.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InsightsInputSchema = z.object({
  currentMonth: z.string(),
  netWorth: z.number(),
  assets: z.number(),
  debts: z.number(),
  cashflow30: z.object({
    income: z.number(),
    outflow: z.number(),
    net: z.number(),
  }),
  expensesByCategoryCurrent: z.record(z.string(), z.number()),
  expensesByCategoryPrev: z.record(z.string(), z.number()),
  totalExpensesCurrent: z.number(),
  totalExpensesPrev: z.number(),
  cards: z.array(z.object({
    name: z.string(),
    balance: z.number(),
    limit: z.number(),
    apr_hint: z.number().optional(),
  })),
  debtsList: z.array(z.object({
    name: z.string(),
    balance: z.number(),
    rate: z.number(),
    monthly: z.number(),
  })),
  savingsGoals: z.array(z.object({
    name: z.string(),
    target: z.number(),
    current: z.number(),
  })).optional(),
});

export type FinanceInsight = {
  kind: "warning" | "opportunity" | "info" | "win";
  emoji: string;
  title: string;
  detail: string;
  action?: string;
};

export const generateFinanceInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InsightsInputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY no configurada");

    const system = `Eres un coach financiero personal directo, mexicano, práctico.
Analizas datos y devuelves ENTRE 4 y 7 insights accionables en JSON.
NUNCA inventes números — trabaja solo con los datos dados.
Prioriza: alertas de sobregasto por categoría, riesgo de saldo negativo,
oportunidades de estrategia de deuda (avalancha), y felicitaciones cuando aplique.
Habla en tú, en español mexicano, sin voseo. Sé breve: máximo 2 oraciones por detail.`;

    const user = `DATOS FINANCIEROS DEL MES ${data.currentMonth}:

Patrimonio: $${data.netWorth.toFixed(0)} MXN (activos $${data.assets.toFixed(0)} - deudas $${data.debts.toFixed(0)})

Cashflow 30 días proyectado:
- Ingresos: $${data.cashflow30.income.toFixed(0)}
- Gastos fijos: $${Math.abs(data.cashflow30.outflow).toFixed(0)}
- Neto: $${data.cashflow30.net.toFixed(0)}

Gastos por categoría este mes vs mes anterior:
${Object.keys({ ...data.expensesByCategoryCurrent, ...data.expensesByCategoryPrev })
  .map((c) => {
    const cur = data.expensesByCategoryCurrent[c] ?? 0;
    const prev = data.expensesByCategoryPrev[c] ?? 0;
    const diff = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
    return `- ${c}: $${cur.toFixed(0)} (mes pasado $${prev.toFixed(0)}, ${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%)`;
  })
  .join("\n")}

Total gastado este mes: $${data.totalExpensesCurrent.toFixed(0)} (mes pasado: $${data.totalExpensesPrev.toFixed(0)})

Tarjetas de crédito:
${data.cards.map((c) => `- ${c.name}: deuda $${c.balance.toFixed(0)} / límite $${c.limit.toFixed(0)} (uso ${((c.balance / (c.limit || 1)) * 100).toFixed(0)}%)`).join("\n") || "- (sin tarjetas)"}

Deudas no-tarjeta:
${data.debtsList.map((d) => `- ${d.name}: saldo $${d.balance.toFixed(0)} @ ${d.rate}% anual, mensual $${d.monthly.toFixed(0)}`).join("\n") || "- (sin deudas)"}

${data.savingsGoals && data.savingsGoals.length > 0 ? `Metas de ahorro:\n${data.savingsGoals.map((s) => `- ${s.name}: $${s.current.toFixed(0)} / $${s.target.toFixed(0)}`).join("\n")}` : ""}

Devuelve UN ARRAY JSON con esta forma exacta:
[
  {
    "kind": "warning" | "opportunity" | "info" | "win",
    "emoji": "un emoji",
    "title": "Título corto",
    "detail": "Explicación en 1-2 oraciones con números concretos",
    "action": "Acción sugerida (opcional)"
  }
]
Responde SOLO el JSON, nada más.`;

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
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    let parsed: FinanceInsight[] = [];
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (m) parsed = JSON.parse(m[0]);
    }
    return { insights: parsed };
  });
