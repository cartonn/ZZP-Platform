"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthorizationError, requireActor, requireRole, type Actor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertCollaborationTransition, CollaborationTransitionError } from "@/lib/collaborations";
import { assertJobTransition } from "@/lib/jobs";
import { planReplacement } from "@/lib/replacement";
import { cancellationBlockReason, completionBlockReason } from "@/lib/cascade/completion";
import { signContract, CascadeError } from "@/lib/cascade/commands";
import { assessCancellation } from "@/lib/cancellation";
import {
  type CollaborationStatus,
  type CredentialType,
  type JobStatus,
  collaborationStatusSchema,
  credentialTypeSchema,
} from "@/lib/enums";
import { collaborationProposalSchema, collaborationCancellationSchema } from "@/lib/validation";
import { toSafeActionError } from "@/lib/safe-action-error";
import { assessCollaborationCredentials } from "@/lib/collaboration-alerts";
import { type FreelancerCredential } from "@/lib/matching";
import {
  reminderDayStart,
  credentialReminderLink,
  credentialReminderMessage,
} from "@/lib/collaboration-reminder";
import { z } from "zod";

// Eén bewoording voor de dispuut-vries, woordelijk gelijk aan de cascade-command-familie
// (`assertNotDisputed` / `persistEventAndEffects`) zodat de UI-melding niet driftet tussen paden.
const DISPUTE_FROZEN_MESSAGE =
  "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.";

export type ProposalState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/** CLIENT stelt een samenwerking voor op basis van een geaccepteerde reactie. */
export async function proposeCollaboration(
  applicationId: string,
  _prev: ProposalState,
  formData: FormData,
): Promise<ProposalState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { id: true, companyId: true, company: { select: { userId: true } } } },
      freelancer: { select: { id: true, userId: true } },
    },
  });
  if (!application || application.job.company.userId !== actor.id)
    return { error: "Reactie niet gevonden." };
  if (application.status !== "ACCEPTED") return { error: "Accepteer de reactie eerst." };

  const existing = await prisma.collaboration.findUnique({
    where: { applicationId },
    select: { id: true },
  });
  if (existing) return { error: "Er bestaat al een samenwerking voor deze reactie." };

  const parsed = collaborationProposalSchema.safeParse({
    rate: formData.get("rate") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  let collaboration;
  try {
    collaboration = await prisma.collaboration.create({
      data: {
        jobId: application.job.id,
        applicationId,
        freelancerId: application.freelancer.id,
        companyId: application.job.companyId,
        status: "PROPOSED",
        rate: data.rate ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    });
  } catch (e) {
    // Gelijktijdig voorstel op dezelfde reactie → applicationId @unique. Nette melding i.p.v. 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "Er bestaat al een samenwerking voor deze reactie." };
    throw e;
  }

  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: application.freelancer.userId,
        type: "COLLABORATION_PROPOSED",
        title: "Samenwerking voorgesteld",
        body: "Een opdrachtgever heeft je een samenwerking voorgesteld.",
        link: "/samenwerkingen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "COLLABORATION_PROPOSED",
        entityType: "Collaboration",
        entityId: collaboration.id,
      }),
    }),
  ]);

  revalidatePath("/samenwerkingen");
  revalidatePath("/kandidaten");
  return undefined;
}

export type CancelState = { error?: string } | undefined;

/**
 * Annuleren met verplichte reden (symmetrisch: beide partijen). De 7-dagen-kostenregel wordt
 * server-side beoordeeld en als snapshot op de samenwerking vastgelegd (productbesluit 12-6-2026):
 * een opdrachtgever-annulering van een actieve samenwerking korter dan 7 dagen vóór de start is
 * betalingsplichtig.
 */
