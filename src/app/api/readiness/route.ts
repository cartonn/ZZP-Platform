import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateReadiness } from "@/lib/observability/readiness";
import { isDraining } from "@/lib/observability/shutdown";
import { withProbeTimeout, resolveProbeTimeoutMs } from "@/lib/observability/probe-timeout";

// Readiness mag nooit gecachet worden: het moet de actuele staat reflecteren.
export const dynamic = "force-dynamic";

const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? "dev";

export async function GET() {
  const draining = isDraining();
  // Harde deadline om beide DB-probes: een hangende (niet foutende) DB — pool-uitputting,
  // lock-contentie, netwerk-partitie met open socket — mag de readiness-probe niet oneindig laten
  // hangen. Een verlopen probe telt als gefaald (not ready), nooit als vals groen.
  const timeoutMs = resolveProbeTimeoutMs(process.env.HEALTH_PROBE_TIMEOUT_MS);
  const report = await evaluateReadiness({
    dbPing: () =>
      withProbeTimeout("readiness-db", timeoutMs, async () => {
        await prisma.$queryRaw`SELECT 1`;
      }),
    schemaProbe: () => withProbeTimeout("readiness-schema", timeoutMs, () => prisma.user.count()),
    draining,
  });

  return NextResponse.json(
    {
      ...report,
      draining,
      commit: commitSha.slice(0, 7),
      time: new Date().toISOString(),
    },
    { status: report.ready ? 200 : 503 },
  );
}
