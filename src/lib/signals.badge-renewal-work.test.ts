import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor een cross-surface next-action-defect (persona-sweep run 67, DOEL 1b):
// de `collaborationRenewalTask` ("plan een vervolg" — ACTIVE-samenwerking op/voorbij `endDate`) staat
// op /acties + de dashboard-rail (`renewalTasks` in pending-tasks.ts) maar ontbrak in de
// `/samenwerkingen`-nav-badge (`cascadeWork`) — de badge keek niet naar `endDate`. Badge stiller dan
// /acties: het "signaal op één oppervlak"-anti-patroon (zie #1026/#1030). We asserten dat de badge de
// renewal-attention-telling nu meetelt, gevoed door dezelfde `summarizeCollaborationRenewal`-bron.

type Query = { where?: Record<string, unknown>; orderBy?: unknown };

const DAY = 1000 * 60 * 60 * 24;
const endInDays = (d: number) => new Date(Date.now() + d * DAY);

// De renewal-badge-query is te herkennen aan de `endDate`-filter + `orderBy: { endDate: "asc" }`;
// de cascade-werk-query heeft dat niet. Zo voeden we alleen de renewal-tak met een fixture.
let renewalRows: { endDate: Date | null }[] = [];
const collaborationFindMany = vi.fn((a: Query) => {
  const isRenewalQuery = a.where != null && "endDate" in a.where;
  return Promise.resolve(isRenewalQuery ? renewalRows : []);
});

vi.mock("@/lib/db", () => ({
  prisma: {
    // fiscale-deadline-bron (BTW/IB) die navBadges nu leest; geen deadlines in deze test (run 73).
    administrationEntry: { findMany: () => Promise.resolve([]) },
    freelancerProfile: { findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })) },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    invoice: { count: vi.fn(() => Promise.resolve(0)) },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
    collaboration: { findMany: (a: Query) => collaborationFindMany(a) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

describe("navBadges FREELANCER — vervolgsignaal telt mee in de /samenwerkingen-badge (run 67)", () => {
  beforeEach(() => {
    collaborationFindMany.mockClear();
    renewalRows = [];
  });

  it("een aflopende (ending_soon) en een net-verstreken (overdue) samenwerking tellen als cascadewerk", async () => {
    renewalRows = [
      { endDate: endInDays(10) }, // ending_soon → attention
      { endDate: endInDays(-3) }, // overdue binnen grace → attention
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/samenwerkingen"]).toEqual({ count: 2, tone: "attention" });
  });

  it("een nog-lang-lopende (on_track) samenwerking telt NIET mee → geen badge", async () => {
    // Ver buiten het venster: valt sowieso al buiten de DB-pre-filter, maar de pure grens bevestigt 0.
    renewalRows = [{ endDate: endInDays(200) }];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/samenwerkingen"]).toBeUndefined();
  });
});
