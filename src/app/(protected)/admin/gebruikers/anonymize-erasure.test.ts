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
        name: "Jan de Vries",
        email: "jan@bedrijf.nl",
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
    notification: { updateMany: op("notification.updateMany") },
    application: { updateMany: op("application.updateMany") },
    supportMessage: { updateMany: op("supportMessage.updateMany") },
    supportTicket: { updateMany: op("supportTicket.updateMany") },
    ideaComment: { updateMany: op("ideaComment.updateMany") },
    review: { updateMany: op("review.updateMany") },
    shiftHandoff: { updateMany: op("shiftHandoff.updateMany") },
    leadContact: { updateMany: op("leadContact.updateMany") },
    availabilityWindow: { updateMany: op("availabilityWindow.updateMany") },
    workExperience: { deleteMany: op("workExperience.deleteMany") },
    indirectHoursEntry: { updateMany: op("indirectHoursEntry.updateMany") },
    idea: { updateMany: op("idea.updateMany") },
    collaboration: { updateMany: op("collaboration.updateMany") },
    favoriteFreelancer: { updateMany: op("favoriteFreelancer.updateMany") },
    domainEvent: {
      findMany: vi.fn(async () => [{ subjectId: "col-7" }]),
      updateMany: op("domainEvent.updateMany"),
    },
    pushSubscription: { deleteMany: op("pushSubscription.deleteMany") },
    auditLog: {
      create: op("auditLog.create"),
      update: op("auditLog.update"),
      updateMany: op("auditLog.updateMany"),
      findMany: vi.fn(async () => [
        // Eigen actie van de betrokkene: IP/user-agent zijn PII en moeten mee gewist.
        {
          id: "audit-own",
          actorId: "user-42",
          entityType: "User",
          entityId: "user-42",
          metadata: JSON.stringify({ from: "ACTIVE", to: "SUSPENDED" }),
          ipAddress: "203.0.113.5",
          userAgent: "Mozilla/5.0",
        },
        // Mislukte login vóór het account bestond als entity: alleen via het e-mailadres in de
        // metadata te matchen (actorId null, entityId "unknown").
        {
          id: "audit-login-failed",
          actorId: null,
          entityType: "User",
          entityId: "unknown",
          metadata: JSON.stringify({ email: "jan@bedrijf.nl" }),
          ipAddress: "198.51.100.7",
          userAgent: null,
        },
        // Bulk-import: rol blijft, e-mailadres eruit.
        {
          id: "audit-import",
          actorId: "admin-9",
          entityType: "User",
          entityId: "user-42",
          metadata: JSON.stringify({ role: "FREELANCER", email: "jan@bedrijf.nl" }),
          ipAddress: null,
          userAgent: null,
        },
        // Franchise-toevoeging: de bemiddelaar (andere actor) voegde deze ZZP'er toe; het event
        // bewaart het e-mailadres als `entityId` én de volledige naam in de metadata. Beide zijn PII
        // van de betrokkene en moeten mee, ook al is actorId niet de betrokkene en entityType geen
        // "User". Wordt geselecteerd via de `entityId: originalEmail`-tak van de OR.
        {
          id: "audit-franchise-add",
          actorId: "franchiser-3",
          entityType: "FreelancerProfile",
          entityId: "jan@bedrijf.nl",
          metadata: JSON.stringify({
            tenantId: "t-1",
            name: "Jan de Vries",
            skills: 2,
            availability: "FULL_TIME",
          }),
          ipAddress: null,
          userAgent: null,
        },
        // Auditregel van een ándere gebruiker die dit adres slechts als substring bevat — mag NIET
        // geraakt worden (exact-match + geen eigen actor/entity).
        {
          id: "audit-other",
          actorId: "user-99",
          entityType: "User",
          entityId: "user-99",
          metadata: JSON.stringify({ email: "boaz-jan@bedrijf.nl" }),
          ipAddress: "192.0.2.9",
          userAgent: "curl/8",
        },
      ]),
    },
    $transaction: vi.fn(async (ops: Array<{ model: string; args: unknown }>) => {
      tx.ops = ops;
      return ops;
    }),
  },
}));

