// Rate-limiter abstractie (fixed-window). Pluggbare store, dezelfde driver-aanpak
// als storage.ts: lokale MemoryRateLimitStore als default, en een gedeelde/durable
// store (Upstash Redis REST) achter dezelfde RateLimitStore-interface voor horizontale
// schaling — net zoals de S3-driver achter StorageDriver zit (MENSENWERK §0b H-2).
//
// De store is async: de in-memory variant lost direct op, de Upstash-variant doet een
// HTTP-round-trip. Alle call-sites draaien al in async-context (server actions, route
// handlers, NextAuth authorize) en awaiten het resultaat.

import { logger } from "@/lib/observability/logger";
import { fetchWithTimeout, resolveHttpTimeoutMs } from "@/lib/services/fetch-timeout";

/** Resultaat van een enkelvoudige rate-limit-check. */
export interface RateLimitResult {
  /** false zodra het aantal verzoeken de limiet overschrijdt binnen het venster. */
  allowed: boolean;
  /** max(0, limit - count) ná deze poging. */
  remaining: number;
  /** 0 wanneer allowed; anders milliseconden tot het venster reset. */
  retryAfterMs: number;
}

/** Interface die elke store moet implementeren. */
export interface RateLimitStore {
  /**
   * Registreer één verzoek voor de gegeven key en geef het resultaat terug.
   * @param key        Identifier (bv. IP-adres of user-id).
   * @param limit      Maximum toegestane verzoeken per venster.
   * @param windowMs   Venstergrootte in milliseconden.
   * @param now        Huidige tijdstempel in milliseconden (injecteerbaar voor tests).
   *                   De Upstash-store negeert dit en gebruikt de Redis-TTL.
   */
  consume(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitResult>;

  /** Verwijdert de teller voor een key (bv. na succesvolle login). */
  reset(key: string): Promise<void>;
}

/** Interne state per key voor de in-memory store. */
interface WindowEntry {
  windowStart: number;
  count: number;
}

/**
 * Drempelwaarde: als de map meer dan dit aantal entries bevat, worden verlopen
 * entries opgeruimd vóór de nieuwe entry wordt geschreven. Dit begrenst de
 * geheugengroei bij veel unieke keys zonder dat elke consume een volledige sweep doet.
 */
const SWEEP_THRESHOLD = 1000;

/**
 * In-memory implementatie van RateLimitStore (fixed-window algoritme).
 *
 * Geschikt voor single-process gebruik (Next.js Node-server, lokaal). Voor
 * multi-instance / horizontale schaling: zet RATE_LIMIT_STORE=upstash (zie
 * UpstashRateLimitStore) — de rest van de code verandert niet.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, WindowEntry>();

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<RateLimitResult> {
    const existing = this.entries.get(key);

    let entry: WindowEntry;

    if (!existing || now >= existing.windowStart + windowMs) {
      // Geen entry of venster is verlopen: begin een nieuw venster.
      entry = { windowStart: now, count: 1 };
      // Ruim verlopen entries op als de map de drempel overschrijdt.
      if (this.entries.size >= SWEEP_THRESHOLD) {
        this.sweep(now, windowMs);
      }
      this.entries.set(key, entry);
    } else {
      // Venster loopt nog: verhoog de teller.
      existing.count += 1;
      entry = existing;
    }

    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);
    const retryAfterMs = allowed ? 0 : entry.windowStart + windowMs - now;

    return { allowed, remaining, retryAfterMs };
  }

  async reset(key: string): Promise<void> {
    this.entries.delete(key);
  }

  /**
   * Verwijdert alle verlopen entries uit de map. Wordt alleen aangeroepen wanneer
   * de map de SWEEP_THRESHOLD overschrijdt om onnodige iteraties te vermijden.
   */
  private sweep(now: number, windowMs: number): void {
    for (const [k, v] of this.entries) {
      if (now >= v.windowStart + windowMs) {
        this.entries.delete(k);
      }
    }
  }
}

