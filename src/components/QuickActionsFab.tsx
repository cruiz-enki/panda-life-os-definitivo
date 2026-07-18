/**
 * **Componente** — Botón flotante (FAB) con acciones rápidas contextuales.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Plus,
  Calendar as CalendarIcon,
  CheckSquare,
  NotebookPen,
  Repeat,
  MessageCircle,
  ClipboardList,
  DollarSign,
} from "lucide-react";

type Variant = "mobile" | "desktop";

const shortcuts: { to: string; label: string; icon: typeof Plus; search?: Record<string, string> }[] = [
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isMobile = variant === "mobile";

  const fabPositionClass = isMobile
    ? "absolute left-1/2 -translate-x-1/2 -top-7"
    : "hidden md:flex fixed z-40 bottom-6 right-6";

  const panelPositionClass = isMobile
    ? "absolute bottom-full mb-3 left-1/2 -translate-x-1/2"
    : "absolute bottom-full mb-3 right-0";

  const wrapperClass = isMobile ? "" : "hidden md:block";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] cursor-default pointer-events-auto"
        />
      )}


      <div className={wrapperClass}>
        <div className={isMobile ? "" : "fixed z-50 bottom-6 right-6"}>
          <div className="relative">
            {/* Panel de atajos */}
            <div
              className={`${panelPositionClass} z-50 transition-all duration-200 origin-bottom ${
                open
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="flex flex-col gap-2 min-w-[12rem] p-2 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-card">
                {shortcuts.map((s, idx) => {
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

            {/* FAB principal */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar acciones rápidas" : "Acciones rápidas"}
              aria-expanded={open}
              className={
                isMobile
                  ? `${fabPositionClass} z-50 w-16 h-16 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center active:scale-95 transition-transform border-4 border-background no-tap-highlight`
                  : `relative w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-105 transition-transform`
              }
            >
              <Plus
                className={`w-6 h-6 transition-transform duration-200 ${
                  open ? "rotate-45" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
