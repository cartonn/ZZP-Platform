import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  applicationRateLimiter,
  createRateLimitStore,
  exportRateLimiter,
  invoiceCreateRateLimiter,
  MemoryRateLimitStore,
  messageRateLimiter,
  noShowReportRateLimiter,
  RateLimiter,
  RedisRateLimitStore,
  resetRateLimiter,
  uploadRateLimiter,
  UpstashRateLimitStore,
  __resetSharedRedisClientForTest,
  type RateLimitResult,
} from "@/lib/rate-limit";

// De aflever-heartbeat wordt door UpstashRateLimitStore.consume lazily geïmporteerd en aangeroepen. Mock 'm
// zodat de unit-tests hermetisch blijven (geen echte DB-schrijf) én we de dead-man's-switch-wiring kunnen
// verifiëren. De MemoryRateLimitStore raakt 'm bewust niet aan.
const recordRateLimitDeliverySuccess = vi.hoisted(() => vi.fn(async () => {}));
const recordRateLimitDeliveryFailure = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/observability/ratelimit-delivery-heartbeat", () => ({
  recordRateLimitDeliverySuccess,
  recordRateLimitDeliveryFailure,
}));

// Mock ioredis: een echte verbinding is niet beschikbaar/gewenst in unit-tests. De fake bootst
// MULTI/EXEC (consume), pipeline (runProbeCommands) en DEL (reset) na via een gedeelde, per-test
// resetbare state — zelfde geest als de fetch-mocks bij UpstashRateLimitStore hieronder.
const redisState = vi.hoisted(() => ({
  multiExecResult: [
    [null, 1],
    [null, 1],
    [null, 60_000],
  ] as [Error | null, unknown][],
  pipelineExecResult: [[null, 1]] as [Error | null, unknown][],
  delResult: 1 as unknown,
  throwOnMulti: false,
  throwOnPipeline: false,
  lastMultiCalls: [] as unknown[][],
  lastPipelineCommands: [] as unknown[][],
  lastDelKey: "",
}));
vi.mock("ioredis", () => {
  class FakeRedis {
    on() {
      return this;
    }
    multi() {
      const calls: unknown[][] = [];
      const chain = {
        call: (...args: unknown[]) => {
          calls.push(args);
          return chain;
        },
        exec: async () => {
          redisState.lastMultiCalls = calls;
          if (redisState.throwOnMulti) throw new Error("Redis MULTI/EXEC mislukt (test)");
          return redisState.multiExecResult;
        },
      };
      return chain;
    }
    pipeline(commands: unknown[][]) {
      redisState.lastPipelineCommands = commands;
      return {
        exec: async () => {
          if (redisState.throwOnPipeline) throw new Error("Redis pipeline mislukt (test)");
          return redisState.pipelineExecResult;
        },
      };
    }
    async del(key: string) {
      redisState.lastDelKey = key;
      return redisState.delResult;
    }
    async quit() {}
  }
  return { default: FakeRedis };
});

// Vaste referentietijdstempel voor deterministische tests — geen echte timers.
const BASE_NOW = 1_700_000_000_000; // willekeurige, vaste epoch-waarde
const LIMIT = 3;
const WINDOW_MS = 60_000; // 1 minuut

