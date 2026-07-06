// Bewijst dat de company-logo-upload de malware-scanner (#631) doorloopt vóór opslag — dezelfde
// poort als de document-/certificaat-upload. Zonder de `assertUploadClean`-regel omzeilt de
// logo-upload de scanner: een besmet bestand belandt onbekeken in de opslag en wordt via /api/media
// aan elke ingelogde gebruiker geserveerd (OWASP A04 insecure design; CLAUDE.md regel 4).
//
// Alleen IO (prisma, authz, audit, next/cache, storage, upload-scanner) is gemockt; de
// validatie-/mapping-logica draait echt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadValidationError } from "@/lib/services/storage";

const store = {
  scanCalls: [] as Array<{ mimeType: string; size: number }>,
  putCalls: [] as Array<{ key: string }>,
  infected: false,
};

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "client-1", role: "CLIENT", status: "ACTIVE" })),
  assertOwnership: vi.fn(() => {}),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(async () => ({ id: "co-1", userId: "client-1", logoKey: null })),
      update: vi.fn(async () => ({ id: "co-1" })),
    },
    industry: { findUnique: vi.fn(async () => ({ id: "ind-1" })) },
  },
}));
vi.mock("@/lib/services/storage", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/services/storage")>("@/lib/services/storage");
  return {
    ...actual,
    generateStorageKey: vi.fn(() => "logos/scan-test.png"),
    getStorage: vi.fn(() => ({
      put: vi.fn(async (key: string) => {
        store.putCalls.push({ key });
      }),
      delete: vi.fn(async () => {}),
    })),
    // Content-type-check overslaan zodat de test op de scanner-poort focust (niet op magic bytes).
    assertContentMatchesMime: vi.fn(() => {}),
  };
});
vi.mock("@/lib/services/upload-scanner", () => ({
  assertUploadClean: vi.fn(async (_buffer: Buffer, target: { mimeType: string; size: number }) => {
    store.scanCalls.push(target);
    if (store.infected) {
      throw new UploadValidationError("Dit bestand is geweigerd: de malware-scan sloeg aan.");
    }
  }),
}));

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function formDataWithLogo(): FormData {
  const fd = new FormData();
  fd.set("name", "Testbedrijf");
  fd.set("website", "");
  fd.set("industryId", "");
  fd.set("logo", new File([PNG_HEADER], "logo.png", { type: "image/png" }));
  return fd;
}

describe("updateCompanyProfile — logo malware-scan", () => {
  beforeEach(() => {
    store.scanCalls = [];
    store.putCalls = [];
    store.infected = false;
  });

  it("scant het logo vóór opslag (scanner wordt aangeroepen, dan pas storage.put)", async () => {
    const { updateCompanyProfile } = await import("./actions");
    const res = await updateCompanyProfile(undefined, formDataWithLogo());

    // De scanner is aangeroepen met het juiste doel...
    expect(store.scanCalls).toEqual([{ mimeType: "image/png", size: PNG_HEADER.length }]);
    // ...en de upload is geslaagd (schoon bestand → opslag).
    expect(store.putCalls).toHaveLength(1);
    expect(res).not.toHaveProperty("fieldErrors.logo");
  });

  it("weigert een besmet logo: geen storage.put, fieldError terug (fail-closed)", async () => {
    store.infected = true;
    const { updateCompanyProfile } = await import("./actions");
    const res = await updateCompanyProfile(undefined, formDataWithLogo());

    // Cruciaal: het besmette bestand mag NOOIT worden opgeslagen.
    expect(store.putCalls).toHaveLength(0);
    expect(res?.fieldErrors?.logo).toMatch(/malware/i);
  });
});
