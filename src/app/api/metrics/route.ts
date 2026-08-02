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
// periode voorbij is maar die de subscription-expiry-cron nog niet op CANCELLED zette) en
// zzp_invoices_overdue_unflipped (cascade-facturen APPROVED met verstreken vervaldatum die de
// payment-reminders-cron nog niet op OVERDUE zette) en zzp_audit_retention_backlog (auditregels ouder
// dan AUDIT_LOG_RETENTION_DAYS die de audit-retention-cron nog niet snoeide — AVG-dataminimalisatie) en
// zzp_applications_retention_backlog (terminale reacties met vrije-tekst-PII ouder dan
// APPLICATION_RETENTION_DAYS die de application-retention-cron nog niet snoeide — AVG-dataminimalisatie) en
// zzp_notifications_retention_backlog (notificaties met title/body-PII ouder dan NOTIFICATION_RETENTION_DAYS
// die de notification-retention-cron nog niet snoeide) en zzp_leads_retention_backlog (beslíste leads met
// contact-PII ouder dan LEAD_RETENTION_DAYS die de lead-retention-cron nog niet snoeide — AVG-dataminimalisatie) en
// zzp_health_incidents_ip_retention_backlog (beveiligingsincidenten ouder dan HEALTH_INCIDENT_IP_RETENTION_DAYS wier
// bron-IP de health-incident-retention-cron nog niet redigeerde — AVG-minimalisatie/opslagbeperking) en
// zzp_webhook_events_retention_backlog (webhook-ledgerrijen ouder dan WEBHOOK_EVENT_RETENTION_DAYS die de
// webhook-event-retention-cron nog niet snoeide — GEEN PII: opslag-hygiëne/availability, de ledger groeit
// anders onbeperkt door) en zzp_routing_cache_retention_backlog (routing-cacherijen — GeocodeCache +
// TravelRouteCache, platte-tekst locatie-PII — wier eigen TTL is verstreken die de routing-cache-retention-cron
// nog niet fysiek verwijderde; altijd actief, geen instelvenster — AVG-dataminimalisatie) — stille-faal-detectors
// die de heartbeat niet vangt.
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
import {
  auditLogRetentionDays,
  applicationRetentionDays,
  notificationRetentionDays,
  leadRetentionDays,
  healthIncidentIpRetentionDays,
  messageRetentionDays,
  webhookEventRetentionDays,
} from "@/lib/config";
import { auditRetentionCutoff } from "@/lib/audit-retention";
import { applicationRetentionCutoff } from "@/lib/application-retention";
import { prunableApplicationWhere } from "@/lib/application-retention-task";
import { notificationRetentionCutoff } from "@/lib/notification-retention";
import { leadRetentionCutoff } from "@/lib/lead-retention";
import { prunableLeadWhere } from "@/lib/lead-retention-task";
import { healthIncidentIpRetentionCutoff } from "@/lib/health-incident-retention";
import { prunableHealthIncidentIpWhere } from "@/lib/health-incident-retention-task";
import { messageRetentionCutoff } from "@/lib/message-retention";
import { prunableMessageWhere } from "@/lib/message-retention-task";
import { webhookEventRetentionCutoff } from "@/lib/webhook-event-retention";
import { prunableWebhookEventWhere } from "@/lib/webhook-event-retention-task";
import { prunableRoutingCacheWhere } from "@/lib/routing-cache-retention-task";
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
  let overdueUnflippedInvoices = 0;
  let auditRetentionBacklog = 0;
  let applicationsRetentionBacklog = 0;
  let notificationsRetentionBacklog = 0;
  let leadsRetentionBacklog = 0;
  let healthIncidentsIpRetentionBacklog = 0;
  let messagesRetentionBacklog = 0;
  let webhookEventsRetentionBacklog = 0;
  let routingCacheRetentionBacklog = 0;
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
    try {
      // Cascade-facturen die APPROVED zijn met een verstreken vervaldatum: werk dat de payment-reminders-
      // cron had moeten doen (APPROVED → OVERDUE). Spiegelt exact de flip-predicaat van
      // `planPaymentReminders.toMarkOverdue` (lifecycleStatus === "APPROVED" && dueAt < nu) zodat de gauge
      // de echte cron-backlog telt en niet kan driften. Facturen zonder dueAt (concept) vallen buiten.
      overdueUnflippedInvoices = await prisma.invoice.count({
        where: { lifecycleStatus: "APPROVED", dueAt: { lt: now } },
      });
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Auditregels ouder dan het geconfigureerde AUDIT_LOG_RETENTION_DAYS-venster: werk dat de
      // audit-retention-cron had moeten doen (snoeien vóór de cutoff). Zelfde bron van waarheid als de
      // taak zelf (`auditRetentionCutoff(auditLogRetentionDays(), now)`) zodat de gauge de echte
      // cron-backlog telt en niet kan driften. Staat retentie UIT (cutoff === null, de pilot-default),
      // dan is er per definitie geen achterstand → 0, geen misleidend signaal.
      const cutoff = auditRetentionCutoff(auditLogRetentionDays(), now);
      if (cutoff) {
        auditRetentionBacklog = await prisma.auditLog.count({
          where: { createdAt: { lt: cutoff } },
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Terminale reacties (REJECTED/WITHDRAWN, zónder samenwerking) ouder dan het geconfigureerde
      // APPLICATION_RETENTION_DAYS-venster: werk dat de application-retention-cron had moeten doen. Hergebruikt
      // exact `prunableApplicationWhere` (dezelfde bron van waarheid, incl. de cascade-veilige
      // `collaboration: { is: null }`-guard) als de taak zelf, zodat de gauge de echte cron-backlog telt en
      // niet kan driften. Een Application-rij draagt vrije-tekst-PII in motivation/note; staat retentie UIT
      // (cutoff === null, de pilot-default), dan is er per definitie geen achterstand → 0.
      const cutoff = applicationRetentionCutoff(applicationRetentionDays(), now);
      if (cutoff) {
        applicationsRetentionBacklog = await prisma.application.count({
          where: prunableApplicationWhere(cutoff),
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Notificaties ouder dan het geconfigureerde NOTIFICATION_RETENTION_DAYS-venster: werk dat de
      // notification-retention-cron had moeten doen (wissen op `createdAt < cutoff`, ongeacht status).
      // Zelfde bron van waarheid als de taak zelf (`notificationRetentionCutoff(notificationRetentionDays(),
      // now)` + dezelfde where-vorm) zodat de gauge de echte cron-backlog telt en niet kan driften. Een
      // Notification-rij draagt PII in title/body; staat retentie UIT (cutoff === null, de pilot-default),
      // dan is er per definitie geen achterstand → 0.
      const cutoff = notificationRetentionCutoff(notificationRetentionDays(), now);
      if (cutoff) {
        notificationsRetentionBacklog = await prisma.notification.count({
          where: { createdAt: { lt: cutoff } },
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Beslíste leads (KLANT/NO_DEAL) ouder dan het geconfigureerde LEAD_RETENTION_DAYS-venster: werk dat de
      // lead-retention-cron had moeten doen. Hergebruikt exact `prunableLeadWhere` (dezelfde bron van waarheid,
      // incl. de eligibiliteits-invariant) als de taak zelf, zodat de gauge de echte cron-backlog telt en niet
      // kan driften. Een Lead draagt contact-PII (cascade-gekoppeld LeadContact-logboek); staat retentie UIT
      // (cutoff === null, de pilot-default), dan is er per definitie geen achterstand → 0.
      const cutoff = leadRetentionCutoff(leadRetentionDays(), now);
      if (cutoff) {
        leadsRetentionBacklog = await prisma.lead.count({
          where: prunableLeadWhere(cutoff),
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Beveiligingsincidenten (HealthIncident) ouder dan het HEALTH_INCIDENT_IP_RETENTION_DAYS-venster
      // wier bron-IP nog niet geredigeerd is: werk dat de health-incident-retention-cron had moeten doen.
      // Hergebruikt exact `prunableHealthIncidentIpWhere` (dezelfde bron van waarheid, incl. de sentinel-
      // sluitingen) als de taak zelf, zodat de gauge de echte cron-backlog telt en niet kan driften. Anders
      // dan de andere retentie-crons staat deze standaard AAN (venster leeg → default 90 dagen); alleen als
      // 'ie expliciet op 0/uit gezet is (cutoff === null) is er per definitie geen achterstand → 0.
      const cutoff = healthIncidentIpRetentionCutoff(healthIncidentIpRetentionDays(), now);
      if (cutoff) {
        healthIncidentsIpRetentionBacklog = await prisma.healthIncident.count({
          where: prunableHealthIncidentIpWhere(cutoff),
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Berichten (Message, chatinhoud in body) ouder dan het MESSAGE_RETENTION_DAYS-venster die de
      // message-retention-cron nog niet snoeide: werk dat die cron had moeten doen. Hergebruikt exact
      // `prunableMessageWhere` (dezelfde bron van waarheid, incl. de lopende-samenwerking-guard) als de
      // taak zelf, zodat de gauge de echte cron-backlog telt en niet kan driften. Staat retentie uit
      // (cutoff === null — de pilot-default), dan is er per definitie geen achterstand → 0.
      const cutoff = messageRetentionCutoff(messageRetentionDays(), now);
      if (cutoff) {
        messagesRetentionBacklog = await prisma.message.count({
          where: prunableMessageWhere(cutoff),
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Webhook-ledgerrijen (ProcessedWebhookEvent) ouder dan het WEBHOOK_EVENT_RETENTION_DAYS-venster die
      // de webhook-event-retention-cron nog niet snoeide: werk dat die cron had moeten doen. Hergebruikt
      // exact `prunableWebhookEventWhere` (dezelfde bron van waarheid als de taak zelf) zodat de gauge de
      // echte cron-backlog telt en niet kan driften. Anders dan de andere retentie-backlogs is dit GEEN
      // AVG-kwestie (de ledger draagt geen PII — alleen een opaque providerreferentie + status) maar
      // opslag-hygiëne: staat retentie uit (cutoff === null — de pilot-default), dan is er per definitie
      // geen achterstand → 0.
      const cutoff = webhookEventRetentionCutoff(webhookEventRetentionDays(), now);
      if (cutoff) {
        webhookEventsRetentionBacklog = await prisma.processedWebhookEvent.count({
          where: prunableWebhookEventWhere(cutoff),
        });
      }
    } catch (error) {
      await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
    }
    try {
      // Routing-cacherijen (GeocodeCache + TravelRouteCache, platte-tekst locatie-PII) wier eigen TTL
      // (expiresAt) is verstreken die de routing-cache-retention-cron nog niet fysiek verwijderde: werk
      // dat die cron had moeten doen. Hergebruikt exact `prunableRoutingCacheWhere` (dezelfde bron van
      // waarheid als de taak zelf) zodat de gauge de echte cron-backlog telt en niet kan driften. Anders
      // dan de config-gevensterde retenties is er hier GEEN instelvenster: de TTL zit per rij ingebakken,
      // dus de cutoff is simpelweg `now` en de gauge is nooit `0`-per-definitie. Beide tabellen delen het
      // `expiresAt`-veld → één where-vorm dekt beide.
      const where = prunableRoutingCacheWhere(now);
      const [geocode, route] = await Promise.all([
        prisma.geocodeCache.count({ where }),
        prisma.travelRouteCache.count({ where }),
      ]);
      routingCacheRetentionBacklog = geocode + route;
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
    overdueUnflippedInvoices,
    auditRetentionBacklog,
    applicationsRetentionBacklog,
    notificationsRetentionBacklog,
    leadsRetentionBacklog,
    healthIncidentsIpRetentionBacklog,
    messagesRetentionBacklog,
    webhookEventsRetentionBacklog,
    routingCacheRetentionBacklog,
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
