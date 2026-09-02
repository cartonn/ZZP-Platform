// Weesblob-grootboek + reconciliatie voor gefaalde best-effort opslag-opruiming.
//
// PROBLEEM dat dit oplost: op meerdere plekken (AVG-anonimisering, document-/certificaat-verwijdering,
// logo-vervanging) verwijderen we een blob uit de opslag NADAT de DB-rij al is weggehaald/vervangen. Die
// `storage.delete(...)` zit bewust in een `.catch(...)` (best-effort — hij mag de mutatie niet omverhalen)
// en werd tot nu toe ALLEEN gelogd. Faalt hij door een transiënte opslagstoring (S3-blip, netwerk,
// time-out), dan bleef de sleutel enkel in een vluchtige hostlogregel staan. Bij het AVG-erasure-pad
// verdwijnt de `Document`-rij VÓÓR de blob-delete, dus een gefaalde delete liet het gevoelige bewijsstuk
// (VOG/diploma/ID) VOORGOED als weesblob achter — zonder spoor om het terug te vinden of te herproberen
// (AVG art. 17 / art. 5(1)(c)).
//
// OPLOSSING: een gefaalde opruiming legt de opaque storagesleutel + herkomst vast in
// `OrphanedStorageObject`. De reconciliatietaak (`runStorageOrphanReconcileTask`) herhaalt de delete in
// begrensde batches tot hij slaagt; een geslaagde reclaim zet `reclaimedAt`. Zo overleeft een sensitieve
// weesblob nooit stilletjes een opslagstoring — het is de laatste stille-best-effort-faalmodus in de
// dead-man's-switch-familie (opslag/mail/push/billing/verificatie/rate-limit/... hadden er al één).
//
// Geen PII: `storageKey` is een opaque pad, `source` een vast herkomst-label, `lastError` een tot
// naam/boodschap gereduceerde, PII-veilige foutbeschrijving (via `describeError`, dezelfde reductie als
// `logStorageCleanupFailure`).

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { getStorage, type StorageDriver } from "@/lib/services/storage";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";
import { describeError } from "@/lib/observability/report";
import { maskEmails } from "@/lib/observability/logger";

/** Herkomst-labels voor een gefaalde opruiming. Vast, niet-PII, zodat operators de bron herkennen. */
export type StorageCleanupSource =
  | "avg-erasure"
  | "document-delete"
  | "certificate-delete"
  | "logo-replace";

/**
 * De canonieke where-vorm voor een nog-openstaande weesblob (opruiming nog niet geslaagd). Eén bron van
 * waarheid, gedeeld door de reconciliatietaak (retry) én de `/api/metrics`-backlog-gauge (count), zodat
 * die twee niet kunnen driften — spiegelt `prunable*Where`/`openHealthIncidentWhere` elders.
 */
export function openOrphanedStorageWhere(): { reclaimedAt: null } {
  return { reclaimedAt: null };
}

/**
 * Reduceert een opgevangen fout tot een PII-veilige, begrensde beschrijving voor `lastError`. Nooit de
 * volledige stack (die kan een pad/e-mail dragen); alleen `naam: boodschap`, afgekapt. `lastError` is een
 * PERSISTENTE sink (DB-veld, tot 30 dagen bewaard) — gevoeliger dan een vluchtige logregel — dus we passen
 * dezelfde e-mailmaskering toe die de logger op alle stringwaarden doet (`maskEmails`), voor het geval een
 * storage-driver een e-mailachtige waarde in `.message` meedraagt (AVG art. 5(1)(c), defense-in-depth).
 */
function describeCleanupError(error: unknown): string {
  const { name, message } = describeError(error);
  return maskEmails(`${name}: ${message}`).slice(0, 500);
}

/**
 * Legt een gefaalde best-effort opslag-opruiming vast. Drop-in vervanger voor de kale
 * `logStorageCleanupFailure(...)` in een `.catch(...)`: logt nog steeds PII-veilig (ongewijzigd gedrag)
 * ÉN registreert de sleutel in het weesblob-grootboek zodat de reconciliatietaak 'm later opruimt.
 *
 * FAIL-SAFE: werpt nooit. Deze functie draait zelf in het `.catch` van een best-effort opruiming; een
 * DB-storing hier mag de al-voltooide mutatie (erasure/verwijdering) niet alsnog laten crashen. Kan het
 * grootboek niet worden bijgewerkt, dan blijft ten minste de PII-veilige logregel over.
 *
 * Idempotent op `storageKey` (uniek): herhaald falen van dezelfde sleutel werkt dezelfde rij bij
 * (attempts++, nieuwe lastError/lastAttemptAt) i.p.v. te dupliceren. Een eerder gereclaimede rij die
 * opnieuw faalt (zeldzaam: dezelfde sleutel opnieuw gebruikt) wordt heropend (`reclaimedAt` → null).
 */
