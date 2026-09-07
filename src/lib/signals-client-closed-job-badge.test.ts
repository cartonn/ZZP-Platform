// Regressietest voor de /kandidaten-nav-badge (opdrachtgever): de badge (`navBadges`, signals.ts) mag
// een open reactie (NEW/VIEWED/SHORTLIST) NIET blijven meetellen zodra de opdrachtgever de opdracht
// heeft GESLOTEN (PUBLISHED→CLOSED) of teruggezet naar concept (PUBLISHED→DRAFT).
//
// Bug (gevonden persona-sweep): de PUBLISHED-poort die run 103 aan de kandidaat-BEOORDEELtaken in
// `pending-tasks.ts` toevoegde (regressietest `pending-tasks-client-closed-job.test.ts`) werd alleen op
// de item-engine toegepast, niet op de badge-bron. `navBadges` telde de NEW-reacties
// (`prisma.application.count`) en de stale VIEWED/SHORTLIST-reacties (`findMany`) alleen op `companyId`,
// zónder `job.status: "PUBLISHED"`. Gevolg: sluit de opdrachtgever een opdracht zonder de reactie te
// beoordelen, dan blijft de reactie NEW in de DB staan (`changeJobStatus` transitioneert reacties niet),
// verdwijnt de beoordeeltaak wél van /acties, maar bleef de /kandidaten-badge 'm eeuwig meetellen — een
// fantoom-badge die nooit op nul komt, in tegenspraak met /acties (het "signaal op één oppervlak"-
// anti-patroon dat dit bestand overal zelf documenteert).
//
// De test modelleert een wereld waarin álle open reacties op een NIET-PUBLISHED opdracht staan: een
// correcte, `job.status: "PUBLISHED"`-gescoopte query levert ze niet op (0/[]), een ongefilterde (buggy)
// query telt ze wél mee. Vóór de fix verscheen de /kandidaten-badge → rood; ná de fix niet → groen.

import { describe, it, expect, vi } from "vitest";

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000);

type WhereArg = {
  where?: {
    job?: { status?: unknown };
    status?: unknown;
    createdAt?: unknown;
  };
};

const isPublishedScoped = (args?: WhereArg) => args?.where?.job?.status === "PUBLISHED";

vi.mock("@/lib/db", () => ({
  prisma: {
    application: {
      // Wereld: NEW/VIEWED/SHORTLIST-reacties bestaan, maar allemaal op een GESLOTEN opdracht.
      // Een PUBLISHED-gescoopte query ziet ze dus niet; een ongefilterde query telt ze mee.
      count: vi.fn(async (args: WhereArg) => (isPublishedScoped(args) ? 0 : 4)),
      findMany: vi.fn(async (args: WhereArg) => {
        if (isPublishedScoped(args)) return []; // correcte, LIVE-gescoopte query
        const status = args?.where?.status;
        // staleCandidates: status ∈ {VIEWED, SHORTLIST} → één wachtende kandidaat op de gesloten opdracht.
        if (status && typeof status === "object" && "in" in status) {
          return [{ status: "VIEWED", createdAt: daysAgo(40), collaboration: null }];
        }
        return [];
      }),
    },
    // Overige oppervlakken stil: geen andere badge mag de /kandidaten-assert vertroebelen.
    job: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
      groupBy: vi.fn(async () => []),
    },
    invoice: { count: vi.fn(async () => 0) },
    performance: { count: vi.fn(async () => 0) },
    collaboration: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
      groupBy: vi.fn(async () => []),
    },
  },
}));

vi.mock("@/lib/user-context", () => ({
  getUserCompanyId: vi.fn(async () => "company-1"),
  getUserTenantId: vi.fn(async () => null),
  getUnreadConversationState: vi.fn(async () => ({ participants: [], latestForeign: new Map() })),
  getCredentialDossier: vi.fn(async () => []),
}));

vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});

vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { navBadges } from "@/lib/signals";

describe("navBadges (CLIENT) — /kandidaten-badge verdwijnt op een gesloten/concept-opdracht", () => {
  it("geen /kandidaten-badge voor open reacties op een NIET-PUBLISHED opdracht", async () => {
    const badges = await navBadges("CLIENT", "user-client");
    expect(badges["/kandidaten"]).toBeUndefined();
  });
});
