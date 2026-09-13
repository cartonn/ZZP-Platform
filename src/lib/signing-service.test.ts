import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PDFDocument, PDFDict, PDFArray, PDFName, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { buildSigningEvidencePdf } from "./signing-evidence-pdf";
import { type Actor } from "@/lib/authz";
import { LegacySigningEvidenceError } from "./signing-contract";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "contract-signing-proof-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return {
    directory,
    url,
    db: new PrismaClient({ datasourceUrl: url }),
    beforePassword: null as (() => Promise<void>) | null,
    allowed: true,
    compare: vi.fn(),
    reset: vi.fn(),
  };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("bcryptjs", () => ({ default: { compare: fixture.compare } }));
vi.mock("@/lib/rate-limit", () => ({
  reauthRateLimiter: { check: async () => ({ allowed: fixture.allowed }), reset: fixture.reset },
}));
vi.mock("@/lib/signals/invalidate", () => ({ invalidateSignals: vi.fn() }));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
}));

import {
  buildSigningOriginal,
  buildSigningDocument,
  loadSigningView,
  recordContractSignature,
  signingHash,
} from "./signing-service";

const db = fixture.db;
const actor = (
  id = "client",
  role: Actor["role"] = id === "freelancer" ? "FREELANCER" : "CLIENT",
): Actor => ({ id, role, status: "ACTIVE" });
async function form(id = "client") {
  const view = await loadSigningView(actor(id), "collaboration");
  expect(view).not.toBeNull();
  const data = new FormData();
  Object.entries({
    documentHash: view!.documentHash,
    signerName: `Synthetic ${id}`,
    password: "synthetic-password",
    reviewed: "on",
    consent: "on",
    authority: "on",
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
const sign = async (id = "client", data?: FormData) =>
  recordContractSignature(actor(id), "collaboration", data ?? (await form(id)));
async function noEvidence() {
  expect(await db.contractSignature.count()).toBe(0);
  expect(await db.contractSigning.count()).toBe(0);
  expect(await db.auditLog.count()).toBe(0);
  expect(await db.notification.count()).toBe(0);
  expect(await db.domainEvent.count()).toBe(0);
  expect(
    await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
  ).toMatchObject({
    status: "PROPOSED",
    agreementClientSignedAt: null,
    agreementFreelancerSignedAt: null,
  });
}

beforeAll(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: fixture.url };
  delete env.RUST_LOG;
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "db",
      "push",
      "--skip-generate",
      "--schema",
      resolve("prisma/schema.prisma"),
    ],
    { env, timeout: 30_000, stdio: "pipe" },
  );
  for (const id of ["client", "freelancer", "outsider", "admin"]) {
    await db.user.create({
      data: {
        id,
        email: `${id}@signing.test`,
        name: `Synthetic ${id}`,
        role: id === "freelancer" ? "FREELANCER" : id === "admin" ? "ADMIN" : "CLIENT",
        status: "ACTIVE",
        passwordHash: "synthetic-hash",
      },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.job.create({
    data: {
      id: "job",
      companyId: "company",
      title: "Synthetic assignment",
      description: "Original scope",
    },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "profile", motivation: "Synthetic" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      applicationId: "application",
      jobId: "job",
      companyId: "company",
      freelancerId: "profile",
      rate: 80,
    },
  });
}, 40_000);

beforeEach(async () => {
  fixture.allowed = true;
  fixture.beforePassword = null;
  fixture.compare.mockReset();
  fixture.compare.mockImplementation(async (password: string, hash: string) => {
    const hook = fixture.beforePassword;
    fixture.beforePassword = null;
    if (hook) await hook();
    return password === "synthetic-password" && hash === "synthetic-hash";
  });
  fixture.reset.mockReset();
  await db.contractSignature.deleteMany();
  await db.contractSigning.deleteMany();
  await db.eventHandlerRun.deleteMany();
  await db.domainEvent.deleteMany();
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.jobCredentialRequirement.deleteMany();
  await db.credential.deleteMany();
  await db.job.update({
    where: { id: "job" },
    data: { title: "Synthetic assignment", description: "Original scope" },
  });
  await db.user.update({
    where: { id: "client" },
    data: {
      passwordHash: "synthetic-hash",
      passwordChangedAt: new Date("2026-01-01"),
      status: "ACTIVE",
      role: "CLIENT",
      mustChangePassword: false,
      anonymizedAt: null,
      deletionRequestedAt: null,
    },
  });
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: {
      status: "PROPOSED",
      signingEvidenceErasedAt: null,
      contractStatus: "PENDING",
      disputedAt: null,
      agreementClientSignedAt: null,
      agreementFreelancerSignedAt: null,
      agreementType: null,
      rate: 80,
    },
  });
  await db.user.update({
    where: { id: "freelancer" },
    data: { status: "ACTIVE", anonymizedAt: null, deletionRequestedAt: null },
  });
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("stores one immutable original shared by both parties and activates atomically after the second signature", async () => {
  const preview = await loadSigningView(actor(), "collaboration");
  await sign();
  const original = await db.contractSigning.findUniqueOrThrow({
    where: { collaborationId: "collaboration" },
  });
  expect(original.documentHash).toBe(preview!.documentHash);
  expect(signingHash(original.documentJson)).toBe(original.documentHash);
  expect(signingHash(original.documentPdf)).toBe(original.pdfHash);
  expect(Buffer.from(original.documentPdf).subarray(0, 5).toString()).toBe("%PDF-");
  expect(
    await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
  ).toMatchObject({
    status: "PROPOSED",
    agreementClientSignedAt: expect.any(Date),
    agreementFreelancerSignedAt: null,
  });
  expect(await db.domainEvent.count()).toBe(0);
  const secondView = await loadSigningView(actor("freelancer"), "collaboration");
  expect(secondView!.documentHash).toBe(original.documentHash);
  await sign("freelancer");
  expect(
    await db.contractSigning.findUniqueOrThrow({ where: { collaborationId: "collaboration" } }),
  ).toEqual(original);
  expect(await db.contractSignature.findMany({ orderBy: { party: "asc" } })).toMatchObject([
    {
      party: "CLIENT",
      actorId: "client",
      signerName: "Synthetic client",
      authenticationMethod: "SESSION_AND_PASSWORD",
    },
    { party: "FREELANCER", actorId: "freelancer", signerName: "Synthetic freelancer" },
  ]);
  expect(
    await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
  ).toMatchObject({
    status: "ACTIVE",
    contractStatus: "SIGNED",
    agreementClientSignedAt: expect.any(Date),
    agreementFreelancerSignedAt: expect.any(Date),
  });
  expect(await db.domainEvent.count({ where: { type: "CONTRACT_SIGNED" } })).toBe(1);
  expect(await db.eventHandlerRun.count()).toBe(1);
  const audits = await db.auditLog.findMany({ where: { action: "CONTRACT_SIGNATURE_RECORDED" } });
  expect(audits).toHaveLength(2);
  for (const audit of audits)
    expect(JSON.parse(audit.metadata!)).toMatchObject({
      documentHash: original.documentHash,
      pdfHash: original.pdfHash,
      authenticationMethod: "SESSION_AND_PASSWORD",
    });
  expect(JSON.stringify(audits)).not.toContain("synthetic-password");
});

it("generates the same original PDF bytes for the same reviewed document", async () => {
  const view = (await loadSigningView(actor(), "collaboration"))!;
  const first = await buildSigningOriginal(view.document, view.documentHash);
  const second = await buildSigningOriginal(view.document, view.documentHash);
  expect(signingHash(first)).toBe(signingHash(second));
});

it.each(["reviewed", "consent", "authority", "signerName", "password"])(
  "rejects missing %s before any evidence is saved",
  async (field) => {
    const data = await form();
    data.delete(field);
    await expect(sign("client", data)).rejects.toThrow();
    expect(fixture.compare).not.toHaveBeenCalled();
    await noEvidence();
  },
);
it.each([
  { field: "password", value: "wrong-password" },
  { field: "signerName", value: "\u0000Invalid" },
  { field: "documentHash", value: "b".repeat(64) },
])("rejects invalid $field", async ({ field, value }) => {
  const data = await form();
  data.set(field, value);
  await expect(sign("client", data)).rejects.toThrow();
  await noEvidence();
});
it("rate limits password attempts before checking the password", async () => {
  fixture.allowed = false;
  await expect(sign()).rejects.toThrow("Te veel pogingen");
  expect(fixture.compare).not.toHaveBeenCalled();
  await noEvidence();
});
it.each([
  { id: "admin", role: "ADMIN" as const },
  { id: "outsider", role: "CLIENT" as const },
  { id: "client", role: "FRANCHISER" as const },
])("cannot sign as $role/$id", async ({ id, role }) => {
  const data = await form();
  await expect(recordContractSignature(actor(id, role), "collaboration", data)).rejects.toThrow(
    "Samenwerking niet gevonden.",
  );
  await noEvidence();
});
it("only grants signing view access to the two parties and an administrator", async () => {
  expect(await loadSigningView(actor("outsider"), "collaboration")).toBeNull();
  expect(await loadSigningView(actor("outsider"), "missing")).toBeNull();
  expect((await loadSigningView(actor("admin", "ADMIN"), "collaboration"))!.party).toBeNull();
  await expect(
    loadSigningView({ ...actor(), status: "SUSPENDED" }, "collaboration"),
  ).rejects.toThrow("Account is niet actief.");
});

it.each(["CANCELLED", "COMPLETED"])(
  "rejects new evidence when collaboration is %s",
  async (status) => {
    await db.collaboration.update({ where: { id: "collaboration" }, data: { status } });
    await expect(sign()).rejects.toThrow("Ondertekenen is gesloten");
    expect(await db.contractSignature.count()).toBe(0);
    expect(await db.contractSigning.count()).toBe(0);
  },
);
it("freezes signing while a dispute is open", async () => {
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { disputedAt: new Date() },
  });
  await expect(sign()).rejects.toThrow("Ondertekenen is gesloten");
  await noEvidence();
});

