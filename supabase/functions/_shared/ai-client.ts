import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS allowlist — solo orígenes propios pueden leer respuestas con datos personales.
const ALLOWED_ORIGINS = [
  "https://os.cmrs.mx",
  "https://os.cmrs.mx",
  "https://panda-life-os.lovable.app",
];
const ALLOWED_ORIGIN_PATTERNS = [/^https:\/\/[a-z0-9-]+\.lovable\.app$/i, /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i];

function resolveOrigin(req: Request | undefined): string {
  const origin = req?.headers.get("origin") ?? "";
  if (!origin) return "https://os.cmrs.mx";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) return origin;
  return "https://os.cmrs.mx";
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://os.cmrs.mx",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};

// Verifica el JWT del request. Devuelve { userId } o un Response 401.
export async function verifyUser(req: Request): Promise<{ userId: string } | { error: Response }> {
  const cors = getCorsHeaders(req);
  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } }) };
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } }) };
  }
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !ANON) {
    return { error: new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } }) };
  }
  const client = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } }) };
  }
  return { userId: data.user.id };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: "json_object" | "text" };
  tools?: any[];
  tool_choice?: any;
}

/**
 * Llama a la API de OpenAI directamente.
 * Portable: no depende de Lovable AI Gateway.
 * Requiere OPENAI_API_KEY como secreto en el proyecto Supabase.
 */
export async function callAI(options: AIRequestOptions): Promise<Response> {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY no configurada. Agrega la variable en Supabase → Edge Functions → Secrets.");
  }

  return await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || "gpt-4o-mini",
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      response_format: options.response_format,
      tools: options.tools,
      tool_choice: options.tool_choice,
    }),
  });
}

export async function handleAIResponse(response: Response, req?: Request) {
  const cors = getCorsHeaders(req);
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en un momento." }), {
      status: 429, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (response.status === 401) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY inválida o no configurada." }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (response.status === 402 || response.status === 403) {
    return new Response(JSON.stringify({ error: "Sin créditos en OpenAI. Recarga saldo en platform.openai.com." }), {
      status: 402, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    console.error("OpenAI error:", response.status, text);
    return new Response(JSON.stringify({ error: "Error en el proveedor de IA" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  return null;
}
