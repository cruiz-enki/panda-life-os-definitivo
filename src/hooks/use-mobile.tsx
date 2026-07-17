/**
 * Hook utilitario para detectar viewport móvil (<768px) usando
 * `matchMedia`. Re-renderiza al cambiar el tamaño de la ventana.
 */
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Devuelve `true` si el viewport es móvil.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
