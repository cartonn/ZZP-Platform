// Cross-surface next-action-defect (DOEL 1b) voor de FRANCHISER-rol: badge↔lijst-drift op het
// stilgevallen-op-de-bench roster-signaal.
//
// Defect: /acties (`franchiserTasks`, pending-tasks.ts) toont per inzetbare tenant-ZZP'er die op de
// bench zit (geen lopende opdracht) én is afgekoeld (≥ DORMANT_IDLE_DAYS niet ingelogd) een
// `franchiseRosterReengagementTask` (deeplink /franchise/zzpers/{id}, tone `attention`). De
// /franchise/zzpers-nav-badge (`navBadges` → `rosterAlerts` in signals.ts) telde echter alléén de
// (bijna-)verlopende + reeds-verlopen certificaten + niet-inzetbare (INACTIEF) profielen — er was géén
// dormancy-term. Een inzetbare, stilgevallen bench-vakmens zonder certificaat-issue verscheen dus wél op
// /acties (en in `pendingTaskCount`) maar de /franchise/zzpers-badge bleef op 0: het "signaal op één
// oppervlak"-anti-patroon, terwijl de klant-kant (`attentionClients`) de spiegel-taak wél telt.
//
// Fix: de FRANCHISER-badge laadt nu dezelfde `_count`-bench-telling en draait dezelfde pure
// `classifyRosterDormancy` als `franchiserTasks`, en telt de `dormant`-tier mee in `rosterAlerts`. Deze
// test is rood zolang die term ontbreekt.

import { describe, expect, it, vi } from "vitest";

const DAY = 86_400_000;
const NOW = Date.now();
const future = new Date(NOW + 300 * DAY);

// Inzetbare, stilgevallen bench-vakmens: verplichte documenten (VOG + verzekering) geldig → geen blocker
// → status AANDACHT/ACTIEF (niet INACTIEF); 0 lopende samenwerkingen (bench); 90 dagen niet ingelogd
// (≥ DORMANT_IDLE_DAYS=60) → `classifyRosterDormancy` tier `dormant`.
const DORMANT_ROSTER_ROW = {
  id: "p1",
  completeness: 100,
  availability: "AVAILABLE",
  user: {
    name: "Sanne",
    identityVerifiedAt: new Date(NOW - 200 * DAY),
    lastLoginAt: new Date(NOW - 90 * DAY),
  },
  credentials: [
    { type: "VOG", status: "VERIFIED", expiresAt: future },
    { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
  ],
  _count: { collaborations: 0 },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    company: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    shiftHandoff: { count: vi.fn(async () => 0) },
    // Geen (bijna-)verlopende of reeds-verlopen roster-certificaten → alleen de dormancy-term drijft de badge.
    credential: { findMany: vi.fn(async () => []) },
    freelancerProfile: { findMany: vi.fn(async () => [DORMANT_ROSTER_ROW]) },
    job: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
  },
}));

import { navBadges } from "./signals";

describe("navBadges FRANCHISER — stilgevallen bench-ZZP'er telt mee in de /franchise/zzpers-badge (DOEL 1b)", () => {
  it("telt een inzetbare, afgekoelde bench-vakmens (spiegelt franchiseRosterReengagementTask op /acties)", async () => {
    const badges = await navBadges("FRANCHISER", "u-1");
    // Zonder de dormancy-term is er geen badge; met de fix telt p1 exact één keer.
    expect(badges["/franchise/zzpers"]?.count).toBe(1);
  });

  it("telt een nu-ingezette vakmens NIET als stilgevallen (activeCollaborations > 0 = engaged via het werk)", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.freelancerProfile.findMany).mockResolvedValueOnce([
      { ...DORMANT_ROSTER_ROW, _count: { collaborations: 1 } },
    ] as never);
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/zzpers"]).toBeUndefined();
  });
});
