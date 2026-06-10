// De hoofdcascade als PURE planners (PLATFORM_OVERHAUL.md §4, Events A–E + zijpaden B2'/D').
// Elke planner valideert de statusovergang tegen de state machine en beschrijft de gevolgen als
// CascadeEffects. De transactionele applier (apply.ts) schrijft ze atomair weg; de runtime-wiring
// (register.ts) laadt context en publiceert/past toe via de event-bus. Geld loopt nooit via het
// platform (Besluit 1); geen factuur zonder goedgekeurde prestatie (Besluit 3).

import { assertCollaborationTransition } from "@/lib/collaborations";
import {
  invoiceLifecycleMachine,
  performanceMachine,
  type InvoiceLifecycleState,
  type PerformanceState,
} from "@/lib/lifecycles";
import { type CollaborationStatus } from "@/lib/enums";
import {
  planInvoiceApproved,
  planInvoiceSubmitted,
  planPaymentConfirmed,
  planInvoiceCredited,
} from "@/lib/administration/ledger";
import { computeVat, hourlySubtotalCents } from "@/lib/administration/vat";
import { ortSubtotalCents, type OrtSegment } from "@/lib/ort";
import { PLATFORM_FEE, type VatRegime, type OrtCategory } from "@/lib/config";
import { type CascadeEffects, emptyEffects } from "@/lib/cascade/types";

// --- Event A — Contract getekend -------------------------------------------
export interface ContractSignedCtx {
  collaborationId: string;
  status: CollaborationStatus; //  huidige samenwerkingsstatus
  freelancerUserId: string;
  clientUserId: string;
  jobTitle: string;
  actorId: string | null;
}

export function planContractSigned(ctx: ContractSignedCtx): CascadeEffects {
  assertCollaborationTransition(ctx.status, "ACTIVE");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Collaboration",
    id: ctx.collaborationId,
    field: "status",
    from: ctx.status,
    to: "ACTIVE",
    set: { contractStatus: "SIGNED" },
  });
  fx.notifications.push(
    {
      userId: ctx.freelancerUserId,
      type: "CONTRACT_SIGNED",
      title: "Opdracht gestart",
      body: `Het contract voor "${ctx.jobTitle}" is getekend. Je kunt nu uren of opleveringen vastleggen.`,
      link: "/samenwerkingen",
    },
    {
      userId: ctx.clientUserId,
      type: "CONTRACT_SIGNED",
      title: "Inhuur actief",
      body: `Het contract voor "${ctx.jobTitle}" is getekend. De opdracht loopt nu.`,
      link: "/samenwerkingen",
    },
  );
  fx.audits.push({
    actorId: ctx.actorId,
    action: "CONTRACT_SIGNED",
    entityType: "Collaboration",
    entityId: ctx.collaborationId,
  });
  return fx;
}

// --- Event B1 — Prestatie ingediend ter goedkeuring ------------------------
export interface PerformanceSubmittedCtx {
  performanceId: string;
  status: PerformanceState;
  performanceType: "HOURS" | "MILESTONE";
  collaborationId: string;
  clientUserId: string;
  now: Date;
  actorId: string | null;
}

export function planPerformanceSubmitted(ctx: PerformanceSubmittedCtx): CascadeEffects {
  performanceMachine.assert(ctx.status, "SUBMITTED");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Performance",
    id: ctx.performanceId,
    field: "status",
    from: ctx.status,
    to: "SUBMITTED",
    set: { submittedAt: ctx.now },
  });
  const label = ctx.performanceType === "HOURS" ? "urenstaat" : "oplevering";
  fx.notifications.push({
    userId: ctx.clientUserId,
    type: "PERFORMANCE_SUBMITTED",
    title: `Beoordeel ingediende ${label}`,
    body: `Er staat een ${label} klaar ter goedkeuring. Goedkeuren is nodig vóór facturatie.`,
    link: "/samenwerkingen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "PERFORMANCE_SUBMITTED",
    entityType: "Performance",
    entityId: ctx.performanceId,
  });
  return fx;
}

