/**
 * Apex Service Worker (NFR-UX-010/011).
 *
 * Offline read-only cache + web-push notifications for visibility drops.
 *
 * Strategy:
 *   - navigate:    network-first, fallback to cache
 *   - /api/v1/:    network-only (never serve stale API data)
 *   - /_next/:     stale-while-revalidate (static assets)
 *   - images:      cache-first with 7-day TTL
 *   - push:        show notification, store event in IDB for dashboard badge
 */

const APEX_CACHE_VERSION = "apex-v1";
const STATIC_CACHE = `${APEX_CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${APEX_CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${APEX_CACHE_VERSION}-images`;
const IMAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(APEX_CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin — let the browser handle it
  if (url.origin !== self.location.origin) return;

  // API routes: network-only
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first w/ cache fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images: cache-first w/ TTL
  if (request.destination === "image") {
    event.respondWith(imageCacheFirst(request));
    return;
  }

  // Static assets (/_next/, /icons/, /fonts/): stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/")
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Everything else: runtime cache, stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last-resort offline page fallback
    return new Response(
      `<!doctype html><title>Offline</title><body style="font-family:system-ui;padding:2rem;background:#02030F;color:#fff"><h1>You're offline</h1><p>Apex is not reachable. Reconnect and refresh.</p></body>`,
      { headers: { "Content-Type": "text/html" }, status: 503 },
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    const cachedDate = cached.headers.get("sw-cached-at");
    if (cachedDate && Date.now() - Number(cachedDate) < IMAGE_MAX_AGE_MS) {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone + stamp the cache time
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", String(Date.now()));
      const stamped = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, stamped);
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

// --- Web Push ---

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Apex alert", body: event.data.text() };
  }
  const title = payload.title || "Apex";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: payload.data || {},
    tag: payload.tag || "apex-alert",
    requireInteraction: payload.priority === "critical",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(target));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    }),
  );
});
