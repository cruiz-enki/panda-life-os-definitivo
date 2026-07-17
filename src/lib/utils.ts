/**
 * Utilidades transversales. `cn()` combina clases de Tailwind respetando
 * precedencia con `tailwind-merge`.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
