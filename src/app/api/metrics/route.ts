// Operationeel-monitoring-endpoint: GET /api/metrics geeft machine-leesbare operationele metrics
// terug (Prometheus-tekst standaard, of JSON via ?format=json) zodat een externe monitor
// (Prometheus-scraper / uptime-dienst) op de dead-man's-switch-signalen kan alarmeren ZONDER dat een
// mens op /admin/systeemstatus hoeft in te loggen. Vult het gat tussen /api/health (alleen liveness)
// en het admin-UI-scherm.
//
// Gauges: zzp_up, zzp_db_reachable, zzp_cron_heartbeat_* / zzp_backup_heartbeat_* (dead-man's-switch),
// zzp_verification_queue (wachtrijdiepte), zzp_verification_queue_oldest_age_seconds (SLA-signaal: hoe
// lang wacht de oudste inzending al), zzp_maintenance_mode (onderhoudsmodus aan → 1) en
// zzp_credentials_overdue_expiry (VERIFIED-credentials wier vervaldatum voorbij is maar die de
// expiry-cron nog niet omzette) en zzp_subscriptions_overdue_expiry (betaalde ACTIVE-abonnementen wier
// periode voorbij is maar die de subscription-expiry-cron nog niet op CANCELLED zette) — twee
// stille-faal-detectors die de heartbeat niet vangt.
//
// Beveiliging: dezelfde Bearer CRON_SECRET als de taak-/heartbeat-routes, fail-closed — geen
// CRON_SECRET → 503, verkeerd token → 401. De uitvoer bevat NOOIT persoonsgegevens of secrets, alleen
// geaggregeerde gauges (tellingen, leeftijden, gezondheidsvlaggen). Nooit gecachet.
//
// LET OP: dit pad staat in de publieke-route-allowlist (`isPublicPath` in src/lib/route-guards.ts,
// naast /api/health, /api/readiness en /api/tasks/) — een sessieloze scraper moet de handler bereiken
// zodat de CRON_SECRET-guard hieronder draait; zonder die allowlist-entry redirect de middleware het
// verzoek naar /login en is het endpoint functioneel dood.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeCron } from "@/lib/cron-auth";
import { getCronFreshness } from "@/lib/observability/cron-heartbeat";
import { getBackupFreshness } from "@/lib/observability/backup-heartbeat";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import { waitingSince } from "@/lib/verification-queue";
import { reportError } from "@/lib/observability/report";
import type { CronFreshness } from "@/lib/observability/cron-freshness";
import {
  buildMetrics,
  metricsToJson,
  renderPrometheus,
  type MetricsInput,
} from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

/** Leeftijd in seconden uit een heartbeat-freshness (null als er nog nooit een run/melding was). */
function ageSeconds(freshness: CronFreshness, now: Date): number | null {
  if (!freshness.lastRunAt) return null;
  const ms = now.getTime() - freshness.lastRunAt.getTime();
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}

/** Verzamelt de DB-/heartbeat-invoer voor de metrics. Elke bron faalt veilig (nooit een 500). */
async function collectInput(now: Date): Promise<MetricsInput> {
  let dbReachable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbReachable = false;
    await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
  }

  let verificationQueue = 0;
  let verificationQueueOldestAgeSeconds: number | null = null;
  let overdueExpiryCredentials = 0;
  let overdueExpirySubscriptions = 0;
  if (dbReachable) {
    try {
      verificationQueue = await prisma.credential.count({ where: { status: "SUBMITTED" } });
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Oudst wachtende SUBMITTED-inzending: zelfde orderering/`waitingSince`-semantiek als de
      // admin-wachtrij (submittedAt leidend, updatedAt-fallback voor legacy-records), zodat de gauge
      // niet kan driften t.o.v. wat de admin op /admin/verificaties ziet. Steunt op de bestaande
      // composite index @@index([status, submittedAt]). Lege wachtrij → null → AGE_NEVER-sentinel.
      const oldest = await prisma.credential.findFirst({
        where: { status: "SUBMITTED" },
        orderBy: [{ submittedAt: { sort: "asc", nulls: "last" } }, { updatedAt: "asc" }],
        select: { submittedAt: true, updatedAt: true },
      });
      if (oldest) {
        const ms = now.getTime() - waitingSince(oldest).getTime();
        verificationQueueOldestAgeSeconds = ms > 0 ? Math.floor(ms / 1000) : 0;
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // VERIFIED-credentials wier vervaldatum al voorbij is: werk dat de expiry-cron had moeten doen
      // (VERIFIED → EXPIRED). Alleen een VERIFIED-credential kan verlopen; een expiresAt in het
      // verleden dat nog niet is omgezet is precies de stille faalmodus die de cron-heartbeat mist.
      overdueExpiryCredentials = await prisma.credential.count({
        where: { status: "VERIFIED", expiresAt: { lt: now } },
      });
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Betaalde ACTIVE-abonnementen wier periode voorbij is: werk dat de subscription-expiry-cron had
      // moeten doen (ACTIVE → CANCELLED → Gratis). Exact dezelfde where-vorm als runSubscriptionExpiryTask
      // (ACTIVE + currentPeriodEnd < nu + plan.priceCents > 0) zodat de gauge de echte cron-backlog telt.
      // Gratis/demo-perpetuele abonnementen (currentPeriodEnd = null) vallen hier automatisch buiten.
      overdueExpirySubscriptions = await prisma.subscription.count({
        where: {
          status: "ACTIVE",
          currentPeriodEnd: { lt: now },
          plan: { priceCents: { gt: 0 } },
        },
      });
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
  }

  // De freshness-lezers vangen hun eigen DB-fouten af en geven dan "never" terug.
  const [cron, backup] = await Promise.all([
    getCronFreshness(undefined, now),
    getBackupFreshness(now),
  ]);

  return {
    dbReachable,
    cronAgeSeconds: ageSeconds(cron, now),
    cronOk: cron.lastOk,
    cronStale: cron.status === "stale",
    backupAgeSeconds: ageSeconds(backup, now),
    backupOk: backup.lastOk,
    backupStale: backup.status === "stale",
    verificationQueue,
    verificationQueueOldestAgeSeconds,
    maintenanceMode: isMaintenanceEnabled(process.env.MAINTENANCE_MODE),
    overdueExpiryCredentials,
    overdueExpirySubscriptions,
  };
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Metrics-endpoint niet geconfigureerd (CRON_SECRET ontbreekt)." },
      { status: 503 },
    );
  }

  if (!authorizeCron(request, secret)) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const now = new Date();
  const metrics = buildMetrics(await collectInput(now));

  const wantsJson = new URL(request.url).searchParams.get("format") === "json";
  if (wantsJson) {
    return NextResponse.json(
      { metrics: metricsToJson(metrics), time: now.toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new NextResponse(renderPrometheus(metrics), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
