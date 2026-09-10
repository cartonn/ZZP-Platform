import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateReadiness, type ReadinessCheck } from "@/lib/observability/readiness";
import { isDraining } from "@/lib/observability/shutdown";
import { withProbeTimeout, resolveProbeTimeoutMs } from "@/lib/observability/probe-timeout";
import { coalesceProbe } from "@/lib/observability/probe-coalesce";

// Readiness mag nooit gecachet worden: het moet de actuele staat reflecteren.
export const dynamic = "force-dynamic";

const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? "dev";

export async function GET() {
  // Harde deadline om beide DB-probes: een hangende (niet foutende) DB — pool-uitputting,
  // lock-contentie, netwerk-partitie met open socket — mag de readiness-probe niet oneindig laten
  // hangen. Een verlopen probe telt als gefaald (not ready), nooit als vals groen.
  const timeoutMs = resolveProbeTimeoutMs(process.env.HEALTH_PROBE_TIMEOUT_MS);

  // Single-flight om de DB-gebonden checks (database + schema): een ongeauthenticeerde burst tegen dit
  // publieke endpoint mag niet N gelijktijdige checkouts uit de begrensde Prisma-pool trekken. De
  // `draining`-check blijft BEWUST buiten de coalescing — die is per-request en goedkoop, en een
  // request tijdens het afsluiten moet altijd de verse drain-staat zien (niet die van een eerder
  // gestarte, gedeelde probe). Daarom evalueren we hier zonder `draining` en voegen we de
  // shutdown-check daarna per request toe.
  const dbReport = await coalesceProbe("readiness", () =>
    evaluateReadiness({
      dbPing: () =>
        withProbeTimeout("readiness-db", timeoutMs, async () => {
          await prisma.$queryRaw`SELECT 1`;
        }),
      schemaProbe: () => withProbeTimeout("readiness-schema", timeoutMs, () => prisma.user.count()),
    }),
  );

  const draining = isDraining();
  const shutdownCheck: ReadinessCheck = draining
    ? { name: "shutdown", ok: false, detail: "draining" }
    : { name: "shutdown", ok: true };
  const checks = [...dbReport.checks, shutdownCheck];
  const ready = checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ready,
      checks,
      draining,
      commit: commitSha.slice(0, 7),
      time: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
