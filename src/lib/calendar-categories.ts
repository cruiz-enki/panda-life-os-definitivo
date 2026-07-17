/**
 * Mapeo de **categorías a colorId de Google Calendar**.
 * Ref: https://developers.google.com/calendar/api/v3/reference/colors
 */
export type CalendarCategory = {
  id: string;
  label: string;
  emoji: string;
  colorId: string; // Google Calendar event colorId
  hex: string; // approximate hex for UI
};

/**
 * Catálogo de categorías disponibles para clasificar eventos.
 */
export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  { id: "trabajo", label: "Trabajo", emoji: "💼", colorId: "9", hex: "#5484ed" },
  { id: "personal", label: "Personal", emoji: "🌱", colorId: "10", hex: "#51b749" },
  { id: "salud", label: "Salud", emoji: "🏥", colorId: "11", hex: "#dc2127" },
  { id: "social", label: "Social", emoji: "🎉", colorId: "6", hex: "#ffb878" },
  { id: "importante", label: "Importante", emoji: "⭐", colorId: "4", hex: "#ff887c" },
  { id: "estudio", label: "Estudio", emoji: "📚", colorId: "5", hex: "#fbd75b" },
  { id: "familia", label: "Familia", emoji: "👨‍👩‍👧", colorId: "3", hex: "#dbadff" },
  { id: "viaje", label: "Viaje", emoji: "✈️", colorId: "7", hex: "#46d6db" },
  { id: "otros", label: "Otros", emoji: "📌", colorId: "8", hex: "#e1e1e1" },
];

/**
 * Devuelve la categoría asociada a un `colorId` de Google, o `null`.
 */
export function categoryFromColorId(colorId?: string): CalendarCategory | null {
  if (!colorId) return null;
  return CALENDAR_CATEGORIES.find((c) => c.colorId === colorId) ?? null;
}

/**
 * Busca una categoría por su id interno.
 */
export function categoryById(id: string): CalendarCategory | null {
  return CALENDAR_CATEGORIES.find((c) => c.id === id) ?? null;
}