export async function cancelCollaboration(
  collaborationId: string,
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const actor = await requireActor();
  const parsed = collaborationCancellationSchema.safeParse({
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de reden." };

  try {
    await applyCollaborationStatusChange(actor, collaborationId, "CANCELLED", {
      reason: parsed.data.reason,
    });
  } catch (e) {
    // Gecureerde domeinfouten (AuthorizationError/*TransitionError/CascadeError) passeren met hun
    // eigen Nederlandse message; een onverwachte Prisma-/systeemfout wordt server-side gelogd en
    // vervangen door een generieke boodschap i.p.v. rauwe interne details te lekken (CWE-209 / A05).
    return { error: toSafeActionError(e) };
  }
  return undefined;
}

export async function changeCollaborationStatus(
  collaborationId: string,
  target: string,
): Promise<void> {
  const actor = await requireActor();
  // safeParse (geen throwing .parse): een geknutselde POST met een `target` buiten de enum mag geen
  // onafgevangen ZodError/500 geven, maar een nette domeinfout — spiegelt franchise/diensten.
  const parsedTarget = collaborationStatusSchema.safeParse(target);
  if (!parsedTarget.success) throw new Error("Ongeldige doelstatus.");
  const targetStatus = parsedTarget.data;
  // Annuleren loopt uitsluitend via cancelCollaboration (reden verplicht + kostensnapshot).
  if (targetStatus === "CANCELLED")
    throw new Error("Annuleren vereist een reden — gebruik de annuleerknop.");
  await applyCollaborationStatusChange(actor, collaborationId, targetStatus);
}

async function applyCollaborationStatusChange(
  actor: Actor,
  collaborationId: string,
  targetStatus: CollaborationStatus,
  cancellation?: { reason: string },
): Promise<void> {
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { id: true, status: true, title: true } },
    },
  });
  if (!collaboration) throw new Error("Samenwerking niet gevonden.");

  // Anti-oracle (CWE-203): een niet-partij mag "bestaat niet" niet kunnen onderscheiden van "bestaat,
  // geen toegang" — beide geven exact het onbekend-id-antwoord. Deze melding wordt via
  // toSafeActionError verbatim naar de client geforward (cancelCollaboration), dus het verschil was
  // een echte existence-oracle op een gegokt id. Consistent met shift-handoff/setDienstStatus.
  const partyUserIds = [collaboration.company.userId, collaboration.freelancer.userId];
  if (!partyUserIds.includes(actor.id)) throw new Error("Samenwerking niet gevonden.");

  // Dispuut-vries (CLAUDE.md: "dispuut bevriest de cascade"): zolang er een open dispuut is, mag géén
  // van beide partijen de samenwerking afronden of annuleren — alleen de admin heft het dispuut op
  // (`resolveDispute`), daarna hervat de cascade. Symmetrisch met de hele cascade-command-familie
  // (`assertNotDisputed` in performance-/invoice-/payment-commands). Zonder deze rem kon een partij
  // een bevroren deal unilateraal op COMPLETED zetten, wat het open dispuut in de fase-badge
  // (`cascadeStage` evalueert COMPLETED vóór disputed) maskeerde tijdens een admin-only governance-hold.
  if (collaboration.disputedAt) throw new Error(DISPUTE_FROZEN_MESSAGE);

  const from = collaboration.status as CollaborationStatus;
  try {
    assertCollaborationTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof CollaborationTransitionError) throw new Error(e.message);
    throw e;
  }

  // Een samenwerking wordt uitsluitend actief via een ondertekend contract (signContractAction /
  // signContractFromList), niet via een losse statuswijziging. Dit blokkeert het oude
  // "Markeer als actief"-pad zodat er nooit een actieve inhuur zonder contract ontstaat.
  if (targetStatus === "ACTIVE") {
    throw new Error("Onderteken eerst het contract om de samenwerking te activeren.");
  }

  // Veiligheidsrem (geld-correctheid): annuleer geen samenwerking zolang er nog open geld is (een
  // niet-afgewikkelde factuur, óók een DRAFT-cascadefactuur) óf een ingediende prestatie die nog op
  // goedkeuring wacht. Symmetrisch met de afronden-rem hieronder: anders raakt dat werk/geld ná de
  // annulering los van zijn context en kan het tóch de cascade in glippen (approve-prestatie →
  // factuur → betaling op een geannuleerde deal). Beoordeel/wijs de prestatie eerst af of markeer/
  // crediteer de factuur. `submitPerformance` blokkeert al nieuw werk ná annulering.
  if (targetStatus === "CANCELLED") {
    const [otherInvoices, submittedPerformances] = await Promise.all([
      // unbounded-allow: factuurstatus van één samenwerking voor de annuleer-rem; per-collab begrensd
      prisma.invoice.findMany({
        where: { collaborationId },
        select: { lifecycleStatus: true, status: true },
      }),
      prisma.performance.count({ where: { collaborationId, status: "SUBMITTED" } }),
    ]);
    const reason = cancellationBlockReason({ otherInvoices, submittedPerformances });
    if (reason) throw new Error(reason);
  }

  // Afronden-rem (geld-correctheid): rond geen samenwerking af zolang er nog open geld is (een
  // niet-afgewikkelde factuur) óf een ingediende prestatie die nog op goedkeuring wacht. Symmetrisch
  // met de annuleer-rem; server-side de waarheid. Spiegelt de cascade-afronding (confirmPayment).
  if (targetStatus === "COMPLETED") {
    const [otherInvoices, submittedPerformances] = await Promise.all([
      // unbounded-allow: factuurstatus van één samenwerking voor de afronden-rem; per-collab begrensd
      prisma.invoice.findMany({
        where: { collaborationId },
        select: { lifecycleStatus: true, status: true },
      }),
      prisma.performance.count({ where: { collaborationId, status: "SUBMITTED" } }),
    ]);
    const reason = completionBlockReason({ otherInvoices, submittedPerformances });
    if (reason) throw new Error(reason);
  }

  // Herplaatsing bij uitval: een geannuleerde actieve inzet heropent de dienst (indien gesloten)
  // en seint de opdrachtgever om direct een vervanger te werven. De veiligheidsrem hierboven blijft
  // de baas — dit draait pas nadat annuleren is toegestaan.
  const replacement = planReplacement({
    from,
    to: targetStatus,
    jobStatus: collaboration.job.status as JobStatus,
  });
  if (replacement.reopenJob && replacement.targetJobStatus) {
    // Defense-in-depth: ook deze overgang loopt via de expliciete dienst-statusmap.
    assertJobTransition(collaboration.job.status as JobStatus, replacement.targetJobStatus);
  }

  // Annuleringssnapshot: reden + 7-dagen-kostenoordeel server-side vastgelegd op het
  // annuleermoment, zodat het oordeel niet verschuift als de startdatum later wijzigt.
  const now = new Date();
  const cancellationData = cancellation
    ? {
        cancelledAt: now,
        cancelledById: actor.id,
        cancellationReason: cancellation.reason,
        cancellationChargeable: assessCancellation({
          byClient: actor.id === collaboration.company.userId,
          active: from === "ACTIVE",
          startDate: collaboration.startDate,
          now,
        }).chargeable,
      }
    : null;

  const otherUserId = partyUserIds.find((id) => id !== actor.id)!;

  // Alles atomair binnen één interactieve transactie. De money-/beoordelingsremmen worden BINNEN de
  // transactie her-geverifieerd (TOCTOU-dicht) en de statuswrite is voorwaardelijk op de verwachte
  // `from`-status (optimistic concurrency, spiegelt applyCascadeEffects): een parallelle actie tussen
  // de pre-check en de write (bv. de tegenpartij dient een prestatie in, of een nieuwe factuur
  // verschijnt) kan zo nooit door het venster glippen — server-side blijft de waarheid.
  await prisma.$transaction(async (tx) => {
    // Her-verificatie van de dispuut-vries BINNEN de transactie (TOCTOU-dicht): een dispuut dat ná de
    // pre-check maar vóór deze write werd geopend, bevriest de afronding/annulering alsnog — de hele
    // transactie rolt terug. Spiegelt de in-transactie-grendel in `persistEventAndEffects`.
    const freshCollab = await tx.collaboration.findUnique({
      where: { id: collaborationId },
      select: { disputedAt: true },
    });
    if (freshCollab?.disputedAt) throw new Error(DISPUTE_FROZEN_MESSAGE);

    // Her-verificatie van de afronden-rem: rond nooit af met open geld of een onbeoordeelde prestatie
    // die ná de pre-check hierboven binnenkwam.
    if (targetStatus === "COMPLETED") {
      const [otherInvoices, submittedPerformances] = await Promise.all([
        // unbounded-allow: factuurstatus van één samenwerking voor de afronden-rem; per-collab begrensd
        tx.invoice.findMany({
          where: { collaborationId },
          select: { lifecycleStatus: true, status: true },
        }),
        tx.performance.count({ where: { collaborationId, status: "SUBMITTED" } }),
      ]);
      const reason = completionBlockReason({ otherInvoices, submittedPerformances });
      if (reason) throw new Error(reason);
    }
    // Her-verificatie van de annuleer-rem (TOCTOU-dicht): geen annulering terwijl er ná de pre-check
    // (net) een prestatie werd ingediend of een openstaande factuur verscheen.
    if (targetStatus === "CANCELLED") {
      const [otherInvoices, submittedPerformances] = await Promise.all([
        // unbounded-allow: factuurstatus van één samenwerking voor de annuleer-rem; per-collab begrensd
        tx.invoice.findMany({
          where: { collaborationId },
          select: { lifecycleStatus: true, status: true },
        }),
        tx.performance.count({ where: { collaborationId, status: "SUBMITTED" } }),
      ]);
      const reason = cancellationBlockReason({ otherInvoices, submittedPerformances });
      if (reason) throw new Error(reason);
    }

    // Voorwaardelijke statuswrite: alleen als de samenwerking nog in de verwachte `from`-status staat.
    // Botst een parallelle transitie (count !== 1) → gooi, zodat de hele transactie terugrolt i.p.v.
    // een tegenstrijdige status of een verweesde factuur/prestatie achter te laten.
    const { count } = await tx.collaboration.updateMany({
      where: { id: collaborationId, status: from },
      // Stempel het afrondingsmoment bij de handmatige afronding — net als de cascade-applier dat doet
      // bij de betalings-cascade (één semantiek, twee paden). Ankert het blinde beoordelingsvenster.
      data: {
        status: targetStatus,
        ...(targetStatus === "COMPLETED" ? { completedAt: now } : {}),
        ...(cancellationData ?? {}),
      },
    });
    if (count !== 1) {
      throw new Error(
        "De status is intussen gewijzigd door een andere actie. Probeer het opnieuw.",
      );
    }

    await tx.notification.create({
      data: {
        userId: otherUserId,
        type: "COLLABORATION_STATUS",
        title: cancellationData ? "Samenwerking geannuleerd" : "Samenwerking bijgewerkt",
        body: cancellationData
          ? `Reden: ${cancellation!.reason}${
              cancellationData.cancellationChargeable
                ? " · Geannuleerd binnen 7 dagen vóór de start — voor de opdrachtgever geldt een betalingsverplichting."
                : ""
            }`
          : `Status: ${targetStatus}.`,
        link: "/samenwerkingen",
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "COLLABORATION_STATUS_CHANGED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: {
          from,
          to: targetStatus,
          ...(cancellationData
            ? {
                reason: cancellation!.reason,
                chargeable: cancellationData.cancellationChargeable,
              }
            : {}),
        },
      }),
    });

    if (replacement.reopenJob && replacement.targetJobStatus) {
      await tx.job.update({
        where: { id: collaboration.job.id },
        data: { status: replacement.targetJobStatus },
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "JOB_REOPENED_FOR_REPLACEMENT",
          entityType: "Job",
          entityId: collaboration.job.id,
          metadata: { from: collaboration.job.status, to: replacement.targetJobStatus },
        }),
      });
    }

    if (replacement.signal) {
      await tx.notification.create({
        data: {
          userId: collaboration.company.userId,
          type: "COLLABORATION_REPLACEMENT",
          title: "Inzet geannuleerd — herplaats de dienst",
          body: `De inzet voor "${collaboration.job.title}" is geannuleerd. Bekijk wie je direct kunt herplaatsen.`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "COLLABORATION_REPLACEMENT_OPENED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { jobId: collaboration.job.id, reopened: replacement.reopenJob },
        }),
      });
    }
  });

  revalidatePath("/samenwerkingen");
  revalidatePath(`/samenwerkingen/${collaborationId}`);
  if (replacement.reopenJob) revalidatePath(`/opdrachten/${collaboration.job.id}`);
}

