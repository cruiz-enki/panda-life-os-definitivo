/**
 * **Hook** — Modo Focus: permite ocultar módulos de la navegación.
 * Guarda las claves ocultas y el flag `enabled` en localStorage y notifica
 * cambios a otras instancias del hook mediante un `storage`-like event.
 * Cuando `enabled=false`, el filtrado devuelve todos los ítems (modo normal).
 */
import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "enki:focus:hidden";
const ENABLED_KEY = "enki:focus:enabled";
const EVENT_NAME = "enki:focus:changed";

export type FocusItemKey = string; // formato: `${to}#${hash ?? ""}`

export function focusKey(to: string, hash?: string): FocusItemKey {
  return `${to}#${hash ?? ""}`;
}

function readHidden(): Set<FocusItemKey> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) === "1";
}

function writeHidden(set: Set<FocusItemKey>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function writeEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, v ? "1" : "0");
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useFocusMode() {
  const [hidden, setHidden] = useState<Set<FocusItemKey>>(() => readHidden());
  const [enabled, setEnabledState] = useState<boolean>(() => readEnabled());

  useEffect(() => {
    const sync = () => {
      setHidden(readHidden());
      setEnabledState(readEnabled());
    };
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isHidden = useCallback(
    (to: string, hash?: string) => enabled && hidden.has(focusKey(to, hash)),
    [hidden, enabled],
  );

  const toggle = useCallback((to: string, hash?: string) => {
    const key = focusKey(to, hash);
    const next = new Set(readHidden());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeHidden(next);
    setHidden(next);
  }, []);

  const showAll = useCallback(() => {
    writeHidden(new Set());
    setHidden(new Set());
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    writeEnabled(v);
    setEnabledState(v);
  }, []);

  const filterItems = useCallback(
    <T extends { to: string; hash?: string }>(items: T[]): T[] =>
      enabled ? items.filter((i) => !hidden.has(focusKey(i.to, i.hash))) : items,
    [hidden, enabled],
  );

  return { hidden, isHidden, toggle, showAll, filterItems, count: hidden.size, enabled, setEnabled };
}
