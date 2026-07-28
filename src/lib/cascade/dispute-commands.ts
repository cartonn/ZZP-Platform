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
  // Server-side statusrem (CLAUDE.md regel 1: client mag tonen, nooit beslissen). De UI toont het
  // dispuut-formulier alléén bij een ACTIVE samenwerking (`active && …` in page.tsx), maar tot nu toe
  // borgde niets die regel server-side: een partij kon `openDisputeAction` rechtstreeks aanroepen op
  // een PROPOSED/COMPLETED/CANCELLED samenwerking. Een dispuut betekent "bevries de lópende cascade" —
  // dat is alleen zinvol op een ACTIVE inzet. Op PROPOSED zou het een landmijn zijn (dispuut → signContract
  // op een bevroren deal; zie contract-dispute-freeze.test.ts, run 40); op COMPLETED blokkeerde het
  // eenzijdig de correctie-/creditfactuur-route (`creditInvoice` checkt `assertNotDisputed`) op een reeds
  // betaalde klus — een griefing-vector; op CANCELLED is er niets meer te bevriezen (no-op vlag). Alle drie
  // hier hard geweigerd. De partij is al vastgesteld, dus de statusmelding lekt geen bestaan (geen oracle).
  if (col.status !== "ACTIVE") {
    throw new CascadeError("Een dispuut kan alleen op een actieve samenwerking worden geopend.");
  }
  if (col.disputedAt) throw new CascadeError("Er is al een open dispuut.");

  const otherUserId =
    actor.id === col.freelancer.userId ? col.company.userId : col.freelancer.userId;
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  const trimmedReason = reason.trim();

  // TOCTOU-grendel (run 55): de statusrem hierboven leest een STALE snapshot (`col.status`), en tussen
  // die lees en de write hieronder ligt nog een netwerk-round-trip (de admin-`findMany`). In dat venster
  // kan een concurrente, compound-guarded mutatie de samenwerking wegzetten: `confirmPayment`
  // (ACTIVE→COMPLETED) of `cancelCollaboration` (ACTIVE→CANCELLED) committen dan éérst, waarna een blinde
  // `collaboration.update({ where: { id } })` `disputedAt` alsnog op een niet-ACTIVE rij zou zetten. Op een
  // COMPLETED rij blokkeert dat de correctie-/creditfactuur-route (`creditInvoice` → `assertNotDisputed`)
  // permanent — exact de griefing-vector die de statusrem wilde dichten, maar dan via een race. Elke zuster
  // (confirmPayment/cancel/signContract via `persistEventAndEffects`, en `applyCollaborationStatusChange`)
  // gebruikt hiervoor een compound-guarded `updateMany({ where: { id, status } })`; dit pad deed dat niet.
  // Fix: interactieve transactie met compound-guarded `updateMany` (id + status ACTIVE + disputedAt null).
  // Matcht 0 → een concurrente overgang won → hele transactie rolt terug (geen event/notificaties/audit).
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.collaboration.updateMany({
      where: { id: collaborationId, status: "ACTIVE", disputedAt: null },
      data: { disputedAt: new Date(), disputeReason: trimmedReason },
    });
    if (claimed.count === 0) {
      // Her-lees binnen de transactie om de juiste melding te kiezen (al-lopend dispuut vs. niet meer
      // actief). De partij is al vastgesteld, dus geen van beide meldingen lekt bestaan (geen oracle).
      const fresh = await tx.collaboration.findUnique({
        where: { id: collaborationId },
        select: { status: true, disputedAt: true },
      });
      if (fresh?.disputedAt) throw new CascadeError("Er is al een open dispuut.");
      throw new CascadeError("Een dispuut kan alleen op een actieve samenwerking worden geopend.");
    }
    await tx.domainEvent.create({
      data: {
        type: "DISPUTE_OPENED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: JSON.stringify({ reason: trimmedReason }),
        correlationId: collaborationId,
      },
    });
    await tx.notification.create({
      data: {
        userId: otherUserId,
        type: "DISPUTE_OPENED",
        title: "Dispuut geopend",
        body: `Er is een dispuut geopend voor "${col.job.title}". De cascade is bevroren tot het is opgelost.`,
        link: `/samenwerkingen/${collaborationId}`,
      },
    });
    for (const a of admins) {
      await tx.notification.create({
        data: {
          userId: a.id,
          type: "DISPUTE_OPENED",
          title: DISPUTE_ADMIN_NOTIFICATION_TITLE,
          body: `Dispuut bij "${col.job.title}": ${trimmedReason}`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      });
    }
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_OPENED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: { reason: trimmedReason },
      }),
    });
  });
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

  // TOCTOU-grendel (run 56): de `!col.disputedAt`-rem hierboven leest een STALE snapshot; tussen die lees
  // en de write hieronder ligt geen atomaire grendel. Twee admins (of één admin die het formulier dubbel
  // verstuurt) die gelijktijdig `resolveDispute` aanroepen, passeren beiden de pre-check en deden vervolgens
  // beiden een blinde `collaboration.update({ where: { id } })` — idempotent op het veld zelf, maar elk pad
  // schreef zijn EIGEN `DISPUTE_RESOLVED` domein-event, audit-rij én twee "Dispuut opgelost"-notificaties.
  // Gevolg: dubbele audit-/event-rijen voor één reëel dispuut (audit-integriteit, CLAUDE.md regel 5) en
  // dubbele notificaties aan beide partijen. Elke zuster in de cascade (incl. `openDispute` hieronder)
  // her-verifieert de status BINNEN de write via een compound-guarded `updateMany`; dit pad deed dat niet.
  // Fix: interactieve transactie met compound-guarded `updateMany({ where: { id, disputedAt: { not: null } } })`.
  // Matcht 0 → een concurrente resolve won → hele transactie rolt terug (geen tweede event/notificatie/audit).
  await prisma.$transaction(async (tx) => {
    const cleared = await tx.collaboration.updateMany({
      where: { id: collaborationId, disputedAt: { not: null } },
      data: { disputedAt: null, disputeReason: null },
    });
    if (cleared.count === 0) {
      // Een concurrente resolve heeft het dispuut al opgeheven; niets meer te doen (geen dubbele fanout).
      throw new CascadeError("Er is geen open dispuut.");
    }
    await tx.domainEvent.create({
      data: {
        type: "DISPUTE_RESOLVED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: "{}",
        correlationId: collaborationId,
      },
    });
    await tx.notification.create({
      data: {
        userId: col.freelancer.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt de samenwerking hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    });
    await tx.notification.create({
      data: {
        userId: col.company.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt de samenwerking hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_RESOLVED",
        entityType: "Collaboration",
        entityId: collaborationId,
      }),
    });
  });
}