/**
 * Gedeelde, durable RateLimitStore op basis van de Upstash Redis REST-API. Activeer met
 * RATE_LIMIT_STORE=upstash + UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. Geen extra
 * SDK-dependency: we praten rechtstreeks met de REST-API via fetch, zodat de bundel licht blijft
 * (zelfde aanpak als de Mollie-provider).
 *
 * Fixed-window, atomair via één pipeline-round-trip:
 *   INCR key            → teller binnen het venster
 *   PEXPIRE key ms NX   → zet de TTL alleen bij de eerste hit (venster begint)
 *   PTTL key            → resterende venstertijd voor retryAfterMs
 *
 * Fail-open: valt de Upstash-call uit (netwerk/Redis), dan staan we het verzoek toe en loggen we
 * de fout. Een transiënte Redis-storing mag login/registratie niet platleggen — beschikbaarheid
 * boven een tijdelijk zwakkere limiet (architectuurprincipe: de app blijft draaien).
 */
export class UpstashRateLimitStore implements RateLimitStore {
  private readonly base: string;

  constructor(
    url: string,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
    // Korte deadline: rate-limiting mag de request niet lang ophouden. Een trage/hangende
    // Upstash-call breekt af en fail-opent (zie consume) i.p.v. login/registratie te blokkeren.
    private readonly timeoutMs: number = resolveHttpTimeoutMs(
      process.env.RATE_LIMIT_HTTP_TIMEOUT_MS,
      2500,
    ),
  ) {
    // Trailing slash weghalen zodat `${base}/pipeline` altijd klopt.
    this.base = url.replace(/\/+$/, "");
  }

  /** Namespacet de key in Redis zodat hij niet botst met ander gebruik van dezelfde Redis. */
  private redisKey(key: string): string {
    return `rl:${key}`;
  }