it.each(["job", "collaboration"])(
  "rejects a stale document after a %s edit during password verification",
  async (entity) => {
    const data = await form();
    fixture.beforePassword = async () => {
      if (entity === "job")
        await db.job.update({ where: { id: "job" }, data: { description: "Changed scope" } });
      else
        await db.collaboration.update({
          where: { id: "collaboration" },
          data: { rate: 95, updatedAt: new Date(Date.now() + 1000) },
        });
    };
    await expect(sign("client", data)).rejects.toThrow(/gewijzigd/);
    await noEvidence();
  },
);
it.each([
  { status: "SUSPENDED" },
  { mustChangePassword: true },
  { passwordHash: "changed" },
  { role: "ADMIN" },
  { anonymizedAt: new Date() },
])("rechecks account before committing: %j", async (data) => {
  fixture.beforePassword = async () => {
    await db.user.update({ where: { id: "client" }, data });
  };
  await expect(sign()).rejects.toThrow("Je account is gewijzigd");
  await noEvidence();
});
it("preserves the originally signed scope when source fields change before the other party signs", async () => {
  await sign();
  const original = await db.contractSigning.findUniqueOrThrow({
    where: { collaborationId: "collaboration" },
  });
  await db.job.update({
    where: { id: "job" },
    data: { title: "Edited after first signature", description: "New scope" },
  });
  expect((await loadSigningView(actor("freelancer"), "collaboration"))!.document.jobTitle).toBe(
    "Synthetic assignment",
  );
  await sign("freelancer");
  expect(
    await db.contractSigning.findUniqueOrThrow({ where: { collaborationId: "collaboration" } }),
  ).toEqual(original);
});

