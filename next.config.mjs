/** @type {import('next').NextConfig} */

// De Content-Security-Policy staat NIET meer hier: de middleware bouwt hem per request met een
// nonce (src/middleware.ts + src/lib/csp.ts), zodat 'unsafe-inline' voor scripts in productie
// vervalt. De overige security-headers blijven statisch en horen hier.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Zoekmachine-indexering staat standaard UIT (besloten pilot; dit platform is login-gated met
// gevoelige documenten). De X-Robots-Tag is defense-in-depth náást /robots.txt: ook een gelekte
// URL draagt dan "noindex, nofollow". ALLOW_INDEXING=true zet het bij go-live open (header vervalt).
// Bron van waarheid: src/lib/indexing.ts (robotsHeaderValue). Hier één keer bij boot geëvalueerd.
const noindexHeaders =
  process.env.ALLOW_INDEXING === "true"
    ? []
    : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