  private async pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    const res = await fetchWithTimeout(
      `${this.base}/pipeline`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Upstash" },
    );
    if (!res.ok) {
      throw new Error(`Upstash: pipeline mislukte (status ${res.status}).`);
    }
    const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    return json.map((entry) => {
      if (entry && typeof entry === "object" && "error" in entry && entry.error) {
        throw new Error(`Upstash: commando-fout (${entry.error}).`);
      }
      return entry?.result;
    });
  }

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    _now: number,
  ): Promise<RateLimitResult> {
    const rkey = this.redisKey(key);
    try {
      const [count, , ttl] = await this.pipeline([
        ["INCR", rkey],
        ["PEXPIRE", rkey, windowMs, "NX"],
        ["PTTL", rkey],
      ]);

      const used = Number(count);
      const ttlMs = Number(ttl);
      const allowed = used <= limit;
      const remaining = Math.max(0, limit - used);
      // PTTL geeft -1 (geen TTL) of -2 (geen key); val dan terug op het volledige venster.
      const retryAfterMs = allowed ? 0 : ttlMs > 0 ? ttlMs : windowMs;

      // Dead-man's-switch: registreer dat het gedeelde kanaal onze operatie accepteerde (gecoalesceerd).
      await this.recordDelivery(true);
      return { allowed, remaining, retryAfterMs };
    } catch (err) {
      logger.error("rate-limit: Upstash consume mislukt — fail-open", {
        scope: "rate-limit",
        error: err instanceof Error ? err.message : String(err),
      });
      // Dead-man's-switch: registreer de mislukking (altijd), zodat een AANHOUDENDE storing zichtbaar wordt
      // — de fail-open hieronder zet de rate-limiting anders stil uit zonder dat iets dat toont.
      await this.recordDelivery(false);
      // Fail-open: beschikbaarheid boven een tijdelijk zwakkere limiet.
      return { allowed: true, remaining: limit, retryAfterMs: 0 };
    }
  }

  /**
   * Registreert de uitkomst van de laatste consume tegen de gedeelde store in de aflever-heartbeat.
   * Lazy import (houdt rate-limit.ts vrij van een harde observability-import op modulepad-niveau en
   * voorkomt import-cycles: de heartbeat trekt prisma + report mee). Best-effort: de heartbeat-schrijf
   * is zelf fail-open, maar een falende dynamic import mag consume nooit alsnog laten falen.
   */
  private async recordDelivery(ok: boolean): Promise<void> {
    try {
      const { recordRateLimitDeliverySuccess, recordRateLimitDeliveryFailure } =
        await import("@/lib/observability/ratelimit-delivery-heartbeat");
      if (ok) {
        await recordRateLimitDeliverySuccess("upstash");
      } else {
        await recordRateLimitDeliveryFailure("upstash");
      }
    } catch {
      // Observability mag het kernpad nooit breken.
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.pipeline([["DEL", this.redisKey(key)]]);
    } catch (err) {
      logger.error("rate-limit: Upstash reset mislukt", {
        scope: "rate-limit",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Voert een rauwe pipeline uit voor de admin-connectiviteitszelftest (/admin/systeemstatus).
   * Anders dan `consume`/`reset` **surfacet** dit fouten (geen fail-open): de zelftest wil een
   * kapotte Upstash-configuratie juist zien, niet stil doorlaten. De caller geeft de volledige
   * (al genamespacete) key mee; deze methode raakt géén echte rate-limit-tellers.
   */
  async runProbeCommands(commands: (string | number)[][]): Promise<unknown[]> {
    return this.pipeline(commands);
  }
}

/**
 * Bouwt de geconfigureerde store: Upstash bij RATE_LIMIT_STORE=upstash (met REST-URL + token),
 * anders de veilige in-memory default. De env-validatie (src/lib/env.ts) eist de Upstash-secrets
 * af zodra de driver op "upstash" staat; deze fallback is defensief.
 */
export function createRateLimitStore(): RateLimitStore {
  if (process.env.RATE_LIMIT_STORE === "upstash") {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      return new UpstashRateLimitStore(url, token);
    }
  }
  return new MemoryRateLimitStore();
}

/**
 * Dunne wrapper rondom een RateLimitStore. Koppelt limit + windowMs (en een vaste namespace) aan
 * een store zodat call-sites alleen een key (en optioneel now) hoeven mee te geven. De namespace
 * voorkomt dat verschillende limiters met dezelfde key-vorm (bv. een IP) op elkaars teller botsen
 * in een gedeelde store.
 */
export class RateLimiter {
  constructor(
    private readonly store: RateLimitStore,
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly keyPrefix: string = "",
  ) {}

  /**
   * Registreer één verzoek voor de gegeven key.
   * @param key  Identifier (bv. IP, user-id).
   * @param now  Tijdstempel in ms; default Date.now(). Injecteerbaar voor tests.
   */
  check(key: string, now: number = Date.now()): Promise<RateLimitResult> {
    return this.store.consume(this.keyPrefix + key, this.limit, this.windowMs, now);
  }

  /** Verwijdert de teller voor een key in de onderliggende store. */
  reset(key: string): Promise<void> {
    return this.store.reset(this.keyPrefix + key);
  }
}

// ─── Geconfigureerde singletons ────────────────────────────────────────────────
// Store-keuze via RATE_LIMIT_STORE: per-proces in-memory (default) of gedeeld via
// Upstash Redis REST (horizontale schaling). Elke limiter krijgt een eigen namespace
// zodat tellers van verschillende limiters elkaar nooit raken in een gedeelde store.

/**
 * Drempel uit env met veilige fallback. Hiermee kan een specifieke omgeving de limiet
 * verhogen — bijvoorbeeld de e2e-suite, waar de héle suite vanaf één IP draait en de
 * productie-defaults onterecht zouden afgaan — zonder de productiedrempel te raken.
 * Ongeldige of ontbrekende waarden vallen terug op de veilige default.
 */
function limitFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Maximaal LOGIN_RATE_LIMIT (default 5) inlogpogingen per IP+e-mail per 15 minuten. */
export const loginRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("LOGIN_RATE_LIMIT", 5),
  15 * 60_000,
  "login:",
);

/** Maximaal REGISTER_RATE_LIMIT (default 5) registraties per IP per uur. */
export const registerRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("REGISTER_RATE_LIMIT", 5),
  60 * 60_000,
  "register:",
);

