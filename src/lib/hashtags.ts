/**
 * Helpers para **hashtags inline** (`#etiqueta`) en tareas, notas,
 * aprendizajes y capturas. Extracción, color determinista y resolución
 * contra el catálogo de tags.
 */
import type { Tag } from "./storage-types";

// Permite letras (incluye acentos), números, _ y -. Mínimo 2 chars.
// Usa lookbehind para evitar capturar # pegados a palabras (ej: c#).
const HASHTAG_RE = /(?:^|\s)#([\p{L}\p{N}_-]{2,32})/gu;

/** Extrae nombres de hashtags únicos (lowercased, sin #) desde un texto libre. */
export function extractHashtags(...texts: (string | undefined | null)[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    let m: RegExpExecArray | null;
    HASHTAG_RE.lastIndex = 0;
    while ((m = HASHTAG_RE.exec(text)) !== null) {
      found.add(m[1].toLowerCase());
    }
  }
  return [...found];
}

/** Color determinístico (oklch) en función del nombre del tag. */
export function colorForTagName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `oklch(0.75 0.18 ${hue})`;
}

/**
 * Dado un texto y la lista actual de tags, devuelve:
 * - newTags: tags a crear (no existían).
 * - tagIds: ids (existentes + nuevos) a asociar al item.
 */
export function resolveHashtags(
  text: string,
  existingTags: Tag[],
): { newTags: Tag[]; tagIds: string[] } {
  const names = extractHashtags(text);
  if (names.length === 0) return { newTags: [], tagIds: [] };
  const byName = new Map(existingTags.map((t) => [t.name.toLowerCase(), t]));
  const newTags: Tag[] = [];
  const tagIds: string[] = [];
  for (const name of names) {
    const existing = byName.get(name);
    if (existing) {
      tagIds.push(existing.id);
    } else {
      const fresh: Tag = { id: crypto.randomUUID(), name, color: colorForTagName(name) };
      newTags.push(fresh);
      tagIds.push(fresh.id);
    }
  }
  return { newTags, tagIds };
}

/** Une ids existentes + nuevos sin duplicar. */
export function mergeTagIds(current: string[] | undefined, extra: string[]): string[] {
  return [...new Set([...(current ?? []), ...extra])];
}
