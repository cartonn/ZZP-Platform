// Geplande runner die mail-intake-rijen (MailIntake) na het retentievenster hard verwijdert. Dwingt de
// AVG art. 5(1)(e)-belofte (opslagbeperking) af die tot nu toe niet technisch was afgedwongen —
// MailIntake-rijen stapelden zich onbeperkt op, mét derde-partij-PII (`fromAddress` van een externe
// aanvrager, `subject`, vrije-tekst `textBody`). Wist op `receivedAt < cutoff`. Idempotent: een tweede
// run met dezelfde klok wist niets meer.
//
// De inbound-webhook legt dezelfde `fromAddress` óók vast in een `MAIL_INTAKE_RECEIVED`-auditrecord;
// die tweede PII-kopie wordt bij het wissen mee-geredact (scrubReceivedAuditPii), zodat de
// opslagbeperking niet stilletjes in de auditlog blijft hangen.
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
import { scrubAuditMetadataPii } from "@/lib/account-anonymization";
import type { Prisma } from "@prisma/client";

export interface MailIntakeRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

// De inbound-webhook schrijft naast de MailIntake-rij een `MAIL_INTAKE_RECEIVED`-auditrecord met het
// `fromAddress` (derde-partij-PII) in de metadata (zie src/app/api/mail-intake/webhook/route.ts). Dat is
// een tweede kopie van dezelfde PII die de MailIntake-sweep hierboven niet raakt — de generieke
// auditlog-retentie staat default uit — waardoor `fromAddress` de opslagbeperking (AVG art. 5(1)(e))
// zou overleven. Deze helper redact dat adres uit het bijbehorende auditrecord op het moment dat de
// intake-rij daadwerkelijk gewist is, zodat beide kopieën samen verdwijnen. Alleen `fromAddress` wordt
// geraakt (exact-match via scrubAuditMetadataPii); operationele velden als `messageId` blijven staan.
async function scrubReceivedAuditPii(
  tx: Prisma.TransactionClient,
  deleted: readonly { id: string; fromAddress: string | null }[],
): Promise<number> {
  if (deleted.length === 0) return 0;
  const rows = await tx.auditLog.findMany({
    where: {
      action: "MAIL_INTAKE_RECEIVED",
      entityType: "MailIntake",
      entityId: { in: deleted.map((r) => r.id) },
    },
    select: { id: true, entityId: true, metadata: true },
  });
  const fromById = new Map(deleted.map((r) => [r.id, r.fromAddress]));
  let scrubbed = 0;
  for (const row of rows) {
    const from = fromById.get(row.entityId);
    const next = scrubAuditMetadataPii(row.metadata, from ? [from] : []);
    if (next !== row.metadata) {
      await tx.auditLog.update({ where: { id: row.id }, data: { metadata: next } });
      scrubbed++;
    }
  }
  return scrubbed;
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
    // Commit the source deletion, PII redaction and completion audit together. On any
    // failure this batch remains available to the next run; earlier batches stay complete.
    const result = await prisma.$transaction(
      async (tx) => {
        const stale = await tx.mailIntake.findMany({
          where,
          select: { id: true, fromAddress: true },
          take: BATCH_SIZE,
        });
        if (stale.length === 0) return { selected: 0, pruned: 0 };
        const staleIds = stale.map((r) => r.id);
        // Recheck the retention/status predicate at the write: a reopened NEW intake survives.
        const { count } = await tx.mailIntake.deleteMany({
          where: { ...where, id: { in: staleIds } },
        });
        if (count > 0) {
          // Redact only the deleted sources; a survivor retains its corresponding audit copy.
          const survivors = await tx.mailIntake.findMany({
            where: { id: { in: staleIds } },
            select: { id: true },
          });
          const survivorIds = new Set(survivors.map((r) => r.id));
          const deleted = stale.filter((r) => !survivorIds.has(r.id));
          const auditScrubbed = await scrubReceivedAuditPii(tx, deleted);
          // One non-PII record per committed batch also survives a later batch failure.
          await tx.auditLog.create({
            data: auditData({
              actorId: opts.actorId ?? null,
              action: "MAIL_INTAKE_PRUNED",
              entityType: "MailIntake",
              entityId: "retention",
              metadata: {
                pruned: count,
                auditScrubbed,
                retentionDays,
                cutoff: cutoff.toISOString(),
              },
            }),
          });
        }
        return { selected: stale.length, pruned: count };
      },
      { timeout: 30_000 },
    );
    pruned += result.pruned;
    if (result.selected < BATCH_SIZE) break;
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
