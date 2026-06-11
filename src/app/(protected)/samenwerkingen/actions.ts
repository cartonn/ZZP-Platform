"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertCollaborationTransition, CollaborationTransitionError } from "@/lib/collaborations";
import { assertJobTransition } from "@/lib/jobs";
import { planReplacement } from "@/lib/replacement";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import { completionBlockReason } from "@/lib/cascade/completion";
import { signContract, CascadeError } from "@/lib/cascade/commands";
import { type CollaborationStatus, type JobStatus, collaborationStatusSchema } from "@/lib/enums";
import { collaborationProposalSchema } from "@/lib/validation";

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

export async function changeCollaborationStatus(
  collaborationId: string,
  target: string,
): Promise<void> {
  const actor = await requireActor();
  const targetStatus = collaborationStatusSchema.parse(target);

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { id: true, status: true, title: true } },
    },
  });
  if (!collaboration) throw new Error("Samenwerking niet gevonden.");

  const partyUserIds = [collaboration.company.userId, collaboration.freelancer.userId];
  if (!partyUserIds.includes(actor.id)) throw new Error("Geen toegang tot deze samenwerking.");

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

  // Veiligheidsrem: annuleer geen samenwerking met een nog openstaande factuur — de
  // betaalverplichting zou anders haar context verliezen. Voldoe of crediteer de factuur eerst.
  if (targetStatus === "CANCELLED") {
    const open = await prisma.invoice.findFirst({
      where: { collaborationId, ...outstandingInvoiceWhere },
      select: { id: true },
    });
    if (open) {
      throw new Error(
        "Er staat nog een openstaande factuur voor deze samenwerking. Markeer die als betaald of crediteer 'm eerst.",
      );
    }
  }

  // Afronden-rem (geld-correctheid): rond geen samenwerking af zolang er nog open geld is (een
  // niet-afgewikkelde factuur) óf een ingediende prestatie die nog op goedkeuring wacht. Symmetrisch
  // met de annuleer-rem; server-side de waarheid. Spiegelt de cascade-afronding (confirmPayment).
  if (targetStatus === "COMPLETED") {
    const [otherInvoices, submittedPerformances] = await Promise.all([
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

  const otherUserId = partyUserIds.find((id) => id !== actor.id)!;
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.collaboration.update({ where: { id: collaborationId }, data: { status: targetStatus } }),
    prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "COLLABORATION_STATUS",
        title: "Samenwerking bijgewerkt",
        body: `Status: ${targetStatus}.`,
        link: "/samenwerkingen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "COLLABORATION_STATUS_CHANGED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: { from, to: targetStatus },
      }),
    }),
  ];

  if (replacement.reopenJob && replacement.targetJobStatus) {
    ops.push(
      prisma.job.update({
        where: { id: collaboration.job.id },
        data: { status: replacement.targetJobStatus },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "JOB_REOPENED_FOR_REPLACEMENT",
          entityType: "Job",
          entityId: collaboration.job.id,
          metadata: { from: collaboration.job.status, to: replacement.targetJobStatus },
        }),
      }),
    );
  }

  if (replacement.signal) {
    ops.push(
      prisma.notification.create({
        data: {
          userId: collaboration.company.userId,
          type: "COLLABORATION_REPLACEMENT",
          title: "Inzet geannuleerd — herplaats de dienst",
          body: `De inzet voor "${collaboration.job.title}" is geannuleerd. Bekijk wie je direct kunt herplaatsen.`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "COLLABORATION_REPLACEMENT_OPENED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { jobId: collaboration.job.id, reopened: replacement.reopenJob },
        }),
      }),
    );
  }

  await prisma.$transaction(ops);

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
