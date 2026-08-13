import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor een cross-surface next-action-defect (persona-sweep run 65, DOEL 1b):
// de FREELANCER /certificaten-nav-badge telde een bijna-verlopend VERIFIED-certificaat mee terwijl
// /acties + de dashboard-rail (`freelancerTasks` → `supersededVerifiedCredentialIds`) dat exemplaar
// juist UITSLUITEN zodra een nieuwer, nu-geldig certificaat van HETZELFDE type de compliance al
// draagt. Repro: de ZZP'er vernieuwt door een nieuw cert aan te maken (oud verloopt < 30d, nieuw
// > 30d) → /acties toont 0 credential-taken, maar de badge toonde "1 attention" die nooit klaart.
// Exact de drift die #1026 op de FRANCHISER-roster-badge dichtte, hier op de ZZP-eigen badge.

type Where = { where?: Record<string, unknown> };

// Eén gedeelde findMany-mock voedt zowel de VERIFIED-dossier-query (superseded/verval) als de
// verplichte-documenten-query. De fixture bevat daarom altijd geldige VOG + INSURANCE zodat de
// mandatory-telling 0 blijft en we `expiring` geïsoleerd meten.
let dossier: { id: string; type: string; status: string; expiresAt: Date | null }[] = [];
const credentialFindMany = vi.fn((_a: Where) => Promise.resolve(dossier));

vi.mock("@/lib/db", () => ({
  prisma: {
    // fiscale-deadline-bron (BTW/IB) die navBadges nu leest; geen deadlines in deze test (run 73).
    administrationEntry: { findMany: () => Promise.resolve([]) },
    freelancerProfile: { findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })) },
    credential: {
      count: vi.fn(() => Promise.resolve(0)), // geen REJECTED
      findMany: (a: Where) => credentialFindMany(a),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    invoice: { count: vi.fn(() => Promise.resolve(0)) },
    collaboration: { findMany: vi.fn(() => Promise.resolve([])) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

const DAY = 1000 * 60 * 60 * 24;
const soon = () => new Date(Date.now() + DAY * 10); // binnen het 30-daagse venster
const later = () => new Date(Date.now() + DAY * 400); // ver buiten het venster
const validMandatory = () => [
  { id: "vog", type: "VOG", status: "VERIFIED", expiresAt: later() },
  { id: "ins", type: "INSURANCE", status: "VERIFIED", expiresAt: later() },
];

describe("navBadges FREELANCER — superseded verval-certificaat telt niet in de /certificaten-badge (run 65)", () => {
  beforeEach(() => {
    credentialFindMany.mockClear();
    dossier = [];
  });

  it("een superseded bijna-verlopend VERIFIED-cert telt NIET mee (badge = /acties, geen valse telling)", async () => {
    dossier = [
      ...validMandatory(),
      { id: "cert-old", type: "CERTIFICATE", status: "VERIFIED", expiresAt: soon() }, // verlopend
      { id: "cert-new", type: "CERTIFICATE", status: "VERIFIED", expiresAt: later() }, // dekker
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    // cert-old is superseded door cert-new → geen verval-telling; mandatory 0; rejected 0 → geen badge.
    expect(badges["/certificaten"]).toBeUndefined();
  });

  it("een écht bijna-verlopend cert (geen dekker) telt WEL mee → badge count 1", async () => {
    dossier = [
      ...validMandatory(),
      { id: "lic", type: "LICENSE", status: "VERIFIED", expiresAt: soon() }, // verlopend, ongedekt
      { id: "cert-old", type: "CERTIFICATE", status: "VERIFIED", expiresAt: soon() }, // superseded
      { id: "cert-new", type: "CERTIFICATE", status: "VERIFIED", expiresAt: later() },
    ];
    const badges = await navBadges("FREELANCER", "u-1");
    // Alleen het ongedekte LICENSE-cert telt (CERTIFICATE-paar is superseded) → count 1.
    expect(badges["/certificaten"]).toEqual({ count: 1, tone: "attention" });
  });
});
