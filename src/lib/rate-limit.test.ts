import { describe, expect, it, beforeEach } from "vitest";
import { MemoryRateLimitStore, RateLimiter, type RateLimitResult } from "@/lib/rate-limit";

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
  it("staat verzoeken toe onder de limiet en berekent remaining correct", () => {
    const r1 = store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.retryAfterMs).toBe(0);

    const r2 = store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW + 1000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r2.retryAfterMs).toBe(0);

    const r3 = store.consume("ip-a", LIMIT, WINDOW_MS, BASE_NOW + 2000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterMs).toBe(0);
  });

  // 2. Op/over de limiet → allowed=false, remaining=0, retryAfterMs correct.
  it("weigert bij de limiet en berekent retryAfterMs correct", () => {
    // Drie toegestane pogingen opgebruiken.
    store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);

    // Vierde poging op t=BASE_NOW: over de limiet.
    const blocked: RateLimitResult = store.consume("ip-b", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // retryAfterMs = windowStart + windowMs - now = BASE_NOW + 60_000 - BASE_NOW
    expect(blocked.retryAfterMs).toBe(WINDOW_MS);

    // Vijfde poging iets later: retryAfterMs neemt af.
    const later = BASE_NOW + 10_000;
    const blocked2 = store.consume("ip-b", LIMIT, WINDOW_MS, later);
    expect(blocked2.allowed).toBe(false);
    expect(blocked2.remaining).toBe(0);
    expect(blocked2.retryAfterMs).toBe(WINDOW_MS - 10_000);
  });

  // 3. Venster reset: na now >= windowStart + windowMs → nieuw venster, allowed=true.
  it("start een nieuw venster als de tijdstempel het venster overschrijdt", () => {
    // Opvullen tot aan de limiet.
    store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);

    const blocked = store.consume("ip-c", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);

    // Exact op de grens: windowStart + windowMs = BASE_NOW + 60_000.
    const afterWindow = BASE_NOW + WINDOW_MS;
    const fresh = store.consume("ip-c", LIMIT, WINDOW_MS, afterWindow);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(LIMIT - 1);
    expect(fresh.retryAfterMs).toBe(0);
  });

  // 4. Per-key isolatie: twee keys tellen volledig onafhankelijk.
  it("houdt tellers per key gescheiden", () => {
    store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    const blockedX = store.consume("key-x", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blockedX.allowed).toBe(false);

    // key-y is onaangetast.
    const firstY = store.consume("key-y", LIMIT, WINDOW_MS, BASE_NOW);
    expect(firstY.allowed).toBe(true);
    expect(firstY.remaining).toBe(LIMIT - 1);
  });

  // 5. reset(key) wist de teller; volgende consume start opnieuw.
  it("wist de teller na reset", () => {
    store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    const blocked = store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    expect(blocked.allowed).toBe(false);

    store.reset("ip-d");

    const afterReset = store.consume("ip-d", LIMIT, WINDOW_MS, BASE_NOW);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(LIMIT - 1);
  });

  // Extra: grenswaarde limit=1 (exacte grens na één poging).
  it("weigert onmiddellijk bij een limiet van 1", () => {
    const r1 = store.consume("ip-e", 1, WINDOW_MS, BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = store.consume("ip-e", 1, WINDOW_MS, BASE_NOW + 1);
    expect(r2.allowed).toBe(false);
    expect(r2.remaining).toBe(0);
    expect(r2.retryAfterMs).toBe(WINDOW_MS - 1);
  });

  // Extra: windowStart wordt exact bijgehouden (nieuw venster start op now).
  it("gebruikt de exacte now als windowStart voor een nieuw venster", () => {
    const t0 = BASE_NOW + 5000;
    store.consume("ip-f", 1, WINDOW_MS, t0);

    const blocked = store.consume("ip-f", 1, WINDOW_MS, t0 + 1);
    expect(blocked.allowed).toBe(false);
    // retryAfterMs = t0 + WINDOW_MS - (t0 + 1) = WINDOW_MS - 1
    expect(blocked.retryAfterMs).toBe(WINDOW_MS - 1);
  });
});

describe("RateLimiter (wrapper)", () => {
  // 6. Injecteerbare now: deterministische check zonder echte timers.
  it("geeft now door aan de store en retourneert het correcte resultaat", () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), LIMIT, WINDOW_MS);

    const r1 = limiter.check("user-1", BASE_NOW);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("user-1", BASE_NOW + 500);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("weigert na het overschrijden van de limiet via de wrapper", () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 2, WINDOW_MS);

    limiter.check("user-2", BASE_NOW);
    limiter.check("user-2", BASE_NOW);
    const blocked = limiter.check("user-2", BASE_NOW);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(WINDOW_MS);
  });

  it("delegeert reset naar de store zodat de teller wordt gewist", () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 1, WINDOW_MS);

    limiter.check("user-3", BASE_NOW);
    const blocked = limiter.check("user-3", BASE_NOW + 1);
    expect(blocked.allowed).toBe(false);

    limiter.reset("user-3");

    const afterReset = limiter.check("user-3", BASE_NOW + 2);
    expect(afterReset.allowed).toBe(true);
  });

  // Venster-reset via wrapper: poging na het venster start opnieuw.
  it("start een nieuw venster via de wrapper na het verstrijken van het venster", () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore(), 1, WINDOW_MS);

    limiter.check("user-4", BASE_NOW);
    const blocked = limiter.check("user-4", BASE_NOW + 1);
    expect(blocked.allowed).toBe(false);

    const fresh = limiter.check("user-4", BASE_NOW + WINDOW_MS);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(0);
  });
});
