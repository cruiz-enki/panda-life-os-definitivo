/**
 * **Componente** — Tarjeta genérica de estadística (label + valor + tendencia opcional).
 */
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "energy" | "learning" | "xp";
}) {
  const accentMap = {
    primary: "from-primary/20 to-transparent text-primary",
    energy: "from-[var(--energy)]/20 to-transparent text-[var(--energy)]",
    learning: "from-[var(--learning)]/20 to-transparent text-[var(--learning)]",
    xp: "from-[var(--xp)]/20 to-transparent text-[var(--xp)]",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]} opacity-60 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          {icon && <div className={accentMap[accent].split(" ").pop()}>{icon}</div>}
        </div>
        <div className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
