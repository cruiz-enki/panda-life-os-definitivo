/**
 * **Server Route** — Recibe emails reenviados por un servicio inbound
 * (Cloudflare Email Worker, SendGrid Inbound Parse, Postmark Inbound) y crea
 * una tarea a nombre del usuario que coincide con el `from`.
 *
 * Autenticación: header `x-inbound-token` (o `?token=`) debe coincidir con
 * `EMAIL_INBOUND_SECRET`.
 *
 * Payload soportado (application/json):
 *   { from, subject, text, html?, to? }
 *
 * También acepta multipart/form-data (SendGrid Inbound Parse) con campos
 * `from`, `subject`, `text`, `html`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Parsed = { from: string; subject: string; text: string; html?: string };

function extractEmail(raw: string): string {
  // "Nombre <mail@dominio.com>" → mail@dominio.com
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim().toLowerCase();
}

function stripSubject(s: string): string {
  return s.replace(/^(re|fwd?|rv):\s*/i, "").trim();
}

async function parseBody(request: Request): Promise<Parsed | null> {
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const j = await request.json();
      return {
        from: String(j.from ?? j.From ?? j.sender ?? ""),
        subject: String(j.subject ?? j.Subject ?? ""),
        text: String(j.text ?? j.Text ?? j.plain ?? j.body ?? ""),
        html: j.html ? String(j.html) : undefined,
      };
    }
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      const fd = await request.formData();
      return {
        from: String(fd.get("from") ?? fd.get("From") ?? fd.get("sender") ?? ""),
        subject: String(fd.get("subject") ?? fd.get("Subject") ?? ""),
        text: String(fd.get("text") ?? fd.get("plain") ?? fd.get("body") ?? ""),
        html: fd.get("html") ? String(fd.get("html")) : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function resolveUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  // 1) auth.users vía admin API
  try {
    const { data: page } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = page?.users?.find(
      (u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (found?.id) return found.id;
  } catch {
    // fallback
  }
  return null;
}

export const Route = createFileRoute("/api/public/hooks/email-to-task")({
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({ ok: true, hint: "POST an email payload" }), {
        headers: { "Content-Type": "application/json" },
      }),
      POST: async ({ request }) => {
        const secret = process.env.EMAIL_INBOUND_SECRET;
        if (!secret) {
          return Response.json({ error: "EMAIL_INBOUND_SECRET no configurado" }, { status: 500 });
        }
        const url = new URL(request.url);
        const provided =
          request.headers.get("x-inbound-token") ??
          url.searchParams.get("token") ??
          "";
        if (provided !== secret) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        const parsed = await parseBody(request);
        if (!parsed || !parsed.from) {
          return Response.json({ error: "payload inválido" }, { status: 400 });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE) {
          return Response.json({ error: "backend mal configurado" }, { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, SERVICE, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const fromEmail = extractEmail(parsed.from);
        const userId = await resolveUserIdByEmail(supabase, fromEmail);
        if (!userId) {
          return Response.json({ error: `remitente no reconocido: ${fromEmail}` }, { status: 403 });
        }

        const title = stripSubject(parsed.subject || parsed.text.slice(0, 80)) || "(sin asunto)";
        const description = parsed.text?.trim().slice(0, 4000) || null;

        const { data, error } = await (supabase as any)
          .from("tasks")
          .insert({
            user_id: userId,
            title,
            description,
            priority: "medium",
            tags: ["email"],
          })
          .select("id")
          .single();

        if (error) {
          console.error("email-to-task insert failed", error);
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ ok: true, task_id: data.id, from: fromEmail, title });
      },
    },
  },
});