describe("placement compliance and rollback", () => {
  it.each(["missing", "expired"])(
    "rolls back the second signature if a required credential is %s",
    async (kind) => {
      await db.jobCredentialRequirement.create({
        data: { jobId: "job", credentialType: "VOG", required: true },
      });
      if (kind === "expired")
        await db.credential.create({
          data: {
            freelancerProfileId: "profile",
            type: "VOG",
            title: "Synthetic VOG",
            status: "VERIFIED",
            expiresAt: new Date(0),
          },
        });
      await sign();
      const original = await db.contractSigning.findUniqueOrThrow({
        where: { collaborationId: "collaboration" },
      });
      await expect(sign("freelancer")).rejects.toThrow(
        "Een vereist bewijsstuk ontbreekt of is verlopen",
      );
      expect(await db.contractSignature.count()).toBe(1);
      expect(await db.auditLog.count()).toBe(1);
      expect(await db.domainEvent.count()).toBe(0);
      expect(
        await db.contractSigning.findUniqueOrThrow({ where: { collaborationId: "collaboration" } }),
      ).toEqual(original);
      expect(
        await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
      ).toMatchObject({ status: "PROPOSED", agreementFreelancerSignedAt: null });
      await db.credential.deleteMany();
      await db.credential.create({
        data: {
          freelancerProfileId: "profile",
          type: "VOG",
          title: "Synthetic valid VOG",
          status: "VERIFIED",
          expiresAt: new Date("2099-01-01"),
        },
      });
      await sign("freelancer");
      expect(
        (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } })).status,
      ).toBe("ACTIVE");
    },
  );
  it.each(["first", "second"])(
    "rolls back every new write if the %s signature audit fails",
    async (position) => {
      if (position === "second") await sign();
      const before = {
        signatures: await db.contractSignature.findMany(),
        signing: await db.contractSigning.findMany(),
        col: await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
        audit: await db.auditLog.count(),
        notifications: await db.notification.count(),
      };
      await db.$executeRawUnsafe(
        "CREATE TRIGGER reject_signature_audit BEFORE INSERT ON AuditLog BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END;",
      );
      try {
        await expect(sign(position === "first" ? "client" : "freelancer")).rejects.toThrow();
        expect(await db.contractSignature.findMany()).toEqual(before.signatures);
        expect(await db.contractSigning.findMany()).toEqual(before.signing);
        expect(
          await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }),
        ).toEqual(before.col);
        expect(await db.auditLog.count()).toBe(before.audit);
        expect(await db.notification.count()).toBe(before.notifications);
        expect(await db.domainEvent.count()).toBe(0);
      } finally {
        await db.$executeRawUnsafe("DROP TRIGGER reject_signature_audit");
      }
    },
  );
});

