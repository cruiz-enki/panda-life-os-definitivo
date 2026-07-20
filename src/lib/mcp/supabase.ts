import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForUser(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const token = ctx.getToken();
  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      // sb_ keys aren't JWTs; ensure apikey header is set and don't clobber Authorization.
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function ok(text: string, structured?: unknown) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structured !== undefined ? { structuredContent: { data: structured } } : {}),
  };
}

export function err(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function todayCDMX(): string {
  // YYYY-MM-DD en zona America/Mexico_City
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}
