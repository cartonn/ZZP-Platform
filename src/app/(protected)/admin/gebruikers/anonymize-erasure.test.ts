// Regressietest voor het AVG-recht op verwijdering (art. 17): anonymizeUser() moet ÁLLE
// vrije-tekst-PII die de betrokkene zelf schreef onomkeerbaar overschrijven. Een `user.update`
// triggert geen cascade op kindrijen, dus motivatiebrieven (Application.motivation), support- en
// idee-teksten en beoordelingen moeten expliciet mee in de anonimiseringstransactie. Zonder die
// updateMany-aanroepen blijft herleidbare PII achter — deze test faalt dan.

import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = vi.hoisted(() => ({ ops: [] as Array<{ model: string; args: unknown }> }));

function op(model: string) {
  return vi.fn((args: unknown) => {
    const o = { model, args };
    return o; // het "promise"-resultaat is het beschrijvende object; $transaction verzamelt ze
  });
}

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: null, userAgent: null })),
}));
vi.mock("@/lib/services/storage", () => ({
  getStorage: () => ({ delete: vi.fn(async () => {}) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({
        id: "user-42",
        role: "FREELANCER",
        deletionRequestedAt: new Date("2026-05-01"),
        anonymizedAt: null,
      })),
      update: op("user.update"),
    },
    freelancerProfile: { updateMany: op("freelancerProfile.updateMany") },
    company: { updateMany: op("company.updateMany") },
    credential: { deleteMany: op("credential.deleteMany") },
    document: {
      deleteMany: op("document.deleteMany"),
      findMany: vi.fn(async () => []),
    },
    message: { updateMany: op("message.updateMany") },
    application: { updateMany: op("application.updateMany") },
    supportMessage: { updateMany: op("supportMessage.updateMany") },
    ideaComment: { updateMany: op("ideaComment.updateMany") },
    review: { updateMany: op("review.updateMany") },
    shiftHandoff: { updateMany: op("shiftHandoff.updateMany") },
    indirectHoursEntry: { updateMany: op("indirectHoursEntry.updateMany") },
    idea: { updateMany: op("idea.updateMany") },
    collaboration: { updateMany: op("collaboration.updateMany") },
    pushSubscription: { deleteMany: op("pushSubscription.deleteMany") },
    auditLog: { create: op("auditLog.create") },
    $transaction: vi.fn(async (ops: Array<{ model: string; args: unknown }>) => {
      tx.ops = ops;
      return ops;
    }),
  },
}));

import { anonymizeUser } from "./actions";

const find = (model: string) => tx.ops.find((o) => o.model === model);

beforeEach(() => {
  tx.ops = [];
});

describe("anonymizeUser — AVG recht op verwijdering dekt vrije-tekst-PII", () => {
  it("redact de motivatiebrieven (Application.motivation) van de betrokkene", async () => {
    await anonymizeUser("user-42");
    const o = find("application.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ freelancer: { userId: "user-42" } });
    expect((o.args.data as { motivation: string }).motivation).toMatch(/verwijderd/i);
  });

  it("redact eigen support-berichten (SupportMessage.body)", async () => {
    await anonymizeUser("user-42");
    const o = find("supportMessage.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ authorId: "user-42" });
    expect((o.args.data as { body: string }).body).toMatch(/verwijderd/i);
  });

  it("redact eigen idee-reacties (IdeaComment.body)", async () => {
    await anonymizeUser("user-42");
    const o = find("ideaComment.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ authorId: "user-42" });
  });

  it("wist eigen beoordelingstoelichtingen (Review.comment)", async () => {
    await anonymizeUser("user-42");
    const o = find("review.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ authorId: "user-42" });
    expect((o.args.data as { comment: string | null }).comment).toBeNull();
  });

  it("redact eigen shift-overname-redenen (ShiftHandoff.reason)", async () => {
    await anonymizeUser("user-42");
    const o = find("shiftHandoff.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ requestedByUserId: "user-42" });
  });

  it("wist de vrije-tekstnoot op indirecte-uren-rijen (IndirectHoursEntry.note)", async () => {
    await anonymizeUser("user-42");
    const o = find("indirectHoursEntry.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
    expect((o.args.data as { note: string | null }).note).toBeNull();
  });

  it("redact titel + omschrijving van eigen ideeën (Idea)", async () => {
    await anonymizeUser("user-42");
    const o = find("idea.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ authorId: "user-42" });
    const data = o.args.data as { title: string; description: string };
    expect(data.title).toMatch(/verwijderd/i);
    expect(data.description).toMatch(/verwijderd/i);
  });

  it("wist de zelf-geschreven annuleerreden (Collaboration.cancellationReason)", async () => {
    await anonymizeUser("user-42");
    const o = find("collaboration.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ cancelledById: "user-42" });
    expect((o.args.data as { cancellationReason: string | null }).cancellationReason).toBeNull();
  });

  it("verwijdert push-abonnementen (PushSubscription — toestel-identifier)", async () => {
    await anonymizeUser("user-42");
    const o = find("pushSubscription.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
  });

  it("schrijft nog steeds een ACCOUNT_ANONYMIZED-auditregel", async () => {
    await anonymizeUser("user-42");
    const o = find("auditLog.create") as { args: { data: { action: string } } };
    expect(o.args.data.action).toBe("ACCOUNT_ANONYMIZED");
  });
});