/**
 * Maximaal RESET_RATE_LIMIT (default 3) wachtwoord-reset-aanvragen per sleutel (IP én e-mail) per
 * uur. Beperkt mail-bombing en CPU-amplificatie (token-hashing) zonder de enumeratiebescherming
 * (uniforme respons) te doorbreken.
 */
export const resetRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("RESET_RATE_LIMIT", 3),
  60 * 60_000,
  "reset:",
);

/**
 * Maximaal CREDENTIAL_VERIFY_RATE_LIMIT (default 10) zelf-verificatiepogingen (DUO/BIG) per ZZP'er
 * per uur. De zelf-verificatie zet een credential direct op VERIFIED zonder admin; zonder limiet is
 * het gokken van een (publiek opzoekbaar) BIG-nummer of DUO-code geautomatiseerd brute-forcebaar.
 */
export const credentialVerifyRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("CREDENTIAL_VERIFY_RATE_LIMIT", 10),
  60 * 60_000,
  "credverify:",
);

/**
 * Maximaal MESSAGE_RATE_LIMIT (default 30) berichten per gebruiker per 5 minuten. Spam-rem op
 * het 1-op-1-kanaal; ruim boven normaal gebruik, maar stopt scripts en plak-loops.
 */
export const messageRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("MESSAGE_RATE_LIMIT", 30),
  5 * 60_000,
  "message:",
);

/**
 * Maximaal APPLICATION_RATE_LIMIT (default 10) reacties op opdrachten per ZZP'er per uur.
 * Begrenst massa-reageren (spam richting opdrachtgevers) zonder serieus gebruik te hinderen.
 */
export const applicationRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("APPLICATION_RATE_LIMIT", 10),
  60 * 60_000,
  "application:",
);

/**
 * Maximaal UPLOAD_RATE_LIMIT (default 20) document-uploads per gebruiker per uur. Begrenst
 * storage-vulling en misbruik van de upload-pijplijn; validatie per bestand blijft leidend.
 */
export const uploadRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("UPLOAD_RATE_LIMIT", 20),
  60 * 60_000,
  "upload:",
);

/**
 * Maximaal EXPORT_RATE_LIMIT (default 5) AVG-exports per gebruiker per uur. De export bundelt
 * veel queries in één verzoek; de limiet voorkomt CPU-amplificatie via een scripted loop.
 */
export const exportRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("EXPORT_RATE_LIMIT", 5),
  60 * 60_000,
  "export:",
);

/**
 * Maximaal DOCUMENT_PDF_RATE_LIMIT (default 60) per-document downloads (factuur-/prestatie-/
 * platformfactuur-PDF's en de compliance-/DBA-dossiers) per gebruiker per uur. Deze routes doen
 * per verzoek een DB-join + on-demand PDF/dossier-generatie; de rem stopt een scripted loop die de
 * server CPU-matig belast (defense-in-depth — de ownership-/authz-poort blijft de bron van toegang).
 * Ruim boven normaal gebruik (een boekhouder/admin die veel documenten na elkaar inziet).
 */
export const documentPdfRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("DOCUMENT_PDF_RATE_LIMIT", 60),
  60 * 60_000,
  "docpdf:",
);

