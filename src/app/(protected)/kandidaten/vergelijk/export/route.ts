import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getCandidateComparisonForJob } from "@/lib/candidate-compare-data";
import { exportCandidateComparisonCsv } from "@/lib/candidate-compare";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("job");
  if (!jobId) return new Response("Geen opdracht opgegeven", { status: 400 });

  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    // Een mid-sessie geschorst/geanonimiseerd account houdt een geldige JWT (middleware laat door op
    // de stale claim), maar requireActor() leest vers uit de DB en werpt 401/403. Vang dat af tot een
    // nette response i.p.v. een rauwe 500 — parity met /prestaties/export en de andere export-routes.
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  if (actor.role !== "CLIENT") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `kandidaten-vergelijk:${actor.id}`);
  if (limited) return limited;

  // Ownership + niet-gevonden lopen via dezelfde 404 zodat we het bestaan van andermans opdracht niet lekken.
  const data = await getCandidateComparisonForJob(actor.id, jobId);
  if (!data) return new Response("Niet gevonden", { status: 404 });

  // Minder dan twee kandidaten levert geen zinvolle vergelijking — geen triviale export.
  if (data.candidates.length < 2) {
    return new Response("Te weinig kandidaten om te vergelijken", { status: 400 });
  }

  const csv = exportCandidateComparisonCsv({
    candidates: data.candidates,
    comparison: data.comparison,
    scoreById: data.ranking.scoreById,
    recommendedId: data.ranking.recommendedId,
  });

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van kandidaat-PII vast — parity met de
  // andere export-routes. Zo is "wie exporteerde wat wanneer" traceerbaar.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "CANDIDATES_COMPARED_EXPORTED",
      entityType: "Job",
      entityId: data.job.id,
      metadata: { count: data.candidates.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kandidaten-vergelijk-${date}.csv"`,
    },
  });
}
