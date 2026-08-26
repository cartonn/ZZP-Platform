import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { readEnv } from "@/lib/env";
import { detectDbProvider } from "@/lib/services/db-selftest";
import { evaluateReadiness } from "@/lib/observability/readiness";
import { collectSystemStatus } from "@/lib/system-status";
import { getCronFreshness } from "@/lib/observability/cron-heartbeat";
import { getBackupFreshness } from "@/lib/observability/backup-heartbeat";
import { getMailDeliveryFreshness } from "@/lib/observability/mail-delivery-heartbeat";
import { getPushDeliveryFreshness } from "@/lib/observability/push-delivery-heartbeat";
import { getStorageDeliveryFreshness } from "@/lib/observability/storage-delivery-heartbeat";
import { getBillingDeliveryFreshness } from "@/lib/observability/billing-delivery-heartbeat";
import { getWebhookAuthFreshness } from "@/lib/observability/billing-webhook-auth-heartbeat";
import { getVerificationDeliveryOverview } from "@/lib/observability/verification-delivery-heartbeat";
import { getRateLimitDeliveryFreshness } from "@/lib/observability/ratelimit-delivery-heartbeat";
import { getPasswordBreachDeliveryFreshness } from "@/lib/observability/password-breach-delivery-heartbeat";
import { getErrorMonitoringDeliveryFreshness } from "@/lib/observability/error-monitoring-delivery-heartbeat";
import { PageHeader } from "@/components/ui/page-header";
import { SystemStatusPanel } from "@/components/admin/system-status-panel";
import { CronHeartbeatCard } from "@/components/admin/cron-heartbeat-card";
import { BackupHeartbeatCard } from "@/components/admin/backup-heartbeat-card";
import { MailDeliveryHeartbeatCard } from "@/components/admin/mail-delivery-heartbeat-card";
import { PushDeliveryHeartbeatCard } from "@/components/admin/push-delivery-heartbeat-card";
import { StorageDeliveryHeartbeatCard } from "@/components/admin/storage-delivery-heartbeat-card";
import { BillingDeliveryHeartbeatCard } from "@/components/admin/billing-delivery-heartbeat-card";
import { BillingWebhookAuthCard } from "@/components/admin/billing-webhook-auth-card";
import { VerificationDeliveryHeartbeatCard } from "@/components/admin/verification-delivery-heartbeat-card";
import { RateLimitDeliveryHeartbeatCard } from "@/components/admin/ratelimit-delivery-heartbeat-card";
import { PasswordBreachDeliveryHeartbeatCard } from "@/components/admin/password-breach-delivery-heartbeat-card";
import { ErrorMonitoringDeliveryHeartbeatCard } from "@/components/admin/error-monitoring-delivery-heartbeat-card";
import { SelfTestSweep } from "@/components/admin/selftest-sweep";
import { DbSelfTest } from "@/components/admin/db-selftest";
import { StorageSelfTest } from "@/components/admin/storage-selftest";
import { MailSelfTest } from "@/components/admin/mail-selftest";
import { RateLimitSelfTest } from "@/components/admin/ratelimit-selftest";
import { VerifierSelfTest } from "@/components/admin/verifier-selftest";
import { BillingSelfTest } from "@/components/admin/billing-selftest";
import { RoutingSelfTest } from "@/components/admin/routing-selftest";
import { UploadScannerSelfTest } from "@/components/admin/upload-scanner-selftest";
import { PasswordBreachSelfTest } from "@/components/admin/password-breach-selftest";
import { SemanticMatcherSelfTest } from "@/components/admin/semantic-matcher-selftest";
import { ErrorMonitoringSelfTest } from "@/components/admin/error-monitoring-selftest";

export const metadata: Metadata = { title: "Systeemstatus · Handslag" };

// Nooit cachen: de posture moet de actuele deploy-configuratie en live databank-staat weerspiegelen.
export const dynamic = "force-dynamic";

/**
 * Systeemstatus (ADMIN-only): de productie-configuratie-posture op één scherm — welke integraties/
 * drivers actief zijn, welke op een veilige fallback draaien en welke aandacht vragen vóór livegang,
 * plus de live databank-bereikbaarheid. Beantwoordt de RUNBOOK-vraag "is productie correct bekabeld?".
 * De env-lezing bevat geen sleutelwaarden (alleen driver-modi en aan/uit).
 */
export default async function SysteemstatusPage() {
  await requireRole("ADMIN");

  const env = readEnv();
  const status = collectSystemStatus(env);
  const readiness = await evaluateReadiness({
    dbPing: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    schemaProbe: () => prisma.user.count(),
  });
  const cronFreshness = await getCronFreshness();
  const backupFreshness = await getBackupFreshness();
  const mailDeliveryFreshness = await getMailDeliveryFreshness();
  const pushDeliveryFreshness = await getPushDeliveryFreshness();
  const storageDeliveryFreshness = await getStorageDeliveryFreshness();
  const billingDeliveryFreshness = await getBillingDeliveryFreshness();
  const webhookAuthFreshness = await getWebhookAuthFreshness();
  const verificationDeliveryOverview = await getVerificationDeliveryOverview();
  const rateLimitDeliveryFreshness = await getRateLimitDeliveryFreshness();
  const passwordBreachDeliveryFreshness = await getPasswordBreachDeliveryFreshness();
  const errorMonitoringDeliveryFreshness = await getErrorMonitoringDeliveryFreshness();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De controlekamer · systeemstatus"
        title="Systeemstatus"
        description="Productie-configuratie en integraties op één scherm. Controleer na een deploy of alles correct bekabeld is vóór livegang."
      />
      <SystemStatusPanel status={status} dbReachable={readiness.ready} />
      <CronHeartbeatCard freshness={cronFreshness} />
      <BackupHeartbeatCard freshness={backupFreshness} />
      <MailDeliveryHeartbeatCard freshness={mailDeliveryFreshness} />
      <PushDeliveryHeartbeatCard freshness={pushDeliveryFreshness} />
      <StorageDeliveryHeartbeatCard freshness={storageDeliveryFreshness} />
      <BillingDeliveryHeartbeatCard freshness={billingDeliveryFreshness} />
      <BillingWebhookAuthCard freshness={webhookAuthFreshness} />
      <VerificationDeliveryHeartbeatCard overview={verificationDeliveryOverview} />
      <RateLimitDeliveryHeartbeatCard freshness={rateLimitDeliveryFreshness} />
      <PasswordBreachDeliveryHeartbeatCard freshness={passwordBreachDeliveryFreshness} />
      <ErrorMonitoringDeliveryHeartbeatCard freshness={errorMonitoringDeliveryFreshness} />
      <SelfTestSweep />
      <DbSelfTest provider={detectDbProvider(process.env.DATABASE_URL)} />
      <StorageSelfTest driverMode={env.STORAGE_DRIVER} />
      <MailSelfTest driverMode={env.EMAIL_DRIVER} />
      <RateLimitSelfTest storeMode={env.RATE_LIMIT_STORE} />
      <VerifierSelfTest />
      <BillingSelfTest providerMode={env.BILLING_PROVIDER} />
      <RoutingSelfTest providerMode={env.ROUTING_PROVIDER} />
      <UploadScannerSelfTest driverMode={env.UPLOAD_SCANNER} />
      <PasswordBreachSelfTest configured={env.PASSWORD_BREACH_CHECK === "hibp"} />
      <SemanticMatcherSelfTest driverMode={env.SEMANTIC_MATCHER} />
      <ErrorMonitoringSelfTest configured={Boolean(env.SENTRY_DSN)} />
    </div>
  );
}