describe("MemoryRateLimitStore", () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  // 1. Onder de limiet → allowed=true, remaining loopt correct af.
  it("staat verzoeken toe onder de limiet en berekent remaining correct", async () => {
    const r1 = await store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.retryAfterMs).toBe(0);

    const r2 = await store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW + 1000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r2.retryAfterMs).toBe(0);

    const r3 = await store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW + 2000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterMs).toBe(0);
  });

  // 2. Op/over de limiet → allowed=false, remaining=0, retryAfterMs correct.
  it("weigert bij de limiet en berekent retryAfterMs correct", async () => {
    // Drie toegestane pogingen opgebruiken.
    await store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);

    // Vierde poging op t=BASE_NOW: over de limiet.
    const blocked: RateLimitResult = await store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // retryAfterMs = windowStart + windowMs - now = BASE_NOW + 60_000 - BASE_NOW
    expect(blocked.retryAfterMs).toBe(WINDOW_MS);

    // Vijfde poging iets later: retryAfterMs neemt af.
    const later = BASE_NOW + 10_000;
    const blocked2 = await store.consume("ip-b", LIMIT, WINDOW_MS, later);
    expect(blocked2.allowed).toBe(false);
    expect(blocked2.remaining).toBe(0);
    expect(blocked2.retryAfterMs).toBe(WINDOW_MS - 10_000);
  });

  // 3. Venster reset: na now >= windowStart + windowMs → nieuw venster, allowed=true.
  it("start een nieuw venster als de tijdstempel het venster overschrijdt", async () => {
    // Opvullen tot aan de limiet.
    await store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);

    const blocked = await store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);

    // Exact op de grens: windowStart + windowMs = BASE_NOW + 60_000.
    const afterWindow = BASE_NOW + WINDOW_MS;
    const fresh = await store.consume("ip-c", LIMIT, WINDOW_MS, afterWindow);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(LIMIT - 1);
    expect(fresh.retryAfterMs).toBe(0);
  });

  // 4. Per-key isolatie: twee keys tellen volledig onafhankelijk.
  it("houdt tellers per key gescheiden", async () => {
    await store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    const blockedX = await store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blockedX.allowed).toBe(false);

    // key-y is onaangetast.
    const firstY = await store.consume("key-y", LIMIT, WINDOW_MS, BASE_NOW);
    expect(firstY.allowed).toBe(true);
    expect(firstY.remaining).toBe(LIMIT - 1);
  });

  // 5. reset(key) wist de teller; volgende consume start opnieuw.
  it("wist de teller na reset", async () => {
    await store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    await store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    const blocked = await store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);

    await store.reset("ip-d");

    const afterReset = await store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(LIMIT - 1);
  });

  // Extra: grenswaarde limit=1 (exacte grens na één poging).
  it("weigert onmiddellijk bij een limiet van 1", async () => {
    const r1 = await store.consume("ip-e", 1, WINDOW_MS, BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = await store.consume("ip-e", 1, WINDOW_MS, BASE_NOW + 1);
    expect(r2.allowed).toBe(false);
    expect(r2.remaining).toBe(0);
    expect(r2.retryAfterMs).toBe(WINDOW_MS - 1);
  });

  // Extra: windowStart wordt exact bijgehouden (nieuw venster start op now).
  it("gebruikt de exacte now als windowStart voor een nieuw venster", async () => {
    const t0 = BASE_NOW + 5000;
    await store.consume("ip-f", 1, WINDOW_MS, t0);

    const blocked = await store.consume("ip-f", 1, WINDOW_MS, t0 + 1);
    expect(blocked.allowed).toBe(false);
    // retryAfterMs = t0 + WINDOW_MS - (t0 + 1) = WINDOW_MS - 1
    expect(blocked.retryAfterMs).toBe(WINDOW_MS - 1);
  });
});

