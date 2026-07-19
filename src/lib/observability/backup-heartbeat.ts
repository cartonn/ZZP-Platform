// Opslag-kant van de back-up-heartbeat (dead-man's-switch). Schrijft/leest de laatste geslaagde
// database-back-up en levert het staleness-oordeel voor /admin/systeemstatus. De pure beoordeling
// zit in backup-freshness.ts; hier alleen de DB-interactie.

import { prisma } from "@/lib/db";
import { backupMaxAgeHours } from "@/lib/config";
import { reportError } from "@/lib/observability/report";
import { evaluateBackupFreshness } from "@/lib/observability/backup-freshness";
import type { CronFreshness } from "@/lib/observability/cron-freshness";

/** Canonieke naam van het database-back-up-schema. */
export const DB_BACKUP_HEARTBEAT = "db-backup";

/**
 * Registreert dat een database-back-up zojuist afrondde. `ok` is false zodra de back-up-job een fout
 * meldde, zodat de systeemstatus een "gemeld-maar-mislukt"-back-up kan onderscheiden.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag de
 * heartbeat-respons niet omverhalen. Een schrijffout wordt gestructureerd gerapporteerd en geslikt.
 */
export async function recordBackupHeartbeat(
  ok: boolean,
  now: Date = new Date(),
  name: string = DB_BACKUP_HEARTBEAT,
): Promise<void> {
  try {
    await prisma.backupHeartbeat.upsert({
      where: { name },
      create: { name, lastRunAt: now, lastOk: ok },
      update: { lastRunAt: now, lastOk: ok },
    });
  } catch (error) {
    await reportError(error, { source: "backup-heartbeat", requestPath: `/backup/${name}` });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness tegen het geconfigureerde venster
 * (`BACKUP_MAX_AGE_HOURS`, default 48 uur). Faalt nooit naar buiten: bij een leesfout wordt "never"
 * teruggegeven (aandacht) i.p.v. een 500 op het admin-scherm.
 */
export async function getBackupFreshness(
  now: Date = new Date(),
  name: string = DB_BACKUP_HEARTBEAT,
): Promise<CronFreshness> {
  const maxAge = backupMaxAgeHours();
  try {
    const row = await prisma.backupHeartbeat.findUnique({ where: { name } });
    return evaluateBackupFreshness(row?.lastRunAt ?? null, row?.lastOk ?? null, now, maxAge);
  } catch (error) {
    await reportError(error, { source: "backup-heartbeat", requestPath: `/backup/${name}` });
    return evaluateBackupFreshness(null, null, now, maxAge);
  }
}