// --- Event B2 — Uren/oplevering goedgekeurd -> concept-factuur --------------
export interface PerformanceApprovedCtx {
  performance: {
    id: string;
    status: PerformanceState;
    type: "HOURS" | "MILESTONE";
    hours?: number | null;
    rateCents?: number | null;
    amountCents?: number | null;
    /** Optionele ORT-segmenten (zorg): uren per tijdscategorie met toeslag. */
    ortSegments?: OrtSegment[] | null;
    /** Toeslagprofiel (bps per categorie) uit de sector/klant; leeg = DEFAULT. */
    ortRates?: Record<OrtCategory, number> | null;
    collaborationId: string;
  };
  freelancerUserId: string;
  clientUserId: string;
  issuerKey: string;
  vatRegime: VatRegime;
  correlationId: string;
  now: Date;
  actorId: string | null;
}

/** Berekent het factuursubtotaal uit de goedgekeurde prestatie. */
export function performanceSubtotalCents(p: PerformanceApprovedCtx["performance"]): number {
  if (p.type === "HOURS") {
    if (p.rateCents == null) throw new Error("Urenstaat mist een uurtarief.");
    // ORT (zorg): zijn er tijdscategorie-segmenten, dan basis + toeslagen; anders uren × tarief.
    if (p.ortSegments && p.ortSegments.length > 0) {
      return ortSubtotalCents(p.ortSegments, p.rateCents, p.ortRates ?? undefined);
    }
    if (p.hours == null) throw new Error("Urenstaat mist uren.");
    return hourlySubtotalCents(p.hours, p.rateCents);
  }
  if (p.amountCents == null) throw new Error("Oplevering mist een milestonebedrag.");
  return p.amountCents;
}

export function planPerformanceApproved(ctx: PerformanceApprovedCtx): CascadeEffects {
  performanceMachine.assert(ctx.performance.status, "APPROVED");
  const subtotalCents = performanceSubtotalCents(ctx.performance);
  const vat = computeVat(subtotalCents, ctx.vatRegime);

  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Performance",
    id: ctx.performance.id,
    field: "status",
    from: ctx.performance.status,
    to: "APPROVED",
    set: { approvedAt: ctx.now },
  });
  fx.newInvoice = {
    performanceId: ctx.performance.id,
    collaborationId: ctx.performance.collaborationId,
    issuerUserId: ctx.freelancerUserId,
    counterpartyUserId: ctx.clientUserId,
    issuerKey: ctx.issuerKey,
    subtotalCents: vat.subtotalCents,
    vatCents: vat.vatCents,
    vatRegime: vat.vatRegime,
    totalCents: vat.totalCents,
    correlationId: ctx.correlationId,
  };
  fx.notifications.push({
    userId: ctx.freelancerUserId,
    type: "INVOICE_DRAFT_READY",
    title: "Concept-factuur klaar",
    body: "De prestatie is goedgekeurd. Controleer de concept-factuur en dien hem in.",
    link: "/facturen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "PERFORMANCE_APPROVED",
    entityType: "Performance",
    entityId: ctx.performance.id,
    metadata: {
      subtotalCents: vat.subtotalCents,
      vatCents: vat.vatCents,
      totalCents: vat.totalCents,
    },
  });
  return fx;
}

// --- Event B2' — Uren/oplevering afgekeurd (zijpad) ------------------------
export interface PerformanceRejectedCtx {
  performanceId: string;
  status: PerformanceState;
  freelancerUserId: string;
  reason: string;
  now: Date;
  actorId: string | null;
}