it("a repeated signature preserves its timestamp and has no duplicate audit, notification, or activation", async () => {
  await sign();
  await sign("freelancer");
  const before = await db.contractSignature.findMany({ orderBy: { party: "asc" } });
  const audits = await db.auditLog.count();
  const notifications = await db.notification.count();
  await sign();
  await sign("freelancer");
  expect(await db.contractSignature.findMany({ orderBy: { party: "asc" } })).toEqual(before);
  expect(await db.auditLog.count()).toBe(audits);
  expect(await db.notification.count()).toBe(notifications);
  expect(await db.domainEvent.count()).toBe(1);
});
it("concurrent first-signature requests cannot create duplicate or partial evidence", async () => {
  const data = await form();
  // Deliberately interleave two real service calls before the outer transaction.
  fixture.beforePassword = async () => {
    await sign("client", data);
  };
  await expect(sign("client", data)).rejects.toThrow(/gewijzigd/);
  expect(await db.contractSignature.count()).toBe(1);
  expect(await db.contractSigning.count()).toBe(1);
  expect(await db.auditLog.count()).toBe(1);
  expect(await db.notification.count()).toBe(1);
  expect(await db.domainEvent.count()).toBe(0);
  await sign("client", data);
  expect(await db.contractSignature.count()).toBe(1);
});
it.each(["cancelled", "disputed"])(
  "rejects a %s transition between review and commit",
  async (kind) => {
    fixture.beforePassword = async () => {
      await db.collaboration.update({
        where: { id: "collaboration" },
        data: kind === "cancelled" ? { status: "CANCELLED" } : { disputedAt: new Date() },
      });
    };
    await expect(sign()).rejects.toThrow(/gewijzigd/);
    expect(await db.contractSignature.count()).toBe(0);
    expect(await db.contractSigning.count()).toBe(0);
    expect(await db.auditLog.count()).toBe(0);
  },
);

it("rolls back both the second signature and activation if the cascade audit fails", async () => {
  await sign();
  const before = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
  await db.$executeRawUnsafe(
    "CREATE TRIGGER reject_activation_audit BEFORE INSERT ON AuditLog WHEN NEW.action = 'CONTRACT_SIGNED' BEGIN SELECT RAISE(ABORT, 'synthetic activation audit failure'); END;",
  );
  try {
    await expect(sign("freelancer")).rejects.toThrow();
    expect(await db.contractSignature.count()).toBe(1);
    expect(await db.auditLog.count()).toBe(1);
    expect(await db.domainEvent.count()).toBe(0);
    expect(await db.eventHandlerRun.count()).toBe(0);
    expect(await db.notification.count()).toBe(1);
    expect(await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } })).toEqual(
      before,
    );
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_activation_audit");
  }
});

