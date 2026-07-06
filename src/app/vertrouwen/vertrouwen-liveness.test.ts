// Regressietest voor de liveness- én tenant-poort op de publieke, sessieloze vertrouwensdossier-
// deelpagina (/vertrouwen/[profileId]/[token]). Het deel-token is een deterministische, per-profiel
// onveranderlijke HMAC — een geldig token blijft dus geldig ná schorsing of anonimisering, en de
// schorsing/anonimisering raakt `FreelancerProfile.visibility` niet. Zonder de poorten bleef deze
// pagina naam + VERIFIED-certificaten + de "Servergeverifieerd door ZZP Platform"-zegel serveren voor:
//   - een geschorst/geanonimiseerd account (AVG art. 17; OWASP A01 — stale server-side status), en
//   - een tenant-gebonden roster-ZZP'er (franchise, `createZzper` = PUBLIC + tenantId), die elders
//     per tenant is afgeschermd (`tenantEntityVisibleTo`) → cross-tenant-lek op een publieke bearer-URL.
//
// De sibling-viewer `/zzp/[id]` (profile-screen.tsx) dwingt beide poorten al af; deze pagina deed dat
// NIET. Spiegelt de agenda-feed-liveness-fix (#630).
//
// Observeerbaar signaal: `audit()` (TRUST_DOSSIER_VIEWED) wordt alléén op het "gedeeld"-pad aangeroepen,
// ná de `isShared`-poort. Wordt het dossier geweigerd, dan is er geen audit — én geen serve.
// Cases 2–4 falen zonder de nieuwe poorten (rood→groen).

import { describe, it, expect, vi, beforeEach } from "vitest";

const SECRET = "test-secret-minstens-16-tekens";

const store = {
  profile: null as Record<string, unknown> | null,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
const findUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/share-token", () => ({
  shareTokenSecret: () => SECRET,
  // Geldig token = de letterlijke string "valid"; al het andere is ongeldig.
  verifyDossierToken: (_id: string, token: string) => token === "valid",
}));
vi.mock("@/lib/db", () => ({
  prisma: { freelancerProfile: { findUnique: findUniqueMock } },
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/rate-limit", () => ({
  dossierViewRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.1" })),
}));

import TrustDossierPage from "./[profileId]/[token]/page";

function activeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "profile-1",
    visibility: "PUBLIC",
    tenantId: null,
    headline: "Verpleegkundige",
    user: {
      name: "Jan de Vries",
      identityVerifiedAt: new Date(),
      status: "ACTIVE",
      anonymizedAt: null,
    },
    credentials: [],
    ...overrides,
  };
}

async function render(token: string) {
  return TrustDossierPage({
    params: Promise.resolve({ profileId: "profile-1", token }),
  } as never);
}

describe("/vertrouwen/[profileId]/[token] — liveness- & tenant-poort", () => {
  beforeEach(() => {
    store.profile = activeProfile();
    findUniqueMock.mockReset();
    findUniqueMock.mockImplementation(async () => store.profile);
    auditMock.mockClear();
  });

  it("actief + PUBLIC + geen tenant + geldig token → dossier gedeeld (audit gelogd)", async () => {
    await render("valid");
    expect(auditMock).toHaveBeenCalledTimes(1);
  });

  it("geschorst account (status !== ACTIVE) → niet gedeeld, geen audit", async () => {
    store.profile = activeProfile({
      user: { name: "Jan", identityVerifiedAt: null, status: "SUSPENDED", anonymizedAt: null },
    });
    await render("valid");
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("geanonimiseerd account (anonymizedAt gezet) → niet gedeeld, geen audit", async () => {
    store.profile = activeProfile({
      user: {
        name: "Jan",
        identityVerifiedAt: null,
        status: "ACTIVE",
        anonymizedAt: new Date("2026-01-01T00:00:00Z"),
      },
    });
    await render("valid");
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("tenant-gebonden roster-ZZP'er (tenantId gezet) → niet gedeeld op de publieke URL, geen audit", async () => {
    store.profile = activeProfile({ tenantId: "tenant-a" });
    await render("valid");
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("ongeldig token → niet gedeeld, geen audit", async () => {
    await render("wrong");
    expect(auditMock).not.toHaveBeenCalled();
  });
});
