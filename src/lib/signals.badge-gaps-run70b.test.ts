import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor badge↔lijst-drift (persona-sweep run 70, GEPARKEERD LOW): een door een lopende/
// voorgestelde samenwerking VEREIST (niet-verplicht) certificaat dat de ZZP'er MIST of dat VERLOPEN is,
// geeft op /acties (pending-tasks.ts) een credentialCollabMissing/-Expired-taak, maar de /certificaten-
// nav-badge telde alleen `rejected + expiring(VERIFIED) + mandatoryAlerts` → die dekken zo'n gat niet en
// de badge was stiller dan /acties. Deze test grendelt vast dat de badge het gat nu meetelt.

type Args = {
  where?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: unknown;
};

const FAR_FUTURE = new Date("2030-01-01T00:00:00.000Z");
// Geldige verplichte documenten (VOG + verzekering) als baseline, zodat mandatoryAlerts 0 is en de
// test uitsluitend de collab-vereist-gat-bijdrage isoleert.
const VALID_MANDATORY = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FAR_FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FAR_FUTURE },
];

const state = {
  collab: null as unknown,
  fullCreds: [] as unknown[],
  mandatoryCreds: VALID_MANDATORY as unknown[],
};

// De collab-vereist-certificaat-gaten worden geteld uit de ONGEWINDOWDE credential-collab-query
// (`credentialCollabWhere`, run 82): status in {PROPOSED,ACTIVE} + selecteert job.credentialRequirements
// (geen performances/invoices meer — die tellen nu via aparte counts). Voed alleen die query.
function isCredentialCollabQuery(a: Args): boolean {
  const inList = (a.where?.status as { in?: string[] })?.in ?? [];
  const job = a.select?.job as { select?: Record<string, unknown> } | undefined;
  return inList.includes("PROPOSED") && job?.select?.credentialRequirements !== undefined;
}

const collaborationFindMany = vi.fn((a: Args) =>
  Promise.resolve(isCredentialCollabQuery(a) && state.collab ? [state.collab] : []),
);
const credentialFindMany = vi.fn((a: Args) => {
  const where = a.where ?? {};
  if (where.type !== undefined) return Promise.resolve(state.mandatoryCreds); // verplichte-docs-query
  if (where.status === "VERIFIED") return Promise.resolve([]); // expiry-set (leeg in deze tests)
  // Volledige certificaatset (geen status-filter): voedt de plaatsings-gate + de gaten-helper.
  if (where.status === undefined) return Promise.resolve(state.fullCreds);
  return Promise.resolve([]);
});

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(() => Promise.resolve({ tenantId: "t-1" })) },
    company: { findUnique: vi.fn(() => Promise.resolve({ id: "co-1" })) },
    freelancerProfile: {
      findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    application: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    job: { count: vi.fn(() => Promise.resolve(0)), findMany: vi.fn(() => Promise.resolve([])) },
    collaboration: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: (a: Args) => collaborationFindMany(a),
    },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
    invoice: { count: vi.fn(() => Promise.resolve(0)), findMany: vi.fn(() => Promise.resolve([])) },
    lead: { count: vi.fn(() => Promise.resolve(0)) },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: (a: Args) => credentialFindMany(a),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    notification: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

const proposedRequiring = (credentialType: string) => ({
  status: "PROPOSED",
  job: { credentialRequirements: [{ credentialType }] },
  performances: [],
  invoices: [],
});

beforeEach(() => {
  collaborationFindMany.mockClear();
  credentialFindMany.mockClear();
  state.collab = null;
  state.fullCreds = [];
  state.mandatoryCreds = VALID_MANDATORY;
});

describe("FREELANCER /certificaten-badge — collab-vereist gat telt mee (run 70)", () => {
  it("telt een volledig ONTBREKEND vereist (niet-verplicht) certificaat", async () => {
    state.collab = proposedRequiring("CERTIFICATE"); // ZZP'er heeft er geen enkel exemplaar van
    state.fullCreds = [];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/certificaten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("telt een VERLOPEN vereist (niet-verplicht) certificaat", async () => {
    state.collab = proposedRequiring("LICENSE");
    state.fullCreds = [
      {
        id: "big-old",
        title: "BIG-registratie",
        type: "LICENSE",
        status: "EXPIRED",
        expiresAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/certificaten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("geen badge wanneer het vereiste certificaat nu-geldig geverifieerd is", async () => {
    state.collab = proposedRequiring("LICENSE");
    state.fullCreds = [
      {
        id: "big-ok",
        title: "BIG-registratie",
        type: "LICENSE",
        status: "VERIFIED",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      },
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/certificaten"]).toBeUndefined();
  });
});
