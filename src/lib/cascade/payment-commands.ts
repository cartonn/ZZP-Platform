// Event E — Betaling bevestigen.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { getMailSender } from "@/lib/services/mail-sender";
import { buildPaymentConfirmedEmail } from "@/lib/services/cascade-emails";
import { planPaymentConfirmedEvent } from "@/lib/cascade/handlers";
import { type CollaborationStatus } from "@/lib/enums";
import { recordTenantFeeForCollaboration } from "@/lib/tenant-billing/record-fee";
import {
  CascadeError,
  assertNotDisputed,
  persistEventAndEffects,
  loadCascadeInvoice,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";

// --- Event E — Betaling bevestigen -----------------------------------------
export async function confirmPayment(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  // Default (config): de ZZP'er bevestigt ontvangst. Opdrachtgever en admin mogen ook markeren.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Geen toegang tot deze factuur.");
  }
  if (!inv.collaborationId)
    throw new CascadeError("Factuur is niet aan een samenwerking gekoppeld.");
  await assertNotDisputed(inv.collaborationId);
  const col = await prisma.collaboration.findUnique({
    where: { id: inv.collaborationId },
    select: { id: true, status: true },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");

  const effects = planPaymentConfirmedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
      partyInvoiceNumber: inv.partyInvoiceNumber,
    },
    collaboration: { id: col.id, status: col.status as CollaborationStatus },
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
