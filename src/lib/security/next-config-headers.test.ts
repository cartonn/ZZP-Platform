import { describe, expect, it } from "vitest";
// Regressiepoort op de statische security-headers uit next.config.mjs. Deze headers vallen buiten
// de per-request middleware (die de CSP-nonce zet) en zijn makkelijk stil te verliezen bij een
// config-refactor. Bevestig de kritieke set inclusief de nieuwe cross-origin-isolatie.
import nextConfig from "../../../next.config.mjs";

type HeaderKV = { key: string; value: string };
type HeaderRule = { source: string; headers: HeaderKV[] };

async function globalHeaders(): Promise<Map<string, string>> {
  const entries = (await nextConfig.headers()) as unknown as HeaderRule[];
  const global = entries.find((e) => e.source === "/:path*");
  if (!global) throw new Error("verwacht een /:path* header-entry in next.config");
  return new Map(global.headers.map((h) => [h.key, h.value]));
}

describe("next.config global security headers", () => {
  it("dwingt de kern-beveiligingsheaders af", async () => {
    const h = await globalHeaders();
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(h.get("Strict-Transport-Security")).toContain("includeSubDomains");
  });

  it("isoleert cross-origin (COOP + CORP same-origin)", async () => {
    const h = await globalHeaders();
    expect(h.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(h.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("ontzegt krachtige browserfuncties via een uitgebreide Permissions-Policy", async () => {
    const h = await globalHeaders();
    const pp = h.get("Permissions-Policy") ?? "";
    // Volledig uit voor hardware/sensors + betaal-/USB-toegang die het platform niet gebruikt.
    for (const directive of [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
    ]) {
      expect(pp).toContain(directive);
    }
    // Tracking-opt-out (FLoC/Topics).
    expect(pp).toContain("interest-cohort=()");
    expect(pp).toContain("browsing-topics=()");
  });
});
