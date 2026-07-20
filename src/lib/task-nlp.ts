/**
 * **Parser de lenguaje natural** para captura rápida de tareas.
 *
 * Entrada: texto libre estilo TickTick/Todoist en español.
 * Extrae: título limpio, fecha/hora (`due`), prioridad, hashtags,
 * y sugerencia de lista (`@lista` o `>lista`).
 *
 * Ejemplos:
 *   "Llamar a Juan mañana 3pm #trabajo !alta"
 *   "Pagar renta el 5 !!!"
 *   "Enviar reporte hoy 18:30 @clientes #urgente"
 *   "Comprar leche viernes"
 */
import type { Priority } from "./storage-types";

export type ParsedTask = {
  title: string;
  due?: string; // ISO
  priority?: Priority;
  tags: string[]; // nombres (sin #)
  listHint?: string; // nombre de lista sugerida
  matched: {
    date?: string; // texto original que se detectó
    time?: string;
    priority?: string;
    tags: string[];
    list?: string;
  };
};

const DAYS_ES: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

const MONTHS_ES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function nextDow(from: Date, dow: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function parsePriority(text: string): { priority?: Priority; matched?: string; rest: string } {
  // !!! = alta, !! = media, ! = baja  |  !alta/!media/!baja  |  !high/!medium/!low
  const wordMatch = text.match(/(?:^|\s)!(alta|media|baja|high|medium|low|urgente)\b/i);
  if (wordMatch) {
    const w = wordMatch[1].toLowerCase();
    const p: Priority = w === "alta" || w === "high" || w === "urgente" ? "high" : w === "media" || w === "medium" ? "medium" : "low";
    return { priority: p, matched: wordMatch[0].trim(), rest: text.replace(wordMatch[0], " ") };
  }
  const bangs = text.match(/(?:^|\s)(!!!|!!|!)(?=\s|$)/);
  if (bangs) {
    const p: Priority = bangs[1] === "!!!" ? "high" : bangs[1] === "!!" ? "medium" : "low";
    return { priority: p, matched: bangs[1], rest: text.replace(bangs[0], " ") };
  }
  return { rest: text };
}

function parseTags(text: string): { tags: string[]; matched: string[]; rest: string } {
  const tags: string[] = [];
  const matched: string[] = [];
  const rest = text.replace(/(?:^|\s)#([\p{L}\p{N}_-]{2,32})/gu, (full, tag) => {
    tags.push(tag.toLowerCase());
    matched.push(`#${tag}`);
    return " ";
  });
  return { tags, matched, rest };
}

function parseList(text: string): { listHint?: string; matched?: string; rest: string } {
  const m = text.match(/(?:^|\s)[@>]([\p{L}\p{N}_-]{2,32})/u);
  if (!m) return { rest: text };
  return { listHint: m[1], matched: m[0].trim(), rest: text.replace(m[0], " ") };
}

function parseTime(text: string): { hours?: number; minutes?: number; matched?: string; rest: string } {
  // 3pm, 3:30pm, 15:00, 15h, 3 pm
  const re = /(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm|h)?\b/i;
  const m = text.match(re);
  if (!m) return { rest: text };
  let h = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const suf = m[3]?.toLowerCase();
  // Evita falsos positivos: número solo sin sufijo y sin minutos (ej: "5 tacos")
  if (!suf && !m[2]) return { rest: text };
  if (suf === "pm" && h < 12) h += 12;
  if (suf === "am" && h === 12) h = 0;
  if (h > 23 || mm > 59) return { rest: text };
  return { hours: h, minutes: mm, matched: m[0].trim(), rest: text.replace(m[0], " ") };
}

