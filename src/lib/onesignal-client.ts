/**
 * Cliente OneSignal Web SDK (lazy-loaded en el navegador).
 * Inicializa una sola vez. Expone helpers para pedir permiso y obtener player_id.
 */

import { supabase } from "@/integrations/supabase/client";
import { getOneSignalConfig, repairOneSignalSavedSubscription } from "@/lib/onesignal.functions";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalNS) => void | Promise<void>>;
    OneSignal?: OneSignalNS;
    __pandaOneSignalConsoleCapture?: boolean;
    __pandaOneSignalFetchCapture?: boolean;
    __pandaOneSignalLogs?: Array<{ level: string; at: string; message: string }>;
    __pandaOneSignalNetworkLogs?: Array<{ at: string; url: string; method: string; status?: number; ok?: boolean; body?: string; error?: string; ms: number }>;
  }
}

type OneSignalNS = {
  init: (opts: {
    appId: string;
    safari_web_id?: string;
    notifyButton?: { enable: boolean };
    allowLocalhostAsSecureOrigin?: boolean;
    autoResubscribe?: boolean;
    notificationClickHandlerMatch?: "exact" | "origin";
    notificationClickHandlerAction?: "navigate" | "focus";
    serviceWorkerPath?: string;
    serviceWorkerParam?: { scope: string };
  }) => Promise<void>;
  login?: (externalId: string) => Promise<void>;
  Debug?: { setLogLevel: (level: "trace" | "debug" | "info" | "warn" | "error") => void };
  User: {
    onesignalId?: string | null;
    PushSubscription: {
      id: string | null;
      token?: string | null;
      optedIn: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener: (
        event: "change",
        cb: (e: { current: { id: string | null; token?: string | null; optedIn: boolean } }) => void,
      ) => void;
    };
  };
  Notifications: {
    permission: boolean;
    permissionNative?: NotificationPermission;
    requestPermission: () => Promise<void>;
    addEventListener: (
      event: "click",
      cb: (e: { notification: { additionalData?: Record<string, unknown> } }) => void,
    ) => void;
  };
};

let cachedAppId: string | null = null;
let initPromise: Promise<void> | null = null;
let initSucceeded = false;
let lastInitError: string | null = null;
let lastPermissionError: string | null = null;

export async function isOneSignalConfigured(): Promise<boolean> {
  if (cachedAppId) return true;
  try {
    const { appId } = await getOneSignalConfig();
    cachedAppId = appId;
    return Boolean(appId);
  } catch {
    return false;
  }
}

const ALLOWED_HOSTS = ["app.cmrs.mx"];

export function isOneSignalAllowedHost(): boolean {
  if (typeof window === "undefined") return false;
  return ALLOWED_HOSTS.includes(window.location.hostname);
}

export async function initOneSignal(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initPromise) return initPromise;

  if (!isOneSignalAllowedHost()) {
    console.warn(
      `[OneSignal] Dominio no permitido (${window.location.hostname}). Las notificaciones push solo funcionan en: ${ALLOWED_HOSTS.join(", ")}`,
    );
    return;
  }

  if (!cachedAppId) {
    const { appId } = await getOneSignalConfig();
    cachedAppId = appId;
  }
  const APP_ID = cachedAppId;
  if (!APP_ID) {
    console.warn("[OneSignal] ONESIGNAL_APP_ID no configurado en backend");
    return;
  }

  console.log("[OneSignal] Cargando SDK con appId:", APP_ID);

  initPromise = (async () => {
    installOneSignalConsoleCapture();
    installOneSignalFetchCapture();
    // Inyecta el SDK script
    if (!document.querySelector('script[data-onesignal-sdk]')) {
      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.async = true;
      s.defer = true;
      s.setAttribute("data-onesignal-sdk", "true");
      s.onload = () => console.log("[OneSignal] SDK loaded");
      s.onerror = () => console.error("[OneSignal] SDK failed to load");
      document.head.appendChild(s);
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    await new Promise<void>((resolve) => {
      window.OneSignalDeferred!.push(async (OneSignal) => {
        try {
          // Exponer globalmente para debugging desde consola
          window.OneSignal = OneSignal;
          await OneSignal.init({
            appId: APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
            notificationClickHandlerMatch: "origin",
            notificationClickHandlerAction: "navigate",
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
            notifyButton: { enable: false },
          });
          OneSignal.Debug?.setLogLevel("trace");
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user?.id && OneSignal.login) await OneSignal.login(auth.user.id);
          initSucceeded = true;
          lastInitError = null;
          console.log("[OneSignal] initialized");
          console.log("[OneSignal] Permission status:", OneSignal.Notifications.permission);
          console.log("[OneSignal] Push subscription id:", OneSignal.User.PushSubscription.id);

          // Escucha cambios de subscription para guardar player_id
          OneSignal.User.PushSubscription.addEventListener("change", async (e) => {
            console.log("[OneSignal] subscription change:", e.current);
            if (e.current.id && e.current.optedIn && e.current.token) {
              await repairOneSignalSubscription();
              await saveOnesignalPlayerId(e.current.id, e.current.token);
            } else if (e.current.id && e.current.optedIn) {
              console.log("[OneSignal] Subscription id presente; esperando token antes de guardar.");
            }
          });
          // Si ya hay player_id activo al init, guárdalo
          const existing = OneSignal.User.PushSubscription.id;
          if (existing && OneSignal.User.PushSubscription.optedIn && OneSignal.User.PushSubscription.token) {
            await repairOneSignalSubscription();
            await saveOnesignalPlayerId(existing, OneSignal.User.PushSubscription.token);
          }
          // Click handler → deep link
          OneSignal.Notifications.addEventListener("click", (e) => {
            const data = e.notification.additionalData as { deep_link?: string } | undefined;
            if (data?.deep_link) window.location.href = data.deep_link;
          });
        } catch (err) {
          lastInitError = errorMessage(err);
          console.error("[OneSignal] init failed:", err);
          // Aun así dejar window.OneSignal disponible para debugging
        } finally {
          resolve();
        }
      });
    });
  })();
  return initPromise;
}

