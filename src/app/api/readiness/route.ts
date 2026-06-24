import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateReadiness } from "@/lib/observability/readiness";

// Readiness mag nooit gecachet worden: het moet de actuele staat reflecteren.
export const dynamic = "force-dynamic";

const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? "dev";

export async function GET() {
  const report = await evaluateReadiness({
    dbPing: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    schemaProbe: () => prisma.user.count(),
  });

  return NextResponse.json(
    {
      ...report,
      commit: commitSha.slice(0, 7),
      time: new Date().toISOString(),
    },
    { status: report.ready ? 200 : 503 },
  );
}