export function planPerformanceRejected(ctx: PerformanceRejectedCtx): CascadeEffects {
  if (!ctx.reason?.trim()) throw new Error("Een afkeuring vereist een reden.");
  performanceMachine.assert(ctx.status, "REJECTED");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Performance",
    id: ctx.performanceId,
    field: "status",
    from: ctx.status,
    to: "REJECTED",
    set: { rejectionReason: ctx.reason.trim(), rejectedAt: ctx.now },
  });
  fx.notifications.push({
    userId: ctx.freelancerUserId,
    type: "PERFORMANCE_REJECTED",
    title: "Uren/oplevering afgekeurd",
    body: `Reden: ${ctx.reason.trim()}. Pas het aan en dien opnieuw in.`,
    link: "/samenwerkingen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "PERFORMANCE_REJECTED",
    entityType: "Performance",
    entityId: ctx.performanceId,
    metadata: { reason: ctx.reason.trim() },
  });
  return fx;
}

// --- Event C — ZZP'er dient factuur in -------------------------------------
export interface InvoiceSubmittedCtx {
  invoice: {
    id: string;
    lifecycleStatus: InvoiceLifecycleState;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  };
  partyInvoiceNumber: string; //  toegekend door de allocator (persist.ts) vóór deze planner
  clientUserId: string;
  now: Date;
  actorId: string | null;
  /**
   * Heraanbieding na afkeuring (REJECTED→SUBMITTED): het factuurnummer is al toegekend en de
   * omzet/debiteuren/af-te-dragen-BTW zijn al geboekt bij de éérste indiening (afkeuring boekt niet
   * terug). Dan GEEN nieuwe grootboekboekingen — anders telt de administratie de factuur dubbel.
   */
  resubmit?: boolean;
}

export function planInvoiceSubmittedEvent(ctx: InvoiceSubmittedCtx): CascadeEffects {
  invoiceLifecycleMachine.assert(ctx.invoice.lifecycleStatus, "SUBMITTED");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Invoice",
    id: ctx.invoice.id,
    field: "lifecycleStatus",
    from: ctx.invoice.lifecycleStatus,
    to: "SUBMITTED",
    set: { partyInvoiceNumber: ctx.partyInvoiceNumber, issuedAt: ctx.now },
  });
  // Alleen bij de éérste indiening boeken: omzet/debiteuren/BTW worden één keer erkend. Een
  // heraanbieding na afkeuring boekt niet opnieuw (afkeuring boekte ook niet terug) → geen dubbeltelling.
  if (!ctx.resubmit) {
    fx.postings.push(
      ...planInvoiceSubmitted({
        issuer: "FREELANCER",
        counterparty: "CLIENT",
        subtotalCents: ctx.invoice.subtotalCents,
        vatCents: ctx.invoice.vatCents,
        totalCents: ctx.invoice.totalCents,
      }),
    );
  }
  fx.notifications.push({
    userId: ctx.clientUserId,
    type: "INVOICE_SUBMITTED",
    title: "Factuur ter goedkeuring",
    body: `Factuur ${ctx.partyInvoiceNumber} staat klaar om goed te keuren.`,
    link: "/facturen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "INVOICE_SUBMITTED",
    entityType: "Invoice",
    entityId: ctx.invoice.id,
    metadata: { number: ctx.partyInvoiceNumber },
  });
  return fx;
}

// --- Event D — Opdrachtgever keurt factuur goed ----------------------------
export interface InvoiceApprovedCtx {
  invoice: {
    id: string;
    lifecycleStatus: InvoiceLifecycleState;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  };
  paymentTermDays: number;
  freelancerUserId: string;
  now: Date;
  actorId: string | null;
}