describe("RateLimiter (wrapper)", () => {
  // 6. Injecteerbare now: deterministische check zonder echte timers.
  it("geeft now door aan de store en retourneert het correcte resultaat", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), LIMIT, WINDOW_MS);

    const r1 = await limiter.check("user-1", BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.check("user-1", BASE_NOW + 500);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("weigert na het overschrijden van de limiet via de wrapper", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 2, WINDOW_MS);

    await limiter.check("user-2", BASE_NOW);
    await limiter.check("user-2", BASE_NOW);
    const blocked = await limiter.check("user-2", BASE_NOW);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(WINDOW_MS);
  });

  it("delegeert reset naar de store zodat de teller wordt gewist", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 1, WINDOW_MS);

    await limiter.check("user-3", BASE_NOW);
    const blocked = await limiter.check("user-3", BASE_NOW + 1);
    expect(blocked.allowed).toBe(false);

    await limiter.reset("user-3");

    const afterReset = await limiter.check("user-3", BASE_NOW + 2);
    expect(afterReset.allowed).toBe(true);
  });

  // Venster-reset via wrapper: poging na het venster start opnieuw.
  it("start een nieuw venster via de wrapper na het verstrijken van het venster", async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 1, WINDOW_MS);

    await limiter.check("user-4", BASE_NOW);
    const blocked = await limiter.check("user-4", BASE_NOW + 1);
    expect(blocked.allowed).toBe(false);

    const fresh = await limiter.check("user-4", BASE_NOW + WINDOW_MS);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(0);
  });

  // Namespace: twee limiters met dezelfde key-vorm botsen niet op dezelfde gedeelde store.
  it("isoleert tellers per limiter-namespace in een gedeelde store", async () => {
    const shared = new MemoryRateLimitStore();
    const a = new RateLimiter(shared, 1, WINDOW_MS, "a:");
    const b = new RateLimiter(shared, 1, WINDOW_MS, "b:");

    const a1 = await a.check("same-key", BASE_NOW);
    expect(a1.allowed).toBe(true);
    // Dezelfde sleutel via een andere limiter is onaangetast dankzij de namespace.
    const b1 = await b.check("same-key", BASE_NOW);
    expect(b1.allowed).toBe(true);
    // Tweede poging op dezelfde namespace wordt wél geweigerd (limit 1).
    const a2 = await a.check("same-key", BASE_NOW + 1);
    expect(a2.allowed).toBe(false);
  });
});

describe("UpstashRateLimitStore", () => {
  beforeEach(() => {
    recordRateLimitDeliverySuccess.mockClear();
    recordRateLimitDeliveryFailure.mockClear();
  });

  // Bouwt een fetch-mock die de Upstash pipeline-respons nabootst: [INCR, PEXPIRE, PTTL].
  function fetchReturning(count: number, ttlMs: number): typeof fetch {
    return vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: count }, { result: 1 }, { result: ttlMs }],
    })) as unknown as typeof fetch;
  }

  it("staat toe onder de limiet en leest remaining uit de teller", async () => {
    const store = new UpstashRateLimitStore(
      "https://x.upstash.io",
      "tok",
      fetchReturning(1, 60_000),
    );
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.retryAfterMs).toBe(0);
    // Dead-man's-switch: een geslaagde round-trip registreert delivery-success (driver "upstash").
    expect(recordRateLimitDeliverySuccess).toHaveBeenCalledWith("upstash");
    expect(recordRateLimitDeliveryFailure).not.toHaveBeenCalled();
  });

  it("weigert boven de limiet en gebruikt PTTL voor retryAfterMs", async () => {
    const store = new UpstashRateLimitStore(
      "https://x.upstash.io",
      "tok",
      fetchReturning(4, 42_000),
    );
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBe(42_000);
  });

  it("valt terug op het volledige venster als PTTL geen TTL kent (-1)", async () => {
    const store = new UpstashRateLimitStore("https://x.upstash.io", "tok", fetchReturning(4, -1));
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBe(60_000);
  });

  it("stuurt de juiste pipeline-commando's met namespace en auth-header", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }, { result: 60_000 }],
    })) as unknown as typeof fetch;
    const store = new UpstashRateLimitStore("https://x.upstash.io/", "secret-token", fetchMock);
    await store.consume("ip-1", 5, 60_000, BASE_NOW);

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0]).toBe("https://x.upstash.io/pipeline"); // trailing slash genormaliseerd
    const init = call[1] as { method: string; headers: Record<string, string>; body: string };
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
    expect(JSON.parse(init.body)).toEqual([
      ["INCR", "rl:ip-1"],
      ["PEXPIRE", "rl:ip-1", 60_000, "NX"],
      ["PTTL", "rl:ip-1"],
    ]);
  });

  it("fail-open: staat het verzoek toe als de Upstash-call faalt", async () => {
    const failing = vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    const store = new UpstashRateLimitStore("https://x.upstash.io", "tok", failing);
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
    // Dead-man's-switch: de fail-open mislukking wordt geregistreerd zodat een aanhoudende storing zichtbaar wordt.
    expect(recordRateLimitDeliveryFailure).toHaveBeenCalledWith("upstash");
    expect(recordRateLimitDeliverySuccess).not.toHaveBeenCalled();
  });

  it("fail-open: staat het verzoek toe als de Upstash-fetch hangt (timeout)", async () => {
    // Fetch die nooit oplost, maar op de timeout-abort reageert door te rejecten met een
    // AbortError — precies zoals de global fetch bij een afgebroken request. fetchWithTimeout
    // vertaalt dit naar een HttpTimeoutError, die in consume wordt afgevangen (fail-open).
    const hangingFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted.");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;
    // Korte timeout (20 ms) zodat de test snel afrondt.
    const store = new UpstashRateLimitStore("https://x.upstash.io", "token", hangingFetch, 20);
    const r = await store.consume("k", 5, 60_000, Date.now());
    expect(r.allowed).toBe(true);
  });

  it("reset stuurt een DEL voor de genamespacete key", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: 1 }],
    })) as unknown as typeof fetch;
    const store = new UpstashRateLimitStore("https://x.upstash.io", "tok", fetchMock);
    await store.reset("ip-9");
    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    const init = call[1] as { body: string };
    expect(JSON.parse(init.body)).toEqual([["DEL", "rl:ip-9"]]);
  });
});

