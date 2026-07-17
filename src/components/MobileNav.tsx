/**
 * **Componente** — Barra de navegación inferior para móvil.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Repeat,
  BookOpen,
  Battery,
  Sparkles,
  CheckSquare,
  NotebookPen,
  Calendar as CalendarIcon,
  Trophy,
  BarChart3,
  Settings,
  Download,
  MoreHorizontal,
  X,
  LogOut,
  Wallet,
  Heart,
  Library,
  Star,
  Target,
  MessageCircle,
  Brain,
  ChevronDown,
  Scale,
  Utensils,
  Pill,
  AlertCircle,
  Stethoscope,
  Activity,
  Dumbbell,
  Home as HomeIcon,
  Newspaper,
  GraduationCap,
  Mountain,
  Compass,
  Workflow,
  LayoutGrid,
  Mail,
  Beaker,
  Moon,
  Smile,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { PandaAvatar } from "@/components/PandaAvatar";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";
import { QuickActionsFab } from "@/components/QuickActionsFab";

// Items principales en la barra inferior (4 + FAB centrado + Más)
const primary = [
  { to: "/", label: "Hoy", icon: LayoutDashboard },
  { to: "/calendar", label: "Plan", icon: CalendarIcon },
  // <FAB centrado va aquí>
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

type MoreItem = { to: string; label: string; icon: typeof LayoutDashboard };

const conocimiento: MoreItem[] = [
  
  { to: "/skill-tree", label: "Skill Tree", icon: Trophy },
  
  { to: "/content", label: "Bitácora de Productividad", icon: Library },
  { to: "/wishlist", label: "Wishlist", icon: Star },
];

const productividad: MoreItem[] = [
  { to: "/pomodoro", label: "Pomodoro", icon: Brain },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/time", label: "Tiempo", icon: Clock },
  { to: "/locations", label: "Ubicaciones", icon: MapPin },
  { to: "/notes", label: "Notas", icon: NotebookPen },
];

const hogar: MoreItem[] = [
  { to: "/home", label: "Limpieza", icon: HomeIcon },
  { to: "/services", label: "Servicios", icon: LayoutGrid },
  { to: "/maintenance", label: "Mantenimiento", icon: Workflow },
  { to: "/inventory", label: "Inventario", icon: Library },
  { to: "/family", label: "Hocicos", icon: Heart },
  { to: "/contacts", label: "Contactos", icon: Users },
];

const crecimiento: MoreItem[] = [
  { to: "/decisions", label: "Decisiones", icon: Scale },
  { to: "/identity", label: "Identidad", icon: Target },
  { to: "/future", label: "Futuro", icon: Sparkles },
  { to: "/goals", label: "Goal Breakdown", icon: Workflow },
];


const logros: MoreItem[] = [
  { to: "/rewards", label: "Recompensas", icon: Trophy },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

const otros: MoreItem[] = [
  { to: "/finance", label: "Finanzas", icon: Wallet },
  { to: "/settings", label: "Ajustes", icon: Settings },
  { to: "/import", label: "Importar", icon: Download },
];


const healthSubItems = [
  { to: "/health", hash: "", label: "Resumen", icon: Heart },
  { to: "/health", hash: "body", label: "Cuerpo", icon: Scale },
  { to: "/meals", hash: "", label: "Comida", icon: Utensils },
  { to: "/health", hash: "meds", label: "Medicación", icon: Pill },
  { to: "/health", hash: "symptoms", label: "Malestares", icon: AlertCircle },
  { to: "/health", hash: "medical", label: "Bitácora médica", icon: Stethoscope },
  { to: "/health", hash: "insights", label: "Insights", icon: Activity },
  { to: "/exercise", hash: "", label: "Ejercicio", icon: Dumbbell },
  { to: "/energy", hash: "", label: "Energía", icon: Battery },
  { to: "/sleep", hash: "", label: "Sueño", icon: Moon },
  { to: "/mood", hash: "", label: "Mood", icon: Smile },
  { to: "/labs", hash: "", label: "Laboratorios", icon: Beaker },
  { to: "/psychology", hash: "", label: "Psicología", icon: Brain },
] as const;

export function MobileNav({ onCapture }: { onCapture?: () => void }) {
  const location = useLocation();
  const [openMore, setOpenMore] = useState(false);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Productividad: true,
    Crecimiento: true,
    Conocimiento: true,
    Misiones: true,
    Otros: true,
    Salud: true,
    Hogar: true,
  });
  const navigate = useNavigate();
  const { state } = useAppState();
  const { level, progress } = levelFromXp(state.xp);
  const { user, signOut } = useAuth();

  const moreActive =
    !primary.some((p) => p.to === location.pathname) &&
    location.pathname !== "/";

  const NavBtn = ({
    to,
    label,
    icon: Icon,
    active,
  }: {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    active: boolean;
  }) => (
    <Link
      to={to}
      className={`no-tap-highlight flex flex-col items-center justify-center gap-0.5 min-w-0 min-h-[56px] flex-1 transition-colors ${
        active ? "text-primary" : "text-muted-foreground active:text-foreground"
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
      <span className="text-[10px] leading-none font-medium truncate max-w-full">{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Bottom bar with notch for FAB */}
          <div className="bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border pb-safe shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-end justify-between px-2 pt-2 pb-1.5 gap-1">
              <NavBtn to={primary[0].to} label={primary[0].label} icon={primary[0].icon} active={location.pathname === primary[0].to} />
              <NavBtn to={primary[1].to} label={primary[1].label} icon={primary[1].icon} active={location.pathname === primary[1].to} />

              {/* Spacer for FAB */}
              <div className="w-16 shrink-0" aria-hidden />

              <NavBtn to={primary[2].to} label={primary[2].label} icon={primary[2].icon} active={location.pathname === primary[2].to} />
              <NavBtn to={primary[3].to} label={primary[3].label} icon={primary[3].icon} active={location.pathname === primary[3].to} />
              <button
                type="button"
                onClick={() => setOpenMore(true)}
                className={`no-tap-highlight flex flex-col items-center justify-center gap-0.5 min-w-0 min-h-[56px] flex-1 transition-colors ${
                  moreActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                }`}
                aria-label="Más opciones"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] leading-none font-medium">Más</span>
              </button>
            </div>
          </div>

          {/* Centered FAB — Speed dial con accesos rápidos */}
          <QuickActionsFab
            variant="mobile"
            onCapture={() => {
              if (onCapture) onCapture();
              else if ((window as any).__openQuickCapture) (window as any).__openQuickCapture();
              else navigate({ to: "/" });
            }}
          />

        </div>
      </nav>

      {/* "Más" sheet */}
      {openMore && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end"
          onClick={() => setOpenMore(false)}
        >
          <div
            className="w-full bg-card border-t border-border rounded-t-3xl pb-safe animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* User strip */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-3">
              <PandaAvatar xp={state.xp} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nivel {level}</div>
                <div className="font-display font-bold text-sm">{state.xp} XP</div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all"
                    style={{ width: `${Math.max(4, progress * 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setOpenMore(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Búsqueda global */}
            <div className="px-4 pt-2" onClick={() => setOpenMore(false)}>
              <GlobalSearchTrigger />
            </div>

            {/* Grupo Salud (acordeón) */}
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={() => setOpenSections((s) => ({ ...s, Salud: !s.Salud }))}
                aria-expanded={openSections.Salud}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  location.pathname === "/health" || location.pathname === "/psychology" || location.pathname === "/exercise" || location.pathname === "/meals" || location.pathname === "/energy"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-secondary/30 border-border text-foreground"
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="text-sm font-semibold flex-1 text-left">Salud</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openSections.Salud ? "rotate-0" : "-rotate-90"}`}
                />
              </button>

              {openSections.Salud && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {healthSubItems.map((sub) => {
                    const Icon = sub.icon;
                    const currentHash = location.hash.replace(/^#/, "");
                    const active =
                      location.pathname === sub.to && currentHash === sub.hash;
                    return (
                      <Link
                        key={`${sub.to}#${sub.hash}`}
                        to={sub.to}
                        hash={sub.hash || undefined}
                        onClick={() => setOpenMore(false)}
                        className={`no-tap-highlight flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          active
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-secondary/20 border-border/60 text-foreground/80 active:bg-secondary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium truncate">
                          {sub.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {([
              { title: "Conocimiento", items: conocimiento, icon: GraduationCap },
              { title: "Productividad", items: productividad, icon: NotebookPen },
              { title: "Hogar", items: hogar, icon: HomeIcon },
              { title: "Crecimiento", items: crecimiento, icon: Repeat },
              { title: "Misiones", items: logros, icon: Trophy },
              { title: "Otros", items: otros, icon: Settings },
            ] as const).map((section) => {
              const open = openSections[section.title];
              const sectionActive = section.items.some((i) => i.to === location.pathname);
              const SectionIcon = section.icon;
              return (
                <div key={section.title} className="px-4 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((s) => ({ ...s, [section.title]: !s[section.title] }))
                    }
                    aria-expanded={open}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                      sectionActive
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-secondary/30 border-border text-foreground"
                    }`}
                  >
                    <SectionIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold flex-1 text-left">{section.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {open && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {section.items.map((m) => {
                        const active = location.pathname === m.to;
                        const Icon = m.icon;
                        return (
                          <Link
                            key={m.to}
                            to={m.to}
                            onClick={() => setOpenMore(false)}
                            className={`no-tap-highlight flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                              active
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-secondary/20 border-border/60 text-foreground/80 active:bg-secondary"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium truncate">{m.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="h-3" />

            <div className="px-4 pb-4">
              <button
                onClick={() => { setOpenMore(false); signOut(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground active:bg-secondary/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="truncate flex-1 text-left">{user?.email ?? "Cerrar sesión"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
