// Cross-surface next-action-defect (DOEL 1b) voor de FRANCHISER-rol: badge↔lijst-drift op de
// dormant-bench re-engagement-taak.
//
// Defect: /acties (`franchiserTasks`, pending-tasks.ts) toont per INZETBARE tenant-ZZP'er die op de
// bench zit (0 lopende samenwerkingen) én ≥ DORMANT_IDLE_DAYS (60) niet inlogde een
// `franchiseRosterReengagementTask` (deeplink /franchise/zzpers/{id}). De /franchise/zzpers-nav-badge
// (`navBadges` → `rosterAlerts` in signals.ts) telde echter alléén de (bijna-)verlopende
// (`expiringProfiles`) + reeds-verlopen (`expiredProfiles`) + niet-inzetbare (`notEngageable`) profielen.
// De badge-roster-query selecteerde niet eens het `_count` van ACTIVE-samenwerkingen dat
// `classifyRosterDormancy` nodig heeft, dus de dormancy-tier werd nooit berekend en de re-engagement-
// taak viel volledig uit de badge — terwijl /acties (en de dashboard-rail) 'm wél toont. Het "signaal op
// één oppervlak"-anti-patroon: het nav-item waar de taak naartoe deeplinkt bleef leeg. Asymmetrisch met
// de klant-spiegel (`franchiseClientReengagementTask` ↔ de `attentionClients`-term op
// /franchise/opdrachtgevers), die de badge wél meetelt.
//
// Fix: de badge-roster-query laadt nu hetzelfde ACTIVE-`_count` als de /acties-bron, en `rosterAlerts`
// telt een `dormantReengagement`-term mee — exact de emitter-volgorde spiegelend (INACTIEF `continue`t,
// alleen de inzetbare dormant-bench telt). Deze test is rood zolang die term ontbreekt.

import { beforeEach, describe, expect, it, vi } from "vitest";

// 90 dagen geleden (> DORMANT_IDLE_DAYS 60) → dormant. Vaste "now" zodat de test deterministisch is.
const NOW = new Date("2026-06-01T00:00:00.000Z");
const NINETY_DAYS_AGO = new Date(NOW.getTime() - 90 * 86_400_000);
const FUTURE = new Date("2030-01-01T00:00:00.000Z");

// Eén INZETBARE, dormant-bench roster-ZZP'er: verplichte docs (VOG/INSURANCE) VERIFIED + niet verlopen
// (→ geen blocker → niet INACTIEF), 0 lopende samenwerkingen, 90 dagen niet ingelogd.
const engageableDormantProfile = {
  id: "p-dormant",
  completeness: 100,
  availability: "AVAILABLE",
  user: { name: "Bench Vakmens", identityVerifiedAt: FUTURE, lastLoginAt: NINETY_DAYS_AGO },
  credentials: [
    { type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
    { type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
  ],
  _count: { collaborations: 0 },
};

let profileSelects: unknown[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    company: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    shiftHandoff: { count: vi.fn(async () => 0) },
    // Geen cert-alerts: alle expiring/expired-kandidaat- en dekkings-queries leveren niets.
    credential: { findMany: vi.fn(async () => []) },
    freelancerProfile: {
      findMany: vi.fn(async (a: { select?: unknown }) => {
        profileSelects.push(a.select);
        return [engageableDormantProfile];
      }),
    },
    job: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  profileSelects = [];
});

describe("navBadges FRANCHISER — dormant-bench re-engagement telt mee in de /franchise/zzpers-badge (DOEL 1b)", () => {
  it("telt een inzetbare, 90 dagen niet-ingelogde bench-ZZP'er (spiegelt franchiseRosterReengagementTask op /acties)", async () => {
    const badges = await navBadges("FRANCHISER", "u-1");
    // Zonder de fix mist de dormancy-term → geen badge; met de fix telt p-dormant exact één keer.
    expect(badges["/franchise/zzpers"]?.count).toBe(1);
  });

  it("laadt de ACTIVE-samenwerking-telling in de badge-roster-query (nodig voor classifyRosterDormancy)", async () => {
    await navBadges("FRANCHISER", "u-1");
    // De badge moet — net als de /acties-bron (pending-tasks.ts) — het ACTIVE-`_count` selecteren, anders
    // kan de dormancy-tier niet worden bepaald en drift de badge opnieuw van /acties.
    const withCount = profileSelects.find(
      (s): s is { _count: unknown } =>
        typeof s === "object" && s != null && "_count" in (s as Record<string, unknown>),
    );
    expect(withCount).toBeDefined();
  });
});
