import { beforeEach, describe, expect, it, vi } from "vitest";

const recordRoutingSuccess = vi.hoisted(() => vi.fn(async () => {}));
const recordRoutingFailure = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/observability/routing-delivery-heartbeat", () => ({
  recordRoutingDeliverySuccess: recordRoutingSuccess,
  recordRoutingDeliveryFailure: recordRoutingFailure,
}));

import {
  checkRoutingConnectivity,
  DEFAULT_ROUTING_RETRIES,
  estimateTravelMinutesWithRouting,
  geocodeCacheKey,
  geocodePlace,
  geoapifyGeocodeUrl,
  geoapifyRoutingUrl,
  MAX_ROUTING_RETRIES,
  normalizeRoutingPlace,
  parseGeoapifyGeocodeResponse,
  parseGeoapifyRoutingResponse,
  resolveRoutingRetries,
  ROUTING_RETRY_BASE_DELAY_MS,
  ROUTING_RETRY_MAX_DELAY_MS,
  RoutingConnectivityError,
  routeCacheKey,
  routingRetryDelayMs,
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

beforeEach(() => {
  recordRoutingSuccess.mockClear();
  recordRoutingFailure.mockClear();
});

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

describe("routing delivery heartbeat", () => {
  const now = new Date("2026-06-08T12:00:00Z");

  it("registreert succes bij een geslaagde geoapify-round-trip", async () => {
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

    await expect(
      estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
        provider: "geoapify",
        apiKey: "test-key",
        cache,
        fetchImpl,
        now,
      }),
    ).resolves.toBe(70);

    // Alleen de VOLLEDIG geslaagde reistijd-lookup telt als aflevering: de twee interne geocode-
    // successen worden onderdrukt zodat een tussentijdse success de mislukkingen-teller niet terugzet.
    expect(recordRoutingSuccess).toHaveBeenCalledTimes(1);
    expect(recordRoutingSuccess).toHaveBeenCalledWith(now);
    expect(recordRoutingFailure).not.toHaveBeenCalled();
  });

  it("registreert bij geocode-OK maar route-fout enkel een mislukking (geen teller-oscillatie)", async () => {
    // Gemengde faalmodus: de geocodes antwoorden 2xx maar het route-endpoint faalt structureel
    // (bv. 503). Zou een tussentijdse geocode-success de teller resetten, dan zou de aanhoudende
    // route-degradatie de `>=3`-alert nooit laten vuren. Deze test borgt: geen success-registratie,
    // alleen een mislukking — de teller kan zo doortellen.
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/geocode/")) {
        return jsonResponse({
          features: [{ properties: { lat: 52.3676, lon: 4.9041, formatted: "Amsterdam" } }],
        });
      }
      return new Response("upstream down", { status: 503 });
    }) as unknown as typeof fetch;

    const minutes = await estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
      provider: "geoapify",
      apiKey: "test-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
      sleepImpl: async () => {},
    });

    expect(recordRoutingSuccess).not.toHaveBeenCalled();
    // Alleen de einduitkomst telt: één mislukking nadat de retries op het 503-route-endpoint uitputten.
    expect(recordRoutingFailure).toHaveBeenCalledTimes(1);
    expect(recordRoutingFailure).toHaveBeenCalledWith(now);
    // Terugval op de deterministische offline schatter.
    expect(minutes).toBeGreaterThan(0);
  });

  it("registreert mislukking bij een niet-ok HTTP-antwoord en valt terug op de offline schatting", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("nope", { status: 401 }),
    ) as unknown as typeof fetch;

    const minutes = await estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
      provider: "geoapify",
      apiKey: "bad-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
    });

    expect(recordRoutingFailure).toHaveBeenCalledWith(now);
    expect(recordRoutingSuccess).not.toHaveBeenCalled();
    // Terugval op de deterministische offline schatter (niet-null getal).
    expect(minutes).toBeGreaterThan(0);
  });

  it("registreert mislukking wanneer de fetch werpt en valt terug", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }) as unknown as typeof fetch;

    const minutes = await estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
      provider: "geoapify",
      apiKey: "test-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
      sleepImpl: async () => {},
    });

    expect(recordRoutingFailure).toHaveBeenCalledWith(now);
    expect(recordRoutingSuccess).not.toHaveBeenCalled();
    expect(minutes).toBeGreaterThan(0);
  });
});