/**
 * Maximaal DOCUMENT_DOWNLOAD_RATE_LIMIT (default 240) downloads van een privé-document
 * (/api/documents/[id]) per gebruiker per uur. Dit is de énige route die de rauwe bytes van de
 * meest gevoelige bestanden (VOG, diploma, ID, verzekering) serveert; elke hit doet een DB-lookup
 * + storage-read + auditregel. De rem stopt een scripted enumeratie-loop over `Document.id` (een
 * cuid, niet volledig willekeurig) en de bijbehorende storage-kosten/auditgroei, terwijl de
 * ownership-check (`canAccessDocument`) leidend blijft. Ruimer dan de PDF-rem omdat de
 * inline-preview in de verificatiequeue legitiem vaker downloadt (security-review: parity met de
 * dossier-/PDF-routes die deze rem al hadden).
 */
export const documentDownloadRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("DOCUMENT_DOWNLOAD_RATE_LIMIT", 240),
  60 * 60_000,
  "docdl:",
);

/**
 * Maximaal DOSSIER_VIEW_RATE_LIMIT (default 30) weergaven van het publieke vertrouwensdossier
 * per IP per 5 minuten. De token-entropie is hoog (HMAC-SHA256), maar de route is sessieloos en
 * elke poging kost een DB-query — deze rem maakt brute-force/scraping onaantrekkelijk
 * (security-review M-4).
 */
export const dossierViewRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("DOSSIER_VIEW_RATE_LIMIT", 30),
  5 * 60_000,
  "dossier:",
);

/**
 * Maximaal AGENDA_FEED_RATE_LIMIT (default 30) opvragingen van de publieke agenda-feed
 * (/api/agenda/feed.ics) per 5 minuten. De route is sessieloos (bearer-token in de querystring),
 * net als het vertrouwensdossier, en elke poging kost DB-I/O — deze rem maakt brute-force/scraping
 * van de feed-token-ruimte onaantrekkelijk (security-review M-4, parity met dossierViewRateLimiter).
 * De call-site keyt op IP én op de `u`-parameter (gebruiker-id uit de URL).
 */
export const agendaFeedRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("AGENDA_FEED_RATE_LIMIT", 30),
  5 * 60_000,
  "agenda:",
);

/**
 * Maximaal INVITE_RATE_LIMIT (default 20) directe uitnodigingen per opdrachtgever per uur.
 * Begrenst uitnodigings-spam (massa-notificaties richting ZZP'ers) zonder serieus gebruik te
 * hinderen; de eligibility-/ownership-poort blijft de bron van toegang.
 */
export const inviteRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("INVITE_RATE_LIMIT", 20),
  60 * 60_000,
  "invite:",
);

/**
 * Maximaal INVOICE_CREATE_RATE_LIMIT (default 30) losse-factuur-aanmaakacties per ZZP'er per uur. De
 * `createInvoice`-mutatie is de zwaarste geldstroom-actie op dit oppervlak: per verzoek een
 * factuurnummer-telling, een interactieve transactie met TOCTOU-hercheck én een multi-row insert
 * (tot `MAX_INVOICE_LINES` regels), plus een retry-lus bij nummerbotsing. Het regelplafond begrenst
 * de kosten binnen één verzoek; deze rem begrenst het aantal verzoeken, zodat een scripted loop de
 * server niet CPU-/DB-matig kan belasten (CWE-400, defense-in-depth). Ruim boven normaal gebruik —
 * niemand maakt legitiem 30 losse facturen per uur — maar stopt een geautomatiseerde flood. Parity
 * met de andere geldstroom-/mutatie-remmen (export/document-pdf/invite). De factureerbaarheids-/
 * ownership-poort blijft de bron van toegang.
 */
export const invoiceCreateRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("INVOICE_CREATE_RATE_LIMIT", 30),
  60 * 60_000,
  "invoicecreate:",
);

