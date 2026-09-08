// Regressietest voor cross-surface next-action-drift op de FREELANCER /certificaten-nav-badge
// (persona-sweep, DOEL 1b). Drie divergenties tussen de badge-bron (`navBadges`, signals.ts) en de
// item-engine (`pending-tasks.ts` `freelancerTasks`) — telkens het "signaal op één oppervlak"-
// anti-patroon: /acties toonde een verleng-actie die de badge niet (of dubbel) telde.
//
//  1. Mid-plaatsing-verval: een vereist, nu-geldig VERIFIED-cert dat ná het 30-daagse venster maar
//     vóór de plaatsings-einddatum verloopt. /acties toont een credentialCollabExpiryTask
//     (`duringPlacementOnly`); de badge kende alleen het binnen-venster-`expiring` → onder-telling.
//  2. Computed-expired: een VERIFIED-cert waarvan `expiresAt` al is verstreken maar de expiry-cron
//     het nog niet naar EXPIRED heeft geflipt. /acties gebruikt de server-berekende verval-check;
//     de badge keek alleen naar `status === "EXPIRED"` → onder-telling tussen de cron-runs door.
//  3. Per-type dedup: twee verlopen exemplaren van hetzelfde niet-verplichte type. /acties toont
//     hooguit één verleng-taak per type; de badge telde per credential-id → over-telling (fantoom).
//
// Elke wereld hieronder is zo gekozen dat de buggy telling ≠ de item-engine, en de gefixte telling
// == de item-engine. Vóór de fix: rood; ná de fix: groen.

import { describe, it, expect, vi } from "vitest";

const NOW = Date.now();
const inDays = (d: number) => new Date(NOW + d * 86_400_000);

// ---- Mutabele wereld-staat, per test gezet ----
type Cred = {
  id: string;
  title: string;
  type: string;
  status: string;
  expiresAt: Date | null;
};
type CollabRow = {
  id: string;
  endDate: Date | null;
  job: { credentialRequirements: { credentialType: string }[] };
};
let DOSSIER: Cred[] = [];
let COLLAB_ROWS: CollabRow[] = [];

// Geldige verplichte documenten (VOG + verzekering) zodat de mandatory-document-basistelling 0 is en
// alleen de scenario-certificaten de /certificaten-badge bepalen.
const MANDATORY_OK: Cred[] = [
  { id: "m-vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: inDays(300) },
  {
    id: "m-ins",
    title: "Verzekering",
    type: "INSURANCE",
    status: "VERIFIED",
    expiresAt: inDays(300),
  },
];

type FindManyArgs = { select?: Record<string, unknown> } | undefined;
const wantsCredentialRequirements = (args: FindManyArgs) => {
  const job = args?.select?.job as { select?: Record<string, unknown> } | undefined;
  return job?.select?.credentialRequirements !== undefined;
};

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: vi.fn(async () => ({ id: "fp-1" })) },
    // De credentialCollab-query selecteert job.credentialRequirements; de renewal-query (endDate-only)
    // niet — zo scheiden we ze zonder de where te hoeven inspecteren.
    collaboration: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async (args: FindManyArgs) =>
        wantsCredentialRequirements(args) ? COLLAB_ROWS : [],
      ),
    },
    invoice: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    savedJob: { count: vi.fn(async () => 0) },
    message: { groupBy: vi.fn(async () => []) },
    notification: { count: vi.fn(async () => 0) },
  },
}));

vi.mock("@/lib/user-context", () => ({
  getCredentialDossier: vi.fn(async () => DOSSIER),
  getUnreadConversationState: vi.fn(async () => ({ participants: [], latestForeign: new Map() })),
  getUserCompanyId: vi.fn(async () => null),
  getUserTenantId: vi.fn(async () => null),
}));

vi.mock("@/lib/data/freelancer-cascade-work", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/freelancer-cascade-work")>();
  return { ...actual, getFreelancerCascadeWorkCount: vi.fn(async () => 0) };
});

import { navBadges } from "@/lib/signals";

function credentialBadgeCount(badges: Awaited<ReturnType<typeof navBadges>>): number {
  return badges["/certificaten"]?.count ?? 0;
}

describe("FREELANCER /certificaten-badge — pariteit met /acties (persona-sweep)", () => {
  it("telt mid-plaatsing-verval (na 30d, vóór einddatum) — spiegelt credentialCollabExpiryTask", async () => {
    // Vereist, nu-geldig cert dat over 45 dagen verloopt; plaatsing loopt tot 60 dagen. Buiten het
    // 30-daagse venster (dus niet in `expiring`), maar mid-inzet → /acties toont het, de badge moet ook.
    DOSSIER = [
      ...MANDATORY_OK,
      {
        id: "c-x",
        title: "Certificaat X",
        type: "CERT_X",
        status: "VERIFIED",
        expiresAt: inDays(45),
      },
    ];
    COLLAB_ROWS = [
      {
        id: "collab-1",
        endDate: inDays(60),
        job: { credentialRequirements: [{ credentialType: "CERT_X" }] },
      },
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(credentialBadgeCount(badges)).toBe(1);
  });

  it("telt een VERIFIED-cert met verstreken expiresAt (computed-expired, cron-gat)", async () => {
    // Cron heeft nog niet geflipt: status VERIFIED maar expiresAt ligt in het verleden. /acties toont
    // een verleng-taak (server-berekende verval-check); de badge moet dezelfde check gebruiken.
    DOSSIER = [
      ...MANDATORY_OK,
      {
        id: "c-y",
        title: "Certificaat Y",
        type: "CERT_Y",
        status: "VERIFIED",
        expiresAt: inDays(-1),
      },
    ];
    COLLAB_ROWS = [];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(credentialBadgeCount(badges)).toBe(1);
  });

  it("telt twee verlopen certs van hetzelfde type als één (per-type dedup, geen fantoom)", async () => {
    // Twee EXPIRED exemplaren van hetzelfde niet-verplichte type: /acties toont hooguit één verleng-
    // taak per type (één vernieuwing dekt het type), dus de badge mag er ook maar één tellen.
    DOSSIER = [
      ...MANDATORY_OK,
      {
        id: "c-z1",
        title: "Certificaat Z (oud)",
        type: "CERT_Z",
        status: "EXPIRED",
        expiresAt: inDays(-10),
      },
      {
        id: "c-z2",
        title: "Certificaat Z (ouder)",
        type: "CERT_Z",
        status: "EXPIRED",
        expiresAt: inDays(-40),
      },
    ];
    COLLAB_ROWS = [];
    const badges = await navBadges("FREELANCER", "u-1");
    expect(credentialBadgeCount(badges)).toBe(1);
  });
});
