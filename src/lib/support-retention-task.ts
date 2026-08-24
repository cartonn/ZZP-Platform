// Geplande runner die afgehandelde support-tickets (SupportTicket) na het retentievenster hard
// verwijdert. Dwingt de AVG art. 5(1)(e)-belofte uit het verwerkingsregister af ("support-communicatie":
// helpdesk-tickets worden bewaard tot afhandeling + een redelijke termijn, max. 12 maanden na
// afhandeling) die tot nu toe niet technisch was afgedwongen — SupportTicket/SupportMessage-rijen
// stapelden zich onbeperkt op, mét vrije-tekst-PII in `subject`/`body`. Wist op `resolvedAt < cutoff`.
// Idempotent: een tweede run met dezelfde klok wist niets meer.
//
// SCOPE-VEILIGHEID (kritiek): nooit een lopend ticket wissen. Alleen tickets met status RESOLVED én een
// gezette `resolvedAt` vallen onder de sweep — een NEW/TRIAGED/AWAITING_USER/REOPENED-ticket is nog in
// behandeling en blijft staan, ongeacht leeftijd. Een RESOLVED-ticket zonder `resolvedAt` (legacy) wordt
// eveneens overgeslagen (conservatief: geen anker → niet wissen). Die guard leeft in
// prunableSupportTicketWhere. Het verwijderen van een ticket cascadeert naar z'n SupportMessages
// (schema: `onDelete: Cascade`), dus de bijbehorende chatinhoud gaat mee.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { supportTicketRetentionDays } from "@/lib/config";
import { supportTicketRetentionCutoff } from "@/lib/support-retention";
import type { Prisma } from "@prisma/client";

export interface SupportTicketRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort en
// voorkomt geheugendruk. Prisma's deleteMany kent geen limit, dus we selecteren id's per batch en
// verwijderen die set (werkt op SQLite én PostgreSQL).
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

/**
 * De set support-tickets die onder de retentie-sweep valt. Geëxporteerd zodat de guard-invariant
 * (afgehandeld, ouder dan het venster, met een echt afhandelmoment) op één plek staat en getest wordt,
 * én zodat de /api/metrics-backlog-gauge exact dezelfde bron van waarheid telt als de taak wist.
 */
export function prunableSupportTicketWhere(cutoff: Date): Prisma.SupportTicketWhereInput {
  return {
    // SCOPE-VEILIGHEID: alleen afgehandelde tickets, geankerd op een echt afhandelmoment. Een nog-open
    // ticket (NEW/TRIAGED/AWAITING_USER/REOPENED) blijft ongeacht leeftijd staan; een RESOLVED-ticket
    // zonder resolvedAt (legacy) mist z'n anker en wordt overgeslagen.
    status: "RESOLVED",
    resolvedAt: { not: null, lt: cutoff },
  };
}

export async function runSupportTicketRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<SupportTicketRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = supportTicketRetentionDays();
  const cutoff = supportTicketRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  const where = prunableSupportTicketWhere(cutoff);

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.supportTicket.findMany({
      where,
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    // Cascade (`onDelete: Cascade` op SupportMessage) verwijdert de bijbehorende berichten mee.
    // TOCTOU-veiligheid (voorkomt gegevensverlies, AVG art. 5(1)(d) juistheid): herhaal het volledige
    // guard-predicaat (`...where`) óók op de delete, niet alleen `id in [...]`. Wordt een ticket in het
    // smalle venster tussen deze `findMany` en de `deleteMany` heropend (RESOLVED → REOPENED) of van
    // anker ontdaan, dan matcht het niet meer en blijft het staan — een weer-actief ticket mag nooit
    // sneuvelen. Fail-closed: alleen rijen die op verwijdermoment nóg afgehandeld-en-verlopen zijn.
    const { count } = await prisma.supportTicket.deleteMany({
      where: { ...where, id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }

  // Registreer de snoei-actie voor operationele traceerbaarheid (art. 5(2) verantwoordingsplicht).
  // Geen PII: alleen aantal + cutoff + venster. Alleen bij daadwerkelijk snoeien, zodat een lege run
  // de auditlog niet vervuilt.
  if (pruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "SUPPORT_TICKETS_PRUNED",
        entityType: "SupportTicket",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
