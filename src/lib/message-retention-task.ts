// Geplande runner die chatberichten (Message) na het retentievenster hard verwijdert. Dwingt de AVG
// art. 5(1)(e)-belofte uit het verwerkingsregister af ("berichten-communicatie": chat tussen ZZP'er en
// opdrachtgever wordt bewaard voor de duur van de samenwerking + een redelijke termijn, max. 12 maanden
// na beëindiging) die tot nu toe niet technisch was afgedwongen — Message-rijen stapelden zich onbeperkt
// op, mét vrije-tekst-PII in `body`. Wist op `createdAt < cutoff`. Idempotent: een tweede run met
// dezelfde klok wist niets meer.
//
// SCOPE-VEILIGHEID (kritiek): nooit berichten van een LOPENDE samenwerking wissen. Een gesprek hangt via
// `Conversation.jobId` aan een opdracht; heeft die opdracht nog een niet-terminale samenwerking
// (PROPOSED/ACTIVE), dan is de relatie nog levend en blijven de berichten staan ("duur van de
// samenwerking"). Alleen gesprekken zónder opdracht (jobId null) of met uitsluitend terminale/geen
// samenwerkingen mogen ná het venster gesnoeid worden. Die guard leeft in prunableMessageWhere.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { messageRetentionDays } from "@/lib/config";
import { messageRetentionCutoff } from "@/lib/message-retention";
import type { Prisma } from "@prisma/client";

export interface MessageRetentionResult {
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
 * De set berichten die onder de retentie-sweep valt. Geëxporteerd zodat de guard-invariant (ouder dan
 * het venster én niet gekoppeld aan een lopende samenwerking) op één plek staat en getest wordt.
 */
export function prunableMessageWhere(cutoff: Date): Prisma.MessageWhereInput {
  return {
    createdAt: { lt: cutoff },
    // SCOPE-VEILIGHEID: nooit berichten van een LOPENDE samenwerking wissen. Een gesprek hangt via
    // Conversation.jobId aan een opdracht; heeft die opdracht een niet-terminale samenwerking
    // (PROPOSED/ACTIVE, incl. een bevroren dispuut dat ACTIVE blijft), dan is de relatie nog levend en
    // blijven de berichten staan ("duur van de samenwerking"). Gesprekken zonder opdracht (jobId null)
    // of met alleen terminale/geen samenwerkingen mogen ná het venster gesnoeid worden.
    conversation: {
      OR: [
        { jobId: null },
        { job: { collaborations: { none: { status: { in: ["PROPOSED", "ACTIVE"] } } } } },
      ],
    },
  };
}

export async function runMessageRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<MessageRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = messageRetentionDays();
  const cutoff = messageRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  const where = prunableMessageWhere(cutoff);

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.message.findMany({
      where,
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.message.deleteMany({
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
        action: "MESSAGES_PRUNED",
        entityType: "Message",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
