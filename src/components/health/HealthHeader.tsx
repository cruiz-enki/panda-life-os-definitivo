/**
 * **Componente** — Cabecera del módulo Salud con KPIs principales.
 */
import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Scale, Utensils, Pill, AlertCircle, Stethoscope, Activity, Dumbbell, Battery, Brain, Beaker } from "lucide-react";

export type HealthTabId = "overview" | "body" | "meals" | "exercise" | "energy" | "meds" | "symptoms" | "medical" | "labs" | "insights" | "psychology";

interface Tab {
  id: HealthTabId;
  label: string;
  icon: React.ReactNode;
  to: string;
  hash?: string;
}

const tabs: Tab[] = [
  { id: "overview", label: "Resumen", icon: <Heart className="w-4 h-4" />, to: "/health", hash: "" },
  { id: "body", label: "Cuerpo", icon: <Scale className="w-4 h-4" />, to: "/health", hash: "body" },
  { id: "meals", label: "Comida", icon: <Utensils className="w-4 h-4" />, to: "/meals" },
  { id: "exercise", label: "Ejercicio", icon: <Dumbbell className="w-4 h-4" />, to: "/exercise" },
  { id: "energy", label: "Energía", icon: <Battery className="w-4 h-4" />, to: "/energy" },
  { id: "meds", label: "Medicación", icon: <Pill className="w-4 h-4" />, to: "/health", hash: "meds" },
  { id: "psychology", label: "Psicología", icon: <Brain className="w-4 h-4" />, to: "/psychology" },
  { id: "symptoms", label: "Malestares", icon: <AlertCircle className="w-4 h-4" />, to: "/health", hash: "symptoms" },
  { id: "medical", label: "Médica", icon: <Stethoscope className="w-4 h-4" />, to: "/health", hash: "medical" },
  { id: "labs", label: "Laboratorios", icon: <Beaker className="w-4 h-4" />, to: "/labs" },
  { id: "insights", label: "Insights", icon: <Activity className="w-4 h-4" />, to: "/health", hash: "insights" },
];

export function HealthHeader() {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentHash = location.hash.replace(/^#/, "");

  const isActive = (tab: Tab) => {
    if (tab.to !== currentPath) return false;
    if (tab.hash !== undefined && tab.hash !== currentHash) return false;
    return true;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2 mb-8">
      {tabs.map((t) => (
        <Link
          key={t.id}
          to={t.to}
          hash={t.hash || undefined}
          className={`min-w-0 flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl text-[11px] font-medium text-center transition-all ${
            isActive(t)
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {t.icon}
          <span className="truncate w-full leading-tight">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
