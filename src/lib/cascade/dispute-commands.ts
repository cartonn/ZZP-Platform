// Zijpad — Dispuut/escalatie: openDispute en resolveDispute.
// Dispuut-logica is voldoende afzonderlijk (bevriest de hele cascade; aparte domein-events;
// eigen audit-trail) om een eigen module te rechtvaardigen.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { CascadeError, assertParty } from "@/lib/cascade/commands-shared";

// --- Zijpad — Dispuut/escalatie --------------------------------------------
export async function openDispute(
  actor: Actor,
  collaborationId: string,
  reason: string,
): Promise<void> {
  if (!reason?.trim()) throw new CascadeError("Een dispuut vereist een toelichting.");
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { title: true } },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  assertParty(actor, col.freelancer.userId, col.company.userId);
  if (col.disputedAt) throw new CascadeError("Er is al een open dispuut.");

  const otherUserId =
    actor.id === col.freelancer.userId ? col.company.userId : col.freelancer.userId;
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.collaboration.update({
      where: { id: collaborationId },
      data: { disputedAt: new Date(), disputeReason: reason.trim() },
    }),
    prisma.domainEvent.create({
      data: {
        type: "DISPUTE_OPENED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: JSON.stringify({ reason: reason.trim() }),
        correlationId: collaborationId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "DISPUTE_OPENED",
        title: "Dispuut geopend",
        body: `Er is een dispuut geopend voor "${col.job.title}". De cascade is bevroren tot het is opgelost.`,
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    ...admins.map((a) =>
      prisma.notification.create({
        data: {
          userId: a.id,
          type: "DISPUTE_OPENED",
          title: "Dispuut — bemiddeling nodig",
          body: `Dispuut bij "${col.job.title}": ${reason.trim()}`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_OPENED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: { reason: reason.trim() },
      }),
    }),
  ]);
}

/** Alleen het platform (admin) heft een dispuut op — daarna loopt de cascade weer. */
export async function resolveDispute(actor: Actor, collaborationId: string): Promise<void> {
  if (actor.role !== "ADMIN")
    throw new CascadeError("Alleen het platform kan een dispuut oplossen.");
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { company: { select: { userId: true } }, freelancer: { select: { userId: true } } },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  if (!col.disputedAt) throw new CascadeError("Er is geen open dispuut.");

  await prisma.$transaction([
    prisma.collaboration.update({
      where: { id: collaborationId },
      data: { disputedAt: null, disputeReason: null },
    }),
    prisma.domainEvent.create({
      data: {
        type: "DISPUTE_RESOLVED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: "{}",
        correlationId: collaborationId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: col.freelancer.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt het werkproces hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: col.company.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt het werkproces hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_RESOLVED",
        entityType: "Collaboration",
        entityId: collaborationId,
      }),
    }),
  ]);
}
