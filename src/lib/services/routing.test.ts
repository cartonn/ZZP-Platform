import { describe, expect, it, vi } from "vitest";
import {
  estimateTravelMinutesWithRouting,
  geocodeCacheKey,
  geoapifyGeocodeUrl,
  geoapifyRoutingUrl,
  normalizeRoutingPlace,
  parseGeoapifyGeocodeResponse,
  parseGeoapifyRoutingResponse,
  routeCacheKey,
  type GeoPoint,
  type RoutingCache,
  type RoutingMode,
  type TravelRoute,
} from "@/lib/services/routing";

class MemoryRoutingCache implements RoutingCache {
  geocodes = new Map<string, GeoPoint & { expiresAt: Date }>();
  routes = new Map<string, TravelRoute & { expiresAt: Date }>();

  async getGeocode(queryKey: string, now: Date): Promise<GeoPoint | null> {
    const row = this.geocodes.get(queryKey);
    if (!row || row.expiresAt <= now) return null;
    return row;
  }

  async setGeocode(input: { queryKey: string; point: GeoPoint; expiresAt: Date }): Promise<void> {
    this.geocodes.set(input.queryKey, { ...input.point, expiresAt: input.expiresAt });
  }

  async getRoute(cacheKey: string, now: Date): Promise<TravelRoute | null> {
    const row = this.routes.get(cacheKey);
    if (!row || row.expiresAt <= now) return null;
    return { ...row, source: "cache" };
  }

  async setRoute(input: {
    cacheKey: string;
    route: Omit<TravelRoute, "source">;
    expiresAt: Date;
  }): Promise<void> {
    this.routes.set(input.cacheKey, {
      ...input.route,
      source: "provider",
      expiresAt: input.expiresAt,
    });
  }
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("routing helpers", () => {
  it("normaliseert plaatsnamen voor stabiele cache keys", () => {
    expect(normalizeRoutingPlace("  Den   Haag ")).toBe("den haag");
    expect(geocodeCacheKey("geoapify", "Amsterdam")).toBe(
      geocodeCacheKey("geoapify", " amsterdam "),
    );
    expect(routeCacheKey("geoapify", "drive", "A", "B")).not.toBe(
      routeCacheKey("geoapify", "drive", "B", "A"),
    );
  });

  it("bouwt Geoapify URLs zonder secrets te loggen of hardcoden", () => {
    const geocode = new URL(geoapifyGeocodeUrl("Amsterdam", "key-123"));
    expect(geocode.hostname).toBe("api.geoapify.com");
    expect(geocode.searchParams.get("text")).toBe("Amsterdam");
    expect(geocode.searchParams.get("filter")).toBe("countrycode:nl");

    const routing = new URL(
      geoapifyRoutingUrl(
        { lat: 52.3676, lon: 4.9041 },
        { lat: 51.9225, lon: 4.4792 },
        "drive",
        "key-123",
      ),
    );
    expect(routing.searchParams.get("mode")).toBe("drive");
    expect(routing.searchParams.get("waypoints")).toContain("|");
  });

  it("parsed geocoding en routing responses", () => {
    const point = parseGeoapifyGeocodeResponse({
      features: [{ properties: { lat: 52.3676, lon: 4.9041, formatted: "Amsterdam" } }],
    });
    expect(point).toMatchObject({ lat: 52.3676, lon: 4.9041, label: "Amsterdam" });

    const route = parseGeoapifyRoutingResponse(
      { features: [{ properties: { distance: 78_000, time: 4_200 } }] },
      point!,
      { lat: 51.9225, lon: 4.4792 },
    );
    expect(route).toMatchObject({ distanceMeters: 78000, durationSeconds: 4200 });
  });
});

describe("estimateTravelMinutesWithRouting", () => {
  it("haalt geocoding + route op en gebruikt daarna de route-cache", async () => {
    const cache = new MemoryRoutingCache();
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/geocode/")) {
        const text = new URL(href).searchParams.get("text");
        return jsonResponse({
          features: [
            {
              properties:
                text === "Amsterdam"
                  ? { lat: 52.3676, lon: 4.9041, formatted: "Amsterdam" }
                  : { lat: 51.9225, lon: 4.4792, formatted: "Rotterdam" },
            },
          ],
        });
      }
      return jsonResponse({ features: [{ properties: { distance: 78_000, time: 4_200 } }] });
    }) as typeof fetch;

    const opts = {
      provider: "geoapify" as const,
      apiKey: "test-key",
      cache,
      fetchImpl,
      now: new Date("2026-06-08T12:00:00Z"),
    };
    await expect(estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", opts)).resolves.toBe(
      70,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    await expect(estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", opts)).resolves.toBe(
      70,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("valt zonder API-key terug op de offline schatting", async () => {
    await expect(
      estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
        provider: "geoapify",
        apiKey: "",
      }),
    ).resolves.toBeGreaterThan(70);
  });
});

// Type-level guard: alleen de mode(s) die de app ondersteunt worden naar Geoapify gestuurd.
const _mode: RoutingMode = "drive";
void _mode;