describe("RedisRateLimitStore", () => {
  beforeEach(() => {
    recordRateLimitDeliverySuccess.mockClear();
    recordRateLimitDeliveryFailure.mockClear();
    __resetSharedRedisClientForTest();
    redisState.multiExecResult = [
      [null, 1],
      [null, 1],
      [null, 60_000],
    ];
    redisState.pipelineExecResult = [[null, 1]];
    redisState.delResult = 1;
    redisState.throwOnMulti = false;
    redisState.throwOnPipeline = false;
    redisState.lastMultiCalls = [];
    redisState.lastPipelineCommands = [];
    redisState.lastDelKey = "";
  });

  it("staat toe onder de limiet en leest remaining uit de teller", async () => {
    redisState.multiExecResult = [
      [null, 1],
      [null, 1],
      [null, 60_000],
    ];
    const store = new RedisRateLimitStore("redis://localhost:6379");
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.retryAfterMs).toBe(0);
    // Dead-man's-switch: een geslaagde round-trip registreert delivery-success (driver "redis").
    expect(recordRateLimitDeliverySuccess).toHaveBeenCalledWith("redis");
    expect(recordRateLimitDeliveryFailure).not.toHaveBeenCalled();
  });

  it("weigert boven de limiet en gebruikt PTTL voor retryAfterMs", async () => {
    redisState.multiExecResult = [
      [null, 4],
      [null, 1],
      [null, 42_000],
    ];
    const store = new RedisRateLimitStore("redis://localhost:6379");
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBe(42_000);
  });

  it("valt terug op het volledige venster als PTTL geen TTL kent (-1)", async () => {
    redisState.multiExecResult = [
      [null, 4],
      [null, 1],
      [null, -1],
    ];
    const store = new RedisRateLimitStore("redis://localhost:6379");
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBe(60_000);
  });

  it("stuurt INCR/PEXPIRE NX/PTTL met namespace via MULTI", async () => {
    const store = new RedisRateLimitStore("redis://localhost:6379");
    await store.consume("ip-1", 5, 60_000, BASE_NOW);
    expect(redisState.lastMultiCalls).toEqual([
      ["INCR", "rl:ip-1"],
      ["PEXPIRE", "rl:ip-1", 60_000, "NX"],
      ["PTTL", "rl:ip-1"],
    ]);
  });

  it("fail-open: staat het verzoek toe als de Redis-call faalt", async () => {
    redisState.throwOnMulti = true;
    const store = new RedisRateLimitStore("redis://localhost:6379");
    const r = await store.consume("ip", 3, 60_000, BASE_NOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
    // Dead-man's-switch: de fail-open mislukking wordt geregistreerd zodat een aanhoudende storing zichtbaar wordt.
    expect(recordRateLimitDeliveryFailure).toHaveBeenCalledWith("redis");
    expect(recordRateLimitDeliverySuccess).not.toHaveBeenCalled();
  });

  it("reset stuurt een DEL voor de genamespacete key", async () => {
    const store = new RedisRateLimitStore("redis://localhost:6379");
    await store.reset("ip-9");
    expect(redisState.lastDelKey).toBe("rl:ip-9");
  });

  it("runProbeCommands surfacet fouten (geen fail-open) — voor de admin-zelftest", async () => {
    redisState.throwOnPipeline = true;
    const store = new RedisRateLimitStore("redis://localhost:6379");
    await expect(store.runProbeCommands([["INCR", "rl:selftest:x"]])).rejects.toThrow();
  });

  it("runProbeCommands geeft de pipeline-resultaten terug", async () => {
    redisState.pipelineExecResult = [
      [null, 1],
      [null, 60_000],
    ];
    const store = new RedisRateLimitStore("redis://localhost:6379");
    const results = await store.runProbeCommands([
      ["PEXPIRE", "rl:selftest:x", 60_000, "NX"],
      ["PTTL", "rl:selftest:x"],
    ]);
    expect(results).toEqual([1, 60_000]);
  });

  it("hergebruikt dezelfde onderliggende client over meerdere store-instances (gedeelde verbinding)", async () => {
    const storeA = new RedisRateLimitStore("redis://localhost:6379");
    const storeB = new RedisRateLimitStore("redis://localhost:6379");
    await storeA.consume("a", 5, 60_000, BASE_NOW);
    await storeB.consume("b", 5, 60_000, BASE_NOW);
    // Geen directe handle op de client hier, maar beide consumes moeten zonder fout de gedeelde
    // FakeRedis-instance vinden (module-singleton) — falen zou hier een exception opleveren.
    expect(recordRateLimitDeliverySuccess).toHaveBeenCalledTimes(2);
  });
});