/**
 * Maximaal NO_SHOW_REPORT_RATE_LIMIT (default 10) no-show-registraties per melder (opdrachtgever/
 * bemiddelaar) per uur. Een no-show-melding is een moderatie-gevoelige mutatie: ze schrijft een
 * permanente `NoShowReport`, stuurt de ZZP'er een notificatie met vrije-tekst-reden en voedt de
 * uitschrijf-wachtrij op /admin/no-shows. Zonder rem kan een kwaadwillende/gecompromitteerde melder
 * herhaalde POST's scripten → notificatie-/DB-/audit-flood + harassment + druk op de moderatiewachtrij.
 * Ruim boven normaal gebruik (een melder registreert hooguit een handvol no-shows per dag), maar stopt
 * een geautomatiseerde flood. Parity met de andere UGC-mutatie-remmen (invite/message/application).
 */
export const noShowReportRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("NO_SHOW_REPORT_RATE_LIMIT", 10),
  60 * 60_000,
  "noshowreport:",
);

/**
 * Maximaal IDEA_ENGAGEMENT_RATE_LIMIT (default 40) idee-mutaties per gebruiker per 5 minuten. De
 * ideeën-hub is het enige open UGC-oppervlak: `createIdea`, `toggleVote` en `addComment` staan open
 * voor élke ingelogde gebruiker (FREELANCER/CLIENT), schrijven vrije tekst en doen notificatie-fan-out
 * (een reactie notificeert de indiener, een idee schrijft een audit + zelf-stem). Zonder rem kan een
 * authenticated/gecompromitteerd account herhaalde POST's scripten → notificatie-/DB-/audit-flood +
 * gerichte harassment van een indiener. Eén gedeelde bucket over de drie engagement-acties, ruim boven
 * normaal gebruik (niemand plaatst legitiem 40 ideeën/stemmen/reacties in 5 minuten) maar het stopt een
 * geautomatiseerde flood. Parity met de andere UGC-mutatie-remmen (message/application/invite/noshow);
 * de auth-/Zod-poort blijft leidend, dit is een extra volume-rem (defense-in-depth).
 */
export const ideaEngagementRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("IDEA_ENGAGEMENT_RATE_LIMIT", 40),
  5 * 60_000,
  "idea:",
);

/**
 * Maximaal CSP_REPORT_RATE_LIMIT (default 30) CSP-violatie-rapporten per IP per minuut. De
 * rapport-route (/api/csp-report) is publiek en ongeauthenticeerd (de browser stuurt de ping);
 * een defecte pagina of een kwaadwillende kan er anders een log-/CPU-flood mee veroorzaken. Ruim
 * boven een normale pagina-lading (één document rapporteert hooguit een handvol violaties).
 */
export const cspReportRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("CSP_REPORT_RATE_LIMIT", 30),
  60_000,
  "cspreport:",
);

/**
 * Maximaal CLIENT_ERROR_RATE_LIMIT (default 20) client-foutrapporten per IP per minuut. De
 * ingest-route (/api/client-error) is publiek en ongeauthenticeerd (de browser stuurt de ping
 * vanuit een error-boundary); een fout-loop op de client of een kwaadwillende kan er anders een
 * log-/CPU-flood mee veroorzaken. Ruim boven een normale sessie (een crash rapporteert één keer).
 */
export const clientErrorRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("CLIENT_ERROR_RATE_LIMIT", 20),
  60_000,
  "clienterror:",
);

/**
 * Maximaal BILLING_WEBHOOK_RATE_LIMIT (default 60) betaal-webhook-pings per IP per minuut. De
 * route (/api/billing/webhook) is publiek en ongeauthenticeerd — de betaalprovider (Mollie/Stripe)
 * pingt zonder sessie. Zonder rem is het een outbound-oracle/kostenamplificatie: elke ping met een
 * geldige `providerRef` triggert een uitgaande `paymentStatus`-call naar de provider (en per ping
 * een DB-lookup). De drempel ligt ruim boven een normale provider-burst (retries lopen met backoff),
 * maar begrenst een geautomatiseerde flood. De call-site geeft bij overschrijding bewust 200 terug
 * (geen 429): een 429 zou de provider tot een retry-storm aanzetten en throttle-info lekken.
 */
