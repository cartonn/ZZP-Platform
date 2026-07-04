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
import { runJobAlertsTask } from "@/lib/job-alerts-task";
import { runJobEngagementTask } from "@/lib/job-engagement-task";
import { runSubscriptionPastDueTask } from "@/lib/past-due-task";
import { runSubscriptionExpiryTask } from "@/lib/subscription-expiry-task";
import { runMonitorTask } from "@/lib/monitoring/monitor-task";
import { runZzpMembershipTask } from "@/lib/zzp-membership-task";
import { runPerformanceGraceTask } from "@/lib/performance-grace-task";
import { runPerformanceApprovalReminderTask } from "@/lib/performance-approval-reminders-task";
import { runDisputeReminderTask } from "@/lib/dispute-reminders-task";
import { runPerformanceSubmissionReminderTask } from "@/lib/performance-submission-reminders-task";
import { runNotificationDigestTask } from "@/lib/notification-digest-task";
import { runReviewsRevealTask } from "@/lib/reviews-reveal-task";
import { runPushDeliveryTask } from "@/lib/push-delivery-task";
import { runScheduledTasks, type ScheduledTask } from "@/lib/scheduled-tasks";
import { logger } from "@/lib/observability/logger";
import { describeError } from "@/lib/observability/report";

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
    { name: "job-alerts", fn: () => runJobAlertsTask({ actorId: null }) },
    { name: "job-engagement", fn: () => runJobEngagementTask({ actorId: null }) },
    { name: "subscription-past-due", fn: () => runSubscriptionPastDueTask({ actorId: null }) },
    { name: "subscription-expiry", fn: () => runSubscriptionExpiryTask({ actorId: null }) },
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
    { name: "reviews-reveal", fn: () => runReviewsRevealTask({ actorId: null }) },
    { name: "push-delivery", fn: () => runPushDeliveryTask({}) },
    { name: "notification-digest", fn: () => runNotificationDigestTask({ actorId: null }) },
    { name: "monitor", fn: () => runMonitorTask({}) },
  ];

  // Ruwe foutdetails alleen server-side loggen; de respons krijgt een statische boodschap.
  const { ok, results, errors } = await runScheduledTasks(tasks, (name, e) =>
    logger.error("[run-all] taak mislukt", { task: name, error: describeError(e) }),
  );

  const hasErrors = Object.keys(errors).length > 0;
  return NextResponse.json({ ok, results, ...(hasErrors ? { errors } : {}) });
}
