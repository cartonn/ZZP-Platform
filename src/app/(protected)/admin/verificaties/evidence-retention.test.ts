import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Bewijsstuk-bewaarbeleid in de verificatiequeue (AVG / lijn Autoriteit Persoonsgegevens): een VOG
// wordt na de beoordeling uit de opslag verwijderd en het platform bewaart alleen "gezien + datum".
// Bewijst de gedragsmatrix:
//   (a) VOG goedkeuren   → bestand weg, Document-rij weg, evidenceSeen*/RemovedAt gezet, audit
//   (b) DIPLOMA goedkeuren → bestand blijft, geen inzage-registratie
//   (c) opslagfout        → status gaat door, evidenceRemovedAt LEEG, gestructureerde log
//   (d) env-override file → bestand blijft
//   (e) VOG afwijzen      → zelfde opruiming als goedkeuren

const {
  credentialFindUnique,
  credentialUpdateMany,
  credentialCount,
  documentFindUnique,
  documentDeleteMany,
  auditCreate,
  storageDelete,
  logCleanupFailure,
} = vi.hoisted(() => ({
  credentialFindUnique: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  credentialUpdateMany:
    vi.fn<(args: { data: Record<string, unknown> }) => Promise<{ count: number }>>(),
  credentialCount: vi.fn(async () => 0),
  documentFindUnique: vi.fn(async () => ({ storageKey: "vog/abc.pdf" })),
  documentDeleteMany: vi.fn(async () => ({ count: 1 })),
  auditCreate:
    vi.fn<(args: { data: { action: string; metadata?: string | null } }) => Promise<unknown>>(),
  storageDelete: vi.fn(async () => {}),
  logCleanupFailure: vi.fn(),
}));

const txClient = {
  credential: { updateMany: credentialUpdateMany },
  credentialVerification: { create: vi.fn(async () => ({})) },
  verificationRequest: { updateMany: vi.fn(async () => ({})) },
  notification: { create: vi.fn(async () => ({})) },
  document: { deleteMany: documentDeleteMany },
  auditLog: { create: auditCreate },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: {
      findUnique: credentialFindUnique,
      count: credentialCount,
      updateMany: credentialUpdateMany,
    },
    document: { findUnique: documentFindUnique, deleteMany: documentDeleteMany },
    auditLog: { create: auditCreate },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));

vi.mock("@/lib/authz", async (orig) => {
  const actual = await orig<typeof import("@/lib/authz")>();
  return {
    ...actual,
    requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  };
});

vi.mock("@/lib/services/storage", async (orig) => {
  const actual = await orig<typeof import("@/lib/services/storage")>();
  return { ...actual, getStorage: vi.fn(() => ({ delete: storageDelete })) };
});