describe("routing provider time-out + transiënte retry (hot-path hardening)", () => {
  const now = new Date("2026-09-04T12:00:00.000Z");

  function geocodeOk(): Response {
    return jsonResponse({
      features: [{ properties: { lat: 52.3676, lon: 4.9041, formatted: "Amsterdam" } }],
    });
  }
  function routeOk(): Response {
    return jsonResponse({ features: [{ properties: { distance: 60000, time: 3600 } }] });
  }

  it("herstelt op een retry na een transiënte 503 op het route-endpoint (succes, geen mislukking)", async () => {
    let routeCalls = 0;
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/geocode/")) return geocodeOk();
      routeCalls += 1;
      // Eerste route-poging faalt transiënt (503), de retry slaagt.
      return routeCalls === 1 ? new Response("upstream", { status: 503 }) : routeOk();
    }) as unknown as typeof fetch;

    const minutes = await estimateTravelMinutesWithRouting("Amsterdam", "Rotterdam", {
      provider: "geoapify",
      apiKey: "test-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
      retries: 2,
      sleepImpl: async () => {},
    });

    expect(routeCalls).toBe(2); // één faal + één geslaagde retry
    expect(minutes).toBe(60); // 3600 s / 60 → uit de provider, niet de haversine-fallback
    expect(recordRoutingSuccess).toHaveBeenCalledTimes(1);
    expect(recordRoutingSuccess).toHaveBeenCalledWith(now);
    expect(recordRoutingFailure).not.toHaveBeenCalled();
  });

  it("herhaalt een niet-transiënte 401 NIET (verkeerde sleutel faalt meteen)", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;

    await geocodePlace("Amsterdam", {
      provider: "geoapify",
      apiKey: "bad-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
      retries: 3,
      sleepImpl: async () => {},
    });

    // De geocode faalt niet-transiënt (401) → geen retry → precies één poging.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(recordRoutingFailure).toHaveBeenCalledWith(now);
    expect(recordRoutingSuccess).not.toHaveBeenCalled();
  });

  it("registreert bij uitgeputte retries op een aanhoudende 429 precies één mislukking", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("rate limited", { status: 429 }),
    ) as unknown as typeof fetch;

    await geocodePlace("Amsterdam", {
      provider: "geoapify",
      apiKey: "test-key",
      cache: new MemoryRoutingCache(),
      fetchImpl,
      now,
      retries: 2,
      sleepImpl: async () => {},
    });

    // Eén initiële poging + twee retries = drie fetch-calls; slechts één heartbeat-mislukking (einduitkomst).
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(recordRoutingFailure).toHaveBeenCalledTimes(1);
    expect(recordRoutingSuccess).not.toHaveBeenCalled();
  });
});

describe("resolveRoutingRetries", () => {
  it("klemt op [0, MAX] en valt terug bij onleesbare invoer", () => {
    expect(resolveRoutingRetries(undefined)).toBe(DEFAULT_ROUTING_RETRIES);
    expect(resolveRoutingRetries("0")).toBe(0);
    expect(resolveRoutingRetries("-3")).toBe(0);
    expect(resolveRoutingRetries("99")).toBe(MAX_ROUTING_RETRIES);
    expect(resolveRoutingRetries("2")).toBe(2);
    expect(resolveRoutingRetries("nonsense")).toBe(DEFAULT_ROUTING_RETRIES);
  });

  it("berekent een begrensde exponentiële backoff", () => {
    expect(routingRetryDelayMs(0)).toBe(ROUTING_RETRY_BASE_DELAY_MS);
    expect(routingRetryDelayMs(1)).toBe(ROUTING_RETRY_BASE_DELAY_MS * 2);
    expect(routingRetryDelayMs(10)).toBe(ROUTING_RETRY_MAX_DELAY_MS);
  });
});

describe("checkRoutingConnectivity", () => {
  const validGeocode = {
    features: [{ properties: { lat: 52.3676, lon: 4.9041, formatted: "Amsterdam" } }],
  };

  it("resolvet stil bij een geldig geocode-antwoord (één read-only round-trip)", async () => {
    let calledUrl = "";
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      calledUrl = String(url);
      return jsonResponse(validGeocode);
    }) as unknown as typeof fetch;
    await expect(
      checkRoutingConnectivity({ provider: "geoapify", apiKey: "test-key", fetchImpl }),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    // Alleen het geocode-endpoint — nooit /routing (geen route berekend).
    expect(calledUrl).toContain("/geocode/");
  });

  it("werpt een RoutingConnectivityError met status bij een niet-ok HTTP-antwoord", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("nope", { status: 401 }),
    ) as unknown as typeof fetch;
    await expect(
      checkRoutingConnectivity({ provider: "geoapify", apiKey: "bad-key", fetchImpl }),
    ).rejects.toMatchObject({ name: "RoutingConnectivityError", status: 401 });
  });

  it("werpt zonder de sleutel te lekken bij een netwerkfout", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED https://api.geoapify.com?apiKey=geheim");
    }) as unknown as typeof fetch;
    let caught: unknown;
    await checkRoutingConnectivity({ provider: "geoapify", apiKey: "test-key", fetchImpl }).catch(
      (e) => {
        caught = e;
      },
    );
    expect(caught).toBeInstanceOf(RoutingConnectivityError);
    expect((caught as Error).message).not.toContain("geheim");
  });

  it("werpt wanneer er geen externe provider actief is (offline)", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(
      checkRoutingConnectivity({ provider: "offline", fetchImpl }),
    ).rejects.toBeInstanceOf(RoutingConnectivityError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("werpt wanneer de API-sleutel ontbreekt", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(
      checkRoutingConnectivity({ provider: "geoapify", apiKey: "", fetchImpl }),
    ).rejects.toBeInstanceOf(RoutingConnectivityError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("werpt wanneer het antwoord geen geldige geocode bevat", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ features: [] })) as unknown as typeof fetch;
    await expect(
      checkRoutingConnectivity({ provider: "geoapify", apiKey: "test-key", fetchImpl }),
    ).rejects.toBeInstanceOf(RoutingConnectivityError);
  });
});

// Type-level guard: alleen de mode(s) die de app ondersteunt worden naar Geoapify gestuurd.
const _mode: RoutingMode = "drive";
void _mode;
