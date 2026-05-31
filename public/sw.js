const CACHE_NAME = "placement-readiness-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico"
];

// Install Event - Pre-cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA SW] Pre-caching core shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[PWA SW] Deleting legacy cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Caching Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass dynamic API, dev server hot reloading, and non-GET requests
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("/_next/data/")
  ) {
    return;
  }

  // Cache-First / Stale-While-Revalidate for Webpack Assets & Fonts
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.origin !== self.location.origin
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached copy immediately, fetch fresh copy in background to update cache
            fetch(request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Network-First with Offline Fallback for standard HTML pages
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache the fresh HTML response
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, try browser cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache match and accepting HTML, redirect to offline page
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/offline");
          }
        });
      })
  );
});
