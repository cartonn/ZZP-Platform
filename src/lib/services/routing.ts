// Echte reistijd-routing via een externe provider, met geocoding + DB-cache.
// Default blijft "offline": zonder API-key valt de app terug op de bestaande deterministische
// plaatsnaam/haversine-schatting in travel-distance.ts.

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { estimateTravelMinutes } from "@/lib/services/travel-distance";
import { fetchWithTimeout, resolveHttpTimeoutMs } from "@/lib/services/fetch-timeout";
import {
  recordRoutingDeliverySuccess,
  recordRoutingDeliveryFailure,
} from "@/lib/observability/routing-delivery-heartbeat";

export type RoutingProvider = "offline" | "geoapify";
export type RoutingMode = "drive";

export interface GeoPoint {
  lat: number;
  lon: number;
  label?: string | null;
  confidence?: number | null;
}

export interface TravelRoute {
  distanceMeters: number;
  durationSeconds: number;
  from: GeoPoint;
  to: GeoPoint;
  source: "cache" | "provider";
}

interface CacheGeocodeInput {
  provider: string;
  query: string;
  queryKey: string;
  point: GeoPoint;
  expiresAt: Date;
}

interface CacheRouteInput {
  provider: string;
  mode: RoutingMode;
  fromQuery: string;
  toQuery: string;
  cacheKey: string;
  route: Omit<TravelRoute, "source">;
  expiresAt: Date;
}

export interface RoutingCache {
  getGeocode(queryKey: string, now: Date): Promise<GeoPoint | null>;
  setGeocode(input: CacheGeocodeInput): Promise<void>;
  getRoute(cacheKey: string, now: Date): Promise<TravelRoute | null>;
  setRoute(input: CacheRouteInput): Promise<void>;
}

class PrismaRoutingCache implements RoutingCache {
  async getGeocode(queryKey: string, now: Date): Promise<GeoPoint | null> {
    const row = await prisma.geocodeCache.findUnique({ where: { queryKey } });
    if (!row || row.expiresAt <= now) return null;
    return {
      lat: row.lat,
      lon: row.lon,
      label: row.label,
      confidence: row.confidence,
    };
  }

  async setGeocode(input: CacheGeocodeInput): Promise<void> {
    await prisma.geocodeCache.upsert({
      where: { queryKey: input.queryKey },
      create: {
        provider: input.provider,
        query: input.query,
        queryKey: input.queryKey,
        lat: input.point.lat,
        lon: input.point.lon,
        label: input.point.label ?? null,
        confidence: input.point.confidence ?? null,
        expiresAt: input.expiresAt,
      },
      update: {
        query: input.query,
        lat: input.point.lat,
        lon: input.point.lon,
        label: input.point.label ?? null,
        confidence: input.point.confidence ?? null,
        expiresAt: input.expiresAt,
      },
    });
  }

  async getRoute(cacheKey: string, now: Date): Promise<TravelRoute | null> {
    const row = await prisma.travelRouteCache.findUnique({ where: { cacheKey } });
    if (!row || row.expiresAt <= now) return null;
    return {
      distanceMeters: row.distanceMeters,
      durationSeconds: row.durationSeconds,
      from: { lat: row.fromLat, lon: row.fromLon },
      to: { lat: row.toLat, lon: row.toLon },
      source: "cache",
    };
  }

  async setRoute(input: CacheRouteInput): Promise<void> {
    await prisma.travelRouteCache.upsert({
      where: { cacheKey: input.cacheKey },
      create: {
        provider: input.provider,
        mode: input.mode,
        fromQuery: input.fromQuery,
        toQuery: input.toQuery,
        cacheKey: input.cacheKey,
        fromLat: input.route.from.lat,
        fromLon: input.route.from.lon,
        toLat: input.route.to.lat,
        toLon: input.route.to.lon,
        distanceMeters: input.route.distanceMeters,
        durationSeconds: input.route.durationSeconds,
        expiresAt: input.expiresAt,
      },
      update: {
        fromQuery: input.fromQuery,
        toQuery: input.toQuery,
        fromLat: input.route.from.lat,
        fromLon: input.route.from.lon,
        toLat: input.route.to.lat,
        toLon: input.route.to.lon,
        distanceMeters: input.route.distanceMeters,
        durationSeconds: input.route.durationSeconds,
        expiresAt: input.expiresAt,
      },
    });
  }
}

