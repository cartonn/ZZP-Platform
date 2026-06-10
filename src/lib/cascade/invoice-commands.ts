// Events C (factuur indienen), D (goedkeuren), D' (afkeuren) + creditfactuur-zijpad.

import { type Actor } from "@/lib/authz";
import { getMailSender } from "@/lib/services/mail-sender";
import {
  buildInvoiceSubmittedEmail,
  buildInvoiceApprovedEmail,
  buildInvoiceRejectedEmail,
} from "@/lib/services/cascade-emails";
import {
  planInvoiceSubmittedEvent,
  planInvoiceApprovedEvent,
  planInvoiceRejectedEvent,
  planInvoiceCreditedEvent,
} from "@/lib/cascade/handlers";
import { DEFAULT_PAYMENT_TERM_DAYS } from "@/lib/config";
import {
  CascadeError,
  assertNotDisputed,
  persistEventAndEffects,
  loadCascadeInvoice,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";

// --- Event C — Factuur indienen --------------------------------------------
export async function submitInvoice(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan de factuur indienen.");
  }
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  // Heraanbieding na afkeuring: een factuur die al een partyInvoiceNumber draagt is eerder ingediend.
  // Dan het bestaande nummer behouden (geen nieuwe allocatie → geen gat in de gatenvrije reeks) en
  // niet opnieuw boeken (omzet/BTW al erkend bij de eerste indiening).
  const isResubmit = inv.partyInvoiceNumber != null;
  const effects = planInvoiceSubmittedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
    },
    // Eerste indiening: leeg → de allocator vult het. Heraanbieding: behoud het bestaande nummer.
    partyInvoiceNumber: isResubmit ? (inv.partyInvoiceNumber ?? "") : "",
    clientUserId: inv.counterpartyUserId,
    now: new Date(),
    actorId: actor.id,
    resubmit: isResubmit,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_SUBMITTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
    // Alleen bij de eerste indiening een nummer alloceren; heraanbieding hergebruikt het bestaande.
    isResubmit
      ? undefined
      : { allocate: { issuerKey: inv.issuerKey, year: new Date().getFullYear(), invoiceId } },
  );

  // Best-effort e-mail naar de opdrachtgever.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        await getMailSender().send(
          buildInvoiceSubmittedEmail({
            recipient: meta.client,
            freelancerName: meta.freelancer.name,
            jobTitle: meta.jobTitle,
            totalCents: inv.totalCents,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Event D — Factuur goedkeuren ------------------------------------------
export async function approveInvoice(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur goedkeuren.");
  }
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceApprovedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
    },
    paymentTermDays: DEFAULT_PAYMENT_TERM_DAYS,
    freelancerUserId: inv.issuerUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_APPROVED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      // Eenmalige overgang (SUBMITTED→APPROVED): dedupeKey maakt een dubbele goedkeuring idempotent.
      dedupeKey: `invoice-approved-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
  );

  // Best-effort e-mail naar de ZZP'er met het goedgekeurde bedrag en de vervaldatum.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + DEFAULT_PAYMENT_TERM_DAYS);
        await getMailSender().send(
          buildInvoiceApprovedEmail({
            recipient: meta.freelancer,
            jobTitle: meta.jobTitle,
            totalCents: inv.totalCents,
            dueAt,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Event D' — Factuur afkeuren -------------------------------------------
export async function rejectInvoice(
  actor: Actor,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur afkeuren.");
  }
  // Tijdens een dispuut bevriest de cascade — ook afkeuren is een transitie (§4 zijpad).
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceRejectedEvent({
    invoiceId,
    lifecycleStatus: inv.lifecycleStatus,
    freelancerUserId: inv.issuerUserId,
    reason,
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_REJECTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
    // Note: no allocate here — invoice rejected, number already assigned from submitInvoice
  );

  // Best-effort e-mail naar de ZZP'er met de reden.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        await getMailSender().send(
          buildInvoiceRejectedEmail({
            recipient: meta.freelancer,
            jobTitle: meta.jobTitle,
            reason,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Zijpad — Creditfactuur ------------------------------------------------
export async function creditInvoice(
  actor: Actor,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan een creditfactuur maken.");
  }
  // Tijdens een dispuut bevriest de cascade — ook crediteren is een transitie (§4 zijpad).
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceCreditedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
      partyInvoiceNumber: inv.partyInvoiceNumber,
    },
    freelancerUserId: inv.issuerUserId,
    clientUserId: inv.counterpartyUserId,
    reason,
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_CREDITED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      // Eenmalige overgang: dedupeKey maakt een dubbele creditering idempotent.
      dedupeKey: `invoice-credited-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
  );
}
