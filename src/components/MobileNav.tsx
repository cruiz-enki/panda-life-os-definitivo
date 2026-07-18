/**
 * **Componente** — Barra de navegación inferior para móvil.
 * Agrupado estilo iOS en 6 categorías: HEALTH, HOME, MONEY, INSIGHTS, MIND, SETUP.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Repeat,
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
  Workflow,
  LayoutGrid,
  Beaker,
  Moon,
  Smile,
  Clock,
  MapPin,
  Users,
  Car,
  Bell,
  Eye,
  FolderKanban,
  Send,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { PandaAvatar } from "@/components/PandaAvatar";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";
import { QuickActionsFab } from "@/components/QuickActionsFab";
import { useFocusMode } from "@/hooks/use-focus-mode";

// Items principales en la barra inferior (4 + FAB centrado + Más)
const primary = [
  { to: "/", label: "Hoy", icon: LayoutDashboard },
  { to: "/log", label: "Registrar", icon: ClipboardList },
  // <FAB centrado va aquí>
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

type MoreItem = { to: string; label: string; icon: typeof LayoutDashboard; hash?: string };

// ===== 6 categorías estilo iOS =====

const healthItems: MoreItem[] = [
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
];

const homeItems: MoreItem[] = [
  { to: "/home", label: "Limpieza", icon: HomeIcon },
  { to: "/services", label: "Servicios", icon: LayoutGrid },
  { to: "/maintenance", label: "Mantenimiento", icon: Workflow },
  { to: "/vehicles", label: "Vehículos", icon: Car },
  { to: "/inventory", label: "Inventario", icon: Library },
  { to: "/family", label: "Hocicos", icon: Heart },
  { to: "/contacts", label: "Contactos", icon: Users },
];

const moneyItems: MoreItem[] = [
  { to: "/net-worth", label: "Patrimonio", icon: BarChart3 },
  { to: "/cashflow", label: "Cashflow", icon: Repeat },
  { to: "/debts", label: "Deudas", icon: Scale },
  { to: "/finance", label: "Finanzas", icon: Wallet },
  { to: "/subscriptions", label: "Suscripciones", icon: Repeat },
];

const insightsItems: MoreItem[] = [
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/rewards", label: "Misiones", icon: Trophy },
  { to: "/skill-tree", label: "Skill Tree", icon: Sparkles },
  { to: "/content", label: "Bitácora", icon: Library },
  { to: "/learnings-history", label: "Aprendizajes", icon: BookOpen },
  { to: "/wishlist", label: "Wishlist", icon: Star },
];

const mindItems: MoreItem[] = [
  { to: "/calendar", label: "Calendario", icon: CalendarIcon },
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
];

const setupItems: MoreItem[] = [
  { to: "/notifications", label: "Notificaciones", icon: Bell },
  { to: "/settings", label: "Ajustes", icon: Settings },
  { to: "/import", label: "Importar", icon: Download },
];

export function MobileNav({ onCapture }: { onCapture?: () => void }) {
  const location = useLocation();
  const [openMore, setOpenMore] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    HEALTH: true,
    HOME: false,
    MONEY: false,
    INSIGHTS: false,
    MIND: false,
    SETUP: false,
  });
  const navigate = useNavigate();
  const { state } = useAppState();
  const { level, progress } = levelFromXp(state.xp);
  const { user, signOut } = useAuth();
  const { filterItems } = useFocusMode();

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

  const sections = [
    { title: "HEALTH", items: filterItems(healthItems), icon: Heart },
    { title: "HOME", items: filterItems(homeItems), icon: HomeIcon },
    { title: "MONEY", items: filterItems(moneyItems), icon: Wallet },
    { title: "INSIGHTS", items: filterItems(insightsItems), icon: BarChart3 },
    { title: "MIND", items: filterItems(mindItems), icon: Brain },
    { title: "SETUP", items: filterItems(setupItems), icon: Settings },
  ].filter((s) => s.items.length > 0);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="relative pointer-events-auto">
          <div className="bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border pb-safe shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-end justify-between px-2 pt-2 pb-1.5 gap-1">
              <NavBtn to={primary[0].to} label={primary[0].label} icon={primary[0].icon} active={location.pathname === primary[0].to} />
              <NavBtn to={primary[1].to} label={primary[1].label} icon={primary[1].icon} active={location.pathname === primary[1].to} />
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

            <div className="px-4 pt-2" onClick={() => setOpenMore(false)}>
              <GlobalSearchTrigger />
            </div>

            {sections.map((section) => {
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
                    <span className="text-xs font-bold flex-1 text-left tracking-[0.15em]">{section.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {open && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {section.items.map((m) => {
                        const currentHash = location.hash.replace(/^#/, "");
                        const active =
                          location.pathname === m.to &&
                          (m.hash === undefined ? currentHash === "" : currentHash === m.hash);
                        const Icon = m.icon;
                        return (
                          <Link
                            key={`${m.to}#${m.hash ?? ""}-${m.label}`}
                            to={m.to}
                            hash={m.hash || undefined}
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
