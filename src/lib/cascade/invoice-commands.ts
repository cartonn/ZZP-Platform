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
  planInvoiceWithdrawnEvent,
} from "@/lib/cascade/handlers";
import { DEFAULT_PAYMENT_TERM_DAYS } from "@/lib/config";
import {
  CascadeError,
  assertNotDisputed,
  assertCollaborationNotTerminal,
  persistEventAndEffects,
  loadCascadeInvoice,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";
import { boundReason } from "@/lib/text-bounds";
import { fiscalYearOf } from "@/lib/administration/fiscal-calendar";
import { recordTenantFeeForCollaboration } from "@/lib/tenant-billing/record-fee";

// --- Event C — Factuur indienen --------------------------------------------
export async function submitInvoice(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  // Anti-oracle (CWE-203): niet-partij → "Factuur niet gevonden."; alleen de tegenpartij (verkeerde
  // kant) houdt de rolmelding. Symmetrisch met approveInvoice (#903).
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan de factuur indienen.");
  }
  if (inv.collaborationId) {
    await assertNotDisputed(inv.collaborationId);
    await assertCollaborationNotTerminal(inv.collaborationId);
  }
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
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
    },
    // Alleen bij de eerste indiening een nummer alloceren; heraanbieding hergebruikt het bestaande.
    isResubmit
      ? undefined
      : // Jaar in Amsterdamse burgerlijke tijd, niet server-UTC: op de UTC-server (Railway) valt
        // 31 dec 23:15 UTC binnen 1 jan Amsterdam — het jaarprefix van het (juridische) factuurnummer
        // moet dan met het Amsterdamse afgiftejaar meelopen, niet met UTC (zelfde patroon als
        // ontzorg-overview.ts). Anders krijgt de eerste nieuwjaarsfactuur nog het oude jaarprefix.
        { allocate: { issuerKey: inv.issuerKey, year: fiscalYearOf(new Date()), invoiceId } },
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
  // Anti-oracle (CWE-203): een actor die geen partij is bij deze factuur (noch uitschrijver, noch
  // opdrachtgever) krijgt exact dezelfde melding als een onbekend id. Deze melding wordt door de
  // useActionState-drawer (`approveInvoiceState`) als returnwaarde aan de client getoond (niet door
  // Next.js geredigeerd) → productie-observeerbaar. Partij-verkeerde-kant → behulpzame rolmelding.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur goedkeuren.");
  }
  if (inv.collaborationId) {
    await assertNotDisputed(inv.collaborationId);
    await assertCollaborationNotTerminal(inv.collaborationId);
  }
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
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
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
  reason = boundReason(reason); // defense-in-depth: kap onbegrensde vrije tekst (PII/audit/notificatie)
  const inv = await loadCascadeInvoice(invoiceId);
  // Anti-oracle (CWE-203): niet-partij → identieke "niet gevonden"-melding (zie approveInvoice);
  // productie-observeerbaar via `rejectInvoiceState`. Partij-verkeerde-kant → rolmelding.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur afkeuren.");
  }
  // Tijdens een dispuut bevriest de cascade — ook afkeuren is een transitie (§4 zijpad).
  if (inv.collaborationId) {
    await assertNotDisputed(inv.collaborationId);
    // Terminale-status-rem (symmetrisch met de forward-siblings, #825): afkeuren op een geannuleerde/
    // afgeronde samenwerking is een cascade-transitie op een dode deal en mag niet.
    await assertCollaborationNotTerminal(inv.collaborationId);
  }
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
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
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
  reason = boundReason(reason); // defense-in-depth: kap onbegrensde vrije tekst (PII/audit/notificatie)
  const inv = await loadCascadeInvoice(invoiceId);
  // Anti-oracle (CWE-203): niet-partij → "Factuur niet gevonden."; alleen de tegenpartij (verkeerde
  // kant) houdt de rolmelding. Symmetrisch met approveInvoice (#903).
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan een creditfactuur maken.");
  }
  // Tijdens een dispuut bevriest de cascade — ook crediteren is een transitie (§4 zijpad).
  if (inv.collaborationId) {
    await assertNotDisputed(inv.collaborationId);
    // Terminale-status-rem: crediteren op een GEANNULEERDE samenwerking mag niet. Een creditnota ná
    // AFRONDING (COMPLETED) is wél legitiem (correctie op een reeds-afgeronde deal) → allowCompleted.
    await assertCollaborationNotTerminal(inv.collaborationId, { allowCompleted: true });
  }
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
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
      terminalGuardAllowCompleted: true,
    },
  );

  // Best-effort: herbereken de franchise-transactie-fee. Een creditnota draait betaalde omzet terug,
  // dus de nog-openstaande (PENDING) fee moet mee omlaag — of vervallen als er geen betaalde grondslag
  // meer over is (idempotent; no-op als billing uit staat of de samenwerking niet bij een tenant hoort).
  // Mag het crediteren zelf nooit laten falen.
  if (inv.collaborationId) {
    try {
      await recordTenantFeeForCollaboration(inv.collaborationId);
    } catch {}
  }
}

// --- Zijpad — Factuur intrekken (WITHDRAWN) --------------------------------
// De uitschrijver (of admin) trekt een nog-niet-aanvaarde factuur (DRAFT/SUBMITTED/REJECTED) terminaal
// terug. Nodig omdat een afgekeurde (of nooit-goedgekeurde) factuur anders als "openstaand geld" de
// samenwerking permanent op ACTIVE vastzet: crediteren kan niet (dat vereist een aanvaarde/betaalde
// factuur) en "markeer betaald" evenmin — er was geen route uit. Intrekken draait de indien-boeking
// terug (geen spookvordering) en telt als afgewikkeld, zodat afronden/annuleren weer kan. Alleen de
// uitschrijver trekt zijn eigen vordering terug (de opdrachtgever kan hooguit afkeuren) — zo kan de
// opdrachtgever niet met een afkeuring + intrekking een terechte factuur wegpoetsen.
export async function withdrawInvoice(
  actor: Actor,
  invoiceId: string,
  reason?: string,
): Promise<void> {
  const trimmed = reason ? boundReason(reason) : "";
  const inv = await loadCascadeInvoice(invoiceId);
  // Anti-oracle (CWE-203): niet-partij → "Factuur niet gevonden."; de tegenpartij (verkeerde kant)
  // houdt de rolmelding. Symmetrisch met submitInvoice/creditInvoice.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Factuur niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan de factuur intrekken.");
  }
  // Tijdens een dispuut bevriest de cascade; intrekken op een dode (terminale) samenwerking mag niet.
  if (inv.collaborationId) {
    await assertNotDisputed(inv.collaborationId);
    await assertCollaborationNotTerminal(inv.collaborationId);
  }
  const effects = planInvoiceWithdrawnEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
    },
    clientUserId: inv.counterpartyUserId,
    reason: trimmed || null,
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_WITHDRAWN",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      // Eenmalige terminale overgang: dedupeKey maakt een dubbele intrekking idempotent.
      dedupeKey: `invoice-withdrawn-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
      disputeGuardCollaborationId: inv.collaborationId,
      terminalGuard: true,
    },
  );
}
