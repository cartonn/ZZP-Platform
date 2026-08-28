// Geplande runner die mail-intake-rijen (MailIntake) na het retentievenster hard verwijdert. Dwingt de
// AVG art. 5(1)(e)-belofte (opslagbeperking) af die tot nu toe niet technisch was afgedwongen —
// MailIntake-rijen stapelden zich onbeperkt op, mét derde-partij-PII (`fromAddress` van een externe
// aanvrager, `subject`, vrije-tekst `textBody`). Wist op `receivedAt < cutoff`. Idempotent: een tweede
// run met dezelfde klok wist niets meer.
//
// SCOPE-VEILIGHEID (kritiek): nooit een NEW intake wissen. Een NEW-rij staat nog in de reviewqueue en
// wacht op de menselijke beoordeling van de opdrachtgever (of is heropend uit DISMISSED, waarbij
// `decidedAt` weer null is); die vroegtijdig wissen zou een openstaande aanvraag — en dus omzet — laten
// verdwijnen. Alleen intakes waarvan de beoordeling aantoonbaar is afgerond (status ACCEPTED/DISMISSED)
// vallen na het venster onder de sweep. Bij ACCEPTED is de concept-opdracht (Job) het durende artefact;
// de ruwe mail mag daarna weg. Die guard leeft in prunableMailIntakeWhere.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { mailIntakeRetentionDays } from "@/lib/config";
import { mailIntakeRetentionCutoff } from "@/lib/mail-intake-retention";
import type { Prisma } from "@prisma/client";

export interface MailIntakeRetentionResult {
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
 * De set intakes die onder de retentie-sweep valt. Geëxporteerd zodat de guard-invariant (ouder dan het
 * venster én beoordeling afgerond) op één plek staat en getest wordt.
 */
export function prunableMailIntakeWhere(cutoff: Date): Prisma.MailIntakeWhereInput {
  return {
    receivedAt: { lt: cutoff },
    // SCOPE-VEILIGHEID: alleen besliste intakes. NEW (nog te beoordelen of heropend) blijft altijd staan.
    status: { in: ["ACCEPTED", "DISMISSED"] },
  };
}

export async function runMailIntakeRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<MailIntakeRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = mailIntakeRetentionDays();
  const cutoff = mailIntakeRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  const where = prunableMailIntakeWhere(cutoff);

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.mailIntake.findMany({
      where,
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.mailIntake.deleteMany({
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
        action: "MAIL_INTAKE_PRUNED",
        entityType: "MailIntake",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
