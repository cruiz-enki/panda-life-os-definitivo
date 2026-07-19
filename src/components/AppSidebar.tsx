/**
 * **Componente** — Barra lateral principal agrupada estilo iOS en 6 categorías:
 * HEALTH, HOME, MONEY, INSIGHTS, MIND, SETUP.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Repeat, BookOpen, Battery, Sparkles, CheckSquare, NotebookPen,
  Calendar as CalendarIcon, LogOut, Trophy, BarChart3, Settings, Wallet, Heart,
  Library, Star, Target, MessageCircle, Brain, ChevronDown, Scale, Utensils, Pill,
  AlertCircle, Stethoscope, Home as HomeIcon, FolderKanban, Dumbbell, Download,
  Workflow, LayoutGrid, Users, Beaker, Eye, Bell, Moon, Smile, Clock, MapPin, Car, Send,
} from "lucide-react";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { PandaAvatar } from "@/components/PandaAvatar";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useLifeMode, type CategoryKey } from "@/hooks/use-life-mode";
import { ModeIndicator } from "@/components/ModeIndicator";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; hash?: string };

// Items sueltos arriba — accesos rápidos siempre visibles
const topItems: NavItem[] = [
  { to: "/", label: "Hoy", icon: LayoutDashboard },
  { to: "/calendar", label: "Plan", icon: CalendarIcon },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/chat", label: "Chat IA", icon: MessageCircle },
];

// ===== 6 categorías estilo iOS =====

const healthItems: NavItem[] = [
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

const homeItems: NavItem[] = [
  { to: "/home", label: "Limpieza", icon: HomeIcon },
  { to: "/services", label: "Servicios", icon: LayoutGrid },
  { to: "/maintenance", label: "Mantenimiento", icon: Workflow },
  { to: "/vehicles", label: "Vehículos", icon: Car },
  { to: "/inventory", label: "Inventario", icon: Library },
  { to: "/family", label: "Hocicos", icon: Heart },
  { to: "/contacts", label: "Contactos", icon: Users },
];

const moneyItems: NavItem[] = [
  { to: "/net-worth", label: "Patrimonio", icon: BarChart3 },
  { to: "/cashflow", label: "Cashflow", icon: Repeat },
  { to: "/debts", label: "Deudas", icon: Scale },
  { to: "/savings", label: "Ahorro", icon: Target },
  { to: "/money-tools", label: "Money Tools", icon: Sparkles },
  { to: "/bank-import", label: "Import bancario", icon: Sparkles },
  { to: "/finance-insights", label: "Insights IA", icon: Sparkles },
  { to: "/afford", label: "¿Puedo permitirmelo?", icon: BarChart3 },
  { to: "/month-close", label: "Cierre mensual", icon: Target },
  { to: "/finance", label: "Finanzas", icon: Wallet },
  { to: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { to: "/money-setup", label: "⚙️ Money Setup", icon: Sparkles },
];

const insightsItems: NavItem[] = [
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/rewards", label: "Misiones", icon: Trophy },
  { to: "/skill-tree", label: "Skill Tree", icon: Sparkles },
  { to: "/content", label: "Bitácora", icon: Library },
  { to: "/learnings-history", label: "Aprendizajes", icon: BookOpen },
  { to: "/wishlist", label: "Wishlist", icon: Star },
];

const mindItems: NavItem[] = [
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

const setupItems: NavItem[] = [
  { to: "/notifications", label: "Notificaciones", icon: Bell },
  { to: "/settings", label: "Ajustes", icon: Settings },
  { to: "/import", label: "Importar", icon: Download },
];

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const currentHash = location.hash.replace(/^#/, "");
  const active =
    location.pathname === item.to &&
    (item.hash === undefined ? currentHash === "" : currentHash === item.hash);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      hash={item.hash}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-sidebar-accent text-primary shadow-card"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {item.label}
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </Link>
  );
}

function CategoryGroup({
  storageKey,
  label,
  icon: Icon,
  items,
  defaultOpen = false,
}: {
  storageKey: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
  defaultOpen?: boolean;
}) {
  const location = useLocation();
  const { filterItems } = useFocusMode();
  const visibleItems = filterItems(items);
  const currentHash = location.hash.replace(/^#/, "");
  const inGroup = visibleItems.some(
    (i) =>
      i.to === location.pathname &&
      (i.hash === undefined ? currentHash === "" : currentHash === i.hash),
  );

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return inGroup || defaultOpen;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return inGroup || defaultOpen;
  });

  useEffect(() => {
    if (inGroup) setOpen(true);
  }, [inGroup]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    }
  };

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-[0.15em] transition-all ${
          inGroup
            ? "bg-sidebar-accent text-primary shadow-card"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
          {visibleItems.map((item) => {
            const active =
              location.pathname === item.to &&
              (item.hash === undefined ? currentHash === "" : currentHash === item.hash);
            const SubIcon = item.icon;
            return (
              <Link
                key={`${item.to}#${item.hash ?? ""}-${item.label}`}
                to={item.to}
                hash={item.hash}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                }`}
              >
                <SubIcon className="w-3.5 h-3.5" />
                {item.label}
                {active && <span className="ml-auto w-1 h-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { state } = useAppState();
  const { level, progress } = levelFromXp(state.xp);
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-7">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl shadow-glow transition-transform group-hover:scale-105">
            🐼
          </div>
          <div>
            <div className="font-display font-bold text-base leading-tight">Panda's</div>
            <div className="font-display font-bold text-sm text-gradient-primary leading-tight">LIFE OS</div>
          </div>
        </Link>
      </div>

      <Link to="/rewards" className="mx-4 mb-6 p-4 rounded-2xl bg-sidebar-accent/60 border border-sidebar-border block hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <PandaAvatar xp={state.xp} size="sm" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nivel {level}</div>
            <div className="font-display font-bold text-sm truncate">{state.xp} XP</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all duration-700"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Sparkles className="w-3 h-3 text-[var(--xp)]" />
          Ver misiones →
        </div>
      </Link>

      <div className="px-3 pb-3">
        <GlobalSearchTrigger />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {topItems.map((item) => <NavLink key={item.to} item={item} />)}
        <div className="h-2" />
        <CategoryGroup storageKey="enki:sidebar:health" label="HEALTH" icon={Heart} items={healthItems} defaultOpen />
        <CategoryGroup storageKey="enki:sidebar:home" label="HOME" icon={HomeIcon} items={homeItems} />
        <CategoryGroup storageKey="enki:sidebar:money" label="MONEY" icon={Wallet} items={moneyItems} />
        <CategoryGroup storageKey="enki:sidebar:insights" label="INSIGHTS" icon={BarChart3} items={insightsItems} />
        <CategoryGroup storageKey="enki:sidebar:mind" label="MIND" icon={Brain} items={mindItems} />
        <CategoryGroup storageKey="enki:sidebar:setup" label="SETUP" icon={Settings} items={setupItems} />
      </nav>

      <div className="px-3 pt-3 pb-2 border-t border-sidebar-border mt-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
          title={user?.email ?? ""}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate flex-1 text-left">{user?.email ?? "Cerrar sesión"}</span>
        </button>
      </div>

      <div className="p-3 text-[10px] text-muted-foreground/60 text-center">
        v2.0 · cloud sync
      </div>
    </aside>
  );
}

export { MobileNav } from "@/components/MobileNav";
