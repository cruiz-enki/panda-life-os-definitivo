/**
 * **Componente** — Widget de dashboard "Identity Focus".
 * Muestra identidades activas y permite elegir identidad de foco semanal.
 */
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import {
  listUserIdentities,
  setFocusIdentity,
  setIdentityActive,
} from "@/lib/identity.functions";
import { IDENTITY_BY_KEY, type IdentityKey } from "@/lib/identities";

type Row = {
  id: string;
  identity_key: string;
  name: string;
  emoji: string;
  description: string;
  active: boolean;
  priority: number;
};

export function IdentityFocusWidget() {
  const [rows, setRows] = useState<Row[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await listUserIdentities();
      setRows(Array.isArray(r?.identities) ? (r.identities as Row[]) : []);
      setFocus(r?.focus_identity_key ?? null);
    } catch (e) {
      console.error("listUserIdentities", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (key: string, next: boolean) => {
    setBusy(true);
    setRows((rs) => rs.map((r) => (r.identity_key === key ? { ...r, active: next } : r)));
    try {
      const r = await setIdentityActive({ data: { identity_key: key, active: next } });
      if (!r.ok) toast.error(r.reason || "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  };

  const setFocusKey = async (key: string | null) => {
    setBusy(true);
    setFocus(key);
    try {
      const r = await setFocusIdentity({ data: { identity_key: key } });
      if (r.ok) toast.success(key ? `Foco: ${IDENTITY_BY_KEY[key as IdentityKey]?.name}` : "Foco eliminado");
      else toast.error(r.reason || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" /> Cargando identidades…
        </div>
      </Card>
    );
  }

  const active = rows.filter((r) => r.active);
  const focusDef = focus ? IDENTITY_BY_KEY[focus as IdentityKey] : null;

  return (
    <Card className="p-5 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Crown className="size-5 text-primary" /> Identity Focus
        </h3>
        <Badge variant="outline">{active.length} activas</Badge>
      </header>

      <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Foco semanal</p>
        <p className="font-display text-base mt-0.5">
          {focusDef ? (
            <span>
              <span className="mr-1">{focusDef.emoji}</span>
              {focusDef.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Sin foco — elige una identidad ↓</span>
          )}
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const isFocus = focus === r.identity_key;
          return (
            <li
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                isFocus
                  ? "bg-primary/10 border-primary/40"
                  : "bg-secondary/30 border-border/50"
              }`}
            >
              <div className="text-xl shrink-0" aria-hidden>
                {r.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant={isFocus ? "default" : "ghost"}
                  onClick={() => setFocusKey(isFocus ? null : r.identity_key)}
                  disabled={busy}
                  title="Foco semanal"
                  className="px-2"
                >
                  <Star className={`size-3.5 ${isFocus ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  variant={r.active ? "secondary" : "outline"}
                  onClick={() => toggleActive(r.identity_key, !r.active)}
                  disabled={busy}
                  className="text-xs"
                >
                  {r.active ? "Activa" : "Inactiva"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
