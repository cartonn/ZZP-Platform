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
import { PageHeader } from "@/components/ui/page-header";
import { SystemStatusPanel } from "@/components/admin/system-status-panel";
import { CronHeartbeatCard } from "@/components/admin/cron-heartbeat-card";
import { BackupHeartbeatCard } from "@/components/admin/backup-heartbeat-card";
import { MailDeliveryHeartbeatCard } from "@/components/admin/mail-delivery-heartbeat-card";
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
