/**
 * **Componente** — Botón flotante (FAB) con acciones rápidas contextuales.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Calendar as CalendarIcon,
  CheckSquare,
  NotebookPen,
  Repeat,
  MessageCircle,
  ClipboardList,
  DollarSign,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TitoMissionsPanel } from "@/components/TitoMissions";

import { useLifeMode } from "@/hooks/use-life-mode";

type Variant = "mobile" | "desktop";

const shortcuts: { to: string; label: string; icon: LucideIcon; search?: Record<string, string> }[] = [
  { to: "/log", label: "Registrar", icon: ClipboardList },
  { to: "/log", label: "Gasto", icon: DollarSign, search: { tab: "expense" } },
  { to: "/calendar", label: "Calendario", icon: CalendarIcon },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/notes", label: "Notas", icon: NotebookPen },
  { to: "/habits", label: "Hábitos", icon: Repeat },
  { to: "/chat", label: "Coach IA", icon: MessageCircle },
];

export function QuickActionsFab({
  variant,
  onCapture,
}: {
  variant: Variant;
  onCapture: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { isFabLabelAllowed } = useLifeMode();
  const visibleShortcuts = shortcuts.filter((s) => isFabLabelAllowed(s.label));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Tito abre el panel al tocarlo
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("tito:openFab", onOpen);
    window.addEventListener("tito:closeFab", onClose);
    window.addEventListener("tito:toggleFab", onToggle);
    return () => {
      window.removeEventListener("tito:openFab", onOpen);
      window.removeEventListener("tito:closeFab", onClose);
      window.removeEventListener("tito:toggleFab", onToggle);
    };
  }, []);

  // Notificar estado para que Tito no se encime con el panel
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("fab:state", { detail: { open } }));
  }, [open]);

  const isMobile = variant === "mobile";

  const panelPositionClass = isMobile
    ? "fixed bottom-24 right-3 z-50"
    : "fixed bottom-6 right-6 z-50";

  const wrapperClass = isMobile ? "" : "hidden md:block";

  return (
    <div className={wrapperClass}>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] cursor-default pointer-events-auto"
        />
      )}

      {/* Panel de atajos anclado abajo-derecha (donde vive Tito) */}
      <div
        className={`${panelPositionClass} transition-all duration-200 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ transform: open ? "translateY(-7.5rem)" : "translateY(-7.5rem) scale(0.95)" }}
      >
        <div className="flex flex-col gap-2 min-w-[15rem] max-w-[17rem] p-2 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-card">
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tito · Acciones
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <TitoMissionsPanel />
          {visibleShortcuts.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Link
                key={`${s.to}-${idx}`}
                to={s.to}
                search={s.search as never}
                onClick={() => setOpen(false)}
                className="no-tap-highlight flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/90 hover:bg-secondary active:bg-secondary transition-colors"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{s.label}</span>
              </Link>
            );
          })}
          <div className="h-px bg-border my-1" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCapture();
            }}
            className="no-tap-highlight flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground shadow-glow"
          >
            <Sparkles className="w-4 h-4" />
            <span>Captura rápida</span>
          </button>
        </div>
      </div>
    </div>
  );
}
