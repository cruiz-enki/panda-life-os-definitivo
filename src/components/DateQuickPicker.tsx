/**
 * **Componente** — Selector rápido de fecha (Hoy / Mañana / + días / fecha custom).
 */
import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { todayCDMX, daysAgoCDMX, humanDateLabel } from "@/lib/date-utils";

/** Picker compacto: chips Hoy/Ayer/Antier + input date oculto para fechas anteriores. */
export function DateQuickPicker({
  value,
  onChange,
  label = "Registrar para",
  className = "",
}: {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = todayCDMX();
  const yesterday = daysAgoCDMX(1);
  const dayBefore = daysAgoCDMX(2);

  const chips = [
    { key: today, label: "Hoy" },
    { key: yesterday, label: "Ayer" },
    { key: dayBefore, label: "Antier" },
  ];

  const isCustom = !chips.some((c) => c.key === value);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}:</span>
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            value === c.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:border-primary"
          }`}
        >
          {c.label}
        </button>
      ))}
      <label
        className={`relative inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${
          isCustom
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-secondary text-muted-foreground border-border hover:border-primary"
        }`}
      >
        <CalendarIcon className="w-3 h-3" />
        {isCustom ? humanDateLabel(value) : "Otra"}
        <ChevronDown className="w-3 h-3" />
        <input
          type="date"
          value={value}
          max={today}
          onChange={(e) => onChange(e.target.value || today)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
