const CACHE_NAME = "batcoach-pwa-v2.0";
const STATIC_ASSETS = [
  "/",
  "/coach",
  "/manifest.json",
  "/bat-icon.jpg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png"
];

// Install Event - Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[ServiceWorker] Pre-caching non-fatal issue:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first with cache fallback
self.addEventListener("fetch", (event) => {
  // Ignore non-GET, WebSocket or API calls
  if (event.request.method !== "GET" || event.request.url.startsWith("ws:") || event.request.url.startsWith("wss:") || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache valid responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
