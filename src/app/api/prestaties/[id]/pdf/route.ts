import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { buildPerformancePdf } from "@/lib/performance-pdf";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { documentPdfRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const runtime = "nodejs";

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// Actuele urenstaat/oplevering-PDF, on-demand. Alleen de betrokken partijen (ZZP'er, opdrachtgever)
// of een admin mogen 'm inzien (server-side waarheid, CLAUDE.md regel 1+2).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // On-demand PDF-generatie is CPU-belastend; rem een scripted loop (authz blijft de bron van toegang).
  const limited = await enforceRateLimit(documentPdfRateLimiter, actor.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  const perf = await prisma.performance.findUnique({
    where: { id },
    select: {
      type: true,
      hours: true,
      rateCents: true,
      amountCents: true,
      milestoneTitle: true,
      periodStart: true,
      periodEnd: true,
      description: true,
      ortSegments: true,
      submittedAt: true,
      createdAt: true,
      collaboration: {
        select: {
          ortProfile: true,
          ortCustomRates: true,
          job: { select: { title: true } },
          company: { select: { name: true, userId: true } },
          freelancer: { select: { userId: true, user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!perf) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  const allowed =
    actor.role === "ADMIN" ||
    actor.id === perf.collaboration?.company.userId ||
    actor.id === perf.collaboration?.freelancer.userId;
  if (!allowed) {
    // Geweigerde inzage ook vastleggen — parity met de dossier-/modelovereenkomst-routes
    // (CLAUDE.md regel 5). Maakt IDOR-enumeratie op prestatie-id's zichtbaar in het auditspoor.
    const meta = await requestMeta();
    await audit({
      actorId: actor.id,
      action: "PERFORMANCE_PDF_ACCESS_DENIED",
      entityType: "Performance",
      entityId: id,
      metadata: { viewerRole: actor.role },
      ...meta,
    });
    // Ononderscheidbaar van een onbekend id (CWE-203): een 403 op een vreemd-maar-geldig prestatie-id
    // verraadt het bestaan ervan. De DENIED-audit hierboven blijft.
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  // AVG/compliance (CLAUDE.md regel 5): inzage van de urenstaat/oplevering (PII: naam, periode,
  // uren, tarief) vastleggen, net als de dossier-routes en /api/documents/[id].
  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "PERFORMANCE_PDF_ACCESSED",
    entityType: "Performance",
    entityId: id,
    metadata: { viewerRole: actor.role },
    ...meta,
  });

  const bytes = await buildPerformancePdf({
    perfType: perf.type,
    jobTitle: perf.collaboration?.job.title ?? "",
    freelancerName: perf.collaboration?.freelancer.user.name ?? "ZZP'er",
    clientName: perf.collaboration?.company.name ?? "Opdrachtgever",
    periodStart: ymd(perf.periodStart),
    periodEnd: ymd(perf.periodEnd),
    hours: perf.hours,
    rateCents: perf.rateCents,
    amountCents: perf.amountCents,
    milestoneTitle: perf.milestoneTitle,
    description: perf.description,
    ortSegments: perf.ortSegments,
    ortProfile: perf.collaboration?.ortProfile ?? null,
    ortCustomRates: perf.collaboration?.ortCustomRates ?? null,
    submittedAt: ymd(perf.submittedAt ?? perf.createdAt),
  });

  const kind = perf.type === "MILESTONE" ? "oplevering" : "urenstaat";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${kind}-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