import { anonymizeUser } from "./actions";
import { prisma } from "@/lib/db";

const find = (model: string) => tx.ops.find((o) => o.model === model);
const findAll = (model: string) => tx.ops.filter((o) => o.model === model);

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

  it("wist het vrije-tekst-beschikbaarheidsveld van de eigen reacties (Application.availability)", async () => {
    await anonymizeUser("user-42");
    // De freelancer-gescopete application.updateMany redact zowel de motivatiebrief als het
    // vrije-tekst-`availability`-veld (bv. "bereikbaar op 06-…"). Zonder `availability: null` blijft
    // die door de betrokkene getypte PII na anonimisering leesbaar op de reactie (rood→groen).
    const ops = findAll("application.updateMany") as Array<{
      args: { where: { freelancer?: unknown; job?: unknown }; data: { availability?: unknown } };
    }>;
    const motivationOp = ops.find((o) => o.args.where.freelancer !== undefined);
    expect(motivationOp).toBeDefined();
    expect(motivationOp!.args.data.availability).toBeNull();
  });

  it("redact eigen support-berichten (SupportMessage.body)", async () => {
    await anonymizeUser("user-42");
    const o = find("supportMessage.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ authorId: "user-42" });
    expect((o.args.data as { body: string }).body).toMatch(/verwijderd/i);
  });

  it("redact het onderwerp van eigen supporttickets (SupportTicket.subject)", async () => {
    await anonymizeUser("user-42");
    const o = find("supportTicket.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
    expect((o.args.data as { subject: string }).subject).toMatch(/verwijderd/i);
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

  it("wist de eigen kandidaatnotitie op reacties op de eigen opdrachten (Application.note)", async () => {
    await anonymizeUser("user-42");
    // Application.updateMany wordt twee keer aangeroepen: motivation (freelancer-scoped) én note
    // (opdrachtgever-scoped). Pak de note-variant op zijn where-vorm.
    const ops = findAll("application.updateMany") as Array<{
      args: { where: { job?: unknown; freelancer?: unknown }; data: { note?: unknown } };
    }>;
    const noteOp = ops.find((o) => o.args.where.job !== undefined);
    expect(noteOp).toBeDefined();
    expect(noteOp!.args.where).toEqual({ job: { company: { userId: "user-42" } } });
    expect(noteOp!.args.data.note).toBeNull();
  });

  it("wist de eigen beslisnotitie bij afgewezen shift-overnames (ShiftHandoff.decisionNote)", async () => {
    await anonymizeUser("user-42");
    // ShiftHandoff.updateMany wordt twee keer aangeroepen: reason (requestedByUserId) én decisionNote
    // (decidedByUserId). Pak de beslisserskant.
    const ops = findAll("shiftHandoff.updateMany") as Array<{
      args: { where: { decidedByUserId?: string }; data: { decisionNote?: unknown } };
    }>;
    const decisionOp = ops.find((o) => o.args.where.decidedByUserId !== undefined);
    expect(decisionOp).toBeDefined();
    expect(decisionOp!.args.where).toEqual({ decidedByUserId: "user-42" });
    expect(decisionOp!.args.data.decisionNote).toBeNull();
  });

  it("redact eigen lead-contactnotities (LeadContact.body)", async () => {
    await anonymizeUser("user-42");
    const o = find("leadContact.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ createdById: "user-42" });
    expect((o.args.data as { body: string }).body).toMatch(/verwijderd/i);
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

  it("wist de vrije-tekstnoot op beschikbaarheidsvensters (AvailabilityWindow.note)", async () => {
    await anonymizeUser("user-42");
    const o = find("availabilityWindow.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ freelancerProfile: { userId: "user-42" } });
    expect((o.args.data as { note: string | null }).note).toBeNull();
  });

  it("wist de eigen dispuutreden, gescopet op de eigen DISPUTE_OPENED-events", async () => {
    await anonymizeUser("user-42");
    // Twee collaboration.updateMany's: cancellationReason (cancelledById) én disputeReason (id in ...).
    const ops = findAll("collaboration.updateMany") as Array<{
      args: { where: { id?: { in: string[] }; disputeReason?: unknown }; data: unknown };
    }>;
    const disputeOp = ops.find((o) => o.args.where.id !== undefined);
    expect(disputeOp).toBeDefined();
    // De ids komen uit de DISPUTE_OPENED-events van de betrokkene (mock geeft col-7).
    expect(disputeOp!.args.where.id).toEqual({ in: ["col-7"] });
    expect((disputeOp!.args.data as { disputeReason: string | null }).disputeReason).toBeNull();
  });

  it("wist de dispuutreden óók uit de DISPUTE_OPENED-domeinevent-payload (AVG art. 17, event-store)", async () => {
    await anonymizeUser("user-42");
    // De vrije tekst leeft in twee kopieën: Collaboration.disputeReason (hierboven getest) én de
    // payload van het eigen DISPUTE_OPENED-event. Zonder de domainEvent.updateMany blijft de tweede
    // staan — deze assert faalt dan (rood→groen).
    const o = find("domainEvent.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    // Gescopet op de eigen events van de betrokkene, nooit die van de tegenpartij.
    expect(o.args.where).toEqual({ type: "DISPUTE_OPENED", actorId: "user-42" });
    // Payload volledig geleegd — de reden is het enige (PII-)veld.
    expect((o.args.data as { payload: string }).payload).toBe("{}");
  });

  it("redact de dispuutreden óók uit de DISPUTE_OPENED-auditlog-metadata (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Derde PII-kopie: de vrije-tekstreden staat verbatim in de metadata (`{ reason }`) van het eigen
    // DISPUTE_OPENED-auditrecord. De generieke email/naam-scrub raakt 'm niet (geen exact-match), dus
    // zonder deze expliciete updateMany overleeft de reden art. 17 — deze assert faalt dan (rood→groen).
    const o = find("auditLog.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    // Gescopet op de eigen dispuut-auditregels (actorId == de betrokkene), nooit die van de tegenpartij.
    expect(o.args.where).toEqual({ actorId: "user-42", action: "DISPUTE_OPENED" });
    const meta = JSON.parse((o.args.data as { metadata: string }).metadata);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de dispuutreden óók uit de admin-fanout-notificatie (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Vierde PII-kopie: de admin-notificatie draagt `Dispuut bij "<opdracht>": <reden>` in haar body.
    // Notificaties worden nergens anders geredact, dus zonder deze updateMany blijft de reden bij élke
    // admin zichtbaar — deze assert faalt dan (rood→groen). Er zijn twee notification.updateMany's
    // (deze admin-fanout + de eigen-feed-redactie hieronder); pak de admin-variant op zijn where-vorm.
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { title?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.title !== undefined);
    expect(o).toBeDefined();
    // Alleen de reden-dragende admin-variant, gescopet op de deep-links van de eigen disputen (col-7).
    expect(o!.args.where).toEqual({
      type: "DISPUTE_OPENED",
      title: "Dispuut — bemiddeling nodig",
      link: { in: ["/samenwerkingen/col-7"] },
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("redact de body van de eigen ontvangen notificaties — reden-dragende vrije-tekst-PII (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Meerdere notificatietypes zetten een vrije-tekstreden verbatim in de body die de betrokkene
    // ontving (NO_SHOW_REPORTED — mogelijk gezondheidsgegeven —, PERFORMANCE_REJECTED,
    // INVOICE_REJECTED, INVOICE_CREDITED, COLLABORATION_STATUS, CREDENTIAL_REJECTED,
    // SHIFT_HANDOFF_REJECTED). Die kopie leeft alleen op de Notification-rij (userId == de betrokkene)
    // en werd door geen enkele bestaande redactie geraakt — zonder deze updateMany overleeft de PII
    // art. 17 (rood→groen). Gescopet puur op de eigen feed, robuust voor toekomstige reden-types.
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; title?: string }; data: { body?: string } };
    }>;
    const own = ops.find((x) => x.args.where.userId !== undefined);
    expect(own).toBeDefined();
    expect(own!.args.where).toEqual({ userId: "user-42" });
    expect(own!.args.data.body).toMatch(/verwijderd/i);
  });

  it("wist de privé favorieten-notitie van de CLIENT (FavoriteFreelancer.note)", async () => {
    await anonymizeUser("user-42");
    const o = find("favoriteFreelancer.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ company: { userId: "user-42" } });
    expect((o.args.data as { note: string | null }).note).toBeNull();
  });

  it("verwijdert de zelf-gerapporteerde werkervaring (WorkExperience — vrije-tekst-PII op het profiel)", async () => {
    await anonymizeUser("user-42");
    const o = find("workExperience.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    // Gescopet op het eigen profiel (freelancerProfile.userId), nooit dat van een ander.
    expect(o.args.where).toEqual({ freelancerProfile: { userId: "user-42" } });
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

  it("redact het e-mailadres van de betrokkene uit bestaande auditlog-metadata (AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    const updates = findAll("auditLog.update") as Array<{
      args: {
        where: { id: string };
        data: { metadata?: string; ipAddress?: null; userAgent?: null };
      };
    }>;
    const byId = (id: string) => updates.find((u) => u.args.where.id === id);

    // Mislukte-login-regel: e-mailadres eruit, IP eruit.
    const loginFailed = byId("audit-login-failed");
    expect(loginFailed).toBeDefined();
    expect(loginFailed!.args.data.metadata).toBeDefined();
    expect(loginFailed!.args.data.metadata).not.toContain("jan@bedrijf.nl");
    expect(JSON.parse(loginFailed!.args.data.metadata!).email).toBe("[verwijderd]");
    expect(loginFailed!.args.data.ipAddress).toBeNull();

    // Bulk-import-regel: e-mailadres eruit, rol blijft behouden.
    const imported = byId("audit-import");
    expect(imported).toBeDefined();
    const importedMeta = JSON.parse(imported!.args.data.metadata!);
    expect(importedMeta.email).toBe("[verwijderd]");
    expect(importedMeta.role).toBe("FREELANCER");

    // Eigen actie zonder e-mail in metadata: IP + user-agent (PII) worden gewist, metadata blijft.
    const own = byId("audit-own");
    expect(own).toBeDefined();
    expect(own!.args.data.ipAddress).toBeNull();
    expect(own!.args.data.userAgent).toBeNull();
    expect(own!.args.data.metadata).toBeUndefined();
  });

  it("raakt de auditregel van een ándere gebruiker NIET aan (exact-match, geen substring-lek)", async () => {
    await anonymizeUser("user-42");
    const updates = findAll("auditLog.update") as Array<{ args: { where: { id: string } } }>;
    expect(updates.some((u) => u.args.where.id === "audit-other")).toBe(false);
  });

  it("selecteert óók auditregels waar het e-mailadres de entityId is (franchise-toevoeging)", async () => {
    const findMany = prisma.auditLog.findMany as unknown as {
      mock: { calls: Array<[{ where: { OR: unknown[] } }]> };
    };
    await anonymizeUser("user-42");
    const firstCall = findMany.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall![0].where.OR).toContainEqual({ entityId: "jan@bedrijf.nl" });
  });

  it("redact naam én e-mail uit een FRANCHISE_FREELANCER_ADDED-auditregel (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    const updates = findAll("auditLog.update") as Array<{
      args: {
        where: { id: string };
        data: { metadata?: string; entityId?: string };
      };
    }>;
    const franchise = updates.find((u) => u.args.where.id === "audit-franchise-add");
    expect(franchise).toBeDefined();
    // Het e-mailadres stond als entityId — dat is PII en moet geredact worden.
    expect(franchise!.args.data.entityId).toBe("[verwijderd]");
    // De volledige naam stond in de metadata — die moet weg, operationele velden blijven.
    const meta = JSON.parse(franchise!.args.data.metadata!);
    expect(meta.name).toBe("[verwijderd]");
    expect(meta.tenantId).toBe("t-1");
    expect(franchise!.args.data.metadata).not.toContain("Jan de Vries");
  });
});
