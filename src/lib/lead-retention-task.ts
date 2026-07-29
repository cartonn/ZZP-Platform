// Geplande runner die beslíste acquisitie-leads (Lead) na het retentievenster hard verwijdert,
// inclusief hun contactlogboek (LeadContact cascadeert mee via onDelete: Cascade). Dwingt de
// AVG art. 5(1)(e)-belofte uit het verwerkingsregister af ("KLANT/afvalt + 12 maanden") die tot nu
// toe alleen via het handmatige deleteLead-pad bestond. Alleen KLANT/NO_DEAL-leads komen in
// aanmerking (isLeadRetentionEligible); een nog actieve prospect (KOUD/WARM) blijft altijd staan.
// Idempotent: een tweede run met dezelfde klok wist niets meer.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { leadRetentionDays } from "@/lib/config";
import { leadRetentionCutoff, isLeadRetentionEligible } from "@/lib/lead-retention";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/enums";
import type { Prisma } from "@prisma/client";

// De beslíste (terminale) statussen die voor retentie in aanmerking komen — afgeleid uit dezelfde
// bron van waarheid (isLeadRetentionEligible) zodat een nieuwe status niet stil buiten de sweep valt.
const ELIGIBLE_STATUSES: LeadStatus[] = LEAD_STATUSES.filter(isLeadRetentionEligible);

/**
 * De set leads die onder de retentie-sweep valt (beslíst — KLANT/NO_DEAL — én sinds `cutoff` niet meer
 * aangeraakt). Geëxporteerd zodat de eligibiliteits-invariant op één plek staat en de stille-faal-gauge
 * op /api/metrics exact dezelfde bron van waarheid hergebruikt (kan niet driften t.o.v. de taak).
 */
export function prunableLeadWhere(cutoff: Date): Prisma.LeadWhereInput {
  return { status: { in: ELIGIBLE_STATUSES }, updatedAt: { lt: cutoff } };
}

export interface LeadRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort en
// voorkomt geheugendruk. Prisma's deleteMany kent geen limit, dus we selecteren id's per batch en
// verwijderen die set (werkt op SQLite én PostgreSQL). Het wissen van een Lead cascadeert naar
// LeadContact.
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

export async function runLeadRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<LeadRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = leadRetentionDays();
  const cutoff = leadRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.lead.findMany({
      where: prunableLeadWhere(cutoff),
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.lead.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
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
        action: "LEADS_PRUNED",
        entityType: "Lead",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
