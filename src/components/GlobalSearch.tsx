/**
 * **Componente** — Búsqueda global tipo Spotlight (⌘K) sobre tareas, notas, aprendizajes, etc.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  CheckSquare,
  NotebookPen,
  Library,
  Star,
  Repeat,
  Wallet,
  CreditCard,
  Receipt,
  Compass,
  Sparkles,
  MessageCircle,
  LogOut,
  BookOpen,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Heart,
  Brain,
  Battery,
  Trophy,
  BarChart3,
  Settings,
  Target,
  MapPin,
  Users,
  Pill,
  Utensils,
  Moon,
  Activity,
  Clock,
} from "lucide-react";
import { useAppState } from "@/lib/storage";
import { useContentLog, useWishlist } from "@/hooks/use-content";
import { useFinance } from "@/hooks/use-finance";
import { useContacts } from "@/hooks/use-contacts";
import { useHealth } from "@/hooks/use-health";
import { useMeals } from "@/hooks/use-meals";
import { useLocations } from "@/hooks/use-locations";
import { useMood } from "@/hooks/use-mood";
import { useSleep } from "@/hooks/use-sleep";
import { useAuth } from "@/lib/auth-context";

type Ctx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };
const GlobalSearchCtx = createContext<Ctx | null>(null);

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchCtx);
  if (!ctx) throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  return ctx;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const PAGES: { label: string; to: string; hash?: string; icon: typeof CheckSquare; keywords?: string }[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, keywords: "hoy inicio" },
  { label: "Calendario", to: "/calendar", icon: CalendarIcon, keywords: "agenda plan" },
  { label: "Tareas", to: "/tasks", icon: CheckSquare },
  { label: "Hogar", to: "/home", icon: CheckSquare, keywords: "casa limpieza rutinas" },
  { label: "Notas", to: "/notes", icon: NotebookPen },
  { label: "Hábitos", to: "/habits", icon: Repeat },
  { label: "Mis Aprendizajes", to: "/learnings-history", icon: BookOpen },
  { label: "Aprende Hoy", to: "/learnings", icon: Sparkles },
  { label: "Bitácora", to: "/content", icon: Library, keywords: "contenido libros series bitacora" },
  { label: "Wishlist", to: "/wishlist", icon: Star, keywords: "deseos" },
  { label: "Energía", to: "/energy", icon: Battery },
  { label: "Identidad", to: "/identity", icon: Target },
  { label: "Chat IA", to: "/chat", icon: MessageCircle, keywords: "coach panda" },
  { label: "Insights", to: "/insights", icon: BarChart3 },
  { label: "Finanzas", to: "/finance", icon: Wallet, keywords: "dinero gastos tarjetas" },
  { label: "Recompensas", to: "/rewards", icon: Trophy },
  { label: "Salud — Resumen", to: "/health", icon: Heart },
  { label: "Salud — Cuerpo", to: "/health", hash: "body", icon: Heart, keywords: "peso medidas" },
  { label: "Salud — Comidas", to: "/health", hash: "meals", icon: Heart },
  { label: "Salud — Medicación", to: "/health", hash: "meds", icon: Heart, keywords: "medicinas pastillas" },
  { label: "Salud — Malestares", to: "/health", hash: "symptoms", icon: Heart, keywords: "síntomas" },
  { label: "Salud — Bitácora médica", to: "/health", hash: "medical", icon: Heart },
  { label: "Psicología", to: "/psychology", icon: Brain },
  { label: "Ajustes", to: "/settings", icon: Settings, keywords: "configuración telegram notificaciones" },
];

const MAX_PER_GROUP = 6;

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <GlobalSearchCtx.Provider value={{ open, setOpen, toggle }}>
      {children}
      <GlobalSearchDialog open={open} setOpen={setOpen} />
    </GlobalSearchCtx.Provider>
  );
}

function GlobalSearchDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state } = useAppState();
  const { items: contentItems } = useContentLog();
  const { items: wishItems } = useWishlist();
  const { cards, expenses } = useFinance();
  const [query, setQuery] = useState("");

  const q = norm(query.trim());

  const go = useCallback(
    (to: string, hash?: string) => {
      setOpen(false);
      setQuery("");
      navigate({ to, hash: hash || undefined } as never);
    },
    [navigate, setOpen],
  );

  const runAction = useCallback(
    (fn: () => void) => {
      setOpen(false);
      setQuery("");
      setTimeout(fn, 50);
    },
    [setOpen],
  );

  // Modo hashtag: si la query empieza con # filtramos por nombre de tag.
  const tagMode = query.trim().startsWith("#");
  const tagQueryName = tagMode ? norm(query.trim().slice(1)) : "";
  const tagsByName = useMemo(() => new Map(state.tags.map((t) => [norm(t.name), t])), [state.tags]);
  const tagNamesById = useMemo(() => new Map(state.tags.map((t) => [t.id, t.name])), [state.tags]);
  // tag exacto si existe
  const exactTag = tagMode ? tagsByName.get(tagQueryName) : undefined;
  // En modo tag, item matchea si tiene el id del tag exacto, o si su nombre incluye la query.
  const matchTagIds = (ids: string[]) => {
    if (!tagMode) return false;
    if (exactTag && ids.includes(exactTag.id)) return true;
    return ids.some((id) => {
      const name = tagNamesById.get(id);
      return name ? norm(name).includes(tagQueryName) : false;
    });
  };
  // Para items sin campo tags (learnings): buscar #tag literal en el texto.
  const matchHashtagInText = (text: string) => {
    if (!tagMode || !tagQueryName) return false;
    return norm(text).includes(`#${tagQueryName}`);
  };
  // Resuelve nombres de tags asociados (ids) a un string buscable.
  const tagNamesText = (ids: string[]) => ids.map((id) => tagNamesById.get(id) ?? "").join(" ");

  const filteredPages = useMemo(() => {
    if (tagMode) return [];
    if (!q) return PAGES.slice(0, 8);
    return PAGES.filter((p) => norm(`${p.label} ${p.keywords ?? ""}`).includes(q)).slice(0, MAX_PER_GROUP);
  }, [q, tagMode]);

  const filteredTasks = useMemo(() => {
    if (tagMode) {
      if (!tagQueryName) return [];
      return state.tasks.filter((t) => matchTagIds(t.tags)).slice(0, MAX_PER_GROUP);
    }
    if (!q) return [];
    return state.tasks
      .filter((t) => norm(`${t.title} ${t.description ?? ""} ${tagNamesText(t.tags)}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, state.tasks, tagMode, tagQueryName]);

  const filteredNotes = useMemo(() => {
    if (tagMode) {
      if (!tagQueryName) return [];
      return state.notes
        .filter((n) => matchTagIds(n.tags) || matchHashtagInText(`${n.title} ${n.content}`))
        .slice(0, MAX_PER_GROUP);
    }
    if (!q) return [];
    return state.notes
      .filter((n) => norm(`${n.title} ${n.content} ${tagNamesText(n.tags)}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, state.notes, tagMode, tagQueryName]);

  const filteredLearnings = useMemo(() => {
    if (tagMode) {
      if (!tagQueryName) return [];
      return state.learnings
        .filter((l) => matchHashtagInText(`${l.title} ${l.notes}`))
        .slice(0, MAX_PER_GROUP);
    }
    if (!q) return [];
    return state.learnings
      .filter((l) => norm(`${l.title} ${l.notes}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, state.learnings, tagMode, tagQueryName]);

  const filteredHabits = useMemo(() => {
    if (tagMode || !q) return [];
    return state.habits.filter((h) => norm(h.name).includes(q)).slice(0, MAX_PER_GROUP);
  }, [q, state.habits, tagMode]);

  const filteredContent = useMemo(() => {
    if (tagMode) {
      if (!tagQueryName) return [];
      return contentItems
        .filter((c) => c.tags.some((tagName) => norm(tagName).includes(tagQueryName)) || matchHashtagInText(`${c.title} ${c.notes}`))
        .slice(0, MAX_PER_GROUP);
    }
    if (!q) return [];
    return contentItems
      .filter((c) => norm(`${c.title} ${c.notes} ${c.genre} ${c.tags.join(" ")}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, contentItems, tagMode, tagQueryName]);

  const filteredWishlist = useMemo(() => {
    if (tagMode) {
      if (!tagQueryName) return [];
      return wishItems
        .filter((w) => w.tags.some((tagName) => norm(tagName).includes(tagQueryName)) || matchHashtagInText(`${w.title} ${w.notes}`))
        .slice(0, MAX_PER_GROUP);
    }
    if (!q) return [];
    return wishItems
      .filter((w) => norm(`${w.title} ${w.notes} ${w.source} ${w.tags.join(" ")}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, wishItems, tagMode, tagQueryName]);

  const filteredCards = useMemo(() => {
    if (tagMode || !q) return [];
    return cards.filter((c) => norm(`${c.name} ${c.bank}`).includes(q)).slice(0, MAX_PER_GROUP);
  }, [q, cards, tagMode]);

  const filteredExpenses = useMemo(() => {
    if (tagMode || !q) return [];
    return expenses
      .filter((e) => norm(`${e.note} ${e.category}`).includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [q, expenses, tagMode]);

  const openQuickCapture = () => {
    const w = window as unknown as { __openQuickCapture?: () => void };
    if (w.__openQuickCapture) w.__openQuickCapture();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar tareas, notas, finanzas…  (usa #etiqueta para filtrar por tag)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sin resultados para "{query}"</CommandEmpty>

        {!q && (
          <CommandGroup heading="Acciones rápidas">
            <CommandItem onSelect={() => runAction(openQuickCapture)}>
              <Sparkles />
              <span>Captura rápida</span>
              <CommandShortcut>⌘ J</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/chat")}>
              <MessageCircle />
              <span>Abrir Chat IA</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/tasks")}>
              <CheckSquare />
              <span>Nueva tarea</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/notes")}>
              <NotebookPen />
              <span>Nueva nota</span>
            </CommandItem>
          </CommandGroup>
        )}

        {filteredPages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Páginas">
              {filteredPages.map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem
                    key={`page-${p.label}`}
                    value={`page-${p.label}`}
                    onSelect={() => go(p.to, p.hash)}
                  >
                    <Icon />
                    <span>{p.label}</span>
                    <CommandShortcut>{p.to}{p.hash ? `#${p.hash}` : ""}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {filteredTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tareas">
              {filteredTasks.map((t) => (
                <CommandItem key={`task-${t.id}`} value={`task-${t.id}-${t.title}`} onSelect={() => go("/tasks")}>
                  <CheckSquare />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.priority} · {t.status}{t.due ? ` · ${t.due}` : ""}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredNotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Notas">
              {filteredNotes.map((n) => (
                <CommandItem key={`note-${n.id}`} value={`note-${n.id}-${n.title}`} onSelect={() => go("/notes")}>
                  <NotebookPen />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{n.title || "(sin título)"}</div>
                    <div className="text-xs text-muted-foreground truncate">{n.type} · {n.category}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredLearnings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Aprendizajes">
              {filteredLearnings.map((l) => (
                <CommandItem key={`learn-${l.id}`} value={`learn-${l.id}-${l.title}`} onSelect={() => go("/learnings-history")}>
                  <BookOpen />
                  <span className="truncate">{l.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredHabits.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Hábitos">
              {filteredHabits.map((h) => (
                <CommandItem key={`habit-${h.id}`} value={`habit-${h.id}-${h.name}`} onSelect={() => go("/habits")}>
                  <Repeat />
                  <span className="truncate">{h.emoji} {h.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredContent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bitácora">
              {filteredContent.map((c) => (
                <CommandItem key={`content-${c.id}`} value={`content-${c.id}-${c.title}`} onSelect={() => go("/content")}>
                  <Library />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.contentType} · {c.status}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredWishlist.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Wishlist">
              {filteredWishlist.map((w) => (
                <CommandItem key={`wish-${w.id}`} value={`wish-${w.id}-${w.title}`} onSelect={() => go("/wishlist")}>
                  <Star />
                  <span className="truncate">{w.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredCards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tarjetas">
              {filteredCards.map((c) => (
                <CommandItem
                  key={`card-${c.id}`}
                  value={`card-${c.id}-${c.name}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    navigate({ to: "/finance/cards/$cardId", params: { cardId: c.id } } as never);
                  }}
                >
                  <CreditCard />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.bank}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredExpenses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Gastos">
              {filteredExpenses.map((e) => (
                <CommandItem key={`exp-${e.id}`} value={`exp-${e.id}-${e.note || e.category}`} onSelect={() => go("/finance")}>
                  <Receipt />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{e.note || e.category}</div>
                    <div className="text-xs text-muted-foreground truncate">${e.amount} · {e.date}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!q && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sesión">
              <CommandItem onSelect={() => runAction(() => signOut())}>
                <LogOut />
                <span>Cerrar sesión</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Botón disparador reutilizable (sidebar / mobile nav). */
export function GlobalSearchTrigger({ className, compact }: { className?: string; compact?: boolean }) {
  const { setOpen } = useGlobalSearch();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={
        className ??
        "w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      }
      aria-label="Búsqueda global"
    >
      <Compass className="w-4 h-4" />
      {!compact && <span className="flex-1 text-left">Buscar…</span>}
      {!compact && (
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border font-mono">⌘K</kbd>
      )}
    </button>
  );
}
