import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest (security/privacy-audit 2026-09-03): removeCredentialEvidence draait vanuit twee
// bronnen zonder lock — de verificatiequeue (direct na de beslissing) én de opruimtaak (cron). Twee
// gelijktijdige aanroepen voor hetzelfde bewijsstuk, of een aanroep die een herindiening verliest,
// mogen GEEN spookregel in het audittrail achterlaten: de compound-guard matcht dan 0 rijen en er is
// niets verwijderd, dus er hoort geen tweede CREDENTIAL_EVIDENCE_REMOVED bij (CLAUDE.md regel 5 —
// audit weerspiegelt de werkelijkheid). De happy-path (count:1) blijft ongewijzigd.

const {
  documentFindUnique,
  credentialCount,
  updateMany,
  documentDeleteMany,
  auditCreate,
  storageDelete,
} = vi.hoisted(() => ({
  documentFindUnique: vi.fn(async () => ({ storageKey: "vog/abc.pdf" })),
  credentialCount: vi.fn(async () => 0),
  updateMany: vi.fn(async () => ({ count: 1 })),
  documentDeleteMany: vi.fn(async () => ({ count: 1 })),
  auditCreate: vi.fn<(args: { data: { action: string } }) => Promise<unknown>>(async () => ({})),
  storageDelete: vi.fn(async () => {}),
}));

const txClient = {
  credential: { updateMany },
  document: { deleteMany: documentDeleteMany },
  auditLog: { create: auditCreate },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    document: { findUnique: documentFindUnique },
    credential: { count: credentialCount },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("@/lib/services/storage", () => ({ getStorage: () => ({ delete: storageDelete }) }));
vi.mock("@/lib/observability/storage-failure", () => ({ logStorageCleanupFailure: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { removeCredentialEvidence } from "./credential-evidence";

const opts = {
  actorId: null,
  credentialId: "cred-1",
  documentId: "doc-1",
  source: "[test]",
};

beforeEach(() => {
  vi.clearAllMocks();
  documentFindUnique.mockResolvedValue({ storageKey: "vog/abc.pdf" });
  credentialCount.mockResolvedValue(0);
  updateMany.mockResolvedValue({ count: 1 });
  documentDeleteMany.mockResolvedValue({ count: 1 });
});

describe("removeCredentialEvidence", () => {
  it("happy-path (count:1): verwijdert bestand + Document-rij en schrijft één audit", async () => {
    const result = await removeCredentialEvidence(opts);

    expect(result).toEqual({ removed: true, skipped: null });
    expect(storageDelete).toHaveBeenCalledWith("vog/abc.pdf");
    expect(documentDeleteMany).toHaveBeenCalledWith({ where: { id: "doc-1" } });
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate.mock.calls[0]![0]).toMatchObject({
      data: { action: "CREDENTIAL_EVIDENCE_REMOVED" },
    });
  });

  it("verloren race (count:0): GEEN Document-delete en GEEN spook-audit", async () => {
    updateMany.mockResolvedValue({ count: 0 }); // credential wijst niet meer naar dít bewijsstuk

    const result = await removeCredentialEvidence(opts);

    expect(result).toEqual({ removed: false, skipped: "no-document" });
    // De opslag-verwijdering is idempotent al gedaan, maar er mag geen tweede audit + geen doc-delete
    // op een verwijdering die deze aanroep niet uitvoerde.
    expect(documentDeleteMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
