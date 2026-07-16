import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { readEnv } from "@/lib/env";
import { evaluateReadiness } from "@/lib/observability/readiness";
import { collectSystemStatus } from "@/lib/system-status";
import { PageHeader } from "@/components/ui/page-header";
import { SystemStatusPanel } from "@/components/admin/system-status-panel";
import { StorageSelfTest } from "@/components/admin/storage-selftest";
import { MailSelfTest } from "@/components/admin/mail-selftest";
import { RateLimitSelfTest } from "@/components/admin/ratelimit-selftest";
import { VerifierSelfTest } from "@/components/admin/verifier-selftest";
import { BillingSelfTest } from "@/components/admin/billing-selftest";

export const metadata: Metadata = { title: "Systeemstatus · ZZP Platform" };

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Systeemstatus"
        description="Productie-configuratie en integraties op één scherm. Controleer na een deploy of alles correct bekabeld is vóór livegang."
      />
      <SystemStatusPanel status={status} dbReachable={readiness.ready} />
      <StorageSelfTest driverMode={env.STORAGE_DRIVER} />
      <MailSelfTest driverMode={env.EMAIL_DRIVER} />
      <RateLimitSelfTest storeMode={env.RATE_LIMIT_STORE} />
      <VerifierSelfTest />
      <BillingSelfTest providerMode={env.BILLING_PROVIDER} />
    </div>
  );
}