export function planInvoiceApprovedEvent(ctx: InvoiceApprovedCtx): CascadeEffects {
  invoiceLifecycleMachine.assert(ctx.invoice.lifecycleStatus, "APPROVED");
  const dueAt = new Date(ctx.now);
  dueAt.setDate(dueAt.getDate() + ctx.paymentTermDays);

  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Invoice",
    id: ctx.invoice.id,
    field: "lifecycleStatus",
    from: ctx.invoice.lifecycleStatus,
    to: "APPROVED",
    set: { dueAt },
  });
  fx.postings.push(
    ...planInvoiceApproved({
      issuer: "FREELANCER",
      counterparty: "CLIENT",
      subtotalCents: ctx.invoice.subtotalCents,
      vatCents: ctx.invoice.vatCents,
      totalCents: ctx.invoice.totalCents,
    }),
  );
  fx.notifications.push({
    userId: ctx.freelancerUserId,
    type: "INVOICE_APPROVED",
    title: "Factuur goedgekeurd",
    body: `Betaling wordt verwacht binnen ${ctx.paymentTermDays} dagen. Betaling verloopt rechtstreeks; het platform houdt alleen de status bij.`,
    link: "/facturen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "INVOICE_APPROVED",
    entityType: "Invoice",
    entityId: ctx.invoice.id,
    metadata: { dueAt: dueAt.toISOString() },
  });
  return fx;
}

// --- Event D' — Factuur afgekeurd (zijpad) ---------------------------------
export interface InvoiceRejectedCtx {
  invoiceId: string;
  lifecycleStatus: InvoiceLifecycleState;
  freelancerUserId: string;
  reason: string;
  actorId: string | null;
}

export function planInvoiceRejectedEvent(ctx: InvoiceRejectedCtx): CascadeEffects {
  if (!ctx.reason?.trim()) throw new Error("Een afkeuring vereist een reden.");
  invoiceLifecycleMachine.assert(ctx.lifecycleStatus, "REJECTED");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Invoice",
    id: ctx.invoiceId,
    field: "lifecycleStatus",
    from: ctx.lifecycleStatus,
    to: "REJECTED",
    set: { rejectionReason: ctx.reason.trim() },
  });
  fx.notifications.push({
    userId: ctx.freelancerUserId,
    type: "INVOICE_REJECTED",
    title: "Factuur afgekeurd",
    body: `Reden: ${ctx.reason.trim()}. Corrigeer de factuur en dien hem opnieuw in.`,
    link: "/facturen",
  });
  fx.audits.push({
    actorId: ctx.actorId,
    action: "INVOICE_REJECTED",
    entityType: "Invoice",
    entityId: ctx.invoiceId,
    metadata: { reason: ctx.reason.trim() },
  });
  return fx;
}

// --- Event E — Betaling rechtstreeks + geregistreerd -----------------------
export interface PaymentConfirmedCtx {
  invoice: {
    id: string;
    lifecycleStatus: InvoiceLifecycleState;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    partyInvoiceNumber: string | null;
  };
  collaboration: { id: string; status: CollaborationStatus; hasOtherOpenWork?: boolean };
  freelancerUserId: string;
  clientUserId: string;
  now: Date;
  actorId: string | null;
}

export function planPaymentConfirmedEvent(ctx: PaymentConfirmedCtx): CascadeEffects {
  invoiceLifecycleMachine.assert(ctx.invoice.lifecycleStatus, "PAID");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Invoice",
    id: ctx.invoice.id,
    field: "lifecycleStatus",
    from: ctx.invoice.lifecycleStatus,
    to: "PAID",
    set: { status: "PAID" }, // spiegel naar de live status zodat de bestaande UI klopt
  });
  // De samenwerking rondt alleen af als deze betaling het laatste openstaande werk afsluit:
  // niet vanuit een andere status dan ACTIVE (idempotent) en niet zolang er nog een andere
  // openstaande factuur of een onbeoordeelde prestatie is (geld blijft anders los van context).
  if (ctx.collaboration.status === "ACTIVE" && !ctx.collaboration.hasOtherOpenWork) {
    fx.statusChanges.push({
      entity: "Collaboration",
      id: ctx.collaboration.id,
      field: "status",
      from: "ACTIVE",
      to: "COMPLETED",
    });
  }
  fx.postings.push(
    ...planPaymentConfirmed({
      issuer: "FREELANCER",
      counterparty: "CLIENT",
      subtotalCents: ctx.invoice.subtotalCents,
      vatCents: ctx.invoice.vatCents,
      totalCents: ctx.invoice.totalCents,
    }),
  );
  const num = ctx.invoice.partyInvoiceNumber ?? "";
  fx.notifications.push(
    {
      userId: ctx.freelancerUserId,
      type: "PAYMENT_CONFIRMED",
      title: "Betaling ontvangen",
      body: `Factuur ${num} is als betaald geregistreerd. Je omzet is verwerkt.`,
      link: "/facturen",
    },
    {
      userId: ctx.clientUserId,
      type: "PAYMENT_CONFIRMED",
      title: "Betaling geregistreerd",
      body: `Factuur ${num} is als betaald geregistreerd.`,
      link: "/facturen",
    },
  );
  fx.audits.push({
    actorId: ctx.actorId,
    action: "PAYMENT_CONFIRMED",
    entityType: "Invoice",
    entityId: ctx.invoice.id,
  });

  // Event F — platformfee (default UIT). Alleen na betaling, indien geconfigureerd.
  if (PLATFORM_FEE.enabled && PLATFORM_FEE.trigger === "AFTER_PAYMENT") {
    fx.followups.push({
      type: "PLATFORM_FEE_INVOICED",
      actorRole: "SYSTEM",
      actorId: null,
      subjectType: "Invoice",
      subjectId: ctx.invoice.id,
      correlationId: null,
      payload: { sourceInvoiceId: ctx.invoice.id },
    });
  }
  return fx;
}

