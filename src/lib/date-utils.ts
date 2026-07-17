/**
 * Helpers de **fecha en zona horaria local** del usuario (CDMX por defecto).
 * Mantiene consistencia con el módulo Insights.
 */
const TZ = "America/Mexico_City";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD del "hoy" del usuario en zona CDMX. */
export function todayCDMX(): string {
  return fmt.format(new Date());
}

/** YYYY-MM-DD de cualquier Date/string en zona CDMX. */
export function dateKeyCDMX(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return fmt.format(date);
}

/** Devuelve el YYYY-MM-DD de hace N días tomando como ancla mediodía local
 *  para evitar saltos por DST/UTC. */
export function daysAgoCDMX(n: number): string {
  const today = todayCDMX();
  const [y, m, d] = today.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() - n);
  return fmt.format(anchor);
}

/** Etiqueta legible "Hoy / Ayer / Lun 14 oct" para un YYYY-MM-DD. */
export function humanDateLabel(key: string): string {
  if (key === todayCDMX()) return "Hoy";
  if (key === daysAgoCDMX(1)) return "Ayer";
  if (key === daysAgoCDMX(2)) return "Antier";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}
