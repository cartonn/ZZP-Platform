// Geplande runner die terminale, niet-geaccepteerde reacties (Application) na het retentievenster hard
// verwijdert. Dwingt de AVG art. 5(1)(e)-belofte uit het verwerkingsregister af ("opdrachten-reacties-
// matching": reactie-inhoud tot 4 weken na afronding van de selectieprocedure) die tot nu toe niet
// technisch was afgedwongen — REJECTED/WITHDRAWN-reacties stapelden zich onbeperkt op, mét vrije-tekst-PII
// in `motivation`/`note`. Idempotent: een tweede run met dezelfde klok wist niets meer.
//
// SCOPE-VEILIGHEID (kritiek): alléén reacties met status REJECTED of WITHDRAWN én zónder gekoppelde
// samenwerking komen in aanmerking. Een geaccepteerde reactie heeft een `Collaboration` (relatie
// `applicationId @unique`, `onDelete: Cascade` vanaf Application) — die zou bij verwijdering de héle
// samenwerking (met facturen, prestaties) mee-casceren. De expliciete `collaboration: { is: null }`-guard
// sluit dat categorisch uit, óók als de status-invariant ooit zou verschuiven. NEW/VIEWED/SHORTLIST zijn
// nog in procedure (de selectie is niet afgerond) en blijven staan.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { applicationRetentionDays } from "@/lib/config";
import { applicationRetentionCutoff } from "@/lib/application-retention";
import type { Prisma } from "@prisma/client";

export interface ApplicationRetentionResult {
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
 * De set reacties die onder de retentie-sweep valt. Geëxporteerd zodat de guard-invariant (terminaal,
 * niet-geaccepteerd, zónder samenwerking, ouder dan het venster) op één plek staat en getest wordt.
 */
export function prunableApplicationWhere(cutoff: Date): Prisma.ApplicationWhereInput {
  return {
    status: { in: ["REJECTED", "WITHDRAWN"] },
    updatedAt: { lt: cutoff },
    // Cascade-veiligheid: nooit een reactie mét samenwerking wissen (zou de samenwerking mee-casceren).
    collaboration: { is: null },
  };
}

export async function runApplicationRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<ApplicationRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = applicationRetentionDays();
  const cutoff = applicationRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  const where = prunableApplicationWhere(cutoff);

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.application.findMany({
      where,
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.application.deleteMany({
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
        action: "APPLICATIONS_PRUNED",
        entityType: "Application",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