export async function requestPushPermission(): Promise<boolean> {
  if (!isOneSignalAllowedHost()) {
    const msg = `Las notificaciones push solo funcionan en ${ALLOWED_HOSTS.join(", ")}. Abre la app desde ese dominio (instálala como PWA en Android) y vuelve a intentarlo.`;
    console.error("[OneSignal]", msg);
    if (typeof window !== "undefined") alert(msg);
    return false;
  }
  await initOneSignal();
  if (!window.OneSignal) {
    console.error("[OneSignal] window.OneSignal indisponible — revisa configuración Web Push en dashboard OneSignal");
    return false;
  }
  if (!initSucceeded) {
    console.error("[OneSignal] init no completó. Probablemente la app en OneSignal no tiene plataforma Web Push configurada.");
    return false;
  }
  try {
    await window.OneSignal.Notifications.requestPermission();
    const granted = window.OneSignal.Notifications.permission;
    console.log("[OneSignal] Permission after request:", granted);
    if (granted) {
      await window.OneSignal.User.PushSubscription.optIn();
    }
    const pid = await waitForSubscriptionId();
    const token = await waitForPushToken();
    console.log("[OneSignal] Push subscription id:", pid);
    console.log("[OneSignal] Push token present after request:", Boolean(token));
    if (granted && pid && token) {
      await repairOneSignalSubscription();
      await saveOnesignalPlayerId(pid, token);
    }
    return granted && Boolean(pid && token);
  } catch (err) {
    lastPermissionError = errorMessage(err);
    console.error("[OneSignal] requestPermission failed:", err);
    return false;
  }
}

