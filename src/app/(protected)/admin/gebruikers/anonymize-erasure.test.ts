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
// Gedeelde delete-spy (hoisted) zodat de tests kunnen asserten met WELKE storage-keys de opslag-
// opruiming wordt aangeroepen — nodig om te bewijzen dat het bedrijfslogo écht mee gewist wordt.
const storageMock = vi.hoisted(() => ({ del: vi.fn(async () => {}) }));
vi.mock("@/lib/services/storage", () => ({
  getStorage: () => ({ delete: storageMock.del }),
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
        // Deze betrokkene bezit geen vestiging → de fail-closed tenant-guard mag de erasure niet
        // blokkeren (een franchiser met een levende eigen tenant wordt apart getest in
        // account-anonymization.test.ts).
        ownedTenant: null,
      })),
      update: op("user.update"),
    },
    freelancerProfile: { updateMany: op("freelancerProfile.updateMany") },
    company: {
      updateMany: op("company.updateMany"),
      // De betrokkene heeft een bedrijfslogo als losse storage-blob (Company.logoKey, géén Document-
      // rij). De anonimisering moet die blob mee wissen — anders blijft hij als wees achter (art. 17).
      findUnique: vi.fn(async () => ({ logoKey: "2026/company-logo-abc.png" })),
    },
    credential: {
      // Twee credentials van de betrokkene — hun auditregels (o.a. de CREDENTIAL_REJECTED-reden)
      // moeten mee-geredact worden vóór de rijen zelf worden verwijderd.
      findMany: vi.fn(async () => [{ id: "cred-1" }, { id: "cred-2" }]),
      deleteMany: op("credential.deleteMany"),
    },
    document: {
      // NB: document.deleteMany + document.findMany worden nu PAS ná de $transaction aangeroepen
      // (race-vrije verwijdering, CWE-367). document.count levert enkel het audit-intentiegetal
      // vóór de transactie.
      count: vi.fn(async () => 0),
      deleteMany: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    message: {
      updateMany: op("message.updateMany"),
      // Eén door de betrokkene VERZONDEN bericht: de eerste 120 tekens staan verbatim in de body van
      // de MESSAGE-notificatie op de feed van de ONTVANGER (userId == ontvanger). Bij verwijdering van
      // de afzender moet die notificatiekopie mee-geredact worden (art. 17, tweede kopie op andermans
      // feed — buiten de brede eigen-feed-wipe).
      findMany: vi.fn(async () => [
        { conversationId: "conv-5", body: "Bel me op 06-12345678, mijn adres is Kerkstraat 12" },
      ]),
    },
    notification: { updateMany: op("notification.updateMany") },
    invoice: {
      // Args-bewust: de erasure leest tweemaal `invoice.findMany` — de eigen CREDIT-facturen (reden
      // door de ZZP'er zelf geschreven) én de eigen REJECTED-facturen (reden door de OPDRACHTGEVER zelf
      // geschreven, gescopet op counterpartyUserId). Beide dragen zelf-geschreven vrije tekst die bij
      // de erasure van de AUTEUR mee moet — de mock moet ze scheiden op `lifecycleStatus`.
      findMany: vi.fn(async (args?: { where?: { lifecycleStatus?: string } }) => {
        if (args?.where?.lifecycleStatus === "REJECTED") {
          // De betrokkene (user-42) is hier de OPDRACHTGEVER (counterparty) die de factuur afkeurde;
          // de reden staat op de eigen factuur, in de audit-metadata én verbatim op de ZZP'er-feed
          // (issuer-55). Zonder de nieuwe redactie overleeft die door de opdrachtgever getypte reden
          // art. 17 op andermans feed en in diens inzage-export.
          return [
            {
              id: "inv-reject-1",
              rejectionReason: "Uren komen niet overeen met de opdracht",
              issuerUserId: "issuer-55",
            },
          ];
        }
        return [
          {
            id: "inv-credit-1",
            rejectionReason: "Verkeerd uurtarief gefactureerd, correctie",
            partyInvoiceNumber: "2026-014",
            counterpartyUserId: "client-77",
          },
        ];
      }),
      updateMany: op("invoice.updateMany"),
    },
    application: { updateMany: op("application.updateMany") },
    // De opdrachten (Job) van het bedrijf dragen door de OPDRACHTGEVER zelf getypte vrije tekst
    // (title/description/location) die eigen naam/telefoon/adres kan bevatten en die bij de erasure
    // mee moet — plus een PUBLISHED-opdracht die uit de publieke marktplaats moet (art. 17).
    job: { updateMany: op("job.updateMany") },
    supportMessage: { updateMany: op("supportMessage.updateMany") },
    supportTicket: { updateMany: op("supportTicket.updateMany") },
    ideaComment: { updateMany: op("ideaComment.updateMany") },
    review: { updateMany: op("review.updateMany") },
    shiftHandoff: {
      updateMany: op("shiftHandoff.updateMany"),
      // Eén afgewezen shift-overname die de betrokkene als BESLISSER (FRANCHISER/ADMIN) zelf beoordeelde:
      // de `decisionNote` is zelf-geschreven vrije tekst die verbatim in de body van de
      // SHIFT_HANDOFF_REJECTED-notificatie op de feed van de AANVRAGER (requester-99) staat en dus mee
      // geredact moet worden bij verwijdering van de beslisser.
      findMany: vi.fn(async () => [
        {
          requestedByUserId: "requester-99",
          decisionNote: "Kandidaat niet geschikt voor deze nachtinzet",
          collaboration: { job: { title: "Nachtdienst ZZP" } },
        },
      ]),
    },
    leadContact: { updateMany: op("leadContact.updateMany") },
    availabilityWindow: { deleteMany: op("availabilityWindow.deleteMany") },
    invoiceLine: { updateMany: op("invoiceLine.updateMany") },
    workExperience: { deleteMany: op("workExperience.deleteMany") },
    indirectHoursEntry: { updateMany: op("indirectHoursEntry.updateMany") },
    performance: {
      // Eén door de betrokkene als OPDRACHTGEVER afgekeurde prestatie (status REJECTED): de reden is
      // door de opdrachtgever zelf geschreven en staat op de eigen prestatie, in de audit-metadata én
      // verbatim op de feed van de ZZP'er (freelancer-66) — dus mee wissen bij diens erasure (art. 17).
      findMany: vi.fn(async () => [
        {
          id: "perf-reject-1",
          rejectionReason: "Oplevering onvolledig, ontbrekende rapportage",
          collaboration: { freelancer: { userId: "freelancer-66" } },
        },
      ]),
      updateMany: op("performance.updateMany"),
    },
    expense: { updateMany: op("expense.updateMany") },
    noShowReport: {
      // Eén no-show die de betrokkene als MÉLDER (opdrachtgever/franchiser) zelf indiende: de reden is
      // zelf-geschreven vrije tekst (de AVG-export erkent 'm als eigen PII, art. 15/20) en moet mee
      // gewist — plus de verbatim kopie in de body van de NO_SHOW_REPORTED-notificatie op de ZZP'er-feed.
      findMany: vi.fn(async () => [
        {
          id: "nsr-1",
          reason: "Niet op komen dagen zonder bericht",
          occurredOn: new Date("2026-05-07"),
          collaboration: { freelancer: { userId: "zzp-88" }, job: { title: "Nachtdienst ZZP" } },
        },
      ]),
      updateMany: op("noShowReport.updateMany"),
    },
    idea: {
      // Eén idee van de betrokkene met een door een beheerder getypte afwijsreden (declineReason).
      // De id's + titels worden vóór de transactie verzameld om zowel de IDEA_STATUS_SET-auditregels
      // als de (naar ándermans feed gekopieerde) notificatietitels te redacten. De titel bevat de
      // persoonsnaam van de betrokkene → PII die art. 17 moet wissen, óók in de notificatiekopie.
      findMany: vi.fn(async () => [
        { id: "idea-1", title: "Idee van Jan de Vries voor betere planning" },
      ]),
      updateMany: op("idea.updateMany"),
    },
    collaboration: {
      updateMany: op("collaboration.updateMany"),
      // Eén samenwerking die de betrokkene (user-42, hier de ZZP'er) zelf annuleerde: de
      // `cancellationReason` is zelf-geschreven vrije tekst die verbatim in de body van de
      // COLLABORATION_STATUS-notificatie op de feed van de TEGENPARTIJ (de opdrachtgever client-70)
      // staat én in de COLLABORATION_STATUS_CHANGED-auditmetadata — dus mee redacten bij de erasure
      // van de annuleerder (art. 17, drie kopieën).
      findMany: vi.fn(async () => [
        {
          id: "col-cancel-1",
          cancellationReason: "Gestopt wegens ziekte, kan de dienst niet afmaken",
          cancellationChargeable: true,
          company: { userId: "client-70" },
          freelancer: { userId: "user-42" },
        },
      ]),
    },
    favoriteFreelancer: { deleteMany: op("favoriteFreelancer.deleteMany") },
    mailIntake: { deleteMany: op("mailIntake.deleteMany") },
    domainEvent: {
      // Standaard: één nog-open dispuut dat de betrokkene zelf opende (col-7). De volle event-velden
      // (type/actorId) zijn nodig voor de replay in `collaborationsWithActiveDisputeOpenedBy`. Wordt
      // per test in beforeEach teruggezet zodat een test 'm mag overschrijven (bv. heropening-scenario).
      findMany: vi.fn(async () => [
        { subjectId: "col-7", type: "DISPUTE_OPENED", actorId: "user-42" },
      ]),
      updateMany: op("domainEvent.updateMany"),
    },
    pushSubscription: { deleteMany: op("pushSubscription.deleteMany") },
    conversationParticipant: { updateMany: op("conversationParticipant.updateMany") },
    lessonCompletion: { deleteMany: op("lessonCompletion.deleteMany") },
    ideaVote: { deleteMany: op("ideaVote.deleteMany") },
    savedJob: { deleteMany: op("savedJob.deleteMany") },
    savedJobSearch: { deleteMany: op("savedJobSearch.deleteMany") },
    notificationPreference: { deleteMany: op("notificationPreference.deleteMany") },
    twoFactorRecoveryCode: { deleteMany: op("twoFactorRecoveryCode.deleteMany") },
    auditLog: {
      create: op("auditLog.create"),
      update: op("auditLog.update"),
      updateMany: op("auditLog.updateMany"),
      findMany: vi.fn(async (args?: { where?: { action?: string } }) => {
        // De IDEA_STATUS_SET-scrub leest de status-auditregels van de eigen ideeën apart op: één
        // afwijs-regel (`{ from, to, reason }`) waarvan alleen de vrije-tekstreden mag verdwijnen,
        // plus één niet-afwijs-regel (`{ from, to }`) die ongemoeid moet blijven (geen loze reason).
        if (args?.where?.action === "IDEA_STATUS_SET") {
          return [
            {
              id: "idea-audit-decline",
              metadata: JSON.stringify({
                from: "UNDER_REVIEW",
                to: "DECLINED",
                reason: "Bevat de persoonsnaam Jan de Vries",
              }),
            },
            {
              id: "idea-audit-planned",
              metadata: JSON.stringify({ from: "OPEN", to: "PLANNED" }),
            },
          ];
        }
        if (args?.where?.action === "COLLABORATION_STATUS_CHANGED") {
          // De annuleer-regel draagt naast from/to óók de zelf-getypte reden + chargeable-oordeel:
          // alleen `reason` mag verdwijnen, from/to/chargeable blijven als verantwoordingsspoor. Een
          // gewone statuswijziging ({ from, to }, geen reason) blijft volledig ongemoeid.
          return [
            {
              id: "collab-audit-cancel",
              metadata: JSON.stringify({
                from: "ACTIVE",
                to: "CANCELLED",
                reason: "Gestopt wegens ziekte, kan de dienst niet afmaken",
                chargeable: true,
              }),
            },
            {
              id: "collab-audit-complete",
              metadata: JSON.stringify({ from: "ACTIVE", to: "COMPLETED" }),
            },
          ];
        }
        return [
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
        ];
      }),
    },
    $transaction: vi.fn(async (ops: Array<{ model: string; args: unknown }>) => {
      tx.ops = ops;
      return ops;
    }),
  },
}));

