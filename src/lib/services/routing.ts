// Echte reistijd-routing via een externe provider, met geocoding + DB-cache.
// Default blijft "offline": zonder API-key valt de app terug op de bestaande deterministische
// plaatsnaam/haversine-schatting in travel-distance.ts.

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { estimateTravelMinutes } from "@/lib/services/travel-distance";

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

async function fetchJson(fetchImpl: typeof fetch, url: string): Promise<unknown | null> {
  const res = await fetchImpl(url);
  if (!res.ok) return null;
  return res.json();
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

  const json = await fetchJson(opts.fetchImpl ?? fetch, geoapifyGeocodeUrl(query, apiKey));
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

  const fromPoint = await geocodePlace(fromQuery, opts);
  const toPoint = await geocodePlace(toQuery, opts);
  if (!fromPoint || !toPoint) return null;

  const json = await fetchJson(
    opts.fetchImpl ?? fetch,
    geoapifyRoutingUrl(fromPoint, toPoint, mode, apiKey),
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
