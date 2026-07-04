import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildHealthPayload, healthHttpStatus } from "@/lib/observability/health";
import { reportError } from "@/lib/observability/report";

// Liveness-probe mag NOOIT gecachet worden: hij moet de actuele staat reflecteren (los van de
// statische build-optimalisatie van Next.js). Zelfde afspraak als /api/readiness.
export const dynamic = "force-dynamic";

const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? "dev";

export async function GET() {
  let db = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    db = false;
    // De DB-storing zichtbaar maken in de monitoring (Sentry-ready via de reporter); slikt zelf alles.
    await reportError(error, { source: "health", requestPath: "/api/health" });
  }

  const payload = buildHealthPayload({ db, commit: commitSha, now: new Date() });
  return NextResponse.json(payload, { status: healthHttpStatus(payload) });
}