export async function recordStorageCleanupFailure(
  source: StorageCleanupSource,
  storageKey: string,
  error: unknown,
): Promise<void> {
  // Ongewijzigd: PII-veilig loggen (herkomst-label tussen haken, consistent met de bestaande callsites).
  logStorageCleanupFailure(`[${source}]`, storageKey, error);

  const lastError = describeCleanupError(error);
  const now = new Date();
  try {
    await prisma.orphanedStorageObject.upsert({
      where: { storageKey },
      create: { storageKey, source, lastError, firstFailedAt: now, lastAttemptAt: now },
      update: {
        source,
        lastError,
        lastAttemptAt: now,
        reclaimedAt: null,
        attempts: { increment: 1 },
      },
    });
  } catch (persistError) {
    // Grootboek niet bij te werken (DB-storing): niet fataal — de logregel hierboven blijft het
    // vangnet. Los loggen zodat deze zeldzame dubbelstoring zichtbaar is.
    logStorageCleanupFailure(`[${source}] grootboek`, storageKey, persistError);
  }
}

export interface StorageOrphanReconcileResult {
  /** Aantal openstaande weesblobs waarvoor deze run een delete probeerde. */
  attempted: number;
  /** Aantal dat nu succesvol uit de opslag verwijderd is (reclaimedAt gezet). */
  reclaimed: number;
  /** Aantal dat opnieuw faalde (blijft openstaan voor de volgende run). */
  stillFailing: number;
  /** Aantal oude, al-gereclaimede grootboekrijen dat deze run is opgeruimd (retentie). */
  pruned: number;
}

// Begrensd per run: houd de opslag-round-trips + DB-writes onder controle. Een grote achterstand wordt
// over meerdere geplande runs weggewerkt (idempotent).
const RECONCILE_BATCH_SIZE = 100;
// Retentie: al-gereclaimede grootboekrijen (bewijs dat een weesblob alsnog is opgeruimd) hoeven niet
// eeuwig te blijven staan. Ruim ze op na een royaal venster; de auditlog houdt het blijvende spoor.
const RECLAIMED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagen

/**
 * Kern van de reconciliatie: retry de opslag-delete voor openstaande weesblobs en snoei oude gereclaimede
 * rijen. Pure-genoeg om te testen met een geïnjecteerde storage-driver + klok. Werpt niet per weesblob:
 * een blob die opnieuw faalt bumpt zijn teller en blijft openstaan voor de volgende run.
 */
export async function reconcileOrphanedStorageObjects(opts?: {
  storage?: StorageDriver;
  now?: Date;
  limit?: number;
}): Promise<StorageOrphanReconcileResult> {
  const storage = opts?.storage ?? getStorage();
  const now = opts?.now ?? new Date();
  const limit = opts?.limit ?? RECONCILE_BATCH_SIZE;

  const open = await prisma.orphanedStorageObject.findMany({
    where: openOrphanedStorageWhere(),
    // Oudste eerst: een blob die het langst is blijven staan, moet als eerste weg (AVG art. 17).
    orderBy: { firstFailedAt: "asc" },
    take: limit,
    select: { id: true, storageKey: true },
  });

  let reclaimed = 0;
  let stillFailing = 0;
  for (const row of open) {
    try {
      await storage.delete(row.storageKey);
      await prisma.orphanedStorageObject.update({
        where: { id: row.id },
        data: { reclaimedAt: now, lastAttemptAt: now, lastError: null },
      });
      reclaimed += 1;
    } catch (error) {
      // Blijft openstaan; bump de teller + leg de nieuwe fout vast. Fail-safe: een DB-write-fout hier
      // mag de rest van de batch niet afbreken.
      await prisma.orphanedStorageObject
        .update({
          where: { id: row.id },
          data: {
            lastAttemptAt: now,
            lastError: describeCleanupError(error),
            attempts: { increment: 1 },
          },
        })
        .catch(() => {});
      stillFailing += 1;
    }
  }

  // Retentie: snoei al-gereclaimede rijen die ouder zijn dan het venster. Idempotent.
  const { count: pruned } = await prisma.orphanedStorageObject.deleteMany({
    where: { reclaimedAt: { lt: new Date(now.getTime() - RECLAIMED_RETENTION_MS) } },
  });

  return { attempted: open.length, reclaimed, stillFailing, pruned };
}

/**
 * Geplande runner: reconcilieer openstaande weesblobs en audit het resultaat. Registreert alleen bij een
 * betekenisvolle uitkomst (iets gereclaimed, nog iets openstaand, of gesnoeid) zodat een lege run de
 * auditlog niet vervuilt. Geen PII in de metadata — alleen aantallen.
 */
export async function runStorageOrphanReconcileTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<StorageOrphanReconcileResult> {
  const now = opts.now ?? new Date();
  const result = await reconcileOrphanedStorageObjects({ now });

  if (result.reclaimed > 0 || result.stillFailing > 0 || result.pruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "STORAGE_ORPHANS_RECONCILED",
        entityType: "OrphanedStorageObject",
        entityId: "reconcile",
        metadata: {
          attempted: result.attempted,
          reclaimed: result.reclaimed,
          stillFailing: result.stillFailing,
          pruned: result.pruned,
          at: now.toISOString(),
        },
      }),
    });
  }

  return result;
}
