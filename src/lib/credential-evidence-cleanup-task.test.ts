import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// De opruimtaak is het vangnet onder een mislukte opslag-verwijdering: een VOG die wél beoordeeld is
// (evidenceSeenAt gezet) maar waarvan het bestand nog staat (evidenceRemovedAt leeg, documentId nog
// gevuld) moet alsnog worden gewist. Anders blijft een strafrechtelijk gegeven achter na één storing.

type CleanupRow = { id: string; type: string; documentId: string };
type RemovalResult = { removed: boolean; skipped: string | null };

const { findMany, removeEvidence } = vi.hoisted(() => ({
  findMany: vi.fn<(args: { where: Record<string, unknown> }) => Promise<CleanupRow[]>>(),
  removeEvidence: vi.fn<(args: Record<string, unknown>) => Promise<RemovalResult>>(),
}));

vi.mock("@/lib/db", () => ({ prisma: { credential: { findMany } } }));
vi.mock("@/lib/credential-evidence", () => ({ removeCredentialEvidence: removeEvidence }));

import { runCredentialEvidenceCleanupTask } from "./credential-evidence-cleanup-task";

beforeEach(() => {
  vi.clearAllMocks();
  removeEvidence.mockResolvedValue({ removed: true, skipped: null });
  delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
});

afterEach(() => {
  delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
});

describe("runCredentialEvidenceCleanupTask", () => {
  it("selecteert alleen beoordeelde rijen met een nog-aanwezig bewijsstuk", async () => {
    findMany.mockResolvedValue([]);

    const result = await runCredentialEvidenceCleanupTask();

    expect(result).toEqual({ removed: 0, failed: 0 });
    expect(findMany.mock.calls[0]![0].where).toEqual({
      evidenceSeenAt: { not: null },
      evidenceRemovedAt: null,
      documentId: { not: null },
    });
  });

  it("ruimt een achtergebleven VOG-bestand alsnog op (systeemactie, geen actor)", async () => {
    findMany.mockResolvedValue([{ id: "cred-1", type: "VOG", documentId: "doc-1" }]);

    const result = await runCredentialEvidenceCleanupTask();

    expect(result).toEqual({ removed: 1, failed: 0 });
    expect(removeEvidence).toHaveBeenCalledWith({
      actorId: null,
      credentialId: "cred-1",
      documentId: "doc-1",
      source: "[bewijsstuk-opruiming]",
    });
  });

  it("telt een opnieuw mislukte verwijdering als openstaand", async () => {
    findMany.mockResolvedValue([{ id: "cred-1", type: "VOG", documentId: "doc-1" }]);
    removeEvidence.mockResolvedValue({ removed: false, skipped: "storage-failed" });

    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 1 });
  });

  it("laat een diploma met rust — dat type houdt zijn bewijsstuk", async () => {
    findMany.mockResolvedValue([{ id: "cred-2", type: "DIPLOMA", documentId: "doc-2" }]);

    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
    expect(removeEvidence).not.toHaveBeenCalled();
  });

  it("respecteert de env-override: met 'file' wordt er niets meer gewist", async () => {
    process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG = "file";
    findMany.mockResolvedValue([{ id: "cred-1", type: "VOG", documentId: "doc-1" }]);

    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
    expect(removeEvidence).not.toHaveBeenCalled();
  });
});
