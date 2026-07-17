/**
 * **Componente** — Barra lateral principal de navegación con todas las secciones de la app.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Repeat, BookOpen, Battery, Sparkles, CheckSquare, NotebookPen, Calendar as CalendarIcon, LogOut, Trophy, BarChart3, Settings, Wallet, Heart, Library, Star, Target, MessageCircle, Brain, ChevronDown, Scale, Utensils, Pill, AlertCircle, Stethoscope, Activity, Home as HomeIcon, Rocket, FolderKanban, Dumbbell, Download, Newspaper, GraduationCap, Mountain, Compass, Workflow, LayoutGrid, Mail, Users, Beaker, Eye, Bell, Moon, Smile, Clock, MapPin, Car } from "lucide-react";
import { useAppState, levelFromXp } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { PandaAvatar } from "@/components/PandaAvatar";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; hash?: string };

// Items sueltos arriba
const topItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/introspection", label: "Introspección", icon: Eye },
  { to: "/pomodoro", label: "Pomodoro", icon: Brain },
  { to: "/decisions", label: "Decisiones", icon: Scale },
  { to: "/chat", label: "Chat IA", icon: MessageCircle },
];

const conocimientoItems: NavItem[] = [
  
  
  { to: "/learnings-history", label: "Mis Aprendizajes", icon: BookOpen },
  { to: "/skill-tree", label: "Skill Tree", icon: Trophy },
  
  { to: "/content", label: "Bitácora", icon: Library },
  { to: "/wishlist", label: "Wishlist", icon: Star },
];


const productividadItems: NavItem[] = [
  { to: "/calendar", label: "Calendario", icon: CalendarIcon },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/time", label: "Tiempo", icon: Clock },
  { to: "/locations", label: "Ubicaciones", icon: MapPin },
  { to: "/notes", label: "Notas", icon: NotebookPen },
  { to: "/projects", label: "Proyectos", icon: FolderKanban },
];

const hogarLimpiezaItem: NavItem = { to: "/home", label: "Limpieza", icon: HomeIcon };
const serviciosItem: NavItem = { to: "/services", label: "Servicios", icon: LayoutGrid };
const mantenimientoItem: NavItem = { to: "/maintenance", label: "Mantenimiento", icon: Workflow };

const hogarGroupItems: NavItem[] = [
  hogarLimpiezaItem,
  serviciosItem,
  { to: "/subscriptions", label: "Suscripciones", icon: Repeat },
  mantenimientoItem,
  { to: "/vehicles", label: "Vehículos", icon: Car },
  { to: "/inventory", label: "Inventario", icon: Library },
  { to: "/family", label: "Hocicos", icon: Heart },
  { to: "/contacts", label: "Contactos", icon: Users },
];

const crecimientoItems: NavItem[] = [
  { to: "/identity", label: "Identidad", icon: Target },
  { to: "/future", label: "Futuro", icon: Sparkles },
  { to: "/goals", label: "Goal Breakdown", icon: Workflow },
];


const misionesItems: NavItem[] = [
  { to: "/rewards", label: "Misiones", icon: Trophy },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

// Items sueltos abajo
const bottomItems: NavItem[] = [
  { to: "/finance", label: "Finanzas", icon: Wallet },
  { to: "/notifications", label: "Notificaciones", icon: Bell },
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

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation();
  const active = location.pathname === item.to;
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

function CollapsibleGroup({
  storageKey,
  label,
  icon: Icon,
  items,
}: {
  storageKey: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
}) {
  const location = useLocation();
  const inGroup = items.some((i) => i.to === location.pathname);

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return inGroup;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return inGroup;
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

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          inGroup
            ? "bg-sidebar-accent text-primary shadow-card"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
          {items.map((item) => {
            const active = location.pathname === item.to;
            const SubIcon = item.icon;
            return (
              <Link
                key={item.to}
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

const HEALTH_OPEN_KEY = "enki:sidebar:health-open";

function HealthGroup() {
  const location = useLocation();
  const inGroup =
    location.pathname === "/health" ||
    location.pathname === "/psychology" ||
    location.pathname === "/exercise" ||
    location.pathname === "/meals" ||
    location.pathname === "/energy";

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return inGroup;
    const stored = window.localStorage.getItem(HEALTH_OPEN_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return inGroup;
  });

  useEffect(() => {
    if (inGroup) setOpen(true);
  }, [inGroup]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HEALTH_OPEN_KEY, next ? "1" : "0");
    }
  };

  const isSubActive = (sub: typeof healthSubItems[number]) => {
    if (location.pathname !== sub.to) return false;
    const currentHash = location.hash.replace(/^#/, "");
    return currentHash === sub.hash;
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          inGroup
            ? "bg-sidebar-accent text-primary shadow-card"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        }`}
      >
        <Heart className="w-4 h-4" />
        <span className="flex-1 text-left">Salud</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
          {healthSubItems.map((sub) => {
            const Icon = sub.icon;
            const active = isSubActive(sub);
            return (
              <Link
                key={`${sub.to}#${sub.hash}`}
                to={sub.to}
                hash={sub.hash || undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sub.label}
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
        <CollapsibleGroup storageKey="enki:sidebar:conocimiento-open" label="Conocimiento" icon={GraduationCap} items={conocimientoItems} />
        <HealthGroup />
        <CollapsibleGroup storageKey="enki:sidebar:productividad-open" label="Productividad" icon={FolderKanban} items={productividadItems} />
        <CollapsibleGroup storageKey="enki:sidebar:hogar-open" label="Hogar" icon={HomeIcon} items={hogarGroupItems} />
        <CollapsibleGroup storageKey="enki:sidebar:crecimiento-open" label="Crecimiento" icon={Rocket} items={crecimientoItems} />
        <CollapsibleGroup storageKey="enki:sidebar:logros-open" label="Misiones" icon={Trophy} items={misionesItems} />
        {bottomItems.map((item) => <NavLink key={item.to} item={item} />)}
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
