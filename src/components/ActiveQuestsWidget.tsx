/**
 * **Componente** — Widget de dashboard "🎯 Misiones activas".
 * Lista misiones del usuario con módulo, prioridad, vencimiento, XP y botón completar.
 */
import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Check, Loader2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { listActiveQuests, completeQuest } from "@/lib/quests.functions";

type Quest = {
  id: string;
  title: string;
  description: string;
  module_key: string | null;
  priority: string;
  due_date: string | null;
  xp: number;
  emoji: string;
  estimated_minutes: number | null;
};

const MODULE_LABEL: Record<string, string> = {
  learning: "Learning",
  money: "Money",
  home: "Home",
  health: "Health",
  goals: "Goals",
  habits: "Hábitos",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-500/15 text-red-500 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

function dueLabel(due: string | null): string {
  if (!due) return "Sin fecha";
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);
  const dDate = new Date(d);
  dDate.setHours(0, 0, 0, 0);
  if (dDate.getTime() === today.getTime()) return "Hoy";
  if (dDate.getTime() === tomorrow.getTime()) return "Mañana";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function ActiveQuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await listActiveQuests();
      setQuests(Array.isArray(r?.quests) ? (r.quests as Quest[]) : []);
    } catch (e) {
      console.error("listActiveQuests error:", e);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (id: string, xp: number) => {
    setBusyId(id);
    try {
      const r = await completeQuest({ data: { questId: id } });
      if (r.ok) {
        toast.success(`🏆 Misión completada. +${xp} XP`);
        setQuests((qs) => qs.filter((q) => q.id !== id));
      } else {
        toast.error(r.reason || "No se pudo completar");
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" /> Cargando misiones…
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Target className="size-5 text-primary" /> Misiones activas
        </h3>
        <Badge variant="outline">{quests.length}</Badge>
      </header>

      {quests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin misiones activas. Crea una desde la sección de misiones.
        </p>
      ) : (
        <ul className="space-y-2">
          {quests.map((q) => (
            <li
              key={q.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50"
            >
              <div className="text-2xl shrink-0" aria-hidden>
                {q.emoji || "🎯"}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to="/"
                  className="font-medium text-sm truncate hover:underline block"
                  title={q.title}
                >
                  {q.title}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                  {q.module_key && (
                    <Badge variant="outline" className="text-[10px]">
                      {MODULE_LABEL[q.module_key] ?? q.module_key}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${PRIORITY_STYLE[q.priority] ?? ""}`}
                  >
                    {q.priority}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> {dueLabel(q.due_date)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--energy)]">
                    <Zap className="size-3" /> {q.xp} XP
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleComplete(q.id, q.xp)}
                disabled={busyId === q.id}
                className="shrink-0"
              >
                {busyId === q.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
