// IMPORTANT: Load OneSignal SDK FIRST so its push/notificationclick handlers
// register before any of our diagnostic listeners. Registering a custom `push`
// handler before OneSignal's import can prevent the SDK from showing the
// notification on some Android/Chrome versions.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const PANDA_ONESIGNAL_DB = "panda-onesignal-diagnostics";
const PANDA_ONESIGNAL_STORE = "events";

function writePandaOneSignalWorkerLog(entry) {
  try {
    const request = indexedDB.open(PANDA_ONESIGNAL_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PANDA_ONESIGNAL_STORE, { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(PANDA_ONESIGNAL_STORE, "readwrite");
      tx.objectStore(PANDA_ONESIGNAL_STORE).add({ at: new Date().toISOString(), ...entry });
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    };
  } catch (_) {
    // Diagnostic logging must never block OneSignal's own worker.
  }
}

// Diagnostic-only listeners. We do NOT register a `push` listener here because
// that competes with OneSignal's SDK handler and can prevent the notification
// from being displayed on Android Chrome.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(Promise.resolve(writePandaOneSignalWorkerLog({ type: "pushsubscriptionchange" })));
});

self.addEventListener("notificationclick", (event) => {
  writePandaOneSignalWorkerLog({ type: "notificationclick", title: event.notification?.title || null });
});

self.addEventListener("error", (event) => {
  writePandaOneSignalWorkerLog({ type: "error", message: event.message || null, filename: event.filename || null });
});

self.addEventListener("unhandledrejection", (event) => {
  writePandaOneSignalWorkerLog({ type: "unhandledrejection", reason: event.reason ? String(event.reason) : null });
});
