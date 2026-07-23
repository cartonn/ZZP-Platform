// Operationeel-monitoring-endpoint: GET /api/metrics geeft machine-leesbare operationele metrics
// terug (Prometheus-tekst standaard, of JSON via ?format=json) zodat een externe monitor
// (Prometheus-scraper / uptime-dienst) op de dead-man's-switch-signalen kan alarmeren ZONDER dat een
// mens op /admin/systeemstatus hoeft in te loggen. Vult het gat tussen /api/health (alleen liveness)
// en het admin-UI-scherm.
//
// Beveiliging: dezelfde Bearer CRON_SECRET als de taak-/heartbeat-routes, fail-closed — geen
// CRON_SECRET → 503, verkeerd token → 401. De uitvoer bevat NOOIT persoonsgegevens of secrets, alleen
// geaggregeerde gauges (tellingen, leeftijden, gezondheidsvlaggen). Nooit gecachet.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeCron } from "@/lib/cron-auth";
import { getCronFreshness } from "@/lib/observability/cron-heartbeat";
import { getBackupFreshness } from "@/lib/observability/backup-heartbeat";
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
  if (dbReachable) {
    try {
      verificationQueue = await prisma.credential.count({ where: { status: "SUBMITTED" } });
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
