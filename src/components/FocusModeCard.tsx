/**
 * **Componente** — Tarjeta de Ajustes para el Modo Focus.
 * Lista todos los módulos agrupados por categoría con un switch para
 * ocultar/mostrar cada uno de la navegación (sidebar + menú móvil).
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useFocusMode, focusKey } from "@/hooks/use-focus-mode";
import {
  EyeOff,
  ChevronDown,
  Heart,
  Home as HomeIcon,
  Wallet,
  BarChart3,
  Brain,
  Settings as SettingsIcon,
  Scale,
  Utensils,
  Dumbbell,
  Battery,
  Moon,
  Smile,
  Pill,
  AlertCircle,
  Stethoscope,
  Beaker,
  LayoutGrid,
  Workflow,
  Car,
  Library,
  Users,
  Repeat,
  Trophy,
  Sparkles,
  BookOpen,
  Star,
  Target,
  NotebookPen,
  Clock,
  MapPin,
  FolderKanban,
  Send,
  Bell,
  Download,
  Eye,
} from "lucide-react";

type Item = { to: string; label: string; icon: any; hash?: string };

const sections: { title: string; icon: any; items: Item[] }[] = [
  {
    title: "HEALTH",
    icon: Heart,
    items: [
      { to: "/health", label: "Resumen", icon: Heart },
      { to: "/health", hash: "body", label: "Cuerpo", icon: Scale },
      { to: "/meals", label: "Comida", icon: Utensils },
      { to: "/exercise", label: "Ejercicio", icon: Dumbbell },
      { to: "/energy", label: "Energía", icon: Battery },
      { to: "/sleep", label: "Sueño", icon: Moon },
      { to: "/mood", label: "Mood", icon: Smile },
      { to: "/health", hash: "meds", label: "Medicación", icon: Pill },
      { to: "/health", hash: "symptoms", label: "Malestares", icon: AlertCircle },
      { to: "/health", hash: "medical", label: "Médica", icon: Stethoscope },
      { to: "/labs", label: "Laboratorios", icon: Beaker },
      { to: "/psychology", label: "Psicología", icon: Brain },
    ],
  },
  {
    title: "HOME",
    icon: HomeIcon,
    items: [
      { to: "/home", label: "Limpieza", icon: HomeIcon },
      { to: "/services", label: "Servicios", icon: LayoutGrid },
      { to: "/maintenance", label: "Mantenimiento", icon: Workflow },
      { to: "/vehicles", label: "Vehículos", icon: Car },
      { to: "/inventory", label: "Inventario", icon: Library },
      { to: "/family", label: "Hocicos", icon: Heart },
      { to: "/contacts", label: "Contactos", icon: Users },
    ],
  },
  {
    title: "MONEY",
    icon: Wallet,
    items: [
      { to: "/finance", label: "Finanzas", icon: Wallet },
      { to: "/subscriptions", label: "Suscripciones", icon: Repeat },
    ],
  },
  {
    title: "INSIGHTS",
    icon: BarChart3,
    items: [
      { to: "/insights", label: "Insights", icon: BarChart3 },
      { to: "/rewards", label: "Misiones", icon: Trophy },
      { to: "/skill-tree", label: "Skill Tree", icon: Sparkles },
      { to: "/content", label: "Bitácora", icon: Library },
      { to: "/learnings-history", label: "Aprendizajes", icon: BookOpen },
      { to: "/wishlist", label: "Wishlist", icon: Star },
    ],
  },
  {
    title: "MIND",
    icon: Brain,
    items: [
      { to: "/identity", label: "Identidad", icon: Target },
      { to: "/future", label: "Futuro", icon: Sparkles },
      { to: "/goals", label: "Metas", icon: Workflow },
      { to: "/decisions", label: "Decisiones", icon: Scale },
      { to: "/introspection", label: "Introspección", icon: Eye },
      { to: "/notes", label: "Notas", icon: NotebookPen },
      { to: "/pomodoro", label: "Pomodoro", icon: Brain },
      { to: "/habits", label: "Hábitos", icon: Repeat },
      { to: "/time", label: "Tiempo", icon: Clock },
      { to: "/locations", label: "Ubicaciones", icon: MapPin },
      { to: "/projects", label: "Proyectos", icon: FolderKanban },
      { to: "/scheduled", label: "Al futuro", icon: Send },
    ],
  },
  {
    title: "SETUP",
    icon: SettingsIcon,
    items: [
      { to: "/notifications", label: "Notificaciones", icon: Bell },
      { to: "/import", label: "Importar", icon: Download },
    ],
  },
];

export function FocusModeCard() {
  const { hidden, toggle, showAll, count, enabled, setEnabled } = useFocusMode();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <EyeOff className="size-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Modo Focus</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${enabled ? "text-primary" : "text-muted-foreground"}`}>
            {enabled ? "Enfoque" : "Normal"}
          </span>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Activar Modo Focus" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Cuando el modo Focus está activo, se ocultan los módulos que marques abajo. Apágalo para volver a ver todo.
        {enabled && count > 0 && (
          <span className="ml-1 text-foreground font-medium">{count} ocultos.</span>
        )}
      </p>
      {count > 0 && (
        <button
          onClick={showAll}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          Restablecer selección
        </button>
      )}

      <div className="space-y-2">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = open[section.title] ?? false;
          const hiddenInSection = section.items.filter((i) =>
            hidden.has(focusKey(i.to, i.hash)),
          ).length;
          return (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [section.title]: !isOpen }))}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
              >
                <SectionIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold tracking-[0.15em] flex-1 text-left">
                  {section.title}
                </span>
                {hiddenInSection > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {hiddenInSection} oculto{hiddenInSection === 1 ? "" : "s"}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
              {isOpen && (
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const key = focusKey(item.to, item.hash);
                    const isHidden = hidden.has(key);
                    return (
                      <div
                        key={key + item.label}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isHidden ? "text-muted-foreground/60" : "text-foreground/80"
                          }`}
                        />
                        <span
                          className={`text-sm flex-1 ${
                            isHidden ? "text-muted-foreground/60 line-through" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                        <Switch
                          checked={!isHidden}
                          onCheckedChange={() => toggle(item.to, item.hash)}
                          aria-label={`Mostrar ${item.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
