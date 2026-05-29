// Cascade-effecten (PLATFORM_OVERHAUL.md §4). Een handler is een PURE functie die, gegeven een
// geladen context, beschrijft wát er moet gebeuren — niet hóe het wordt weggeschreven. De
// transactionele applier (apply.ts) voert het atomair uit; zo blijven de cascade-regels testbaar
// zonder DB (zelfde plan/apply-patroon als runExpiryTask).

import { type Posting } from "@/lib/administration/ledger";
import { type VatRegime } from "@/lib/config";
import { type DomainEventInput } from "@/lib/events";

/** Een statuswijziging op een bestaand domeinobject (al gevalideerd tegen de state machine). */
export interface StatusChange {
  entity: "Collaboration" | "Performance" | "Invoice";
  id: string;
  /** Welk veld wijzigt (bv. "lifecycleStatus", "status", "contractStatus"). */
  field: string;
  from: string;
  to: string;
  /** Extra velden die in dezelfde update meegaan (bv. submittedAt, dueAt, rejectionReason). */
  set?: Record<string, unknown>;
}

/** Een in-app notificatie/taak voor een rol. */
export interface NotificationDraft {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

/** Een auditregel (mens-leesbaar gevolg, naast het machine-event). */
export interface AuditDraft {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/** De concept-factuur die automatisch uit een goedgekeurde prestatie ontstaat (Event B2). */
export interface NewInvoiceDraft {
  performanceId: string;
  collaborationId: string;
  issuerUserId: string;
  counterpartyUserId: string;
  issuerKey: string;
  subtotalCents: number;
  vatCents: number;
  vatRegime: VatRegime;
  totalCents: number;
  correlationId: string;
}

/** Alle gevolgen van één cascade-stap, samen atomair toe te passen. */
export interface CascadeEffects {
  statusChanges: StatusChange[];
  postings: Posting[];
  notifications: NotificationDraft[];
  audits: AuditDraft[];
  /** Nieuw aan te maken concept-factuur (alleen Event B2). */
  newInvoice?: NewInvoiceDraft | null;
  /** Vervolg-events die dezelfde cascade voortzetten (bv. Event F na E indien fee actief). */
  followups: DomainEventInput[];
}

/** Lege effecten — handig als basis. */
export function emptyEffects(): CascadeEffects {
  return { statusChanges: [], postings: [], notifications: [], audits: [], newInvoice: null, followups: [] };
}