export interface RoutingOptions {
  provider?: RoutingProvider;
  mode?: RoutingMode;
  apiKey?: string;
  cache?: RoutingCache;
  fetchImpl?: typeof fetch;
  now?: Date;
  geocodeTtlDays?: number;
  routeTtlDays?: number;
  /**
   * Intern: onderdruk het registreren van een GESLAAGDE aflever-heartbeat op deze round-trip. Gezet door
   * `getTravelRoute` op zijn interne geocode-sub-calls, zodat alleen een VOLLEDIG geslaagde reistijd-
   * lookup (beide geocodes + de route) de opeenvolgende-mislukkingen-teller terugzet — niet een
   * tussentijdse geocode-success. Anders zou een aanhoudend falende route-endpoint (geocode 2xx, route
   * 5xx) de teller per match op 0↔1 laten oscilleren en de `>=3`-alert nooit laten vuren, terwijl de
   * degradatie doorloopt. Een MISLUKKING wordt altijd direct geregistreerd, ongeacht deze vlag.
   */
  suppressSuccessRecord?: boolean;
}

const DEFAULT_GEOCODE_TTL_DAYS = 180;
const DEFAULT_ROUTE_TTL_DAYS = 30;

const prismaCache = new PrismaRoutingCache();

function ttlDate(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

export function normalizeRoutingPlace(place: string): string {
  return place.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashKey(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 32);
}

export function geocodeCacheKey(provider: string, place: string): string {
  return `${provider}:${hashKey([normalizeRoutingPlace(place)])}`;
}

export function routeCacheKey(
  provider: string,
  mode: RoutingMode,
  from: string,
  to: string,
): string {
  return `${provider}:${mode}:${hashKey([normalizeRoutingPlace(from), normalizeRoutingPlace(to)])}`;
}

export function configuredRoutingProvider(): RoutingProvider {
  const provider = process.env.ROUTING_PROVIDER;
  if (provider === "geoapify") return "geoapify";
  return "offline";
}

function configuredApiKey(provider: RoutingProvider): string | null {
  if (provider === "geoapify") return process.env.GEOAPIFY_API_KEY ?? null;
  return null;
}

export function geoapifyGeocodeUrl(query: string, apiKey: string): string {
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("lang", "nl");
  url.searchParams.set("filter", "countrycode:nl");
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

export function geoapifyRoutingUrl(
  from: GeoPoint,
  to: GeoPoint,
  mode: RoutingMode,
  apiKey: string,
): string {
  const url = new URL("https://api.geoapify.com/v1/routing");
  url.searchParams.set("waypoints", `${from.lat},${from.lon}|${to.lat},${to.lon}`);
  url.searchParams.set("mode", mode);
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseGeoapifyGeocodeResponse(json: unknown): GeoPoint | null {
  const features = (json as { features?: unknown[] } | null)?.features;
  const first = Array.isArray(features) ? features[0] : null;
  if (!first || typeof first !== "object") return null;

  const properties = (first as { properties?: Record<string, unknown> }).properties ?? {};
  const geometry = (first as { geometry?: { coordinates?: unknown[] } }).geometry;
  const coords = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];

  const lat = numberOrNull(properties.lat) ?? numberOrNull(coords[1]);
  const lon = numberOrNull(properties.lon) ?? numberOrNull(coords[0]);
  if (lat == null || lon == null) return null;

  const rank = properties.rank as { confidence?: unknown } | undefined;
  return {
    lat,
    lon,
    label: typeof properties.formatted === "string" ? properties.formatted : null,
    confidence: numberOrNull(rank?.confidence),
  };
}

export function parseGeoapifyRoutingResponse(
  json: unknown,
  from: GeoPoint,
  to: GeoPoint,
): Omit<TravelRoute, "source"> | null {
  const features = (json as { features?: unknown[] } | null)?.features;
  const first = Array.isArray(features) ? features[0] : null;
  if (!first || typeof first !== "object") return null;

  const properties = (first as { properties?: Record<string, unknown> }).properties ?? {};
  const distanceMeters = numberOrNull(properties.distance);
  const durationSeconds = numberOrNull(properties.time);
  if (distanceMeters == null || durationSeconds == null) return null;

  return {
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(durationSeconds),
    from,
    to,
  };
}

/**
 * Voert de daadwerkelijke uitgaande provider-fetch uit en registreert de aflever-uitkomst in de
 * routing-heartbeat (dead-man's-switch). Aangeroepen ALLEEN op de échte geoapify-provider mét sleutel
 * (de aanroepers gaten daarop). Semantiek van "aflevering":
 * - fetch werpt (netwerk/DNS/time-out) → mislukking → null
 * - `!res.ok` (401/403/429/5xx) → mislukking → null
 * - `res.json()` werpt (onleesbaar) → mislukking → null
 * - 2xx + parseerbare JSON → succes → json (ongeacht of de inhoud een match bevat: de provider
 *   antwoordde gezond; een lege maar geldige body telt als succes)
 * De heartbeat-recorders zijn fail-open (werpen nooit naar buiten), dus geen extra afhandeling.
 *
 * `recordSuccessOnDelivery` bepaalt of een 2xx-succes ook de GESLAAGDE heartbeat schrijft (die de
 * mislukkingen-teller terugzet). Een MISLUKKING wordt ALTIJD geregistreerd; alleen de success-registratie
 * is gated, zodat `getTravelRoute` een tussentijdse geocode-success kan onderdrukken en pas de volledige
 * lookup als aflevering telt (zie `suppressSuccessRecord`).
 */
async function fetchJson(
  fetchImpl: typeof fetch,
  url: string,
  now: Date,
  recordSuccessOnDelivery: boolean,
): Promise<unknown | null> {
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch {
    await recordRoutingDeliveryFailure(now);
    return null;
  }
  if (!res.ok) {
    await recordRoutingDeliveryFailure(now);
    return null;
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    await recordRoutingDeliveryFailure(now);
    return null;
  }
  if (recordSuccessOnDelivery) await recordRoutingDeliverySuccess(now);
  return json;
}

export async function geocodePlace(
  place: string | null | undefined,
  opts: RoutingOptions = {},
): Promise<GeoPoint | null> {
  if (!place?.trim()) return null;
  const provider = opts.provider ?? configuredRoutingProvider();
  if (provider !== "geoapify") return null;

  const apiKey = opts.apiKey ?? configuredApiKey(provider);
  if (!apiKey) return null;

  const now = opts.now ?? new Date();
  const cache = opts.cache ?? prismaCache;
  const query = place.trim().replace(/\s+/g, " ");
  const queryKey = geocodeCacheKey(provider, query);
  const cached = await cache.getGeocode(queryKey, now);
  if (cached) return cached;

  const json = await fetchJson(
    opts.fetchImpl ?? fetch,
    geoapifyGeocodeUrl(query, apiKey),
    now,
    !opts.suppressSuccessRecord,
  );
  const point = parseGeoapifyGeocodeResponse(json);
  if (!point) return null;

  await cache.setGeocode({
    provider,
    query,
    queryKey,
    point,
    expiresAt: ttlDate(now, opts.geocodeTtlDays ?? DEFAULT_GEOCODE_TTL_DAYS),
  });
  return point;
}

export async function getTravelRoute(
  from: string | null | undefined,
  to: string | null | undefined,
  opts: RoutingOptions = {},
): Promise<TravelRoute | null> {
  if (!from?.trim() || !to?.trim()) return null;
  const provider = opts.provider ?? configuredRoutingProvider();
  if (provider !== "geoapify") return null;

  const apiKey = opts.apiKey ?? configuredApiKey(provider);
  if (!apiKey) return null;

  const now = opts.now ?? new Date();
  const mode = opts.mode ?? "drive";
  const cache = opts.cache ?? prismaCache;
  const fromQuery = from.trim().replace(/\s+/g, " ");
  const toQuery = to.trim().replace(/\s+/g, " ");
  const cacheKey = routeCacheKey(provider, mode, fromQuery, toQuery);
  const cached = await cache.getRoute(cacheKey, now);
  if (cached) return cached;

  // De interne geocode-sub-calls onderdrukken hun GESLAAGDE heartbeat: alleen een volledig geslaagde
  // reistijd-lookup (hieronder, de route-round-trip) telt als aflevering en zet de mislukkingen-teller
  // terug. Zo kan een aanhoudend falende route-endpoint (geocode 2xx, route 5xx) de teller niet stil
  // op 0↔1 laten oscilleren. Een MISLUKKING in een geocode wordt wél direct geregistreerd.
  const geocodeOpts: RoutingOptions = { ...opts, now, suppressSuccessRecord: true };
  const fromPoint = await geocodePlace(fromQuery, geocodeOpts);
  const toPoint = await geocodePlace(toQuery, geocodeOpts);
  if (!fromPoint || !toPoint) return null;

  const json = await fetchJson(
    opts.fetchImpl ?? fetch,
    geoapifyRoutingUrl(fromPoint, toPoint, mode, apiKey),
    now,
    true,
  );
  const route = parseGeoapifyRoutingResponse(json, fromPoint, toPoint);
  if (!route) return null;

  await cache.setRoute({
    provider,
    mode,
    fromQuery,
    toQuery,
    cacheKey,
    route,
    expiresAt: ttlDate(now, opts.routeTtlDays ?? DEFAULT_ROUTE_TTL_DAYS),
  });

  return { ...route, source: "provider" };
}

/**
 * Echte routed reistijd als Geoapify is geconfigureerd; anders/als provider faalt: de bestaande
 * offline schatting. Hierdoor blijft matching deterministisch en robuust zonder API-key.
 */
export async function estimateTravelMinutesWithRouting(
  from: string | null | undefined,
  to: string | null | undefined,
  opts: RoutingOptions = {},
): Promise<number | null> {
  const route = await getTravelRoute(from, to, opts).catch(() => null);
  if (route) return Math.round(route.durationSeconds / 60);
  return estimateTravelMinutes(from, to);
}

export interface RoutingDiagnostics {
  provider: RoutingProvider;
  /** Of er een API-key is geconfigureerd — NOOIT de waarde zelf (alleen aan/uit). */
  keyConfigured: boolean;
  /** True als de provider actief én bruikbaar is (geconfigureerd + key aanwezig). */
  active: boolean;
  geocodeCacheCount: number;
  routeCacheCount: number;
  lastRouteAt: Date | null;
}

/**
 * Fout bij de routing-connectiviteitscontrole. Draagt een BEWUST veilig bericht (provider + reden of
 * HTTP-status) — NOOIT de aanroep-URL, die de API-sleutel in de query-string bevat. Aparte klasse
 * zodat de zelftest dit veilige bericht mag tonen (en elke andere, onverwachte fout terugvalt op
 * alleen de error-naam). Zelfde patroon als `BillingConnectivityError`.
 */
export class RoutingConnectivityError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "RoutingConnectivityError";
    this.status = status;
  }
}