vi.mock("@/lib/observability/storage-failure", () => ({
  logStorageCleanupFailure: logCleanupFailure,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { rejectCredential, verifyCredential } from "./actions";

function credential(type: string, documentId: string | null = "doc-1") {
  return {
    id: "cred-1",
    type,
    title: "VOG 2026",
    status: "SUBMITTED",
    documentId,
    freelancerProfile: { userId: "zzp-1" },
  };
}

/** De `data` van de statuswijziging (eerste updateMany in de beslissingstransactie). */
function decisionData() {
  return credentialUpdateMany.mock.calls[0]![0].data;
}

/** De `data` van de ontkoppel-update (tweede updateMany), of undefined als die niet draaide. */
function unlinkData(): Record<string, unknown> | undefined {
  return credentialUpdateMany.mock.calls[1]?.[0].data;
}

function evidenceAudit() {
  return auditCreate.mock.calls
    .map((c) => c[0].data)
    .find((d) => d.action === "CREDENTIAL_EVIDENCE_REMOVED");
}

beforeEach(() => {
  vi.clearAllMocks();
  auditCreate.mockResolvedValue({});
  credentialUpdateMany.mockResolvedValue({ count: 1 });
  credentialCount.mockResolvedValue(0);
  documentFindUnique.mockResolvedValue({ storageKey: "vog/abc.pdf" });
  storageDelete.mockResolvedValue(undefined);
  delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
});

afterEach(() => {
  delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
});

describe("verifyCredential — VOG (metadata-beleid)", () => {
  it("(a) verwijdert het bestand, wist het Document-record en legt gezien/verwijderd vast", async () => {
    credentialFindUnique.mockResolvedValue(credential("VOG"));

    await verifyCredential("cred-1");

    // Inzage-registratie zit atomair in de statuswijziging.
    const decision = decisionData();
    expect(decision.status).toBe("VERIFIED");
    expect(decision.evidenceSeenAt).toBeInstanceOf(Date);
    expect(decision.evidenceSeenById).toBe("admin-1");

    // Bestand daadwerkelijk uit de opslag + Document-rij weg + ontkoppeld.
    expect(storageDelete).toHaveBeenCalledWith("vog/abc.pdf");
    expect(documentDeleteMany).toHaveBeenCalledWith({ where: { id: "doc-1" } });
    expect(unlinkData()?.documentId).toBeNull();
    expect(unlinkData()?.evidenceRemovedAt).toBeInstanceOf(Date);

    // Auditregel met de beleidsreden (CLAUDE.md regel 5).
    const entry = evidenceAudit();
    expect(entry).toBeDefined();
    expect(entry?.metadata).toContain("gezien + datum");
  });

  it("(e) doet hetzelfde bij afwijzen — een afgewezen kopie heeft al helemaal geen grondslag", async () => {
    credentialFindUnique.mockResolvedValue(credential("VOG"));
    const fd = new FormData();
    fd.set("reason", "Document onleesbaar.");

    await rejectCredential("cred-1", fd);

    expect(decisionData().status).toBe("REJECTED");
    expect(decisionData().evidenceSeenById).toBe("admin-1");
    expect(storageDelete).toHaveBeenCalledWith("vog/abc.pdf");
    expect(evidenceAudit()).toBeDefined();
  });

  it("(c) laat de beslissing staan bij een opslagfout, met lege evidenceRemovedAt en een log", async () => {
    credentialFindUnique.mockResolvedValue(credential("VOG"));
    storageDelete.mockRejectedValue(new Error("S3 onbereikbaar"));

    await expect(verifyCredential("cred-1")).resolves.toBeUndefined();

    // Status + inzage-registratie zijn geland...
    expect(decisionData().status).toBe("VERIFIED");
    expect(decisionData().evidenceSeenAt).toBeInstanceOf(Date);
    // ...maar de opruiming is NIET afgevinkt: geen ontkoppel-update, geen Document-delete, geen audit.
    expect(unlinkData()).toBeUndefined();
    expect(documentDeleteMany).not.toHaveBeenCalled();
    expect(evidenceAudit()).toBeUndefined();
    // Gestructureerd gelogd (nooit stil slagen), met de opslagsleutel om het bestand terug te vinden.
    expect(logCleanupFailure).toHaveBeenCalledWith(
      "[verificaties]",
      "vog/abc.pdf",
      expect.any(Error),
    );
  });

  it("(d) bewaart het bestand met de env-override op 'file'", async () => {
    process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG = "file";
    credentialFindUnique.mockResolvedValue(credential("VOG"));

    await verifyCredential("cred-1");

    expect(decisionData().evidenceSeenAt).toBeUndefined();
    expect(storageDelete).not.toHaveBeenCalled();
    expect(documentDeleteMany).not.toHaveBeenCalled();
  });
});

describe("verifyCredential — overige types", () => {
  it("(b) laat het bewijsstuk van een diploma ongemoeid", async () => {
    credentialFindUnique.mockResolvedValue(credential("DIPLOMA"));

    await verifyCredential("cred-1");

    expect(decisionData().status).toBe("VERIFIED");
    expect(decisionData().evidenceSeenAt).toBeUndefined();
    expect(decisionData().evidenceSeenById).toBeUndefined();
    expect(storageDelete).not.toHaveBeenCalled();
    expect(documentDeleteMany).not.toHaveBeenCalled();
  });
});

describe("verifyCredential — VOG zonder bestand", () => {
  it("doet geen opslag-aanroep als er niets te verwijderen valt", async () => {
    credentialFindUnique.mockResolvedValue(credential("VOG", null));

    await verifyCredential("cred-1");

    expect(decisionData().evidenceSeenAt).toBeInstanceOf(Date);
    expect(storageDelete).not.toHaveBeenCalled();
  });
});