import { anonymizeUser } from "./actions";
import { prisma } from "@/lib/db";
import { noShowReportedNotificationBody } from "@/lib/no-show";
import { shiftHandoffRejectedNotificationBody } from "@/lib/shift-handoff";
import {
  invoiceRejectedNotificationBody,
  performanceRejectedNotificationBody,
  collaborationCancelledNotificationBody,
} from "@/lib/cascade/notification-bodies";
import { ideaCommentNotificationTitle, ideaStatusNotificationTitle } from "@/lib/ideas";

const find = (model: string) => tx.ops.find((o) => o.model === model);
const findAll = (model: string) => tx.ops.filter((o) => o.model === model);

beforeEach(() => {
  tx.ops = [];
  storageMock.del.mockClear();
  // Reset naar het standaard-dispuutevent (één eigen, nog-open dispuut op col-7) zodat een test die de
  // domainEvent-mock overschrijft niet naar de volgende lekt.
  (
    prisma.domainEvent.findMany as unknown as { mockImplementation: (fn: () => unknown) => void }
  ).mockImplementation(async () => [
    { subjectId: "col-7", type: "DISPUTE_OPENED", actorId: "user-42" },
  ]);
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

  it("wist de server-berekende per-persoon-snapshots van de eigen reacties (Application.complianceSnapshot/matchScore/proposedRate)", async () => {
    await anonymizeUser("user-42");
    // De freelancer-gescopete application.updateMany moet naast de vrije tekst ook de afgeleide
    // per-persoon-snapshots wissen: `complianceSnapshot` (JSON: wélke verplichte certificaten — o.a.
    // VOG/LICENSE/INSURANCE — de betrokkene bij het reageren mistte/verlopen had, een gevoelig
    // compliance-profiel), `matchScore` (afgeleide beoordeling) en `proposedRate` (zelf gevraagd
    // tarief). De rij overleeft de erasure gepseudonimiseerd, dus zonder deze wissing blijft die PII
    // via `freelancerId → FreelancerProfile → User` herleidbaar (AVG art. 17 + 5(1)(c)) — rood→groen.
    const ops = findAll("application.updateMany") as Array<{
      args: {
        where: { freelancer?: unknown; job?: unknown };
        data: {
          complianceSnapshot?: unknown;
          matchScore?: unknown;
          proposedRate?: unknown;
        };
      };
    }>;
    const freelancerScopedOp = ops.find((o) => o.args.where.freelancer !== undefined);
    expect(freelancerScopedOp).toBeDefined();
    expect(freelancerScopedOp!.args.data.complianceSnapshot).toBeNull();
    expect(freelancerScopedOp!.args.data.matchScore).toBeNull();
    expect(freelancerScopedOp!.args.data.proposedRate).toBeNull();
  });

  it("redact de door de opdrachtgever getypte vrije tekst op eigen opdrachten (Job.title/description/location)", async () => {
    await anonymizeUser("user-42");
    // De opdrachten van het bedrijf dragen door de OPDRACHTGEVER zelf getypte vrije tekst; een
    // `company.update` cascadeert niet naar Job, dus zonder een expliciete job.updateMany blijft die
    // (mogelijk naam/telefoon/adres-)tekst na anonimisering leesbaar en — voor een PUBLISHED-opdracht —
    // platform-breed zichtbaar. De redactie-op is bedrijfs-gescopet op de eigen opdrachten (rood→groen).
    const ops = findAll("job.updateMany") as Array<{
      args: {
        where: { company?: { userId?: string }; status?: string };
        data: { title?: unknown; description?: unknown; location?: unknown; status?: unknown };
      };
    }>;
    const redactOp = ops.find((o) => o.args.data.title !== undefined);
    expect(redactOp, "verwacht een Job-redactie-op").toBeDefined();
    expect(redactOp!.args.where).toEqual({ company: { userId: "user-42" } });
    expect(redactOp!.args.data.title).toMatch(/verwijderd/i);
    expect(redactOp!.args.data.description).toMatch(/verwijderd/i);
    expect(redactOp!.args.data.location).toBeNull();
  });

  it("haalt PUBLISHED-opdrachten van het geanonimiseerde account uit de publieke marktplaats (Job.status → CLOSED)", async () => {
    await anonymizeUser("user-42");
    // Een geanonimiseerd (SUSPENDED) account kan de opdracht nooit meer beheren/vervullen; de
    // marktplaats-where filtert enkel op status, niet op eigenaar-status. Alleen PUBLISHED → CLOSED,
    // eigenaar-gescopet — DRAFT/CLOSED blijven ongemoeid (rood→groen).
    const ops = findAll("job.updateMany") as Array<{
      args: {
        where: { company?: { userId?: string }; status?: string };
        data: { status?: unknown };
      };
    }>;
    const closeOp = ops.find((o) => o.args.where.status === "PUBLISHED");
    expect(closeOp, "verwacht een PUBLISHED→CLOSED-op").toBeDefined();
    expect(closeOp!.args.where).toEqual({ company: { userId: "user-42" }, status: "PUBLISHED" });
    expect(closeOp!.args.data.status).toBe("CLOSED");
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

  it("wist de eigen leesbevestigingen (ConversationParticipant.lastReadAt → null)", async () => {
    await anonymizeUser("user-42");
    const o = find("conversationParticipant.updateMany") as {
      args: { where: unknown; data: unknown };
    };
    expect(o).toBeDefined();
    // Gescopet op de eigen deelname-rijen — nooit de leesstaat van een tegenpartij.
    expect(o.args.where).toEqual({ userId: "user-42" });
    // Het tijdstip verdwijnt zodat de "Gezien"-markering van de tegenpartij niet toewijsbaar blijft.
    expect((o.args.data as { lastReadAt: Date | null }).lastReadAt).toBeNull();
  });

  it("wist de eigen leesbevestigingen op notificaties (Notification.readAt → null)", async () => {
    await anonymizeUser("user-42");
    // Naast de body-redactie wist de brede eigen-feed-wipe óók `readAt`. Dat is een door de betrokkene
    // zélf gezette engagement-timestamp (wanneer hij een melding las) die na anonimisering anders
    // toewijsbaar blijft aan de identieke `User.id` — dezelfde residuele-gedragsmetadata-klasse als
    // `lastLoginAt`/`lastReadAt`. De export gaf `readAt` al prijs; zonder deze wis is de erasure
    // asymmetrisch (rood→groen). Meerdere notification.updateMany's; pak de brede eigen-feed-variant
    // (where == exact { userId }, zonder title-filter).
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: Record<string, unknown>; data: { body?: unknown; readAt?: unknown } };
    }>;
    const ownFeedOp = ops.find(
      (o) =>
        o.args.where.userId === "user-42" &&
        Object.keys(o.args.where).length === 1 &&
        o.args.where.title === undefined,
    );
    expect(ownFeedOp).toBeDefined();
    expect((ownFeedOp!.args.data as { body: string }).body).toMatch(/verwijderd/i);
    expect(ownFeedOp!.args.data.readAt).toBeNull();
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

  it("redact de zelf-getypte prestatie-vrije-tekst (Performance.description + milestoneTitle) van de ZZP'er (AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // De ZZP'er typt bij het indienen van uren/mijlpalen een werkomschrijving (Performance.description,
    // niet-nullable) en mijlpaltitel — die kunnen opdrachtgever/locatie/persoonsdetails bevatten. De
    // Collaboration blijft staan als factuur-/fiscale historie, dus de onDelete:Cascade op Performance
    // vuurt niet: zonder een expliciete updateMany overleeft deze zelf-geschreven PII art. 17
    // (rood→groen). Gescopet op de eigen prestaties via collaboration.freelancer.userId.
    const o = find("performance.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ collaboration: { freelancer: { userId: "user-42" } } });
    const data = o.args.data as { description: string; milestoneTitle: string | null };
    expect(data.description).toMatch(/verwijderd/i);
    expect(data.milestoneTitle).toBeNull();
  });

  it("redact de zelf-getypte omschrijving van eigen zakelijke uitgaven (Expense.description, AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // `Expense.description` is vrije tekst die de ZZP'er bij een aftrekbare uitgave schreef en die een
    // opdrachtgever/locatie/persoon kan benoemen. De AVG-data-export (`account-export.ts`) exporteert dit
    // veld als eigen PII (art. 15/20); de erasure moet het spiegelbeeldig wissen. De Expense-rij blijft als
    // fiscale bewaargrond staan (net als Performance), dus non-nullable `description` → redactiestring.
    // Zonder deze updateMany overleeft de zelf-geschreven PII art. 17 (rood→groen). Gescopet op userId.
    const o = find("expense.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
    expect((o.args.data as { description: string }).description).toMatch(/verwijderd/i);
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

  it("wist de afwijsreden op eigen ideeën (Idea.declineReason) én redact 'm uit de IDEA_STATUS_SET-auditmetadata (AVG art. 15/17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // De AVG-inzage (`account-export.ts`) toont `Idea.declineReason` — de vrije tekst die een
    // beheerder bij het afwijzen typte — aan de betrokkene als deel van zijn eigen idee (art. 15).
    // De erasure moet die reden dan spiegelbeeldig kunnen wissen (art. 17). Vóór de fix redact de
    // idea.updateMany alleen title/description en overleeft declineReason (rood→groen).
    const idea = find("idea.updateMany") as { args: { data: { declineReason?: unknown } } };
    expect(idea).toBeDefined();
    expect(idea.args.data.declineReason).toBeNull();

    // Tweede kopie: de reden staat verbatim in de `{ from, to, reason }`-metadata van het
    // IDEA_STATUS_SET-auditrecord (actorId = beheerder, entityType "Idea" → nooit door de generieke
    // email/naam-scrub geraakt). Alleen de `reason`-sleutel wordt geredact; de statusovergang
    // (from/to, geen PII) blijft als verantwoordingsspoor staan. De niet-afwijs-regel (zonder reason)
    // mag ongemoeid blijven — daarvoor mag géén auditLog.update worden geschreven.
    const updates = findAll("auditLog.update") as Array<{
      args: { where: { id: string }; data: { metadata?: string } };
    }>;
    const declineOp = updates.find((u) => u.args.where.id === "idea-audit-decline");
    expect(declineOp).toBeDefined();
    const meta = JSON.parse(declineOp!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
    expect(meta.from).toBe("UNDER_REVIEW");
    expect(meta.to).toBe("DECLINED");
    // De reden-loze statusovergang wordt niet aangeraakt (geen loze reason-sleutel toegevoegd).
    expect(updates.some((u) => u.args.where.id === "idea-audit-planned")).toBe(false);
  });

  it("redact de idee-titel óók uit de IDEA_STATUS-/IDEA_COMMENT-notificatietitels op ándermans feed (AVG art. 17, MIDDEL)", async () => {
    await anonymizeUser("user-42");
    // De idee-titel (vrije tekst van de betrokkene, bevat hier zijn persoonsnaam) is verbatim in de
    // TITEL van de fanout-notificaties gekopieerd — óók naar stemmers/reageerders (`userId != de
    // betrokkene`). De brede notification.updateMany({ where: { userId } }) raakt alleen de EIGEN feed
    // én enkel de body; deze titel-kopie op ándermans feed overleefde art. 17 en werd via
    // account-export.ts (dat Notification.title prijsgeeft) aan die andere gebruiker getoond. Vóór de
    // fix bestaat er geen op de idee-titels gescopete notification.updateMany → deze assert faalt (rood→groen).
    const ideaTitle = "Idee van Jan de Vries voor betere planning";
    const ops = findAll("notification.updateMany") as Array<{
      args: {
        where: { type?: unknown; title?: { in?: string[] } };
        data: { title?: unknown };
      };
    }>;
    const titleOp = ops.find(
      (o) =>
        Array.isArray(o.args.where.title?.in) &&
        o.args.where.title.in.includes(ideaStatusNotificationTitle(ideaTitle)),
    );
    expect(titleOp).toBeDefined();
    // Beide notificatietypes die de titel dragen worden gescopet en geredact.
    expect(titleOp!.args.where.type).toEqual({ in: ["IDEA_STATUS", "IDEA_COMMENT"] });
    expect(titleOp!.args.where.title!.in).toContain(ideaCommentNotificationTitle(ideaTitle));
    expect(titleOp!.args.data.title).toMatch(/verwijderd/i);
  });

  it("wist de zelf-geschreven annuleerreden (Collaboration.cancellationReason)", async () => {
    await anonymizeUser("user-42");
    const o = find("collaboration.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ cancelledById: "user-42" });
    expect((o.args.data as { cancellationReason: string | null }).cancellationReason).toBeNull();
  });

  it("redact de annuleerreden óók uit de COLLABORATION_STATUS_CHANGED-auditmetadata (AVG art. 17, HOOG)", async () => {
    // Tweede kopie: de zelf-getypte reden staat verbatim in de `{ from, to, reason, chargeable }`-
    // metadata van het COLLABORATION_STATUS_CHANGED-auditrecord. De generieke email/naam-scrub raakt
    // een vrije-tekstreden nooit → die overleefde art. 17. Alleen de `reason`-sleutel wordt geredact;
    // from/to/chargeable blijven als verantwoordingsspoor. De reden-loze statuswijziging (COMPLETED,
    // zonder reason) mag ongemoeid blijven. Vóór de fix bestaat deze scrub niet (rood→groen).
    await anonymizeUser("user-42");
    const updates = findAll("auditLog.update") as Array<{
      args: { where: { id: string }; data: { metadata?: string } };
    }>;
    const cancelOp = updates.find((u) => u.args.where.id === "collab-audit-cancel");
    expect(cancelOp).toBeDefined();
    const meta = JSON.parse(cancelOp!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
    expect(meta.from).toBe("ACTIVE");
    expect(meta.to).toBe("CANCELLED");
    expect(meta.chargeable).toBe(true);
    // De reden-loze afrondingsovergang wordt niet aangeraakt (geen loze reason-sleutel toegevoegd).
    expect(updates.some((u) => u.args.where.id === "collab-audit-complete")).toBe(false);
  });

  it("redact de annuleerreden óók uit de COLLABORATION_STATUS-notificatie op de tegenpartij-feed (AVG art. 17, HOOG)", async () => {
    // Derde kopie: de TEGENPARTIJ (de opdrachtgever client-70, ≠ de annuleerder user-42) ontving een
    // COLLABORATION_STATUS-notificatie met de reden verbatim in de body. Die notificatie heeft geen
    // deep-link (link = "/samenwerkingen"), dus scope op de exacte, deterministisch reconstrueerbare
    // body (via de gedeelde `collaborationCancelledNotificationBody`) op de feed van de tegenpartij —
    // zo raken we nooit de annulering van een ándere gebruiker. De brede eigen-feed-wipe raakt deze
    // kopie op andermans feed NIET. Vóór de fix bestaat deze redactie niet (rood→groen).
    await anonymizeUser("user-42");
    const expectedBody = collaborationCancelledNotificationBody(
      "Gestopt wegens ziekte, kan de dienst niet afmaken",
      true,
    );
    const ops = findAll("notification.updateMany") as Array<{
      args: {
        where: { userId?: string; type?: unknown; body?: unknown };
        data: { body?: unknown };
      };
    }>;
    const o = ops.find(
      (x) => x.args.where.type === "COLLABORATION_STATUS" && x.args.where.userId === "client-70",
    );
    expect(o).toBeDefined();
    expect(o!.args.where.body).toBe(expectedBody);
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("wist het volledige beschikbaarheidsvenster (AvailabilityWindow — datums+type+uren+noot, AVG art. 17)", async () => {
    // Vóór de fix: alleen `note` werd genulld → startDate/endDate/type/hoursPerWeek overleefden als
    // gedragsmetadata (een patroon van UNAVAILABLE-vensters kan omstandigheden prijsgeven), gekoppeld
    // aan de behouden FreelancerProfile.id. Zonder tegenpartij-/fiscale bewaargrond wist de fix nu de
    // hele rij (spiegel WorkExperience/SavedJob). Rood zonder de bronwijziging (updateMany → deleteMany).
    await anonymizeUser("user-42");
    const o = find("availabilityWindow.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ freelancerProfile: { userId: "user-42" } });
    // De oude, partiële updateMany mag niet meer draaien.
    expect(find("availabilityWindow.updateMany")).toBeUndefined();
  });

  it("verwijdert de tweestapsverificatie-herstelcodes gescopet op de betrokkene (AVG art. 17)", async () => {
    // De TwoFactorRecoveryCode-rijen zijn bruikbaar authenticatiemateriaal (bcrypt-hash van eenmalige
    // back-upcodes). Een `user.update` cascadeert er niet naartoe, dus ze worden expliciet hard
    // verwijderd — maar ALLEEN die van de betrokkene. De coverage-gate is een tekst-scan die een
    // scoping-regressie (bv. een `where` die álle gebruikers raakt of de call buiten de transactie)
    // niet zou vangen; deze assertie dwingt de userId-scope hard af.
    await anonymizeUser("user-42");
    const o = find("twoFactorRecoveryCode.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
  });

  it("wist de zelf-getypte factuurregel-omschrijvingen (InvoiceLine.description, AVG art. 17)", async () => {
    // Handmatige/cascade-factuur → InvoiceLine.description is zelf-getypte vrije tekst van de
    // uitschrijver (kan opdrachtgever/locatie/persoondetails bevatten). De Invoice-rij blijft staan
    // (fiscale bewaargrond) maar de omschrijving moet mee. Gescopet op de EIGEN uitschrijver-facturen:
    // issuerUserId == de betrokkene (cascade) óf de samenwerking-freelancer-link (legacy loose).
    await anonymizeUser("user-42");
    const o = find("invoiceLine.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({
      invoice: {
        OR: [{ issuerUserId: "user-42" }, { collaboration: { freelancer: { userId: "user-42" } } }],
      },
    });
    expect((o.args.data as { description: string }).description).toBe(
      "[Verwijderd op verzoek van de gebruiker]",
    );
  });

  it("wist de eigen dispuutreden, gescopet op de eigen DISPUTE_OPENED-events", async () => {
    await anonymizeUser("user-42");
    // Twee collaboration.updateMany's: cancellationReason (cancelledById) én disputeReason (id in ...).
    const ops = findAll("collaboration.updateMany") as Array<{
      args: { where: { id?: { in: string[] }; disputeReason?: unknown }; data: unknown };
    }>;
    const disputeOp = ops.find((o) => o.args.where.id !== undefined);
    expect(disputeOp).toBeDefined();
    // De ids komen uit het huidige, nog-open eigen dispuut van de betrokkene (mock geeft col-7).
    expect(disputeOp!.args.where.id).toEqual({ in: ["col-7"] });
    expect((disputeOp!.args.data as { disputeReason: string | null }).disputeReason).toBeNull();
  });

  it("wist de LIVE dispuutreden NIET als de tegenpartij het huidige dispuut heropende (geen vernietiging van andermans lopende bewijs, rood→groen)", async () => {
    // Scenario: de betrokkene opende ooit een dispuut op col-8, admin loste het op (reden genulld),
    // daarna opende de TEGENPARTIJ een nieuw dispuut op dezelfde samenwerking. `disputeReason` bevat nu
    // de reden van de tegenpartij. Een naïeve scope op alle-tijd eigen DISPUTE_OPENED-events zou col-8
    // nog matchen en die lopende, vreemde reden bij de erasure van de betrokkene wegvagen.
    (
      prisma.domainEvent.findMany as unknown as { mockImplementation: (fn: () => unknown) => void }
    ).mockImplementation(async () => [
      { subjectId: "col-8", type: "DISPUTE_OPENED", actorId: "user-42" },
      { subjectId: "col-8", type: "DISPUTE_RESOLVED", actorId: "admin-1" },
      { subjectId: "col-8", type: "DISPUTE_OPENED", actorId: "other-party" },
    ]);

    await anonymizeUser("user-42");

    const ops = findAll("collaboration.updateMany") as Array<{
      args: { where: { id?: { in: string[] }; disputeReason?: unknown }; data: unknown };
    }>;
    const disputeOp = ops.find((o) => o.args.where.id !== undefined);
    expect(disputeOp).toBeDefined();
    // Groen: de huidige opener is de tegenpartij → geen samenwerking-id in scope, de live reden van de
    // tegenpartij blijft staan. Zonder de fix zou dit ["col-8"] zijn en andermans bewijs vernietigen.
    expect(disputeOp!.args.where.id).toEqual({ in: [] });
    // De eigen event-payload/audit-redactie blijft wél breed (op actorId) — die raakt alleen eigen tekst.
    const eventOp = find("domainEvent.updateMany") as { args: { where: unknown } };
    expect(eventOp.args.where).toEqual({ type: "DISPUTE_OPENED", actorId: "user-42" });
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
    // Er zijn twee auditLog.updateMany's (de credential-metadata-redactie + deze DISPUTE-variant);
    // pak de dispuut-variant op zijn where-vorm.
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { action?: string }; data: { metadata?: string } };
    }>;
    const o = ops.find((x) => x.args.where.action === "DISPUTE_OPENED");
    expect(o).toBeDefined();
    // Gescopet op de eigen dispuut-auditregels (actorId == de betrokkene), nooit die van de tegenpartij.
    expect(o!.args.where).toEqual({ actorId: "user-42", action: "DISPUTE_OPENED" });
    const meta = JSON.parse(o!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de factuur-intrekreden óók uit de INVOICE_WITHDRAWN-auditlog-metadata (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // De ZZP'er (uitschrijver) typt bij het intrekken van een ingediende factuur een vrije-tekstreden
    // die in de `{ reason }`-metadata van het eigen INVOICE_WITHDRAWN-auditrecord belandt (withdrawInvoice,
    // cascade/invoice-commands.ts). De generieke email/naam-scrub raakt vrije tekst nooit, dus zonder een
    // expliciete updateMany overleeft de reden art. 17 — herleidbaar via AuditLog.actorId naar de
    // (hernoemde) User. Alleen de uitschrijver trekt in → actorId == de betrokkene is exact (rood→groen).
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { action?: string }; data: { metadata?: string } };
    }>;
    const o = ops.find((x) => x.args.where.action === "INVOICE_WITHDRAWN");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({ actorId: "user-42", action: "INVOICE_WITHDRAWN" });
    const meta = JSON.parse(o!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de metadata van de credential-auditregels (o.a. CREDENTIAL_REJECTED-reden, AVG art. 17, KRITIEK)", async () => {
    await anonymizeUser("user-42");
    // De credential-rijen worden hard verwijderd, maar hun auditregels overleven. De CREDENTIAL_REJECTED-
    // regel draagt de door de beheerder getypte afwijsreden (vrije tekst, mogelijk de naam of art. 9-
    // inhoud van een VOG/diploma) in `metadata`. Die regel heeft `actorId` = beheerder en
    // `entityType` = "Credential", dus de eigen-actor/entity-scrub raakt 'm nooit — zonder deze
    // expliciete updateMany overleeft de reden art. 17 (rood→groen).
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { entityType?: string; entityId?: unknown }; data: { metadata?: unknown } };
    }>;
    const o = ops.find((x) => x.args.where.entityType === "Credential");
    expect(o).toBeDefined();
    // Gescopet op de (uniek aan de betrokkene toebehorende) credential-id's, vóór hun verwijdering verzameld.
    expect(o!.args.where.entityId).toEqual({ in: ["cred-1", "cred-2"] });
    // Metadata volledig geleegd — verwijdert de reden en elk ander PII-veld.
    expect(o!.args.data.metadata).toBeNull();
  });

  it("redact de dispuutreden óók uit de admin-fanout-notificatie (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Vierde PII-kopie: de admin-notificatie draagt `Dispuut bij "<opdracht>": <reden>` in haar body.
    // Notificaties worden nergens anders geredact, dus zonder deze updateMany blijft de reden bij élke
    // admin zichtbaar — deze assert faalt dan (rood→groen). Er zijn twee notification.updateMany's
    // (deze admin-fanout + de eigen-feed-redactie hieronder); pak de admin-variant op zijn where-vorm.
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { type?: unknown; title?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "DISPUTE_OPENED");
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

  it("redact de berichttekst óók uit de MESSAGE-notificatie op de feed van de ONTVANGER (AVG art. 17, KRITIEK)", async () => {
    await anonymizeUser("user-42");
    // Elk verzonden bericht is verbatim (≤120 tekens) naar de body van de MESSAGE-notificatie op de
    // feed van de ONTVANGER gekopieerd (userId == ontvanger). De `Message.body`-redactie (senderId)
    // en de brede eigen-feed-wipe (userId == betrokkene) raken die tweede kopie geen van beide — zonder
    // deze gerichte redactie blijft de vrije berichttekst (telefoon/adres) leesbaar op andermans feed
    // én in diens AVG-inzage-export (`account-export.ts` geeft `Notification.body` onvoorwaardelijk
    // prijs). Deze assert faalt zonder de fix (rood→groen). Meerdere notification.updateMany's; pak de
    // MESSAGE-variant op zijn where-vorm.
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { type?: unknown; link?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "MESSAGE");
    expect(o).toBeDefined();
    // Gescopet op het exacte, deterministisch reconstrueerbare tripel (type + gespreks-deep-link +
    // body-slice) zodat we nooit het bericht van een ándere afzender in hetzelfde gesprek raken.
    expect(o!.args.where).toEqual({
      type: "MESSAGE",
      link: "/berichten/conv-5",
      body: "Bel me op 06-12345678, mijn adres is Kerkstraat 12",
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("verwijdert de favorieten die de CLIENT bijhield (FavoriteFreelancer — rij + notitie, AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // De héle rij wordt gewist, niet enkel de `note`: `companyId + freelancerProfileId + createdAt` is
    // zíjn eigen bookmark-/gedragsmetadata (welke ZZP'ers hij bookmarkte, wanneer) zonder tegenpartij-
    // waarde — de ZZP'er ziet deze privé-favoriet nooit. Enkel de notitie redacten liet relatie+timestamp
    // achter (art. 17-residu). Gescopet op de eigen bedrijven (company.userId), nooit een favoriet van een
    // andere opdrachtgever. Zonder de deleteMany overleeft de bookmark art. 17 (rood→groen).
    const o = find("favoriteFreelancer.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ company: { userId: "user-42" } });
  });

  it("verwijdert de opgeslagen opdrachten (SavedJob — eigen bookmark-/gedragsmetadata, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // `SavedJob` draagt uitsluitend zíjn `freelancerProfileId` + `createdAt` (welke vacature bewaard,
    // wanneer) — toewijsbare gedragsmetadata over de betrokkene, geen gedeelde/tegenpartij-waarde. Het
    // `FreelancerProfile` wordt geüpdatet (niet verwijderd), dus de `onDelete: Cascade` vuurt niet; zonder
    // deze deleteMany overleeft de bookmark-historie art. 17 (rood→groen). Gescopet op het eigen profiel
    // (freelancer.userId), nooit de bookmarks van een andere ZZP'er. De inzage-export geeft ze nu óók prijs.
    const o = find("savedJob.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ freelancer: { userId: "user-42" } });
  });

  it("verwijdert de bewaarde zoekopdrachten (SavedJobSearch — eigen zoek-/voorkeurmetadata, AVG art. 17, MIDDEL)", async () => {
    await anonymizeUser("user-42");
    // `SavedJobSearch` (`name` = zelf-getypte vrije tekst, `query` = opgeslagen zoekfilter, `createdAt`)
    // is de exacte spiegel van `SavedJob`: eigen gedrags-/voorkeurmetadata over de betrokkene (waar hij
    // naar werk zocht, en wanneer), zonder gedeelde/tegenpartij-waarde. Het `FreelancerProfile` wordt
    // geüpdatet (niet verwijderd), dus de `onDelete: Cascade` vuurt niet; zonder deze deleteMany overleeft
    // de zoek-historie art. 17 (rood→groen; de saved-search-feature liet dit gat eerder ontstaan). Gescopet
    // op het eigen profiel (freelancer.userId), nooit de zoekopdrachten van een andere ZZP'er.
    const o = find("savedJobSearch.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ freelancer: { userId: "user-42" } });
  });

  it("verwijdert de e-mailvoorkeuren (NotificationPreference — eigen opt-out-config, AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // `NotificationPreference` (`userId + category + emailEnabled`) is de eigen opt-out-/voorkeurstaat —
    // gedragsconfiguratie gebonden aan de betrokkene. Een `user.update` triggert de cascade niet; zonder
    // deze deleteMany blijft "welke e-mailcategorieën deze (geanonimiseerde) gebruiker uitzette" staan
    // (rood→groen). Gescopet strikt op de eigen `userId`.
    const o = find("notificationPreference.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
  });

  it("verwijdert de zelf-gerapporteerde werkervaring (WorkExperience — vrije-tekst-PII op het profiel)", async () => {
    await anonymizeUser("user-42");
    const o = find("workExperience.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    // Gescopet op het eigen profiel (freelancerProfile.userId), nooit dat van een ander.
    expect(o.args.where).toEqual({ freelancerProfile: { userId: "user-42" } });
  });

  it("verwijdert de bedrijfslogo-blob uit de opslag (Company.logoKey — losse blob, géén Document-rij, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Het logo wordt via bedrijf/actions.ts als losse storage-blob geüpload (Company.logoKey), niet als
    // Document-rij. De transactie zet logoKey op null maar raakt het bestand niet; zonder de expliciete
    // storage.delete blijft het (voor een eenmanszaak mogelijk een persoonlijke foto) als weesblob voor
    // altijd staan — een half-voltooide verwijdering. Deze assert faalt zonder de fix (rood→groen).
    expect(storageMock.del).toHaveBeenCalledWith("2026/company-logo-abc.png");
  });

  it("wist geen logo-blob als de betrokkene geen bedrijf/logo heeft (null-guard, geen lege-key-delete)", async () => {
    (
      prisma.company.findUnique as unknown as {
        mockImplementationOnce: (fn: () => unknown) => void;
      }
    ).mockImplementationOnce(async () => null);
    await anonymizeUser("user-42");
    // Geen bedrijf (of geen logo) → de opslag-opruiming mag niet met een lege/undefined key worden
    // aangeroepen (documents is in deze mock ook leeg, dus storage.delete hoort helemaal niet te vuren).
    expect(storageMock.del).not.toHaveBeenCalled();
  });

  it("leest de document-storagesleutels PAS ná de anonimiseringstransactie — race-vrij (TOCTOU, CWE-367, AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // De blob-opruiming moet de storagesleutels lezen NADAT het account is geanonimiseerd (SUSPENDED,
    // passwordHash gewist → currentActor() geeft null, dus geen upload meer mogelijk). Pas dan dekt de
    // sleutellijst exact de te wissen rijen en kan er geen weesblob ontstaan. Bewijs: de document.findMany
    // die de sleutels ophaalt valt ná de $transaction. Vóór de fix werd die lijst vóór de transactie
    // gesnapshot (findMany-volgorde < $transaction-volgorde) — dan faalt deze assert (rood→groen).
    const findManyOrder = (
      prisma.document.findMany as unknown as { mock: { invocationCallOrder: number[] } }
    ).mock.invocationCallOrder.at(-1)!;
    const txOrder = (
      prisma.$transaction as unknown as { mock: { invocationCallOrder: number[] } }
    ).mock.invocationCallOrder.at(-1)!;
    expect(findManyOrder).toBeGreaterThan(txOrder);
  });

  it("wist de blob van een document dat tijdens het anonimiseringsvenster opdook (geen weesblob, art. 17)", async () => {
    // Simuleer een document dat pas ná de start van de anonimisering in de DB staat. Omdat de sleutels
    // nu PAS ná de transactie worden gelezen, ziet de opruiming dit document en wordt zowel de rij als de
    // blob gewist — geen achtergebleven (mogelijk art. 9-)VOG/diploma.
    (
      prisma.document.findMany as unknown as {
        mockResolvedValueOnce: (v: unknown) => void;
      }
    ).mockResolvedValueOnce([{ storageKey: "2026/vog-tijdens-venster.pdf" }]);
    await anonymizeUser("user-42");
    expect(storageMock.del).toHaveBeenCalledWith("2026/vog-tijdens-venster.pdf");
    expect(prisma.document.deleteMany).toHaveBeenCalledWith({ where: { ownerId: "user-42" } });
  });

  it("verwijdert push-abonnementen (PushSubscription — toestel-identifier)", async () => {
    await anonymizeUser("user-42");
    const o = find("pushSubscription.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
  });

  it("verwijdert de afgeronde academielessen (LessonCompletion — eigen leer-/voortgangsmetadata, AVG art. 17, LAAG)", async () => {
    await anonymizeUser("user-42");
    // `LessonCompletion` draagt uitsluitend de eigen `userId` + `completedAt` (welke les, wanneer
    // afgerond) — toewijsbare gedragsmetadata over de betrokkene, geen gedeelde/tegenpartij-waarde. Een
    // `user.update` triggert geen cascade, dus zonder deze deleteMany overleeft de metadata art. 17
    // (rood→groen). De AVG-inzage (`account-export.ts`) geeft deze rijen nu óók prijs (art. 15/20-symmetrie).
    const o = find("lessonCompletion.deleteMany") as { args: { where: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ userId: "user-42" });
  });

  it("verwijdert de stemmen op ideeën (IdeaVote — eigen gedragsmetadata, AVG art. 17, LAAG)", async () => {
    await anonymizeUser("user-42");
    // `IdeaVote` draagt uitsluitend de eigen `userId` + `createdAt` (op welk idee, wanneer gestemd) —
    // toewijsbare gedragsmetadata over de betrokkene. Zonder deze deleteMany overleeft ze art. 17
    // (rood→groen). Symmetrisch met de inzage-export die deze stemmen nu prijsgeeft.
    const o = find("ideaVote.deleteMany") as { args: { where: unknown } };
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

  it("wist de zelf-geschreven creditreden op de eigen credit-facturen (Invoice.rejectionReason, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // `creditInvoice` (cascade) zet de door de ZZP'er zélf getypte creditreden op
    // `Invoice.rejectionReason` (lifecycleStatus CREDITED). `anonymizeUser` raakte de Invoice nergens
    // aan — zonder deze updateMany overleeft de zelf-geschreven reden art. 17 (rood→groen). Gescopet op
    // de eigen credit-facturen (issuerUserId == de betrokkene, CREDITED) zodat een REJECTED-reden
    // (door de OPDRACHTGEVER geschreven, apart geredact bij díens erasure) niet in dezelfde updateMany
    // wordt geraakt. De credit-updateMany komt als eerste `invoice.updateMany` in de transactie.
    const o = find("invoice.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ id: { in: ["inv-credit-1"] } });
    expect((o.args.data as { rejectionReason: string | null }).rejectionReason).toBeNull();
  });

  it("redact de creditreden óók uit de INVOICE_CREDITED-auditmetadata van de eigen facturen (AVG art. 17)", async () => {
    await anonymizeUser("user-42");
    // Tweede kopie: de reden staat in de `{ reason }`-metadata van het `INVOICE_CREDITED`-auditrecord.
    // De generieke email/naam-scrub raakt vrije tekst niet — zonder deze expliciete updateMany overleeft
    // de reden art. 17 (rood→groen). Gescopet op de credit-actie + de eigen factuur-id's (raakt nooit een
    // `INVOICE_REJECTED`-regel van de tegenpartij).
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { action?: string; entityId?: unknown }; data: { metadata?: string } };
    }>;
    const o = ops.find((x) => x.args.where.action === "INVOICE_CREDITED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      action: "INVOICE_CREDITED",
      entityType: "Invoice",
      entityId: { in: ["inv-credit-1"] },
    });
    const meta = JSON.parse(o!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de creditreden óók uit de tegenpartij-notificatie (INVOICE_CREDITED body, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Derde kopie: de opdrachtgever ontving een `INVOICE_CREDITED`-notificatie met de reden verbatim in
    // de body. Die notificatie heeft geen deep-link (link = "/facturen"), dus wordt gescopet op de
    // exacte, deterministisch reconstrueerbare body (factuurnummer + reden) op de eigen feed van de
    // tegenpartij (client-77) — nooit de credit van een ándere ZZP'er. Zonder deze updateMany blijft de
    // zelf-geschreven reden bij de opdrachtgever zichtbaar (rood→groen).
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; type?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "INVOICE_CREDITED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      userId: "client-77",
      type: "INVOICE_CREDITED",
      body: "Factuur 2026-014 is gecrediteerd door de ZZP'er. Reden: Verkeerd uurtarief gefactureerd, correctie.",
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("wist de door de OPDRACHTGEVER getypte factuur-afkeurreden op de eigen afgekeurde facturen (Invoice.rejectionReason, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // `rejectInvoice` (cascade) zet de door de OPDRACHTGEVER zélf getypte afkeurreden op
    // `Invoice.rejectionReason` (lifecycleStatus REJECTED). Bij verwijdering van de OPDRACHTGEVER — de
    // AUTEUR — moet die reden mee; zonder deze updateMany overleeft de zelf-geschreven reden art. 17
    // (rood→groen). Gescopet op de eigen afgekeurde facturen (counterpartyUserId == de betrokkene,
    // REJECTED). Pak de tweede `invoice.updateMany` (de eerste is de credit-variant hierboven).
    const ops = findAll("invoice.updateMany") as Array<{
      args: { where: { id?: { in?: string[] } }; data: { rejectionReason?: string | null } };
    }>;
    const o = ops.find((x) => x.args.where.id?.in?.includes("inv-reject-1"));
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({ id: { in: ["inv-reject-1"] } });
    expect(o!.args.data.rejectionReason).toBeNull();
  });

  it("redact de factuur-afkeurreden óók uit de INVOICE_REJECTED-auditmetadata (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Tweede kopie: de reden staat in de `{ reason }`-metadata van het `INVOICE_REJECTED`-auditrecord.
    // De generieke email/naam-scrub raakt vrije tekst niet — zonder deze expliciete updateMany overleeft
    // de reden art. 17 (rood→groen). Gescopet op de afkeur-actie + de eigen factuur-id's.
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { action?: string; entityId?: unknown }; data: { metadata?: string } };
    }>;
    const o = ops.find((x) => x.args.where.action === "INVOICE_REJECTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      action: "INVOICE_REJECTED",
      entityType: "Invoice",
      entityId: { in: ["inv-reject-1"] },
    });
    const meta = JSON.parse(o!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de factuur-afkeurreden óók uit de INVOICE_REJECTED-notificatie op de ZZP'er-feed (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Derde kopie: de ZZP'er (crediteur) ontving een `INVOICE_REJECTED`-notificatie met de reden
    // verbatim in de body. Die notificatie heeft geen deep-link (link = "/facturen"), dus wordt gescopet
    // op de exacte, deterministisch reconstrueerbare body (via de gedeelde `invoiceRejectedNotificationBody`)
    // op de feed van de ZZP'er (issuer-55) — nooit de afkeuring van een ándere opdrachtgever. Zonder deze
    // updateMany blijft de door de opdrachtgever getypte reden bij de ZZP'er zichtbaar (rood→groen).
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; type?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "INVOICE_REJECTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      userId: "issuer-55",
      type: "INVOICE_REJECTED",
      body: invoiceRejectedNotificationBody("Uren komen niet overeen met de opdracht"),
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("wist de door de OPDRACHTGEVER getypte prestatie-afkeurreden op de eigen afgekeurde prestaties (Performance.rejectionReason, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // `rejectPerformance` (cascade) zet de door de OPDRACHTGEVER zélf getypte afkeurreden op
    // `Performance.rejectionReason` (status REJECTED). De ZZP'er-erasure redact al description/
    // milestoneTitle maar bewust NIET deze reden (door de tegenpartij geschreven). Bij verwijdering van
    // de OPDRACHTGEVER — de AUTEUR — moet hij mee; zonder deze updateMany overleeft de reden art. 17
    // (rood→groen). Gescopet op de eigen bedrijfsprestaties (collaboration.company.userId == de
    // betrokkene, REJECTED). Pak de `performance.updateMany` met de reject-id (de andere redact
    // description/milestoneTitle op de ZZP'er-scope).
    const ops = findAll("performance.updateMany") as Array<{
      args: { where: { id?: { in?: string[] } }; data: { rejectionReason?: string | null } };
    }>;
    const o = ops.find((x) => x.args.where.id?.in?.includes("perf-reject-1"));
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({ id: { in: ["perf-reject-1"] } });
    expect(o!.args.data.rejectionReason).toBeNull();
  });

  it("redact de prestatie-afkeurreden óók uit de PERFORMANCE_REJECTED-auditmetadata (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Tweede kopie: de `{ reason }`-metadata van het `PERFORMANCE_REJECTED`-auditrecord.
    const ops = findAll("auditLog.updateMany") as Array<{
      args: { where: { action?: string; entityId?: unknown }; data: { metadata?: string } };
    }>;
    const o = ops.find((x) => x.args.where.action === "PERFORMANCE_REJECTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      action: "PERFORMANCE_REJECTED",
      entityType: "Performance",
      entityId: { in: ["perf-reject-1"] },
    });
    const meta = JSON.parse(o!.args.data.metadata as string);
    expect(meta.reason).toBe("[verwijderd]");
  });

  it("redact de prestatie-afkeurreden óók uit de PERFORMANCE_REJECTED-notificatie op de ZZP'er-feed (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Derde kopie: de ZZP'er ontving een `PERFORMANCE_REJECTED`-notificatie met de reden verbatim in de
    // body (link = "/samenwerkingen", geen deep-link). Gereconstrueerd via de gedeelde
    // `performanceRejectedNotificationBody` en op de feed van de ZZP'er (freelancer-66) geredact — nooit
    // de afkeuring van een ándere opdrachtgever. Zonder deze updateMany blijft de reden zichtbaar (rood→groen).
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; type?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "PERFORMANCE_REJECTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      userId: "freelancer-66",
      type: "PERFORMANCE_REJECTED",
      body: performanceRejectedNotificationBody("Oplevering onvolledig, ontbrekende rapportage"),
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("redact de zelf-getypte no-show-reden op de eigen meldingen (NoShowReport.reason, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // De MÉLDER (opdrachtgever/franchiser) typte de reden zélf; de AVG-data-export (`account-export.ts`,
    // `reportedById == actor`) erkent 'm als eigen PII onder art. 15/20. `anonymizeUser` raakte de
    // NoShowReport nergens aan — zonder deze updateMany overleeft de zelf-geschreven reden art. 17
    // (rood→groen). De rij blijft als geschil-/verantwoordingshistorie staan (niet-nullable `reason` →
    // redactiestring). Gescopet op de eigen meldingen (reportedById == de betrokkene).
    const o = find("noShowReport.updateMany") as { args: { where: unknown; data: unknown } };
    expect(o).toBeDefined();
    expect(o.args.where).toEqual({ id: { in: ["nsr-1"] } });
    expect((o.args.data as { reason: string }).reason).toMatch(/verwijderd/i);
  });

  it("redact de no-show-reden óók uit de NO_SHOW_REPORTED-notificatie op de feed van de gemelde ZZP'er (AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Tweede kopie: `reportNoShow` zet de reden verbatim in de body van de notificatie die de gemelde
    // ZZP'er ontvangt. Die body wordt deterministisch gereconstrueerd via de gedeelde
    // `noShowReportedNotificationBody` en op de feed van de ZZP'er geredact — nooit de no-show van een
    // ándere melder. Zonder deze updateMany blijft de zelf-geschreven reden op andermans feed staan
    // (rood→groen). Meerdere notification.updateMany's; pak de NO_SHOW_REPORTED-variant.
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; type?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "NO_SHOW_REPORTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      userId: "zzp-88",
      type: "NO_SHOW_REPORTED",
      body: noShowReportedNotificationBody({
        jobTitle: "Nachtdienst ZZP",
        occurredOn: new Date("2026-05-07"),
        reason: "Niet op komen dagen zonder bericht",
      }),
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });

  it("redact de shift-overname-afwijsreden óók uit de SHIFT_HANDOFF_REJECTED-notificatie op de AANVRAGERSfeed (decisionNote, AVG art. 17, HOOG)", async () => {
    await anonymizeUser("user-42");
    // Tweede kopie: `rejectShiftHandoff` zet de door de BESLISSER getypte reden verbatim in de body van
    // de notificatie die de AANVRAGER (requester-99) ontvangt — een ándere gebruiker dan de beslisser.
    // De generieke eigen-feed-wipe (userId == de betrokkene) raakt die dus NIET wanneer de betrokkene de
    // beslisser is. De body wordt deterministisch gereconstrueerd via de gedeelde
    // `shiftHandoffRejectedNotificationBody` en op de aanvragersfeed geredact — nooit de afwijzing van
    // een ándere beslisser. Zonder deze updateMany overleeft de zelf-geschreven reden art. 17 op
    // andermans feed (en in diens inzage-export) (rood→groen).
    const ops = findAll("notification.updateMany") as Array<{
      args: { where: { userId?: string; type?: string; body?: string }; data: { body?: string } };
    }>;
    const o = ops.find((x) => x.args.where.type === "SHIFT_HANDOFF_REJECTED");
    expect(o).toBeDefined();
    expect(o!.args.where).toEqual({
      userId: "requester-99",
      type: "SHIFT_HANDOFF_REJECTED",
      body: shiftHandoffRejectedNotificationBody({
        jobTitle: "Nachtdienst ZZP",
        note: "Kandidaat niet geschikt voor deze nachtinzet",
      }),
    });
    expect(o!.args.data.body).toMatch(/verwijderd/i);
  });
});