describe("createRateLimitStore (factory)", () => {
  const saved = {
    store: process.env.RATE_LIMIT_STORE,
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    redisUrl: process.env.REDIS_URL,
  };

  afterEach(() => {
    process.env.RATE_LIMIT_STORE = saved.store;
    process.env.UPSTASH_REDIS_REST_URL = saved.url;
    process.env.UPSTASH_REDIS_REST_TOKEN = saved.token;
    process.env.REDIS_URL = saved.redisUrl;
  });

  it("geeft een MemoryRateLimitStore zonder env-config", () => {
    delete process.env.RATE_LIMIT_STORE;
    expect(createRateLimitStore()).toBeInstanceOf(MemoryRateLimitStore);
  });

  it("geeft een UpstashRateLimitStore bij RATE_LIMIT_STORE=upstash met secrets", () => {
    process.env.RATE_LIMIT_STORE = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://x.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
    expect(createRateLimitStore()).toBeInstanceOf(UpstashRateLimitStore);
  });

  it("valt veilig terug op memory als de Upstash-secrets ontbreken", () => {
    process.env.RATE_LIMIT_STORE = "upstash";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(createRateLimitStore()).toBeInstanceOf(MemoryRateLimitStore);
  });

  it("geeft een RedisRateLimitStore bij RATE_LIMIT_STORE=redis met REDIS_URL", () => {
    process.env.RATE_LIMIT_STORE = "redis";
    process.env.REDIS_URL = "redis://localhost:6379";
    expect(createRateLimitStore()).toBeInstanceOf(RedisRateLimitStore);
  });

  it("valt veilig terug op memory als REDIS_URL ontbreekt", () => {
    process.env.RATE_LIMIT_STORE = "redis";
    delete process.env.REDIS_URL;
    expect(createRateLimitStore()).toBeInstanceOf(MemoryRateLimitStore);
  });
});

