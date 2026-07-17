// Minimal service worker for Panda's LIFE OS
// IMPORTANT: No caching strategy — only handles push notifications.
// This avoids the "stale content" problem in iframed previews.

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler — required for Chrome PWA installability.
// Pure pass-through, no caching (avoids stale content issues).
self.addEventListener("fetch", () => {
  return;
});

// Web Push: receive a push payload from the server and show a notification
self.addEventListener("push", (event) => {
  let data = { 
    title: "Panda OS", 
    body: "Tienes una nueva notificación", 
    url: "/",
    tag: "panda-os"
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag,
    renotify: true, // Re-vibrate/notify even if same tag
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: "open", title: "Abrir app" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// When the user clicks the notification, focus an open tab or open a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  // Use a protocol-relative URL if needed
  const targetUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Try to find an existing window and focus it
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // If no matching window found, but there's a window we can navigate
      for (const client of clients) {
        if ("focus" in client && "navigate" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
