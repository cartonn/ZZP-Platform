// Event E — Betaling bevestigen.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { getMailSender } from "@/lib/services/mail-sender";
import { buildPaymentConfirmedEmail } from "@/lib/services/cascade-emails";
import { planPaymentConfirmedEvent } from "@/lib/cascade/handlers";
import { hasOpenCollaborationWork } from "@/lib/cascade/completion";
import { type CollaborationStatus } from "@/lib/enums";
import { recordTenantFeeForCollaboration } from "@/lib/tenant-billing/record-fee";
import {
  CascadeError,
  assertNotDisputed,
  terminalCollaborationError,
  persistEventAndEffects,
  loadCascadeInvoice,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";

// --- Event E — Betaling bevestigen -----------------------------------------
export async function confirmPayment(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  // Default (config): de ZZP'er bevestigt ontvangst. Opdrachtgever en admin mogen ook markeren.
  // Niet-partij krijgt exact dezelfde "Factuur niet gevonden."-melding als een onbekend id
  // (anti-oracle, CWE-203). Beide partijen mogen markeren, dus geen "verkeerde kant"-rolmelding.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (!inv.collaborationId)
    throw new CascadeError("Factuur is niet aan een samenwerking gekoppeld.");
  await assertNotDisputed(inv.collaborationId);
  const col = await prisma.collaboration.findUnique({
    where: { id: inv.collaborationId },
    select: { id: true, status: true },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  // Terminale-status-rem: een betaling op een GEANNULEERDE samenwerking is nooit geldig. COMPLETED is
  // hier wél toegestaan — `confirmPayment` produceert de afronding zélf als effect (de collab is bij
  // het laden nog ACTIVE) en een herhaalde betaling is al idempotent via de dedupeKey + factuur-lifecycle.
  {
    const err = terminalCollaborationError(col.status, { allowCompleted: true });
    if (err) throw err;
  }

  // Bepaal of deze betaling het laatste openstaande werk afsluit. Andere niet-afgewikkelde
  // facturen of nog onbeoordeelde prestaties houden de samenwerking ACTIEF (geld-correctheid).
  // Dit is de pre-transactionele lees; de write-time backstop tegen een race (nieuw open werk
  // tussen deze lees en de write) zit in de relationele guard op de afrond-statuswijziging
  // (planPaymentConfirmedEvent → collaborationCompletableGuard, `optional`-skip in apply.ts).
  const [otherInvoices, submittedPerformances, rejectedPerformances] = await Promise.all([
    prisma.invoice.findMany({
      where: { collaborationId: inv.collaborationId, id: { not: invoiceId } },
      select: { lifecycleStatus: true, status: true },
    }),
    prisma.performance.count({
      where: { collaborationId: inv.collaborationId, status: "SUBMITTED" },
    }),
    // Afgekeurde (corrigeerbare) prestaties houden het auto-afronden óók tegen — anders verweest die
    // prestatie permanent wanneer een ándere factuur-cyclus uitbetaalt.
    prisma.performance.count({
      where: { collaborationId: inv.collaborationId, status: "REJECTED" },
    }),
  ]);
  const hasOtherOpenWork = hasOpenCollaborationWork({
    otherInvoices,
    submittedPerformances,
    rejectedPerformances,
  });

  const effects = planPaymentConfirmedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
      partyInvoiceNumber: inv.partyInvoiceNumber,
    },
    collaboration: { id: col.id, status: col.status as CollaborationStatus, hasOtherOpenWork },
    freelancerUserId: inv.issuerUserId,
    clientUserId: inv.counterpartyUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "PAYMENT_CONFIRMED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      dedupeKey: `payment-confirmed-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
      terminalGuardAllowCompleted: true,
    },
  );

  // Best-effort transactie-fee voor de franchise-tenant registreren (idempotent; no-op als billing
  // uit staat of de samenwerking niet bij een tenant hoort). Mag de betaling nooit laten falen.
  try {
    await recordTenantFeeForCollaboration(inv.collaborationId);
  } catch {}

  // Best-effort e-mail naar beide partijen.
  try {
    const meta = await loadCollabMeta(inv.collaborationId);
    if (meta) {
      const mail = getMailSender();
      const link = collabLink(inv.collaborationId);
      const emailData = { jobTitle: meta.jobTitle, totalCents: inv.totalCents, link };
      await mail.send(buildPaymentConfirmedEmail({ recipient: meta.freelancer, ...emailData }));
      await mail.send(buildPaymentConfirmedEmail({ recipient: meta.client, ...emailData }));
    }
  } catch {}
}