it("uses fresh credential expiry at second-signature commit", async () => {
  await db.jobCredentialRequirement.create({
    data: { jobId: "job", credentialType: "VOG", required: true },
  });
  await db.credential.create({
    data: {
      id: "vog",
      freelancerProfileId: "profile",
      type: "VOG",
      title: "Synthetic VOG",
      status: "VERIFIED",
      expiresAt: new Date("2099-01-01"),
    },
  });
  await sign();
  fixture.beforePassword = async () => {
    await db.credential.update({ where: { id: "vog" }, data: { expiresAt: new Date(0) } });
  };
  await expect(sign("freelancer")).rejects.toThrow(
    "Een vereist bewijsstuk ontbreekt of is verlopen",
  );
  expect(await db.contractSignature.count()).toBe(1);
  expect(await db.domainEvent.count()).toBe(0);
});

it.each(["documentJson", "documentPdf"])(
  "fails closed if persisted %s is tampered with",
  async (field) => {
    await sign();
    await db.contractSigning.update({
      where: { collaborationId: "collaboration" },
      data:
        field === "documentJson"
          ? { documentJson: "{}" }
          : { documentPdf: Buffer.from("modified") },
    });
    await expect(loadSigningView(actor("freelancer"), "collaboration")).rejects.toThrow(
      "documentversie kan niet worden bevestigd",
    );
    expect(await db.contractSignature.count()).toBe(1);
  },
);

it.each(["client", "freelancer"])("rejects pending deletion by either party (%s)", async (id) => {
  const data = await form();
  fixture.beforePassword = async () => {
    await db.user.update({ where: { id }, data: { deletionRequestedAt: new Date() } });
  };
  await expect(sign("client", data)).rejects.toThrow();
  await noEvidence();
});
it.each(["SUSPENDED", "anonymized"])(
  "rejects counterparty %s between review and commit",
  async (state) => {
    const data = await form();
    fixture.beforePassword = async () => {
      await db.user.update({
        where: { id: "freelancer" },
        data: state === "anonymized" ? { anonymizedAt: new Date() } : { status: state },
      });
    };
    await expect(sign("client", data)).rejects.toThrow("andere partij");
    await noEvidence();
  },
);
it("never reconstructs an erased original from mutable current data", async () => {
  const data = await form();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { signingEvidenceErasedAt: new Date() },
  });
  await expect(loadSigningView(actor(), "collaboration")).rejects.toThrow(
    "Ondertekenbewijs verwijderd",
  );
  await expect(sign("client", data)).rejects.toThrow("Ondertekenbewijs verwijderd");
  await noEvidence();
});
it("appends a readable evidence packet without changing stored original bytes", async () => {
  await sign();
  await sign("freelancer");
  const view = (await loadSigningView(actor(), "collaboration"))!;
  const original = Buffer.from(view.col.signing!.documentPdf);
  const packet = await buildSigningEvidencePdf(view);
  expect((await PDFDocument.load(packet)).getPageCount()).toBeGreaterThan(
    (await PDFDocument.load(original)).getPageCount(),
  );
  expect(
    Buffer.from(
      (await db.contractSigning.findUniqueOrThrow({ where: { collaborationId: "collaboration" } }))
        .documentPdf,
    ),
  ).toEqual(original);
  // Optional, synthetic-only visual QA artifact; ordinary test runs write no files.
  if (process.env.HANDSLAG_PDF_QA_DIRECTORY) {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(process.env.HANDSLAG_PDF_QA_DIRECTORY, { recursive: true });
    writeFileSync(
      resolve(process.env.HANDSLAG_PDF_QA_DIRECTORY, "synthetic-signing-evidence.pdf"),
      packet,
    );
  }
});

it("keeps full Unicode declarations in portable PDF attachments", async () => {
  const data = await form();
  data.set("signerName", "Zoë Łukasz 李");
  await sign("client", data);
  const view = (await loadSigningView(actor(), "collaboration"))!;
  const bytes = await buildSigningEvidencePdf(view);
  const pdf = await PDFDocument.load(bytes);
  const names = pdf.catalog
    .lookup(PDFName.of("Names"), PDFDict)
    .lookup(PDFName.of("EmbeddedFiles"), PDFDict)
    .lookup(PDFName.of("Names"), PDFArray);
  const contents: string[] = [];
  for (let i = 1; i < names.size(); i += 2) {
    const spec = names.lookup(i, PDFDict);
    const stream = spec.lookup(PDFName.of("EF"), PDFDict).lookup(PDFName.of("F"));
    if (!(stream instanceof PDFRawStream)) throw new Error("Expected an embedded PDF stream");
    contents.push(Buffer.from(decodePDFRawStream(stream).decode()).toString("utf8"));
  }
  expect(contents).toContain(view.col.signing!.documentJson);
  const evidence = contents.map((value) => JSON.parse(value)).find((value) => value.signatures);
  expect(evidence.signatures[0].signerName).toBe("Zoë Łukasz 李");
  expect(evidence.documentHash).toBe(view.documentHash);
  expect(evidence.pdfHash).toBe(view.col.signing!.pdfHash);
});