export async function collectOneSignalDiagnostics(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined") return { error: "No browser window" };
  const startedAt = new Date().toISOString();
  await initOneSignal();
  const regs = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations() : [];
  const ready = await Promise.race([
    "serviceWorker" in navigator ? navigator.serviceWorker.ready.then((r) => r).catch(() => null) : Promise.resolve(null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
  const browserPushSub = await ready?.pushManager.getSubscription().catch(() => null);
  const os = window.OneSignal;
  const { data: auth } = await supabase.auth.getUser();
  const { data: prefs } = auth.user?.id
    ? await supabase
        .from("notification_preferences")
        .select("onesignal_player_id, global_notifications_enabled")
        .eq("user_id", auth.user.id)
        .maybeSingle()
    : { data: null };

  return {
    startedAt,
    host: window.location.hostname,
    href: window.location.href,
    secureContext: window.isSecureContext,
    standalone:
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    userAgent: navigator.userAgent,
    notificationPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
    oneSignalAllowedHost: isOneSignalAllowedHost(),
    oneSignalConfigured: Boolean(cachedAppId),
    oneSignalInitSucceeded: initSucceeded,
    lastInitError,
    lastPermissionError,
    oneSignal: os
      ? {
          permission: os.Notifications.permission,
          permissionNative: os.Notifications.permissionNative,
          oneSignalId: os.User.onesignalId ?? null,
          subscriptionId: os.User.PushSubscription.id,
          tokenPresent: Boolean(os.User.PushSubscription.token),
          tokenPrefix: os.User.PushSubscription.token?.slice(0, 18) ?? null,
          optedIn: os.User.PushSubscription.optedIn,
        }
      : null,
    database: {
      userIdPresent: Boolean(auth.user?.id),
      storedSubscriptionId: prefs?.onesignal_player_id ?? null,
      globalNotificationsEnabled: prefs?.global_notifications_enabled ?? null,
      storedMatchesSdk: Boolean(prefs?.onesignal_player_id && prefs.onesignal_player_id === os?.User.PushSubscription.id),
    },
    serviceWorkers: regs.map((r) => ({
      scope: r.scope,
      active: r.active?.scriptURL ?? null,
      activeState: r.active?.state ?? null,
      installing: r.installing?.scriptURL ?? null,
      waiting: r.waiting?.scriptURL ?? null,
    })),
    readyServiceWorker: ready
      ? {
          scope: ready.scope,
          active: ready.active?.scriptURL ?? null,
          pushSubscriptionEndpointHost: browserPushSub ? new URL(browserPushSub.endpoint).hostname : null,
          browserPushSubscriptionPresent: Boolean(browserPushSub),
        }
      : null,
    workerEvents: await readOneSignalWorkerEvents(),
    capturedLogs: window.__pandaOneSignalLogs ?? [],
    capturedOneSignalNetwork: window.__pandaOneSignalNetworkLogs ?? [],
  };
}

export async function getCurrentPlayerId(): Promise<string | null> {
  await initOneSignal();
  return window.OneSignal?.User.PushSubscription.id ?? null;
}

export async function disableOneSignalPush(): Promise<void> {
  await initOneSignal();
  await window.OneSignal?.User.PushSubscription.optOut();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, onesignal_player_id: null, onesignal_push_token: null }, { onConflict: "user_id" });
  if (error) console.error("[OneSignal] Error limpiando player_id:", error);
}

async function waitForSubscriptionId(timeoutMs = 8000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const id = window.OneSignal?.User.PushSubscription.id ?? null;
    if (id) return id;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return window.OneSignal?.User.PushSubscription.id ?? null;
}

async function waitForPushToken(timeoutMs = 10000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = window.OneSignal?.User.PushSubscription.token ?? null;
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return window.OneSignal?.User.PushSubscription.token ?? null;
}

async function repairOneSignalSubscription(): Promise<void> {
  const push = window.OneSignal?.User.PushSubscription;
  if (!push?.id || !push.token || !push.optedIn) return;
  try {
    await push.optIn();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const result = await repairOneSignalSavedSubscription({ data: { subscriptionId: push.id, token: push.token } });
    console.log("[OneSignal] Reparación backend de suscripción:", result);
  } catch (err) {
    console.warn("[OneSignal] No se pudo re-sincronizar la suscripción:", err);
  }
}

function installOneSignalConsoleCapture() {
  if (window.__pandaOneSignalConsoleCapture) return;
  window.__pandaOneSignalConsoleCapture = true;
  window.__pandaOneSignalLogs = window.__pandaOneSignalLogs || [];
  (["log", "warn", "error"] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      const message = args.map((arg) => (typeof arg === "string" ? arg : safeJson(arg))).join(" ");
      if (/onesignal|service worker|pushsubscription|\[sw\]/i.test(message)) {
        window.__pandaOneSignalLogs!.push({ level, at: new Date().toISOString(), message });
        window.__pandaOneSignalLogs = window.__pandaOneSignalLogs!.slice(-120);
      }
      original(...args);
    };
  });
}

function installOneSignalFetchCapture() {
  if (window.__pandaOneSignalFetchCapture) return;
  window.__pandaOneSignalFetchCapture = true;
  window.__pandaOneSignalNetworkLogs = window.__pandaOneSignalNetworkLogs || [];
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const started = Date.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || (input instanceof Request ? input.method : "GET");
    try {
      const response = await originalFetch(input, init);
      if (/onesignal/i.test(url)) {
        const clone = response.clone();
        const body = await clone.text().catch(() => "");
        window.__pandaOneSignalNetworkLogs!.push({
          at: new Date().toISOString(),
          url,
          method,
          status: response.status,
          ok: response.ok,
          body: body.slice(0, 1200),
          ms: Date.now() - started,
        });
        window.__pandaOneSignalNetworkLogs = window.__pandaOneSignalNetworkLogs!.slice(-80);
      }
      return response;
    } catch (err) {
      if (/onesignal/i.test(url)) {
        window.__pandaOneSignalNetworkLogs!.push({
          at: new Date().toISOString(),
          url,
          method,
          error: errorMessage(err),
          ms: Date.now() - started,
        });
        window.__pandaOneSignalNetworkLogs = window.__pandaOneSignalNetworkLogs!.slice(-80);
      }
      throw err;
    }
  };
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function readOneSignalWorkerEvents(): Promise<Array<Record<string, unknown>>> {
  if (typeof indexedDB === "undefined") return [];
  return new Promise((resolve) => {
    const request = indexedDB.open("panda-onesignal-diagnostics", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("events", { keyPath: "id", autoIncrement: true });
    };
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("events", "readonly");
      const store = tx.objectStore("events");
      const getAll = store.getAll();
      getAll.onerror = () => {
        db.close();
        resolve([]);
      };
      getAll.onsuccess = () => {
        db.close();
        resolve((getAll.result as Array<Record<string, unknown>>).slice(-50));
      };
    };
  });
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : safeJson(err);
}

async function saveOnesignalPlayerId(playerId: string, pushToken?: string | null): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    console.warn("[OneSignal] No hay usuario autenticado, no se guarda player_id");
    return;
  }
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        onesignal_player_id: playerId,
        onesignal_push_token: pushToken ?? null,
        global_notifications_enabled: true,
      },
      { onConflict: "user_id" },
    );
  if (error) {
    console.error("[OneSignal] Error guardando player_id:", error);
  } else {
    console.log("[OneSignal] Saved OneSignal player id to Supabase:", playerId);
  }
}
