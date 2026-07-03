import { describe, it, expect } from "vitest";
import { MemoryRateLimitStore, RateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

// De guard vertaalt een RateLimiter-uitslag naar of een 429-Response (limiet overschreden) of
// null (mag door). Alle export-/PDF-routes delen exact deze logica; hier testen we hem los met een
// echte in-memory store zodat de teller-/venstergrens end-to-end klopt.
function makeLimiter(limit: number, windowMs = 60_000) {
  return new RateLimiter(new MemoryRateLimitStore(), limit, windowMs, "test:");
}

describe("enforceRateLimit", () => {
  it("geeft null zolang de limiet niet is overschreden", async () => {
    const limiter = makeLimiter(3);
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
  });

  it("geeft een 429 zodra de limiet is overschreden", async () => {
    const limiter = makeLimiter(2);
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();

    const res = await enforceRateLimit(limiter, "user-1");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    const body = await res!.json();
    expect(body).toEqual({ error: "Te veel verzoeken. Probeer het later opnieuw." });
  });

  it("zet een Retry-After-header (seconden, minimaal 1)", async () => {
    const limiter = makeLimiter(1, 60_000);
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
    const res = await enforceRateLimit(limiter, "user-1");
    const retryAfter = Number(res!.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("gebruikt een meegegeven bericht in de body", async () => {
    const limiter = makeLimiter(1);
    await enforceRateLimit(limiter, "user-1");
    const res = await enforceRateLimit(limiter, "user-1", "Rustig aan.");
    const body = await res!.json();
    expect(body.error).toBe("Rustig aan.");
  });

  it("telt per key apart — een tweede gebruiker wordt niet geremd", async () => {
    const limiter = makeLimiter(1);
    expect(await enforceRateLimit(limiter, "user-1")).toBeNull();
    expect(await enforceRateLimit(limiter, "user-1")).not.toBeNull();
    // Andere key = eigen venster.
    expect(await enforceRateLimit(limiter, "user-2")).toBeNull();
  });
});
