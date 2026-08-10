// Opslag-kant van de cron-heartbeat (dead-man's-switch). Schrijft/leest de laatste run van een
// geplande-taken-cron en levert het staleness-oordeel voor /admin/systeemstatus. De pure
// beoordeling zit in cron-freshness.ts; hier alleen de DB-interactie.

import { prisma } from "@/lib/db";
import { cronMaxAgeHours } from "@/lib/config";
import { reportError } from "@/lib/observability/report";
import { evaluateCronFreshness, type CronFreshness } from "@/lib/observability/cron-freshness";
import { serializeFailedTasks, parseFailedTasks } from "@/lib/observability/cron-failed-tasks";

/** Canonieke naam van de gecombineerde geplande-taken-cron. */
export const RUN_ALL_HEARTBEAT = "run-all";

/**
 * Registreert dat de cron zojuist heeft gedraaid. `ok` is false zodra ten minste één taak faalde,
 * zodat de systeemstatus een "draaide-maar-met-fouten"-run kan onderscheiden. `failedTasks` bevat de
 * namen van de gefaalde taken (statische identifiers, géén PII) zodat /admin/systeemstatus wélke
 * runner faalde kan tonen zonder dat de operator de server-logs hoeft te grepen. Bij een geslaagde
 * run worden eerdere gefaalde-taak-namen gewist (kolom → null).
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag
 * de cron-respons niet omverhalen. Een schrijffout wordt gestructureerd gerapporteerd en geslikt.
 */
export async function recordCronHeartbeat(
  name: string,
  ok: boolean,
  failedTasks: readonly string[] = [],
  now: Date = new Date(),
): Promise<void> {
  // Alleen bij een gefaalde run namen bewaren; een geslaagde run wist ze (null) — geen stale attributie.
  const lastFailedTasks = ok ? null : serializeFailedTasks(failedTasks);
  try {
    await prisma.cronHeartbeat.upsert({
      where: { name },
      create: { name, lastRunAt: now, lastOk: ok, lastFailedTasks },
      update: { lastRunAt: now, lastOk: ok, lastFailedTasks },
    });
  } catch (error) {
    await reportError(error, { source: "cron-heartbeat", requestPath: `/cron/${name}` });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness tegen het geconfigureerde venster
 * (`CRON_MAX_AGE_HOURS`, default 36 uur). Faalt nooit naar buiten: bij een leesfout wordt "never"
 * teruggegeven (aandacht) i.p.v. een 500 op het admin-scherm.
 */
export async function getCronFreshness(
  name: string = RUN_ALL_HEARTBEAT,
  now: Date = new Date(),
): Promise<CronFreshness> {
  const maxAgeHours = cronMaxAgeHours();
  try {
    const row = await prisma.cronHeartbeat.findUnique({ where: { name } });
    return evaluateCronFreshness(
      row?.lastRunAt ?? null,
      row?.lastOk ?? null,
      now,
      maxAgeHours,
      parseFailedTasks(row?.lastFailedTasks),
    );
  } catch (error) {
    await reportError(error, { source: "cron-heartbeat", requestPath: `/cron/${name}` });
    return evaluateCronFreshness(null, null, now, maxAgeHours);
  }
}