export const billingWebhookRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("BILLING_WEBHOOK_RATE_LIMIT", 60),
  60_000,
  "billingwebhook:",
);

/**
 * Maximaal STORAGE_SELFTEST_RATE_LIMIT (default 6) opslag-zelftests per beheerder per 5 minuten. De
 * admin-actie (/admin/systeemstatus) doet een echte round-trip tegen de storage-driver (put/get/
 * delete) — bij S3 zijn dat betaalde API-calls tegen de bucket. De rem houdt een per ongeluk
 * herhaalde klik of een script binnen de perken zonder de normale, incidentele controle te hinderen.
 */
export const storageSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("STORAGE_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "storageselftest:",
);

/**
 * Maximaal MAIL_SELFTEST_RATE_LIMIT (default 4) e-mail-zelftests per beheerder per 5 minuten. De
 * admin-actie (/admin/systeemstatus) stuurt een echte mail via de provider (Resend/SMTP kost geld/
 * quota, en herhaalde verzending naar hetzelfde adres oogt als spam). Strakker dan de opslag-rem
 * omdat een verzonden mail een extern zichtbaar neveneffect heeft.
 */
export const mailSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("MAIL_SELFTEST_RATE_LIMIT", 4),
  5 * 60_000,
  "mailselftest:",
);

/**
 * Maximaal RATELIMIT_SELFTEST_RATE_LIMIT (default 6) rate-limit-store-zelftests per beheerder per 5
 * minuten. De admin-actie (/admin/systeemstatus) doet een echte round-trip (INCR/PEXPIRE/PTTL/DEL/
 * EXISTS) tegen de geconfigureerde Upstash-store. De rem houdt een per ongeluk herhaalde klik of een
 * script binnen de perken zonder de normale, incidentele controle te hinderen (parity met de
 * opslag-zelftest). Deze limiter draait bewust op de in-memory store (`MemoryRateLimitStore`) zodat
 * hij ook werkt terwijl de Upstash-verbinding juist wordt getest — anders zou een kapotte Upstash de
 * eigen zelftest-rem fail-openen of laten hangen.
 */
