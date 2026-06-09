// Rate-limiter abstractie (fixed-window). Pluggbare store, dezelfde driver-aanpak
// als storage.ts: lokale MemoryRateLimitStore als default, later vervangbaar door
// een gedeelde/durable store (Redis, Upstash) achter dezelfde RateLimitStore-interface —
// net zoals de S3-driver achter StorageDriver zit.

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
   */
  consume(key: string, limit: number, windowMs: number, now: number): RateLimitResult;

  /** Verwijdert de teller voor een key (bv. na succesvolle login). */
  reset(key: string): void;
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
 * multi-instance / horizontale schaling: vervang door een gedeelde store (zie
 * het interface boven) zonder de rest van de code te hoeven aanpassen.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, WindowEntry>();

  consume(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
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

  reset(key: string): void {
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
 * Dunne wrapper rondom een RateLimitStore. Koppelt limit + windowMs aan een store
 * zodat call-sites alleen een key (en optioneel now) hoeven mee te geven.
 */
export class RateLimiter {
  constructor(
    private readonly store: RateLimitStore,
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /**
   * Registreer één verzoek voor de gegeven key.
   * @param key  Identifier (bv. IP, user-id).
   * @param now  Tijdstempel in ms; default Date.now(). Injecteerbaar voor tests.
   */
  check(key: string, now: number = Date.now()): RateLimitResult {
    return this.store.consume(key, this.limit, this.windowMs, now);
  }

  /** Verwijdert de teller voor een key in de onderliggende store. */
  reset(key: string): void {
    this.store.reset(key);
  }
}

// ─── Geconfigureerde singletons ────────────────────────────────────────────────
// Per-proces in-memory. Voor een enkel Node-proces is dit prima; bij meerdere
// instanties (horizontale schaling, serverless) is een gedeelde/durable store
// nodig achter dezelfde RateLimitStore-interface — net zoals de S3-storagedriver
// achter StorageDriver zit.

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
  new MemoryRateLimitStore(),
  limitFromEnv("LOGIN_RATE_LIMIT", 5),
  15 * 60_000,
);

/** Maximaal REGISTER_RATE_LIMIT (default 5) registraties per IP per uur. */
export const registerRateLimiter = new RateLimiter(
  new MemoryRateLimitStore(),
  limitFromEnv("REGISTER_RATE_LIMIT", 5),
  60 * 60_000,
);

/**
 * Maximaal RESET_RATE_LIMIT (default 3) wachtwoord-reset-aanvragen per sleutel (IP én e-mail) per
 * uur. Beperkt mail-bombing en CPU-amplificatie (token-hashing) zonder de enumeratiebescherming
 * (uniforme respons) te doorbreken.
 */
export const resetRateLimiter = new RateLimiter(
  new MemoryRateLimitStore(),
  limitFromEnv("RESET_RATE_LIMIT", 3),
  60 * 60_000,
);

/**
 * Maximaal CREDENTIAL_VERIFY_RATE_LIMIT (default 10) zelf-verificatiepogingen (DUO/BIG) per ZZP'er
 * per uur. De zelf-verificatie zet een credential direct op VERIFIED zonder admin; zonder limiet is
 * het gokken van een (publiek opzoekbaar) BIG-nummer of DUO-code geautomatiseerd brute-forcebaar.
 */
export const credentialVerifyRateLimiter = new RateLimiter(
  new MemoryRateLimitStore(),
  limitFromEnv("CREDENTIAL_VERIFY_RATE_LIMIT", 10),
  60 * 60_000,
);