export interface RoutingConnectivityOptions {
  provider?: RoutingProvider;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  /** Synthetische probe-plaats (NL); default een bekende plaatsnaam. */
  probePlace?: string;
  timeoutMs?: number;
}

/** Synthetische, onschuldige NL-plaats voor de connectiviteitscontrole. */
export const ROUTING_PROBE_PLACE = "Amsterdam";

/**
 * READ-ONLY connectiviteitscontrole tegen de geconfigureerde routing-provider: één geocode-round-trip
 * met een synthetische NL-plaats, met een harde time-out. Bevestigt bereikbaarheid + geldige sleutel
 * + contract-vorm ZONDER de cache te muteren en zonder een route te berekenen. Werpt een
 * `RoutingConnectivityError` met een veilig bericht (provider + reden/HTTP-status, nooit de URL of de
 * sleutel) bij een fout; resolvet stil bij succes.
 *
 * Bedoeld voor de admin-zelftest (/admin/systeemstatus) en de go-live-sweep: zonder deze controle zou
 * een verkeerd geplakte `GEOAPIFY_API_KEY` pas bij runtime opvallen als een stille terugval op de
 * offline reistijd-schatter (geen vals GO in de sweep).
 */
export async function checkRoutingConnectivity(
  opts: RoutingConnectivityOptions = {},
): Promise<void> {
  const provider = opts.provider ?? configuredRoutingProvider();
  if (provider !== "geoapify") {
    throw new RoutingConnectivityError("Geen externe routing-provider actief.");
  }

  const apiKey = opts.apiKey ?? configuredApiKey(provider);
  if (!apiKey) {
    throw new RoutingConnectivityError("Geen API-sleutel geconfigureerd voor de routing-provider.");
  }

  const query = (opts.probePlace ?? ROUTING_PROBE_PLACE).trim();
  const timeoutMs = opts.timeoutMs ?? resolveHttpTimeoutMs(process.env.ROUTING_HTTP_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      geoapifyGeocodeUrl(query, apiKey),
      {},
      { fetchImpl: opts.fetchImpl, timeoutMs, label: "Routing" },
    );
  } catch {
    // Netwerk-/DNS-/timeout-fout: NOOIT het rauwe bericht doorgeven — de URL met de sleutel zou erin
    // kunnen zitten. Alleen een veilige, generieke reden.
    throw new RoutingConnectivityError("Routing-provider onbereikbaar (netwerkfout of time-out).");
  }

  if (!res.ok) {
    throw new RoutingConnectivityError(
      `Routing-provider antwoordde met HTTP ${res.status}.`,
      res.status,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new RoutingConnectivityError("Onleesbaar antwoord van de routing-provider.");
  }

  const point = parseGeoapifyGeocodeResponse(json);
  if (!point) {
    throw new RoutingConnectivityError(
      "Onverwacht antwoord van de routing-provider (geen geldige geocode).",
    );
  }
}

/**
 * Diagnose voor de admin-bewaking: welke routing-provider draait, of de key gezet is (boolean, niet
 * de waarde) en hoeveel er gecachet is. Server-side; lekt nooit de API-key.
 */
export async function routingDiagnostics(): Promise<RoutingDiagnostics> {
  const provider = configuredRoutingProvider();
  // Boolean afgeleid uit de ruwe env (NOOIT de waarde), zodat een gezette sleutel mét
  // provider="offline" zichtbaar blijft als misconfiguratie.
  const keyConfigured = (process.env.GEOAPIFY_API_KEY ?? "").trim().length > 0;
  const [geocodeCacheCount, routeCacheCount, lastRoute] = await Promise.all([
    prisma.geocodeCache.count(),
    prisma.travelRouteCache.count(),
    prisma.travelRouteCache.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);
  return {
    provider,
    keyConfigured,
    active: provider === "geoapify" && keyConfigured,
    geocodeCacheCount,
    routeCacheCount,
    lastRouteAt: lastRoute?.updatedAt ?? null,
  };
}