it.each(["ACTIVE", "COMPLETED", "CANCELLED", "PROPOSED"])(
  "never manufactures evidence for an already signed legacy agreement in %s",
  async (status) => {
    const preview = (await loadSigningView(actor(), "collaboration"))!;
    const data = await form();
    // A malicious caller can calculate the current mutable document's hash, too.
    // Rejection must be based on the missing historical original, not a stale form hash.
    const changed = {
      ...preview.col,
      rate: 120,
      job: { ...preview.col.job, description: "Later changed scope" },
    };
    data.set("documentHash", signingHash(JSON.stringify(buildSigningDocument(changed))));
    const legacyDate = new Date("2026-02-01T12:00:00Z");
    await db.job.update({ where: { id: "job" }, data: { description: changed.job.description } });
    const before = await db.collaboration.update({
      where: { id: "collaboration" },
      data: {
        status,
        contractStatus: "SIGNED",
        rate: 120,
        agreementClientSignedAt: legacyDate,
        agreementFreelancerSignedAt: legacyDate,
      },
    });
    for (const signer of [actor(), actor("freelancer")]) {
      await expect(loadSigningView(signer, "collaboration")).rejects.toBeInstanceOf(
        LegacySigningEvidenceError,
      );
      await expect(recordContractSignature(signer, "collaboration", data)).rejects.toBeInstanceOf(
        LegacySigningEvidenceError,
      );
    }
    expect(await loadSigningView(actor("outsider"), "collaboration")).toBeNull();
    expect(await loadSigningView(actor("outsider"), "missing")).toBeNull();
    expect(fixture.compare).not.toHaveBeenCalled();
    expect(await db.contractSigning.count()).toBe(0);
    expect(await db.contractSignature.count()).toBe(0);
    expect(await db.auditLog.count()).toBe(0);
    expect(await db.domainEvent.count()).toBe(0);
    expect(await db.notification.count()).toBe(0);
    expect(await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } })).toEqual(
      before,
    );
  },
);

it("rechecks the legacy gap inside the write transaction even if the version timestamp is unchanged", async () => {
  const data = await form();
  const before = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
  fixture.beforePassword = async () => {
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { status: "ACTIVE", contractStatus: "SIGNED", updatedAt: before.updatedAt },
    });
  };
  await expect(sign("client", data)).rejects.toBeInstanceOf(LegacySigningEvidenceError);
  expect(await db.contractSigning.count()).toBe(0);
  expect(await db.contractSignature.count()).toBe(0);
  expect(await db.auditLog.count()).toBe(0);
  expect(await db.domainEvent.count()).toBe(0);
  const after = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
  expect(after.status).toBe("ACTIVE");
  expect(after.updatedAt).toEqual(before.updatedAt);
  expect(after.agreementClientSignedAt).toBeNull();
});

it("the PDF helper refuses a legacy view instead of generating a retrospective original", async () => {
  const preview = (await loadSigningView(actor(), "collaboration"))!;
  await expect(
    buildSigningEvidencePdf({
      ...preview,
      col: { ...preview.col, status: "ACTIVE", signing: null },
    }),
  ).rejects.toBeInstanceOf(LegacySigningEvidenceError);
});

it("retains genuinely recorded originals after activation and later mutable edits", async () => {
  await sign();
  await sign("freelancer");
  const original = (await loadSigningView(actor(), "collaboration"))!;
  await db.collaboration.update({ where: { id: "collaboration" }, data: { rate: 200 } });
  await db.job.update({ where: { id: "job" }, data: { description: "Later changed scope" } });
  const current = (await loadSigningView(actor(), "collaboration"))!;
  expect(current.col.status).toBe("ACTIVE");
  expect(current.document).toEqual(original.document);
  expect(current.col.signing).toEqual(original.col.signing);
  expect(await buildSigningEvidencePdf(current)).toBeInstanceOf(Uint8Array);
});
