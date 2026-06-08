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
      .then(() => self.skipWaiting()),
  );
});

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
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
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
