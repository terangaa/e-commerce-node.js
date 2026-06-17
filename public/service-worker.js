const CACHE_NAME = "jimshop-v2";

const STATIC_CACHE = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/css/site.css",
  "/css/modern.css",
  "/css/advanced-effects.css"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH STRATEGY
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // HTML → network first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // CSS/JS/Images → cache first
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        }).catch(() => cached)
      );
    })
  );
});