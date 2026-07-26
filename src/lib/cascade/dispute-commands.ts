// Zijpad — Dispuut/escalatie: openDispute en resolveDispute.
// Dispuut-logica is voldoende afzonderlijk (bevriest de hele cascade; aparte domein-events;
// eigen audit-trail) om een eigen module te rechtvaardigen.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { CascadeError, assertParty } from "@/lib/cascade/commands-shared";
import { boundReason } from "@/lib/text-bounds";

/**
 * Titel van de admin-fanout-notificatie bij een geopend dispuut. Alleen déze notificatie draagt de
 * vrije-tekstreden verbatim in haar body (de tegenpartij krijgt een generieke melding zonder reden).
 * Gedeeld als constante zodat de AVG-erasure (anonymizeUser) exact díe notificaties kan terugvinden en
 * de reden kan redacten, zonder een brosse string-koppeling tussen de twee bestanden.
 */
export const DISPUTE_ADMIN_NOTIFICATION_TITLE = "Dispuut — bemiddeling nodig";

// --- Zijpad — Dispuut/escalatie --------------------------------------------
export async function openDispute(
  actor: Actor,
  collaborationId: string,
  reason: string,
): Promise<void> {
  // Defense-in-depth: kap onbegrensde vrije tekst óók hier, los van de boundary-normalisatie in de
  // server-action — de reden belandt in de collaboration-rij, een domein-event, notificatiebodies én
  // audit-metadata.
  reason = boundReason(reason);
  if (!reason) throw new CascadeError("Een dispuut vereist een toelichting.");
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { title: true } },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  // Niet-partij krijgt exact dezelfde "… niet gevonden."-melding als een onbekend id (anti-oracle).
  assertParty(actor, col.freelancer.userId, col.company.userId, "Samenwerking niet gevonden.");
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
          title: DISPUTE_ADMIN_NOTIFICATION_TITLE,
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
        body: "Het dispuut is opgelost; je kunt de samenwerking hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: col.company.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt de samenwerking hervatten.",
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
