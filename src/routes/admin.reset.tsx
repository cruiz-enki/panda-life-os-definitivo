/**
 * **Ruta** — Admin: reset de datos del usuario (operación peligrosa).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsOwner } from "@/hooks/use-is-owner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reset")({
  head: () => ({ meta: [{ title: "Reset · Pandus Maximus" }] }),
  component: ResetPage,
});

type Section = {
  key: string;
  label: string;
  tables: string[];
  resetXp?: boolean;
};

const SECTIONS: Section[] = [
  { key: "xp", label: "Experiencia (XP) y nivel", tables: [], resetXp: true },
  { key: "achievements", label: "Logros desbloqueados", tables: ["achievements_unlocked"] },
  { key: "quests", label: "Progreso de misiones", tables: ["quest_progress"] },
  { key: "custom_ach", label: "Logros personalizados", tables: ["custom_achievements"] },
  { key: "custom_quests", label: "Misiones personalizadas", tables: ["custom_quests"] },
  { key: "rewards", label: "Tienda y canjes de recompensas", tables: ["reward_redemptions", "rewards_shop"] },
  { key: "tasks", label: "Tareas y listas", tables: ["tasks", "task_lists"] },
  { key: "notes", label: "Notas", tables: ["notes"] },
  { key: "habits", label: "Hábitos", tables: ["habits"] },
  { key: "learnings", label: "Aprendizajes", tables: ["learnings"] },
  { key: "energy", label: "Registros de energía", tables: ["energy_entries"] },
  { key: "tags", label: "Etiquetas", tables: ["tags"] },
  {
    key: "finance",
    label: "Finanzas (tarjetas, gastos, pagos, MSI, presupuestos, recordatorios, categorías)",
    tables: [
      "card_payments",
      "finance_expenses",
      "msi_plans",
      "finance_budgets",
      "finance_reminders",
      "finance_categories",
      "credit_cards",
    ],
  },
  {
    key: "health",
    label: "Salud (composición corporal, comidas, medicamentos y tomas)",
    tables: ["health_medication_logs", "health_medications", "health_meals", "health_body_entries"],
  },
  { key: "hidden", label: "Defaults ocultos", tables: ["hidden_defaults"] },
];

function ResetPage() {
  const { user } = useAuth();
  const { isOwner, loading: roleLoading } = useIsOwner();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isOwner) navigate({ to: "/" });
  }, [isOwner, roleLoading, navigate]);

  const toggle = (key: string) =>
    setSelected((s) => ({ ...s, [key]: !s[key] }));

  const selectAll = () =>
    setSelected(Object.fromEntries(SECTIONS.map((s) => [s.key, true])));

  const clearAll = () => setSelected({});

  const run = async () => {
    if (!user) return;
    const picked = SECTIONS.filter((s) => selected[s.key]);
    if (picked.length === 0) {
      toast.error("Selecciona al menos una sección");
      return;
    }
    if (confirm.trim().toUpperCase() !== "RESET") {
      toast.error('Escribe "RESET" para confirmar');
      return;
    }
    setBusy(true);
    const errors: string[] = [];
    let deletedTables = 0;

    for (const section of picked) {
      for (const table of section.tables) {
        const { error } = await supabase
          .from(table as never)
          .delete()
          .eq("user_id", user.id);
        if (error) errors.push(`${table}: ${error.message}`);
        else deletedTables++;
      }
      if (section.resetXp) {
        const { error } = await supabase
          .from("profiles")
          .update({ xp: 0 })
          .eq("user_id", user.id);
        if (error) errors.push(`profiles.xp: ${error.message}`);
      }
    }

    // Limpiar caché local del estado
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("pandas-life-os")
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}

    setBusy(false);
    if (errors.length) {
      toast.error(`Reset con errores: ${errors[0]}`);
      console.error("Reset errors:", errors);
    } else {
      toast.success(`Reset completado (${deletedTables} tablas)`);
    }
    setConfirm("");
    setSelected({});
    setTimeout(() => window.location.reload(), 1200);
  };

  if (roleLoading || !isOwner) return null;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold flex items-center gap-3">
          <RefreshCw className="size-8 text-destructive" />
          Reset de datos
        </h1>
        <p className="text-muted-foreground mt-2">
          Borra de forma permanente los datos seleccionados de tu cuenta.
        </p>
      </header>

      <Card className="p-4 border-destructive/40 bg-destructive/5 flex gap-3">
        <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong className="text-destructive">Acción irreversible.</strong>{" "}
          Esto borra los datos del usuario actual ({user?.email}). No afecta a
          otros usuarios ni a la lista de invitados.
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Qué borrar</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Todo
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Ninguno
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <label
              key={s.key}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 cursor-pointer"
            >
              <Checkbox
                checked={!!selected[s.key]}
                onCheckedChange={() => toggle(s.key)}
                className="mt-0.5"
              />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-display text-lg font-semibold">Confirmación</h3>
        <p className="text-sm text-muted-foreground">
          Escribe <strong>RESET</strong> para habilitar el botón.
        </p>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="RESET"
        />
        <Button
          variant="destructive"
          onClick={run}
          disabled={busy || confirm.trim().toUpperCase() !== "RESET"}
          className="w-full"
        >
          <Trash2 className="size-4 mr-2" />
          {busy ? "Borrando…" : "Borrar datos seleccionados"}
        </Button>
      </Card>
    </div>
  );
}