describe("resetRateLimiter (wachtwoord-reset)", () => {
  it("staat de default van 3 aanvragen per sleutel toe en weigert de 4e", async () => {
    const key = `reset-test-${BASE_NOW}`; // unieke sleutel, beïnvloedt andere tests niet
    expect((await resetRateLimiter.check(key, BASE_NOW)).allowed).toBe(true);
    expect((await resetRateLimiter.check(key, BASE_NOW + 1)).allowed).toBe(true);
    expect((await resetRateLimiter.check(key, BASE_NOW + 2)).allowed).toBe(true);
    expect((await resetRateLimiter.check(key, BASE_NOW + 3)).allowed).toBe(false);
  });
});

describe("mutatie-limiters (berichten/reacties/uploads/export)", () => {
  it("messageRateLimiter: 30 berichten toegestaan, 31e geweigerd", async () => {
    const key = `msg-test-${BASE_NOW}`;
    for (let i = 0; i < 30; i++) {
      expect((await messageRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await messageRateLimiter.check(key, BASE_NOW + 30)).allowed).toBe(false);
  });

  it("applicationRateLimiter: 10 reacties toegestaan, 11e geweigerd", async () => {
    const key = `apply-test-${BASE_NOW}`;
    for (let i = 0; i < 10; i++) {
      expect((await applicationRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await applicationRateLimiter.check(key, BASE_NOW + 10)).allowed).toBe(false);
  });

  it("uploadRateLimiter: 20 uploads toegestaan, 21e geweigerd", async () => {
    const key = `upload-test-${BASE_NOW}`;
    for (let i = 0; i < 20; i++) {
      expect((await uploadRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await uploadRateLimiter.check(key, BASE_NOW + 20)).allowed).toBe(false);
  });

  it("exportRateLimiter: 5 exports toegestaan, 6e geweigerd, nieuw venster na een uur", async () => {
    const key = `export-test-${BASE_NOW}`;
    for (let i = 0; i < 5; i++) {
      expect((await exportRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await exportRateLimiter.check(key, BASE_NOW + 5)).allowed).toBe(false);
    expect((await exportRateLimiter.check(key, BASE_NOW + 60 * 60_000)).allowed).toBe(true);
  });

  it("noShowReportRateLimiter: 10 meldingen toegestaan, 11e geweigerd, nieuw venster na een uur", async () => {
    const key = `noshow-test-${BASE_NOW}`;
    for (let i = 0; i < 10; i++) {
      expect((await noShowReportRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await noShowReportRateLimiter.check(key, BASE_NOW + 10)).allowed).toBe(false);
    expect((await noShowReportRateLimiter.check(key, BASE_NOW + 60 * 60_000)).allowed).toBe(true);
  });

  it("invoiceCreateRateLimiter: 30 facturen toegestaan, 31e geweigerd, nieuw venster na een uur", async () => {
    const key = `invcreate-test-${BASE_NOW}`;
    for (let i = 0; i < 30; i++) {
      expect((await invoiceCreateRateLimiter.check(key, BASE_NOW + i)).allowed).toBe(true);
    }
    expect((await invoiceCreateRateLimiter.check(key, BASE_NOW + 30)).allowed).toBe(false);
    expect((await invoiceCreateRateLimiter.check(key, BASE_NOW + 60 * 60_000)).allowed).toBe(true);
  });
});
