const CACHE_NAME = "ytt-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal network-passthrough fetch handler — required by browsers for install-prompt eligibility.
// Only intercept GET: Safari's service worker implementation is unreliable at
// re-streaming POST/PUT bodies through event.respondWith(fetch(event.request)),
// and can silently truncate large multipart uploads — exactly the "Unexpected
// end of form" failures seen on real iOS devices but never reproducible from
// a desktop browser (which isn't PWA-installed with an active controlling
// worker the same way). Uploads have no business being intercepted anyway —
// let the browser handle them natively.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Yesterday, Today, Tomorrow", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Yesterday, Today, Tomorrow", {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