// --- Zijpad — Creditfactuur ------------------------------------------------
export interface InvoiceCreditedCtx {
  invoice: {
    id: string;
    lifecycleStatus: InvoiceLifecycleState;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    partyInvoiceNumber: string | null;
  };
  freelancerUserId: string;
  clientUserId: string;
  reason: string;
  actorId: string | null;
}

/** ZZP'er crediteert een factuur: tegenboeking bij beide partijen, BTW gecorrigeerd. */
export function planInvoiceCreditedEvent(ctx: InvoiceCreditedCtx): CascadeEffects {
  if (!ctx.reason?.trim()) throw new Error("Een creditfactuur vereist een reden.");
  invoiceLifecycleMachine.assert(ctx.invoice.lifecycleStatus, "CREDITED");
  const fx = emptyEffects();
  fx.statusChanges.push({
    entity: "Invoice",
    id: ctx.invoice.id,
    field: "lifecycleStatus",
    from: ctx.invoice.lifecycleStatus,
    to: "CREDITED",
    set: { status: "CANCELLED", rejectionReason: ctx.reason.trim() },
  });
  // Een al betaalde factuur (PAID/PROCESSED) heeft betaal-tegenboekingen; crediteren draait die terug.
  const reversePayment =
    ctx.invoice.lifecycleStatus === "PAID" || ctx.invoice.lifecycleStatus === "PROCESSED";
  fx.postings.push(
    ...planInvoiceCredited(
      {
        issuer: "FREELANCER",
        counterparty: "CLIENT",
        subtotalCents: ctx.invoice.subtotalCents,
        vatCents: ctx.invoice.vatCents,
        totalCents: ctx.invoice.totalCents,
      },
      { reversePayment },
    ),
  );
  const num = ctx.invoice.partyInvoiceNumber ?? "concept";
  fx.notifications.push(
    {
      userId: ctx.freelancerUserId,
      type: "INVOICE_CREDITED",
      title: "Factuur gecrediteerd",
      body: `Factuur ${num} is gecrediteerd. Reden: ${ctx.reason.trim()}.`,
      link: "/facturen",
    },
    {
      userId: ctx.clientUserId,
      type: "INVOICE_CREDITED",
      title: "Factuur gecrediteerd",
      body: `Factuur ${num} is gecrediteerd door de ZZP'er. Reden: ${ctx.reason.trim()}.`,
      link: "/facturen",
    },
  );
  fx.audits.push({
    actorId: ctx.actorId,
    action: "INVOICE_CREDITED",
    entityType: "Invoice",
    entityId: ctx.invoice.id,
    metadata: { reason: ctx.reason.trim() },
  });
  return fx;
}
