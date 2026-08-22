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
// zzp_subscriptions_stale_pending (abonnementen die te lang in PENDING hangen — een betaalde checkout
// die de betaal-webhook nooit op ACTIVE/PAST_DUE tilde; stil-kapotte-webhook-detector, geen cron) en
// zzp_invoices_overdue_unflipped (cascade-facturen APPROVED met verstreken vervaldatum die de
// payment-reminders-cron nog niet op OVERDUE zette) en zzp_reviews_overdue_reveal (beoordelingen met een
// verstreken double-blind reveal-venster die de reviews-reveal-cron nog niet publiceerde) en
// zzp_performances_overdue_grace (ingediende prestaties wier grace-venster verstreken is die de
// performance-grace-cron nog niet automatisch goedkeurde — geen factuur, ZZP'er niet uitbetaald) en
// zzp_disputes_overdue_escalation (open disputen boven DISPUTE_ESCALATE_AFTER_DAYS die de
// dispute-reminders-cron nog niet naar admins escaleerde — bevroren cascade blijft bevroren, admins
// worden nooit gepaget, ZZP'er wacht op geld) en zzp_audit_retention_backlog (auditregels ouder
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
// nog niet fysiek verwijderde; altijd actief, geen instelvenster — AVG-dataminimalisatie) en
// zzp_membership_unbilled_active (actieve ZZP'ers in de lopende maand zonder geregistreerde maandbijdrage die
// de zzp-membership-cron nog niet vastlegde — omzetlek, alleen als het lidmaatschap aan staat) — stille-faal-detectors
// die de heartbeat niet vangt — en zzp_mail_delivery_ok / zzp_mail_consecutive_failures /
// zzp_mail_last_failure_age_seconds (mail-aflever-heartbeat: levert het e-mailkanaal nog af, of wijst een
// systematisch afwijzende provider élke notificatie/reset/herinnering stil af — event-gedreven, geen
// staleness-op-leeftijd).
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
import { getMailDeliveryFreshness } from "@/lib/observability/mail-delivery-heartbeat";
import { getPushDeliveryFreshness } from "@/lib/observability/push-delivery-heartbeat";
import { getBillingDeliveryFreshness } from "@/lib/observability/billing-delivery-heartbeat";
import { getStorageDeliveryFreshness } from "@/lib/observability/storage-delivery-heartbeat";
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
import { overdueReviewRevealWhere } from "@/lib/reviews-reveal-task";
import { ZZP_MEMBERSHIP, performanceGraceDays, subscriptionPendingStaleHours } from "@/lib/config";
import {
  pendingStaleCutoff,
  stalePendingSubscriptionWhere,
} from "@/lib/subscription-pending-stale";
import { overdueDowngradeSubscriptionWhere, pastDueDowngradeBacklogCutoff } from "@/lib/past-due";
import { activeMembershipUserIds, monthKey, monthRange } from "@/lib/zzp-membership";
import { membershipPerformanceSelect, membershipPerformanceWhere } from "@/lib/zzp-membership-task";
import { graceCutoff, overduePerformanceGraceWhere } from "@/lib/performance-grace-task";
import {
  disputeEscalationBacklogCutoff,
  disputeEscalationDedupeKey,
} from "@/lib/dispute-reminders";
import { overdueDisputeCollaborationWhere } from "@/lib/dispute-reminders-task";
import { reportError } from "@/lib/observability/report";
import type { CronFreshness } from "@/lib/observability/cron-freshness";
import { withProbeTimeout, ProbeTimeoutError } from "@/lib/observability/probe-timeout";
import {
  mapWithConcurrency,
  resolveMetricsConcurrency,
  resolveMetricsTimeoutMs,
} from "@/lib/observability/metrics-collect";
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
  let stalePendingSubscriptions = 0;
  let overduePastDueDowngrades = 0;
  let overdueUnflippedInvoices = 0;
  let overdueReviewReveals = 0;
  let overduePerformanceGrace = 0;
  let overdueDisputeEscalations = 0;
  let auditRetentionBacklog = 0;
  let applicationsRetentionBacklog = 0;
  let notificationsRetentionBacklog = 0;
  let leadsRetentionBacklog = 0;
  let healthIncidentsIpRetentionBacklog = 0;
  let messagesRetentionBacklog = 0;
  let webhookEventsRetentionBacklog = 0;
  let routingCacheRetentionBacklog = 0;
  let membershipUnbilledActive = 0;
  // true zolang de DB-collectie álle backlog-tellingen binnen de deadline afrondt; false zodra de
  // scrape wordt afgekapt (zie de runner onderaan het dbReachable-blok) — dan houden de nog-niet-
  // afgeronde gauges hun default en signaleert zzp_metrics_collection_complete dat expliciet.
  let metricsCollectionComplete = true;
  if (dbReachable) {
    // Elke collector schrijft z'n eigen `let`-variabele bij afronding en vangt z'n eigen fout af
    // (reportError → verwerpt nooit). Ze lopen bounded-parallel achter een harde deadline (runner
    // onderaan): voorheen liepen deze ~18 tellingen strikt serieel én zonder deadline, waardoor een
    // trage/gelockte DB de scrape liet stapelen en Prisma-connecties liet vasthouden — dezelfde
    // hang-klasse die de health/readiness-probes al met withProbeTimeout afvangen.
    const collectors: Array<() => Promise<void>> = [];
    collectors.push(async () => {
      try {
        verificationQueue = await prisma.credential.count({ where: { status: "SUBMITTED" } });
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
      try {
        // Abonnementen die te lang in PENDING hangen: een betaalde checkout die de betaal-webhook nooit op
        // ACTIVE/PAST_DUE tilde. Anders dan de andere backlogs bewaakt dit GEEN cron maar de webhook zelf —
        // er is geen cron die PENDING verwerkt. Hergebruikt exact `stalePendingSubscriptionWhere` (dezelfde
        // bron van waarheid), met de cutoff uit het geconfigureerde venster. Met de mock-provider bestaat er
        // nooit een PENDING-rij → per definitie 0 (de pilot-default; geen misleidend signaal).
        stalePendingSubscriptions = await prisma.subscription.count({
          where: stalePendingSubscriptionWhere(
            pendingStaleCutoff(subscriptionPendingStaleHours(), now),
          ),
        });
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
      try {
        // PAST_DUE-abonnementen die de downgrade-drempel (PAST_DUE_DOWNGRADE_AFTER_DAYS, 7 dagen)
        // overschreden maar nog niet naar CANCELLED (→ Gratis) zijn gezet: werk dat de subscription-past-due-
        // cron had moeten doen. Sluit het laatste gat in de abonnement-stille-faal-familie (naast
        // overdueExpirySubscriptions/stalePendingSubscriptions). Hergebruikt exact `overdueDowngradeSubscriptionWhere`
        // (dezelfde bron van waarheid, gespiegeld aan planPastDue's downgrade-beslissing). Met de mock-provider
        // bestaat er nooit een PAST_DUE-rij → per definitie 0 (de pilot-default; geen misleidend signaal).
        overduePastDueDowngrades = await prisma.subscription.count({
          where: overdueDowngradeSubscriptionWhere(pastDueDowngradeBacklogCutoff(now)),
        });
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
      try {
        // Beoordelingen wier double-blind reveal-venster verstreken is (PENDING_REVEAL + revealDeadline < nu):
        // werk dat de reviews-reveal-cron had moeten doen (PENDING_REVEAL → PUBLISHED). Hergebruikt exact
        // `overdueReviewRevealWhere(now)` (dezelfde bron van waarheid als de taak zelf) zodat de gauge de echte
        // cron-backlog telt en niet kan driften. Een kleine, tijdelijke achterstand (tot één cron-interval) is
        // normaal; aanhoudend/oplopend betekent dat afgeronde beoordelingen ná venstersluiting verborgen blijven.
        overdueReviewReveals = await prisma.review.count({ where: overdueReviewRevealWhere(now) });
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
      try {
        // Ingediende prestaties (SUBMITTED) wier grace-venster verstreken is: werk dat de performance-grace-
        // cron had moeten doen (auto-goedkeuring SUBMITTED → APPROVED, wat de factuur-cascade start).
        // Hergebruikt exact `overduePerformanceGraceWhere(graceCutoff(now, days))` (dezelfde bron van waarheid
        // als de taak zelf, incl. de niet-geannuleerd/niet-betwist-guard) zodat de gauge de echte cron-backlog
        // telt en niet kan driften. Staat het grace-venster UIT (days <= 0, de pilot-default), dan is er per
        // definitie geen auto-goedkeuring en dus geen achterstand → 0, geen misleidend signaal.
        const days = performanceGraceDays();
        if (days > 0) {
          overduePerformanceGrace = await prisma.performance.count({
            where: overduePerformanceGraceWhere(graceCutoff(now, days)),
          });
        }
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
      try {
        // Open disputen wier leeftijd de dispute-escalatie-drempel (DISPUTE_ESCALATE_AFTER_DAYS, 7 dagen)
        // overschreed maar die de dispute-reminders-cron nog niet naar admins escaleerde: werk dat die
        // cron had moeten doen (`planDisputeReminders` vuurt bij `d > DISPUTE_ESCALATE_AFTER_DAYS` een
        // DISPUTE_ESCALATION-event, met dedupeKey `dispute-escalation-<collabId>`). Hergebruikt exact
        // `overdueDisputeCollaborationWhere(disputeEscalationBacklogCutoff(now))` als bron van waarheid,
        // en trekt vervolgens de reeds-geëscaleerden af via de DomainEvent-dedupeKey (identieke sleutel
        // die de runner gebruikt) — zo telt de gauge alleen collabs die nog GEEN escalatie kregen. De
        // IN-lijst is per definitie klein (open disputen zijn zeldzaam), dus een enkele round-trip.
        const cutoff = disputeEscalationBacklogCutoff(now);
        // unbounded-allow: een backlog-gauge moet ELKE openstaande escalatie tellen; een `take` zou de
        // stille-faal-telling onderschatten (vals-negatief). De where is scherp begrensd (open disputen
        // voorbij de drempel — een zeldzame, kleine set), dus geen praktisch geheugelrisico.
        const candidates = await prisma.collaboration.findMany({
          where: overdueDisputeCollaborationWhere(cutoff),
          select: { id: true },
        });
        if (candidates.length > 0) {
          const keys = candidates.map((c) => disputeEscalationDedupeKey(c.id));
          // unbounded-allow: de IN-lijst is `keys` (afgeleid van `candidates` hierboven — dezelfde
          // begrensde set), dus deze lezing is intrinsiek gebonden aan de al-begrensde backlog.
          const escalated = await prisma.domainEvent.findMany({
            where: { dedupeKey: { in: keys } },
            select: { dedupeKey: true },
          });
          overdueDisputeEscalations = Math.max(0, candidates.length - escalated.length);
        }
      } catch (error) {
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      }
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    collectors.push(async () => {
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
    });
    if (ZZP_MEMBERSHIP.enabled) {
      collectors.push(async () => {
        try {
          // Actieve ZZP'ers in de LOPENDE maand (≥1 goedgekeurde prestatie die op deze maand valt) zonder
          // ZzpMembershipCharge voor die maand: werk dat de zzp-membership-cron had moeten registreren (de
          // kern-ZZP-monetisatie). Hergebruikt exact `membershipPerformanceWhere` + `activeMembershipUserIds`
          // (dezelfde bron van waarheid, incl. de periode-begin-leidende maand-toewijzing) als de taak zelf,
          // zodat de gauge de echte cron-backlog telt en niet kan driften. Alleen berekend als het
          // lidmaatschap AAN staat (anders per definitie 0 — de pilot-default; geen query, geen misleidend
          // signaal). Een ZZP'er die vandaag actief wordt is "unbilled" tot de volgende dagelijkse run.
          const period = monthKey(now);
          const { start, end } = monthRange(now);
          // unbounded-allow: exact dezelfde lezing als de zzp-membership-taak zelf (één maand goedgekeurde
          // prestaties), begrensd tot de lopende maand en alleen actief als het lidmaatschap AAN staat (default
          // uit); een `take` zou de actieve-ZZP'ers-telling ondertellen → vals-negatieve omzet-gauge.
          const performances = await prisma.performance.findMany({
            where: membershipPerformanceWhere(start, end),
            select: membershipPerformanceSelect,
          });
          const activeUserIds = activeMembershipUserIds(performances, period);
          if (activeUserIds.size > 0) {
            const billed = await prisma.zzpMembershipCharge.count({
              where: { period, userId: { in: [...activeUserIds] } },
            });
            membershipUnbilledActive = Math.max(0, activeUserIds.size - billed);
          }
        } catch (error) {
          await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
        }
      });
    }
    // Bounded-parallelle collectie achter een harde deadline. De concurrency is begrensd (default 4)
    // zodat de scrape de Prisma-pool niet monopoliseert en echt gebruikersverkeer niet verdringt.
    // Overschrijdt de collectie de deadline, dan verwerpt withProbeTimeout met een ProbeTimeoutError:
    // de reeds afgeronde tellingen blijven staan (elke collector schrijft z'n `let` bij afronding), de
    // rest houdt zijn default, en metricsCollectionComplete gaat op false zodat een monitor de
    // vals-lage nullen niet als gezond leest. De collectors verwerpen zelf nooit (elk vangt z'n eigen
    // fout af), dus alleen de deadline kan de race verwerpen; een niet-deadline-fout propageert bewust.
    try {
      await withProbeTimeout(
        "metrics-collect",
        resolveMetricsTimeoutMs(process.env.METRICS_COLLECT_TIMEOUT_MS),
        () =>
          mapWithConcurrency(
            collectors,
            resolveMetricsConcurrency(process.env.METRICS_COLLECT_CONCURRENCY),
            (collector) => collector(),
          ),
      );
    } catch (error) {
      if (error instanceof ProbeTimeoutError) {
        metricsCollectionComplete = false;
        await reportError(error, { source: "metrics", requestPath: "/api/metrics" });
      } else {
        throw error;
      }
    }
  }

  // De freshness-lezers vangen hun eigen DB-fouten af en geven dan "never" terug.
  const [cron, backup, mail, push, storage, billing] = await Promise.all([
    getCronFreshness(undefined, now),
    getBackupFreshness(now),
    getMailDeliveryFreshness(now),
    getPushDeliveryFreshness(now),
    getStorageDeliveryFreshness(now),
    getBillingDeliveryFreshness(now),
  ]);

  return {
    dbReachable,
    metricsCollectionComplete,
    cronAgeSeconds: ageSeconds(cron, now),
    cronOk: cron.lastOk,
    cronStale: cron.status === "stale",
    cronFailedTasks: cron.failedTasks,
    backupAgeSeconds: ageSeconds(backup, now),
    backupOk: backup.lastOk,
    backupStale: backup.status === "stale",
    mailDeliveryOk: mail.status !== "failing",
    mailDeliveryConsecutiveFailures: mail.consecutiveFailures,
    mailDeliveryLastFailureAgeSeconds: mail.failureAgeSeconds,
    pushDeliveryOk: push.status !== "failing",
    pushDeliveryConsecutiveFailures: push.consecutiveFailures,
    pushDeliveryLastFailureAgeSeconds: push.failureAgeSeconds,
    storageDeliveryOk: storage.status !== "failing",
    storageDeliveryConsecutiveFailures: storage.consecutiveFailures,
    storageDeliveryLastFailureAgeSeconds: storage.failureAgeSeconds,
    billingDeliveryOk: billing.status !== "failing",
    billingDeliveryConsecutiveFailures: billing.consecutiveFailures,
    billingDeliveryLastFailureAgeSeconds: billing.failureAgeSeconds,
    verificationQueue,
    verificationQueueOldestAgeSeconds,
    maintenanceMode: isMaintenanceEnabled(process.env.MAINTENANCE_MODE),
    overdueExpiryCredentials,
    overdueExpirySubscriptions,
    stalePendingSubscriptions,
    overduePastDueDowngrades,
    overdueUnflippedInvoices,
    overdueReviewReveals,
    overduePerformanceGrace,
    overdueDisputeEscalations,
    auditRetentionBacklog,
    applicationsRetentionBacklog,
    notificationsRetentionBacklog,
    leadsRetentionBacklog,
    healthIncidentsIpRetentionBacklog,
    messagesRetentionBacklog,
    webhookEventsRetentionBacklog,
    routingCacheRetentionBacklog,
    membershipUnbilledActive,
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
