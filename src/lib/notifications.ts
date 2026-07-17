/**
 * **Notificaciones**: Web Notifications API + scheduler local +
 * registro de Web Push. Helpers para programar, cancelar y disparar
 * notificaciones.
 */
import { supabase } from "@/integrations/supabase/client";

// VAPID public key is fetched from the server (where it's stored as a secret).
let _vapidPublicKey: string | null | undefined = undefined;
async function getVapidPublicKey(): Promise<string | null> {
  if (_vapidPublicKey !== undefined) return _vapidPublicKey;
  try {
    const res = await fetch("/api/public/vapid-key");
    if (!res.ok) {
      _vapidPublicKey = null;
      return null;
    }
    const json = (await res.json()) as { publicKey?: string };
    _vapidPublicKey = json.publicKey || null;
    return _vapidPublicKey;
  } catch {
    _vapidPublicKey = null;
    return null;
  }
}

// ============================================================
// PERMISSION + SUPPORT
// ============================================================
/**
 * ¿El navegador soporta Web Notifications API?
 */
export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * ¿El navegador soporta Web Push (Service Worker + PushManager)?
 */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

// ============================================================
// LOCAL NOTIFICATIONS
// ============================================================
/**
 * Muestra una notificación local inmediatamente.
 */
export function showLocalNotification(title: string, options: NotificationOptions = {}) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
  } catch (e) {
    // Some browsers (iOS Safari) require ServiceWorkerRegistration.showNotification
    navigator.serviceWorker?.getRegistration().then((reg) => {
      reg?.showNotification(title, { icon: "/icon-192.png", badge: "/icon-192.png", ...options });
    });
  }
}

// ============================================================
// SERVICE WORKER REGISTRATION (safe for previews)
// ============================================================
function isPreviewIframe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  return host.includes("id-preview--") || host.includes("lovableproject.com");
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  // Skip SW in iframe previews (causes stale content)
  if (isPreviewIframe()) {
    // Cleanup any leftover SW from a previous run
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[notifications] SW registration failed", err);
    return null;
  }
}

// ============================================================
// WEB PUSH SUBSCRIPTION
// ============================================================
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "Tu navegador no soporta push notifications." };

  const perm = await requestNotificationPermission();
  if (perm !== "granted") return { ok: false, reason: "Permiso de notificaciones denegado." };

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey)
    return { ok: false, reason: "Push real no configurado todavía (falta VAPID público)." };

  const reg = await ensureServiceWorker();
  if (!reg)
    return {
      ok: false,
      reason:
        "No se pudo registrar el service worker. Abre la app publicada (no el preview) e instálala.",
    };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "Suscripción inválida." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

// ============================================================
// LOCAL SCHEDULER — recordatorios mientras la pestaña está abierta
// ============================================================
type ScheduledItem = { id: string; at: number; title: string; body: string; url?: string };
const timers: Map<string, number> = new Map();

/**
 * Programa una notificación local (in-memory) para disparar más tarde.
 */
export function scheduleLocal(item: ScheduledItem) {
  cancelLocal(item.id);
  const delay = item.at - Date.now();
  if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return; // solo próximas 24h
  const id = window.setTimeout(() => {
    showLocalNotification(item.title, {
      body: item.body,
      tag: item.id,
      data: { url: item.url || "/" },
    });
    timers.delete(item.id);
  }, delay);
  timers.set(item.id, id);
}

/**
 * Cancela una notificación local previamente programada.
 */
export function cancelLocal(id: string) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
}

/**
 * Limpia todas las notificaciones locales programadas.
 */
export function clearAllLocal() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

// ============================================================
// HELPERS para hábitos / tareas
// ============================================================
export type ReminderInput = {
  tasks: Array<{ id: string; title: string; due?: string; reminder?: number; status: string }>;
  habits: Array<{ id: string; name: string; lastCompleted: string | null }>;
  prefs: {
    habitsEnabled: boolean;
    tasksEnabled: boolean;
    quietStart?: number | null;
    quietEnd?: number | null;
  };
};

function withinQuietHours(date: Date, start?: number | null, end?: number | null): boolean {
  if (start == null || end == null) return false;
  const h = date.getHours();
  if (start === end) return false;
  if (start < end) return h >= start && h < end;
  return h >= start || h < end; // wraps midnight
}

/**
 * Re-programa los recordatorios del día a partir de `input` (tareas,
 * hábitos, etc.).
 */
export function rescheduleReminders(input: ReminderInput) {
  clearAllLocal();
  const now = new Date();

  // Tareas con recordatorio
  if (input.prefs.tasksEnabled) {
    for (const t of input.tasks) {
      if (!t.due || !t.reminder || t.status === "completed") continue;
      const due = new Date(t.due).getTime();
      const at = due - t.reminder * 60 * 1000;
      const atDate = new Date(at);
      if (withinQuietHours(atDate, input.prefs.quietStart, input.prefs.quietEnd)) continue;
      scheduleLocal({
        id: `task-${t.id}`,
        at,
        title: `📋 ${t.title}`,
        body: `Vence en ${t.reminder} min`,
        url: "/tasks",
      });
    }
  }

  // Hábitos no completados hoy → recordar a las 19h
  if (input.prefs.habitsEnabled) {
    const today = now.toISOString().slice(0, 10);
    const reminderAt = new Date();
    reminderAt.setHours(19, 0, 0, 0);
    if (reminderAt.getTime() < Date.now()) return;
    if (withinQuietHours(reminderAt, input.prefs.quietStart, input.prefs.quietEnd)) return;

    const pending = input.habits.filter((h) => h.lastCompleted !== today);
    if (pending.length === 0) return;

    scheduleLocal({
      id: "habits-evening",
      at: reminderAt.getTime(),
      title: "🐼 Recordatorio de hábitos",
      body: `Te quedan ${pending.length} hábito${pending.length === 1 ? "" : "s"} por completar hoy`,
      url: "/habits",
    });
  }
}
