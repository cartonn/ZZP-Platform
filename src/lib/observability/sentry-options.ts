// Gehardende Sentry-init-opties (pure, testbaar; los van het @sentry/nextjs-pakket dat NIET
// geïnstalleerd is). `report.ts` geeft deze opties door aan `sentry.init(...)` zodra SENTRY_DSN
// gezet is en het pakket beschikbaar is.
//
// Waarom een eigen seam i.p.v. een kaal `{ dsn }`:
//   1. AVG (dit platform verwerkt gevoelige documenten; Sentry is een externe — mogelijk
//      buiten-EER — verwerker). Sentry's default kan request-headers/cookies/IP/gebruikersdata
//      meesturen. We zetten `sendDefaultPii: false` expliciet én scrubben in `beforeSend` alle
//      PII-dragende velden uit het event vóór verzending. Dataminimalisatie by default.
//   2. Deploy-correlatie: `environment` + `release` (commit-SHA) koppelen een fout aan de juiste
//      omgeving/deploy — anders is een Sentry-issue niet te herleiden naar een versie.
//   3. Geen performance-tracing by default (`tracesSampleRate: 0`): errors-only, geen extra
//      dataverzameling/overhead tenzij bewust aangezet.

/** Vorm van de init-opties die aan `@sentry/nextjs`'s `init()` worden meegegeven. */
export interface SentryInitOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate: number;
  sendDefaultPii: false;
  beforeSend: (event: SentryEvent) => SentryEvent;
}

/** Minimale, structurele vorm van een Sentry-event — genoeg om PII veilig te scrubben. */
export interface SentryEvent {
  request?: {
    headers?: Record<string, unknown>;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
    url?: unknown;
    [key: string]: unknown;
  };
  user?: unknown;
  server_name?: unknown;
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Request-headers die veilig zijn om te bewaren (geen auth/PII); al het overige wordt gedropt. */
const SAFE_HEADERS = new Set(["content-type", "content-length", "x-request-id"]);

/**
 * Verwijdert PII-dragende velden uit een Sentry-event vóór verzending naar de externe verwerker.
 * Puur en defensief: kopieert alleen wat veilig is, gooit de rest weg. Nooit throwen — een fout
 * in de scrubber mag reporting niet breken (report.ts vangt bovendien alles af).
 */
export function scrubSentryEvent(event: SentryEvent): SentryEvent {
  if (!event || typeof event !== "object") return event;
  const scrubbed: SentryEvent = { ...event };

  // Gebruikersidentiteit (e-mail/IP/id) nooit meesturen.
  if ("user" in scrubbed) delete scrubbed.user;
  // Servernaam kan een interne hostname/instance-id lekken.
  if ("server_name" in scrubbed) delete scrubbed.server_name;

  if (scrubbed.request && typeof scrubbed.request === "object") {
    const request = { ...scrubbed.request };
    // Cookies (sessietokens!), request-body (form-/JSON-payload met PII) en query-string
    // (kan tokens/zoektermen bevatten) volledig droppen.
    delete request.cookies;
    delete request.data;
    delete request.query_string;

    // Van de URL alleen het pad bewaren (geen querystring/host met PII).
    if (typeof request.url === "string") {
      request.url = safePath(request.url);
    }

    // Headers filteren tot een veilige allowlist (Authorization/Cookie/X-Forwarded-For eruit).
    if (request.headers && typeof request.headers === "object") {
      const safe: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(request.headers)) {
        if (SAFE_HEADERS.has(key.toLowerCase())) safe[key] = value;
      }
      request.headers = safe;
    }
    scrubbed.request = request;
  }

  return scrubbed;
}

/** Behoudt alleen het pad van een (mogelijk absolute) URL; valt bij een parse-fout veilig terug. */
function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    // Relatief pad of onparseerbaar: kap een eventuele querystring/fragment af.
    return url.split(/[?#]/)[0] ?? url;
  }
}

/** Leest en klemt de traces-sample-rate uit env; default 0 (errors-only), geklemd op [0, 1]. */
export function resolveTracesSampleRate(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1, Math.max(0, parsed));
}

/**
 * Bouwt de gehardende init-opties uit de omgeving. `environment` valt terug op NODE_ENV,
 * `release` op de commit-SHA (Railway/CI), en tracing staat standaard uit. Puur t.o.v. de
 * meegegeven env-snapshot (default `process.env`).
 */
export function buildSentryInitOptions(env: NodeJS.ProcessEnv = process.env): SentryInitOptions {
  const environment = firstNonEmpty(env.SENTRY_ENVIRONMENT, env.NODE_ENV) ?? undefined;
  const release =
    firstNonEmpty(env.SENTRY_RELEASE, env.RAILWAY_GIT_COMMIT_SHA, env.COMMIT_SHA) ?? undefined;

  return {
    dsn: firstNonEmpty(env.SENTRY_DSN) ?? undefined,
    environment,
    release,
    tracesSampleRate: resolveTracesSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,
  };
}

/** Geeft de eerste niet-lege (getrimde) waarde terug, of null. */
function firstNonEmpty(...values: (string | undefined)[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}
