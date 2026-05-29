// Transactionele applier voor CascadeEffects (PLATFORM_OVERHAUL.md §4). Schrijft statuswijziging +
// administratie-postings + notificaties + audit atomair weg binnen één prisma.$transaction
// (CLAUDE.md regel 5), net als runExpiryTask. De cascade-regels zelf zijn puur (handlers.ts);
// dit is de "apply"-helft van plan/apply. Aanroepen vanuit command-functies (route/serveractie).

import { Prisma } from "@prisma/client";
import { auditData } from "@/lib/audit";
import { toEntryData, type PartyOwners } from "@/lib/administration/persist";
import { type CascadeEffects } from "@/lib/cascade/types";

export interface ApplyRefs {
  /** Welke user hoort bij welke partij — voor per-partij administratie-views. */
  owners: PartyOwners;
  /** De factuur waarop de postings slaan (Events C/D/E). */
  invoiceId?: string | null;
  performanceId?: string | null;
  correlationId?: string | null;
  /** Het DomainEvent dat deze effecten triggert (herleidbaarheid). */
  eventId: string;
  occurredAt?: Date;
}

export interface ApplyResult {
  /** Id van de nieuw aangemaakte concept-factuur (alleen Event B2). */
  createdInvoiceId?: string;
}

/**
 * Past alle effecten van één cascade-stap toe binnen de gegeven transactie. Idempotentie regelt de
 * aanroeper via de event-`dedupeKey` + EventHandlerRun-marker; deze functie schrijft puur weg.
 */
export async function applyCascadeEffects(
  tx: Prisma.TransactionClient,
  effects: CascadeEffects,
  refs: ApplyRefs,
): Promise<ApplyResult> {
  const result: ApplyResult = {};

  // 1. Nieuwe concept-factuur (Event B2) — vóór de statuswijzigingen, geen postings.
  if (effects.newInvoice) {
    const inv = effects.newInvoice;
    const created = await tx.invoice.create({
      data: {
        // Live-velden behouden zodat bestaande queries blijven werken.
        number: `CONCEPT-${inv.performanceId}`, // tijdelijk; krijgt partijnummer bij indienen (Event C)
        status: "DRAFT",
        totalCents: inv.totalCents,
        collaborationId: inv.collaborationId,
        // Cascade-velden
        lifecycleStatus: "DRAFT",
        performanceId: inv.performanceId,
        issuerUserId: inv.issuerUserId,
        counterpartyUserId: inv.counterpartyUserId,
        issuerKey: inv.issuerKey,
        subtotalCents: inv.subtotalCents,
        vatCents: inv.vatCents,
        vatRegime: inv.vatRegime,
        correlationId: inv.correlationId,
      },
    });
    result.createdInvoiceId = created.id;
  }

  // 2. Statuswijzigingen (al gevalideerd tegen de state machine in de planner).
  for (const sc of effects.statusChanges) {
    const data = { [sc.field]: sc.to, ...(sc.set ?? {}) } as Record<string, unknown>;
    if (sc.entity === "Collaboration") {
      await tx.collaboration.update({ where: { id: sc.id }, data: data as Prisma.CollaborationUpdateInput });
    } else if (sc.entity === "Performance") {
      await tx.performance.update({ where: { id: sc.id }, data: data as Prisma.PerformanceUpdateInput });
    } else if (sc.entity === "Invoice") {
      await tx.invoice.update({ where: { id: sc.id }, data: data as Prisma.InvoiceUpdateInput });
    }
  }

  // 3. Administratie-postings (debiteur/crediteur/BTW) — dubbel boekhouden.
  if (effects.postings.length > 0) {
    await tx.administrationEntry.createMany({
      data: toEntryData(effects.postings, {
        owners: refs.owners,
        invoiceId: refs.invoiceId ?? null,
        performanceId: refs.performanceId ?? null,
        correlationId: refs.correlationId ?? null,
        eventId: refs.eventId,
        occurredAt: refs.occurredAt,
      }),
    });
  }

  // 4. Notificaties / taken voor de juiste rollen.
  if (effects.notifications.length > 0) {
    await tx.notification.createMany({
      data: effects.notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        link: n.link ?? null,
      })),
    });
  }

  // 5. Auditregels (mens-leesbaar gevolg, naast het machine-event).
  for (const a of effects.audits) {
    await tx.auditLog.create({ data: auditData(a) });
  }

  return result;
}
