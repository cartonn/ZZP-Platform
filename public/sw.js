// Minimale, hand-geschreven service worker (geen dependency). Doel: een installeerbare PWA met een
// nette offline-pagina. BEWUST conservatief: cache NOOIT geauthenticeerde HTML/data (zou één
// gebruiker de pagina van een ander kunnen tonen). Alleen de offline-fallback + content-gehashte
// statische assets worden gecachet.
const CACHE = "zzp-shell-v3";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(OFFLINE_URL))
      .catch(() => {}) // een mislukte pre-cache mag de installatie niet blokkeren
      .then(() => self.skipWaiting()),
  );
});

// Laatste vangnet als de offline-pagina niet (meer) in de cache zit (bv. na cache-evictie).
const OFFLINE_FALLBACK = new Response(
  "<!doctype html><meta charset=utf-8><title>Offline</title><p style='font:16px system-ui;padding:24px'>Je bent offline. Probeer het later opnieuw.",
  { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigaties: altijd eerst het netwerk (verse, per-gebruiker SSR). Pas bij een netwerkfout valt het
  // terug op de statische offline-pagina. Geen HTML wordt gecachet.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || OFFLINE_FALLBACK.clone())),
    );
    return;
  }

  // Content-gehashte, onveranderlijke assets: cache-first (veilig, niet gebruiker-specifiek).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa/icon/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});

// Web-push: toon de door de server gestuurde notificatie als systeemmelding. De payload is JSON
// (buildPushPayload): { title, body, url, tag }. Defensief geparset zodat een rare payload de SW niet
// sloopt; `url` reist mee in data voor de klik-afhandeling hieronder.
self.addEventListener("push", (event) => {
  let p = {};
  try {
    p = event.data ? event.data.json() : {};
  } catch {
    p = {};
  }
  const title = p.title || "ZZP Platform";
  const options = {
    body: p.body || "",
    tag: p.tag || undefined,
    icon: "/pwa/icon/192.png",
    badge: "/pwa/icon/192.png",
    data: { url: typeof p.url === "string" && p.url.startsWith("/") ? p.url : "/notificaties" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik op de melding: focus een bestaand venster (en navigeer het) of open een nieuw venster op de
// doel-URL. Same-origin afgedwongen via een relatief pad.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notificaties";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
