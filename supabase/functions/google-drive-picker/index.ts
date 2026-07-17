import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

// Permite letras, números, espacio y unos pocos signos. Bloquea comillas
// y caracteres de control para impedir inyección en el query string.
const QUERY_REGEX = /^[\p{L}\p{N} ._\-]{0,128}$/u;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  try {
    const payload = await req.json().catch(() => ({}));
    const rawQuery = typeof payload?.query === "string" ? payload.query.trim() : "";
    if (rawQuery && !QUERY_REGEX.test(rawQuery)) {
      return new Response(JSON.stringify({ error: "Query inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const query = rawQuery;

    const apiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_DRIVE_API_KEY is not set");
    }

    // Escapar comillas simples por seguridad (defensa en profundidad: el regex ya las bloquea).
    const safeQuery = query.replace(/'/g, "\\'");
    const searchQuery = `mimeType contains 'image/' ${safeQuery ? `and name contains '${safeQuery}'` : ""}`;
    const url = new URL("https://google-drive.lovable.app/drive/v3/files");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("fields", "files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink)");
    url.searchParams.set("pageSize", "20");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Google Drive API error:", response.status, error);
      return new Response(JSON.stringify({ error: "Google Drive request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("google-drive-picker error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
