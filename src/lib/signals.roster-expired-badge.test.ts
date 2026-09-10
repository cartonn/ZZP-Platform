// Cross-surface next-action-defect (DOEL 1b) voor de FRANCHISER-rol: badge↔lijst-drift op het
// reeds-verlopen roster-certificaat.
//
// Defect: /acties (`franchiserTasks`, pending-tasks.ts) toont per tenant-ZZP'er met een REEDS verlopen,
// NIET-verplicht certificaat een `franchiseCredentialExpiredTask` (deeplink /franchise/zzpers/{id}). De
// /franchise/zzpers-nav-badge (`navBadges` → `rosterAlerts` in signals.ts) telde echter alléén de
// (bijna-)verlopende (`expiringProfiles`) + niet-inzetbare (`notEngageable`) profielen — er was géén
// query en geen term voor de reeds-verlopen certificaten. Zodra een cert de vervaldatum passeerde viel
// het uit het `(now, soon]`-verloopvenster en verdween het uit de badge, terwijl /acties de "verlopen"-
// taak juist dán toont: de badge onder-rapporteerde de compliance-gap precies toen die actief werd.
//
// Fix: de FRANCHISER-badge draait nu dezelfde twee-staps-aanpak als pending-tasks.ts (kandidaten →
// gescopet volledig VERIFIED/EXPIRED-dossier → `rosterExpiredByProfile`) en telt `expiredProfiles` mee
// in `rosterAlerts`. Deze test is rood zolang die term ontbreekt.

import { beforeEach, describe, expect, it, vi } from "vitest";

type CredQuery = {
  where?: {
    status?: unknown;
    expiresAt?: unknown;
    OR?: unknown;
    type?: unknown;
    freelancerProfileId?: unknown;
  };
};

const PAST = new Date("2020-01-01T00:00:00.000Z");
let credQueries: CredQuery[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    company: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    shiftHandoff: { count: vi.fn(async () => 0) },
    credential: {
      findMany: vi.fn(async (a: CredQuery) => {
        credQueries.push(a);
        const w = a.where ?? {};
        // Kandidaat-query voor REEDS verlopen certs (heeft de OR-tak status EXPIRED / VERIFIED<now).
        if (Array.isArray(w.OR)) return [{ freelancerProfileId: "p1" }];
        // Dekkings-query voor de verlopen-tak (status ∈ {VERIFIED, EXPIRED}): lever het volledige
        // dossier van p1 — één verlopen, niet-verplicht certificaat zonder nu-geldige dekking.
        const status = w.status as { in?: unknown } | undefined;
        if (status && typeof status === "object" && Array.isArray(status.in)) {
          return [
            {
              id: "c1",
              type: "CERTIFICATE",
              status: "EXPIRED",
              expiresAt: PAST,
              freelancerProfileId: "p1",
            },
          ];
        }
        // Expiring-kandidaat + expiring-dekking: geen (bijna-)verlopende certs.
        return [];
      }),
    },
    freelancerProfile: { findMany: vi.fn(async () => []) },
    job: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  credQueries = [];
});

describe("navBadges FRANCHISER — reeds-verlopen roster-cert telt mee in de /franchise/zzpers-badge (DOEL 1b)", () => {
  it("telt een tenant-ZZP'er met een verlopen niet-verplicht certificaat (spiegelt franchiseCredentialExpiredTask op /acties)", async () => {
    const badges = await navBadges("FRANCHISER", "u-1");
    // Zonder de fix is er geen verlopen-term → geen badge; met de fix telt p1 exact één keer.
    expect(badges["/franchise/zzpers"]?.count).toBe(1);
  });

  it("draait een kandidaat-query met de server-berekende verval-scope (status EXPIRED óf VERIFIED<now, niet-verplicht type)", async () => {
    await navBadges("FRANCHISER", "u-1");
    // De verlopen-kandidaat-query moet exact de /acties-bron (`expiredRosterCreds`, pending-tasks.ts)
    // spiegelen: verplichte typen uitsluiten (die dekt de engageability-tak) en verval server-berekenen.
    const expiredCandidate = credQueries.find((q) => Array.isArray(q.where?.OR));
    expect(expiredCandidate).toBeDefined();
    expect(expiredCandidate?.where?.type).toMatchObject({ notIn: ["VOG", "INSURANCE"] });
  });
});