/**
 * Contract ondertekenen vanaf het samenwerkingen-overzicht. Hergebruikt de cascade-command
 * signContract (zet atomair contractStatus=SIGNED + status=ACTIVE). De enige manier om een
 * samenwerking te activeren — vervangt het oude losse "Markeer als actief".
 */
export async function signContractFromList(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await signContract(actor, collaborationId);
  } catch (e) {
    if (e instanceof CascadeError) throw new Error(e.message);
    throw e;
  }
  revalidatePath("/samenwerkingen");
  revalidatePath("/acties");
  revalidatePath("/dashboard");
}

const credentialReminderSchema = z.object({
  collaborationId: z.string().min(1),
  type: credentialTypeSchema,
});

export type ReminderState = { error?: string; message?: string } | undefined;

/**
 * Certificaatherinnering (rode draad 5): de opdrachtgever stuurt de ZZP'er bij een lopende
 * samenwerking een gerichte notificatie om een ontbrekend/vereist certificaat aan te leveren.
 * Keten: auth → rol (CLIENT) → ownership (company.userId) → Zod → server-herbevestiging dat het
 * type écht openstaat → idempotentie (max één per samenwerking+type per kalenderdag) → notify + audit.
 */
export async function sendCredentialReminder(
  collaborationId: string,
  type: string,
  _prev: ReminderState,
  _formData: FormData,
): Promise<ReminderState> {
  let actor: Actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = credentialReminderSchema.safeParse({ collaborationId, type });
  if (!parsed.success) return { error: "Ongeldige herinnering." };
  const reminderType = parsed.data.type as CredentialType;

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: parsed.data.collaborationId },
    include: {
      company: { select: { userId: true, name: true } },
      freelancer: {
        select: {
          userId: true,
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      job: {
        select: {
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
    },
  });
  if (!collaboration) return { error: "Samenwerking niet gevonden." };
  // Ownership + anti-oracle (CWE-203): alleen de betrokken opdrachtgever mag herinneren; een niet-
  // betrokken CLIENT mag "bestaat niet" niet kunnen onderscheiden van "bestaat, geen toegang" → zelfde
  // onbekend-id-antwoord (voorheen kon een CLIENT zo andermans samenwerking-id's aftasten).
  if (collaboration.company.userId !== actor.id) return { error: "Samenwerking niet gevonden." };
  if (collaboration.status !== "ACTIVE" && collaboration.status !== "PROPOSED")
    return { error: "Herinneren kan alleen bij een lopende samenwerking." };

  // Server is de waarheid: bevestig dat dit type écht openstaat (ontbrekend of verlopen). Nooit
  // vertrouwen op de client-side melding — anders kan men om een willekeurig certificaat vragen.
  const requiredTypes = collaboration.job.credentialRequirements.map(
    (r) => r.credentialType as CredentialType,
  );
  const credentials: FreelancerCredential[] = collaboration.freelancer.credentials.map((c) => ({
    type: c.type as CredentialType,
    status: c.status as FreelancerCredential["status"],
    expiresAt: c.expiresAt,
  }));
  const alert = assessCollaborationCredentials(requiredTypes, credentials);
  const outstanding = new Set<CredentialType>([...alert.missing, ...alert.expired]);
  if (!outstanding.has(reminderType))
    return { error: "Dit certificaat is niet (meer) vereist voor deze samenwerking." };

  // Idempotentie: geen spam. Eén herinnering per samenwerking+type per kalenderdag. We lezen de
  // audit-regels van vandaag voor deze samenwerking en filteren op het type in de metadata.
  const dayStart = reminderDayStart(new Date());
  const todayReminders = await prisma.auditLog.findMany({
    where: {
      action: "CREDENTIAL_REMINDER_SENT",
      entityType: "Collaboration",
      entityId: collaboration.id,
      createdAt: { gte: dayStart },
    },
    select: { metadata: true },
    take: 50,
  });
  const alreadyReminded = todayReminders.some((r) => {
    if (!r.metadata) return false;
    try {
      return (JSON.parse(r.metadata) as { type?: string }).type === reminderType;
    } catch {
      return false;
    }
  });
  if (alreadyReminded) return { message: "Je hebt vandaag al herinnerd." };

  const { title, body } = credentialReminderMessage(collaboration.company.name, reminderType);
  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: collaboration.freelancer.userId,
        type: "CREDENTIAL_REMINDER",
        title,
        body,
        link: credentialReminderLink(reminderType),
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "CREDENTIAL_REMINDER_SENT",
        entityType: "Collaboration",
        entityId: collaboration.id,
        metadata: { type: reminderType },
      }),
    }),
  ]);

  revalidatePath("/samenwerkingen");
  return { message: "Herinnering verstuurd." };
}
