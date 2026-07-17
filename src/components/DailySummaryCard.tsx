/**
 * **Componente** — Tarjeta de resumen diario (tareas hechas, hábitos, energía, XP del día).
 */
import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { generateDailySummary } from "@/lib/ai-client";
import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "@/lib/storage-types";


const CACHE_KEY = "ai-daily-summary";

type Cached = { date: string; userKey: string; content: string };

function readCache(userKey: string, date: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return c.date === date && c.userKey === userKey ? c.content : null;
  } catch { return null; }
}

function writeCache(userKey: string, date: string, content: string) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ date, userKey, content })); } catch { /* noop */ }
}

// Render markdown muy ligero (bold + saltos de línea + bullets)
function renderMarkdown(md: string) {
  return md
    .split("\n")
    .map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
        .replace(/`(.+?)`/g, '<code class="px-1 rounded bg-secondary text-xs">$1</code>');
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return <li key={i} className="ml-4 list-disc text-muted-foreground" dangerouslySetInnerHTML={{ __html: html.replace(/^[-*]\s/, "") }} />;
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
    });
}

export function DailySummaryCard({ state, today }: { state: AppState; today: string }) {
  const userKey = `${state.xp}-${state.tasks.length}-${state.habits.length}`;
  const [summary, setSummary] = useState<string | null>(() => readCache(userKey, today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true); setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError("Inicia sesión para ver el resumen del día.");
        return;
      }
      const text = await generateDailySummary(state, today);
      setSummary(text);
      writeCache(userKey, today, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error generando resumen";
      setError(/Unauthorized|401/i.test(msg) ? "Tu sesión expiró. Vuelve a iniciar sesión para regenerar." : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (summary || loading || error) return;
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) fetchSummary();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 mb-8 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">Coach IA · resumen del día</h3>
            <p className="text-xs text-muted-foreground">Generado por Lovable AI</p>
          </div>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Pensando…" : "Regenerar"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && loading && !summary && (
        <div className="space-y-2">
          <div className="h-3 rounded bg-secondary animate-pulse w-3/4" />
          <div className="h-3 rounded bg-secondary animate-pulse w-full" />
          <div className="h-3 rounded bg-secondary animate-pulse w-5/6" />
        </div>
      )}

      {summary && (
        <div className="space-y-1 text-sm">
          {renderMarkdown(summary)}
        </div>
      )}
    </section>
  );
}
