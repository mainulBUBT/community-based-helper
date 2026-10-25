const STATIC = "dordam-static-v3";
const PAGES = "dordam-pages-v3";
const LIMITS = { [STATIC]: 200, [PAGES]: 80 };
const SHELL = ["/", "/search/", "/saved/", "/offline/"];
const cacheable = (response) => response.ok && response.type === "basic";

async function put(name, request, response) {
  const cache = await caches.open(name);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - LIMITS[name])).map((key) => cache.delete(key)));
}

function networkFirst(request, fallback) {
  return fetch(request)
    .then((response) => {
      if (cacheable(response)) put(PAGES, request, response.clone());
      return response;
    })
    .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit ?? fallback()));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !(key in LIMITS)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/admin")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (cacheable(response)) put(STATIC, request, response.clone());
            return response;
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/data/catalog/")) {
    event.respondWith(networkFirst(request, () => Response.error()));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, () => caches.match("/offline/")));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {}
  if (!data.title) return;
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url;
  const target = new URL(typeof path === "string" && /^\/(?!\/)/.test(path) ? path : "/saved/", location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url === target);
      return open ? open.focus() : self.clients.openWindow(target);
    }),
  );
});
