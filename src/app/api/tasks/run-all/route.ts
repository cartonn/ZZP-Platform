// Enkelvoudig cron-eindpunt dat alle geplande taken achtereenvolgens uitvoert.
// De host hoeft maar één cron te configureren: POST /api/tasks/run-all met de CRON_SECRET.
// Individuele fouten breken de overige taken niet af; het resultaat bevat per taak de uitkomst.
// POST met Authorization: Bearer <CRON_SECRET> Zonder CRON_SECRET: 503.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { runExpiryTask } from "@/lib/expiry-task";
import { runPaymentReminderTask } from "@/lib/payment-reminders-task";
import { runDbaMonitorTask } from "@/lib/dba-monitor-task";
import { runConceptInvoiceReminderTask } from "@/lib/concept-invoice-reminders-task";
import { runVatReminderTask } from "@/lib/vat-reminder-task";
import { runHoursCriterionReminderTask } from "@/lib/hours-criterion-reminder-task";
import { runJobAlertsTask } from "@/lib/job-alerts-task";
import { runJobEngagementTask } from "@/lib/job-engagement-task";
import { runSubscriptionPastDueTask } from "@/lib/past-due-task";
import { runSubscriptionExpiryTask } from "@/lib/subscription-expiry-task";
import { runSubscriptionReconcileTask } from "@/lib/subscription-reconcile-task";
import { runMonitorTask } from "@/lib/monitoring/monitor-task";
import { runZzpMembershipTask } from "@/lib/zzp-membership-task";
import { runPerformanceGraceTask } from "@/lib/performance-grace-task";
import { runPerformanceApprovalReminderTask } from "@/lib/performance-approval-reminders-task";
import { runDisputeReminderTask } from "@/lib/dispute-reminders-task";
import { runPerformanceSubmissionReminderTask } from "@/lib/performance-submission-reminders-task";
import { runApplicationDecisionReminderTask } from "@/lib/application-decision-reminders-task";
import { runConversationReplyReminderTask } from "@/lib/conversation-reply-reminders-task";
import { runNotificationDigestTask } from "@/lib/notification-digest-task";
import { runReviewsRevealTask } from "@/lib/reviews-reveal-task";
import { runPushDeliveryTask } from "@/lib/push-delivery-task";
import { runAuditRetentionTask } from "@/lib/audit-retention-task";
import { runWebhookEventRetentionTask } from "@/lib/webhook-event-retention-task";
import { runLeadRetentionTask } from "@/lib/lead-retention-task";
import { runHealthIncidentRetentionTask } from "@/lib/health-incident-retention-task";
import { runRoutingCacheRetentionTask } from "@/lib/routing-cache-retention-task";
import { runNotificationRetentionTask } from "@/lib/notification-retention-task";
import { runApplicationRetentionTask } from "@/lib/application-retention-task";
import { runMessageRetentionTask } from "@/lib/message-retention-task";
import { runSupportTicketRetentionTask } from "@/lib/support-retention-task";
import { runMailIntakeRetentionTask } from "@/lib/mail-intake-retention-task";
import { runCredentialEvidenceCleanupTask } from "@/lib/credential-evidence-cleanup-task";
import { runStorageOrphanReconcileTask } from "@/lib/services/storage-orphans";
import { runScheduledTasks, resolveTaskTimeoutMs, type ScheduledTask } from "@/lib/scheduled-tasks";
import { reportBackgroundFailure } from "@/lib/observability/report";
import { recordCronHeartbeat, RUN_ALL_HEARTBEAT } from "@/lib/observability/cron-heartbeat";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Taak-endpoint niet geconfigureerd." }, { status: 503 });
  }

  if (!authorizeCron(request, secret)) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const tasks: ScheduledTask[] = [
    { name: "expiry", fn: () => runExpiryTask({ actorId: null }) },
    { name: "payment-reminders", fn: () => runPaymentReminderTask({ actorId: null }) },
    { name: "dba-monitor", fn: () => runDbaMonitorTask({ actorId: null }) },
    {
      name: "concept-invoice-reminders",
      fn: () => runConceptInvoiceReminderTask({ actorId: null }),
    },
    { name: "vat-reminders", fn: () => runVatReminderTask({ actorId: null }) },
    {
      name: "hours-criterion-reminders",
      fn: () => runHoursCriterionReminderTask({ actorId: null }),
    },
    { name: "job-alerts", fn: () => runJobAlertsTask({ actorId: null }) },
    { name: "job-engagement", fn: () => runJobEngagementTask({ actorId: null }) },
    { name: "subscription-past-due", fn: () => runSubscriptionPastDueTask({ actorId: null }) },
    { name: "subscription-expiry", fn: () => runSubscriptionExpiryTask({ actorId: null }) },
    {
      name: "subscription-reconcile",
      fn: () => runSubscriptionReconcileTask({ actorId: null }),
    },
    { name: "zzp-membership", fn: () => runZzpMembershipTask({}) },
    { name: "performance-grace", fn: () => runPerformanceGraceTask({ actorId: null }) },
    {
      name: "performance-approval-reminders",
      fn: () => runPerformanceApprovalReminderTask({ actorId: null }),
    },
    { name: "dispute-reminders", fn: () => runDisputeReminderTask({ actorId: null }) },
    {
      name: "performance-submission-reminders",
      fn: () => runPerformanceSubmissionReminderTask({ actorId: null }),
    },
    {
      name: "application-decision-reminders",
      fn: () => runApplicationDecisionReminderTask({ actorId: null }),
    },
    {
      name: "conversation-reply-reminders",
      fn: () => runConversationReplyReminderTask({ actorId: null }),
    },
    { name: "reviews-reveal", fn: () => runReviewsRevealTask({ actorId: null }) },
    { name: "push-delivery", fn: () => runPushDeliveryTask({}) },
    { name: "notification-digest", fn: () => runNotificationDigestTask({ actorId: null }) },
    { name: "audit-retention", fn: () => runAuditRetentionTask({ actorId: null }) },
    {
      name: "webhook-event-retention",
      fn: () => runWebhookEventRetentionTask({ actorId: null }),
    },
    { name: "lead-retention", fn: () => runLeadRetentionTask({ actorId: null }) },
    {
      name: "health-incident-retention",
      fn: () => runHealthIncidentRetentionTask({ actorId: null }),
    },
    { name: "routing-cache-retention", fn: () => runRoutingCacheRetentionTask({ actorId: null }) },
    {
      name: "notification-retention",
      fn: () => runNotificationRetentionTask({ actorId: null }),
    },
    {
      name: "application-retention",
      fn: () => runApplicationRetentionTask({ actorId: null }),
    },
    {
      name: "message-retention",
      fn: () => runMessageRetentionTask({ actorId: null }),
    },
    {
      name: "support-retention",
      fn: () => runSupportTicketRetentionTask({ actorId: null }),
    },
    {
      name: "mail-intake-retention",
      fn: () => runMailIntakeRetentionTask({ actorId: null }),
    },
    { name: "credential-evidence-cleanup", fn: () => runCredentialEvidenceCleanupTask() },
    {
      name: "storage-orphan-reconcile",
      fn: () => runStorageOrphanReconcileTask({ actorId: null }),
    },
    { name: "monitor", fn: () => runMonitorTask({}) },
  ];

  // Ruwe foutdetails alleen server-side; de respons krijgt een statische boodschap. Een falende
  // taak escaleert naar de error-reporter (lokaal gestructureerd + Sentry indien geconfigureerd),
  // zodat een fout op de onbewaakte cron niet stil in de logs verdwijnt.
  // Per-taak-deadline: één hangende taak (lock-contentie, trage externe call) mag de overige taken
  // + de heartbeat niet blokkeren. Default aan (royale plafond); TASK_TIMEOUT_MS=0 zet 'm uit.
  const timeoutMs = resolveTaskTimeoutMs(process.env.TASK_TIMEOUT_MS);
  const { ok, results, errors } = await runScheduledTasks(
    tasks,
    (name, e) => {
      void reportBackgroundFailure("cron:run-all", e, { task: name });
    },
    { timeoutMs },
  );

  // Heartbeat: registreer dat de cron draaide (dead-man's-switch op /admin/systeemstatus). Geef de
  // namen van de gefaalde taken mee zodat de systeemstatus wélke runner faalde toont (i.p.v. "grep de
  // logs"). Slikt eigen fouten — mag de cron-respons nooit omverhalen.
  await recordCronHeartbeat(RUN_ALL_HEARTBEAT, ok, Object.keys(errors));

  const hasErrors = Object.keys(errors).length > 0;
  return NextResponse.json({ ok, results, ...(hasErrors ? { errors } : {}) });
}
