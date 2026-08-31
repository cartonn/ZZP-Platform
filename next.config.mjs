/** @type {import('next').NextConfig} */

// De Content-Security-Policy staat NIET meer hier: de middleware bouwt hem per request met een
// nonce (src/middleware.ts + src/lib/csp.ts), zodat 'unsafe-inline' voor scripts in productie
// vervalt. De overige security-headers blijven statisch en horen hier.
// Permissions-Policy: expliciet elke krachtige browserfunctie ontzeggen die dit platform niet
// gebruikt, zodat een (hypothetische) XSS of een ingebedde iframe die functies niet kan aanspreken.
// `()` = volledig uit (ook voor de eigen origin); `(self)` = alleen onze eigen origin. We staan
// alleen fullscreen + clipboard-write toe (self) voor legitieme UX (deel-links kopiëren, PDF-print).
// `interest-cohort=()` en `browsing-topics=()` zetten Google's FLoC/Topics-tracking uit (privacy).
const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=()",
  "browsing-topics=()",
  "camera=()",
  "clipboard-write=(self)",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "interest-cohort=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Cross-origin-isolatie (defense-in-depth voor een login-gated app met gevoelige documenten):
  // COOP severt de opener-relatie met cross-origin vensters (beschermt tegen cross-window-lekken /
  // reverse-tabnabbing). De betaalproviders (Mollie/Stripe) gebruiken full-page redirects, geen
  // popup-handle, dus `same-origin` breekt geen flow. CORP verhindert dat een andere origin ónze
  // resources no-cors inlaadt; `same-origin` past bij dit self-contained platform (CSP default-src
  // 'self', geen externe hosts). De gevoelige bestand-routes zetten CORP bovendien zelf (belt-and-
  // suspenders) via src/lib/security/resource-headers.ts.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Origin-Agent-Cluster vraagt de browser dit origin in een eigen agent-cluster (proces/geheugen)
  // te isoleren — defense-in-depth voor een login-gated app met gevoelige documenten, complementair
  // aan COOP/CORP. `?1` = structured-header boolean true. Moet consistent op élke response van dit
  // origin staan (de browser beslist het bij de eerste document-load en cachet het per origin),
  // vandaar de globale /:path*-regel hieronder.
  { key: "Origin-Agent-Cluster", value: "?1" },
  // X-Permitted-Cross-Domain-Policies: geen Adobe cross-domain policy files (Flash/Acrobat mogen
  // geen cross-origin data van dit domein laden). OWASP Secure Headers Project. Dit platform serveert
  // geen crossdomain.xml; `none` maakt dat expliciet en dicht een legacy-databestemming.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // X-DNS-Prefetch-Control off: geen speculatieve DNS-prefetch van links. Kleine privacy-/lek-
  // reductie voor een besloten platform (voorkomt dat het bezoek aan een gedeelde/externe host
  // via DNS zichtbaar wordt vóór de gebruiker er bewust naartoe navigeert).
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

// Zoekmachine-indexering staat standaard UIT (besloten pilot; dit platform is login-gated met
// gevoelige documenten). De X-Robots-Tag is defense-in-depth náást /robots.txt: ook een gelekte
// URL draagt dan "noindex, nofollow". ALLOW_INDEXING=true zet het bij go-live open (header vervalt).
// Bron van waarheid: src/lib/indexing.ts (robotsHeaderValue). Hier één keer bij boot geëvalueerd.
const noindexHeaders =
  process.env.ALLOW_INDEXING === "true"
    ? []
    : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

// Server-action body-limiet. Uploads (documenten/certificaten/bedrijfslogo) lopen via server
// actions ("use server" + formData, zie src/app/(protected)/{documenten,certificaten,bedrijf}/
// actions.ts). Next.js kapt de request-body van een server action standaard op 1 MB af — kleiner
// dan onze upload-ceiling (MAX_UPLOAD_BYTES = 10 MB in src/lib/services/storage.ts). Zonder deze
// override wordt een reëel gescande VOG-/diploma-PDF (2–5 MB) stil geweigerd vóór validateUpload
// draait: de kernfunctie (veilige documentupload) breekt op echte bestanden, met een generieke
// "Body exceeded 1 MB limit"-fout i.p.v. onze nette UploadValidationError.
// We tillen de limiet naar de upload-ceiling (10 MB) + ruime headroom voor multipart-boundaries en
// meegestuurde form-velden. Bron van waarheid voor de ceiling blijft MAX_UPLOAD_BYTES;
// src/lib/services/upload-body-limit.test.ts bewaakt de drift tussen beide.
const SERVER_ACTION_BODY_SIZE_LIMIT = "12mb";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...securityHeaders, ...noindexHeaders] },
      // De service worker zelf nooit cachen: zo komt een nieuwe versie altijd direct binnen.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