export const rateLimitSelfTestRateLimiter = new RateLimiter(
  new MemoryRateLimitStore(),
  limitFromEnv("RATELIMIT_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "ratelimitselftest:",
);

/**
 * Maximaal VERIFIER_SELFTEST_RATE_LIMIT (default 6) verificatie-adapter-zelftests per beheerder per 5
 * minuten. De admin-actie (/admin/systeemstatus) doet een echte round-trip (synthetische probe) tegen
 * de geconfigureerde DUO/BIG/iDIN-endpoints. De rem houdt een per ongeluk herhaalde klik of een script
 * binnen de perken zonder de normale, incidentele controle te hinderen (parity met de opslag-zelftest).
 */
export const verifierSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("VERIFIER_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "verifierselftest:",
);

/**
 * Maximaal BILLING_SELFTEST_RATE_LIMIT (default 6) betaalprovider-zelftests per beheerder per 5
 * minuten. De admin-actie (/admin/systeemstatus) doet een read-only round-trip (Stripe /balance,
 * Mollie /methods) tegen de geconfigureerde provider — geen geldverplaatsing. De rem houdt een per
 * ongeluk herhaalde klik of een script binnen de perken (parity met de andere zelftests).
 */
export const billingSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("BILLING_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "billingselftest:",
);

/**
 * Maximaal UPLOAD_SCANNER_SELFTEST_RATE_LIMIT (default 6) upload-scanner-zelftests per beheerder per 5
 * minuten. De admin-actie (/admin/systeemstatus) doet één round-trip tegen de geconfigureerde ClamAV-
 * daemon met de EICAR-testprobe — geen echte upload/opslag. De rem houdt een per ongeluk herhaalde
 * klik of een script binnen de perken (parity met de andere zelftests).
 */
export const uploadScannerSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("UPLOAD_SCANNER_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "uploadscannerselftest:",
);

/**
 * Maximaal ERROR_MONITORING_SELFTEST_RATE_LIMIT (default 6) error-monitoring-zelftests per beheerder
 * per 5 minuten. De admin-actie (/admin/systeemstatus) stuurt één synthetische testgebeurtenis naar
 * de geconfigureerde Sentry-koppeling en wacht op flush. De rem houdt een per ongeluk herhaalde klik
 * of een script binnen de perken (parity met de andere zelftests).
 */
export const errorMonitoringSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("ERROR_MONITORING_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "errormonitoringselftest:",
);

/**
 * Maximaal DB_SELFTEST_RATE_LIMIT (default 6) database-zelftests per beheerder per 5 minuten. De
 * admin-actie (/admin/systeemstatus) doet een lichte read-only round-trip (SELECT 1 + bestaanscheck
 * op kern-tabellen) tegen de databank. De rem houdt een per ongeluk herhaalde klik of een script
 * binnen de perken zonder de normale, incidentele controle te hinderen.
 */
export const dbSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("DB_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "dbselftest:",
);

/**
 * Maximaal ROUTING_SELFTEST_RATE_LIMIT (default 6) routing-zelftests per beheerder per 5 minuten. De
 * admin-actie (/admin/systeemstatus) doet één READ-ONLY geocode-round-trip tegen de geconfigureerde
 * routing-provider (Geoapify) — geen cache-write, geen route-berekening. De rem houdt een per ongeluk
 * herhaalde klik of een script binnen de perken (parity met de andere zelftests).
 */
export const routingSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("ROUTING_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "routingselftest:",
);

/**
 * Maximaal PASSWORD_BREACH_SELFTEST_RATE_LIMIT (default 6) gelekt-wachtwoord-zelftests per beheerder
 * per 5 minuten. De admin-actie (/admin/systeemstatus) haalt één bekend-gelekt test-wachtwoord door de
 * geconfigureerde HIBP-controle (k-anoniem, read-only). De rem houdt een per ongeluk herhaalde klik of
 * een script binnen de perken (parity met de andere zelftests).
 */
export const passwordBreachSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("PASSWORD_BREACH_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "passwordbreachselftest:",
);

/**
 * Maximaal SEMANTIC_MATCHER_SELFTEST_RATE_LIMIT (default 6) semantische-matching-zelftests per
 * beheerder per 5 minuten. De admin-actie (/admin/systeemstatus) doet een read-only operationele probe
 * tegen de geconfigureerde matcher-driver (pgvector). De rem houdt een per ongeluk herhaalde klik of een
 * script binnen de perken (parity met de andere zelftests).
 */
export const semanticMatcherSelfTestRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("SEMANTIC_MATCHER_SELFTEST_RATE_LIMIT", 6),
  5 * 60_000,
  "semanticmatcherselftest:",
);

/**
 * Maximaal SELFTEST_SWEEP_RATE_LIMIT (default 3) go-live-sweeps per beheerder per 5 minuten. Eén sweep
 * draait álle actieve zelftests tegelijk (opslag, database, rate-limit, verificatie, betaalprovider,
 * upload-scanner, error-monitoring) — dus strakker dan de losse zelftests, zodat een herhaalde klik
 * niet elke geconfigureerde integratie tegelijk belast.
 */
export const selfTestSweepRateLimiter = new RateLimiter(
  createRateLimitStore(),
  limitFromEnv("SELFTEST_SWEEP_RATE_LIMIT", 3),
  5 * 60_000,
  "selftestsweep:",
);