function parseDate(text: string, now: Date): { date?: Date; matched?: string; rest: string } {
  const norm = stripAccents(text.toLowerCase());

  // hoy / mañana / pasado mañana / anteayer
  const rel: Array<[RegExp, number]> = [
    [/(?:^|\s)pasado\s+manana\b/, 2],
    [/(?:^|\s)manana\b/, 1],
    [/(?:^|\s)hoy\b/, 0],
  ];
  for (const [re, days] of rel) {
    const m = norm.match(re);
    if (m) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + days);
      const idx = m.index ?? 0;
      const rest = text.slice(0, idx) + " " + text.slice(idx + m[0].length);
      return { date: d, matched: m[0].trim(), rest };
    }
  }

  // en X días/semanas
  const enX = norm.match(/(?:^|\s)en\s+(\d{1,3})\s+(dias?|semanas?|meses?)\b/);
  if (enX) {
    const n = parseInt(enX[1], 10);
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    if (enX[2].startsWith("dia")) d.setDate(d.getDate() + n);
    else if (enX[2].startsWith("semana")) d.setDate(d.getDate() + 7 * n);
    else d.setMonth(d.getMonth() + n);
    const idx = enX.index ?? 0;
    return { date: d, matched: enX[0].trim(), rest: text.slice(0, idx) + " " + text.slice(idx + enX[0].length) };
  }

  // día de la semana (opcionalmente "el lunes" o "este/próximo lunes")
  for (const [name, dow] of Object.entries(DAYS_ES)) {
    const re = new RegExp(`(?:^|\\s)(?:el\\s+|este\\s+|proximo\\s+|pr[oó]ximo\\s+)?${stripAccents(name)}\\b`);
    const m = norm.match(re);
    if (m) {
      const d = nextDow(now, dow);
      const idx = m.index ?? 0;
      return { date: d, matched: m[0].trim(), rest: text.slice(0, idx) + " " + text.slice(idx + m[0].length) };
    }
  }

  // "el 5", "el 5 de junio", "5/6", "5-6-2026"
  const dm = norm.match(/(?:^|\s)(?:el\s+)?(\d{1,2})(?:\s+de\s+([a-z]+))?(?:\s+(?:de\s+)?(\d{4}))?\b/);
  if (dm && (dm[2] || dm[3] || /el\s+\d/.test(dm[0]))) {
    const day = parseInt(dm[1], 10);
    const monthName = dm[2];
    const year = dm[3] ? parseInt(dm[3], 10) : now.getFullYear();
    const month = monthName ? MONTHS_ES[monthName] : now.getMonth();
    if (day >= 1 && day <= 31 && month !== undefined) {
      const d = new Date(year, month, day, 0, 0, 0, 0);
      if (!dm[3] && d.getTime() < now.getTime() - 12 * 3600 * 1000 && !monthName) {
        d.setMonth(d.getMonth() + 1);
      }
      const idx = dm.index ?? 0;
      return { date: d, matched: dm[0].trim(), rest: text.slice(0, idx) + " " + text.slice(idx + dm[0].length) };
    }
  }

  const slash = norm.match(/(?:^|\s)(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10) - 1;
    let year = slash[3] ? parseInt(slash[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const idx = slash.index ?? 0;
      return { date: d, matched: slash[0].trim(), rest: text.slice(0, idx) + " " + text.slice(idx + slash[0].length) };
    }
  }

  return { rest: text };
}

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/^[,;:-]+|[,;:-]+$/g, "").trim();
}

export function parseTaskInput(input: string, now: Date = new Date()): ParsedTask {
  const matched: ParsedTask["matched"] = { tags: [] };
  let rest = input;

  const p = parsePriority(rest); rest = p.rest; if (p.matched) matched.priority = p.matched;
  const t = parseTags(rest); rest = t.rest; matched.tags = t.matched;
  const l = parseList(rest); rest = l.rest; if (l.matched) matched.list = l.matched;
  const d = parseDate(rest, now); rest = d.rest; if (d.matched) matched.date = d.matched;
  const tm = parseTime(rest); rest = tm.rest; if (tm.matched) matched.time = tm.matched;

  let due: string | undefined;
  if (d.date) {
    const out = new Date(d.date);
    if (tm.hours !== undefined) out.setHours(tm.hours, tm.minutes ?? 0, 0, 0);
    due = out.toISOString();
  } else if (tm.hours !== undefined) {
    const out = new Date(now);
    out.setHours(tm.hours, tm.minutes ?? 0, 0, 0);
    if (out.getTime() < now.getTime()) out.setDate(out.getDate() + 1);
    due = out.toISOString();
  }

  return {
    title: cleanTitle(rest) || input.trim(),
    due,
    priority: p.priority,
    tags: t.tags,
    listHint: l.listHint,
    matched,
  };
}
