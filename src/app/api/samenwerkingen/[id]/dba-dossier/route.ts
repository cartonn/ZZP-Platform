// DBA-dossier-PDF per samenwerking: onderbouwingsbundel voor een bedrijfsbezoek van de Belastingdienst.
// Beschikbaar voor de betrokken partijen (opdrachtgever / ZZP'er) en admin. Audit bij elke export.
// HARD: geen juridisch advies of oordeel; disclaimer op elke pagina van de PDF (Besluit 2).

import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { buildDbaAuditData } from "@/lib/dba-audit";
import { buildDbaAuditPdf } from "@/lib/dba-audit-pdf";
import { documentPdfRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // De DBA-PDF joint cross-party PII + genereert on-demand; rem een scripted loop (authz blijft leidend).
  const limited = await enforceRateLimit(documentPdfRateLimiter, actor.id);
  if (limited) return limited;

  const { id } = await ctx.params;

  const col = await prisma.collaboration.findUnique({
    where: { id },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      rate: true,
      agreementType: true,
      agreementFreelancerSignedAt: true,
      agreementClientSignedAt: true,
      company: {
        select: {
          name: true,
          userId: true,
        },
      },
      freelancer: {
        select: {
          userId: true,
          kvkNumber: true,
          btwNumber: true,
          user: { select: { name: true } },
          credentials: {
            // Alleen beoordeelde certificaten (VERIFIED/EXPIRED) — geen concept-/afgewezen-pogingen
            // lekken naar de opdrachtgever via het totaaltal (zelfde keuze als dossier-route).
            where: { status: { in: ["VERIFIED", "EXPIRED"] } },
            select: { type: true, title: true, status: true, verifiedAt: true },
          },
        },
      },
      job: {
        select: {
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
          dbaNoSubstitution: true,
          dbaExclusive: true,
          dbaWeakEntrepreneurship: true,
          dbaDurationMonths: true,
        },
      },
    },
  });

  if (!col) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

  // Toegang: de betrokken ZZP'er, de opdrachtgever, of admin.
  const allowed =
    actor.role === "ADMIN" || actor.id === col.company.userId || actor.id === col.freelancer.userId;
  if (!allowed) {
    // Geweigerde inzage van het DBA-dossier (cross-party PII: namen, KvK/BTW, certificaatstatus)
    // vastleggen — beveiligingsrelevant, parity met /api/documents/[id] en de dossier-route
    // (CLAUDE.md regel 5). Maakt IDOR-enumeratie op collaboration-id's zichtbaar in het auditspoor.
    const meta = await requestMeta();
    await audit({
      actorId: actor.id,
      action: "DBA_DOSSIER_ACCESS_DENIED",
      entityType: "Collaboration",
      entityId: id,
      metadata: { viewerRole: actor.role },
      ...meta,
    });
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const now = new Date();
  const auditData = buildDbaAuditData(
    {
      id: col.id,
      startDate: col.startDate,
      endDate: col.endDate,
      rate: col.rate,
      agreementType: col.agreementType,
      agreementFreelancerSignedAt: col.agreementFreelancerSignedAt,
      agreementClientSignedAt: col.agreementClientSignedAt,
      job: col.job,
    },
    {
      freelancerName: col.freelancer.user.name ?? "Onbekend",
      companyName: col.company.name ?? "Onbekend",
      kvkNumber: col.freelancer.kvkNumber ?? null,
      btwNumber: col.freelancer.btwNumber ?? null,
    },
    col.freelancer.credentials.map((c) => ({
      type: c.type,
      title: c.title,
      status: c.status,
      verifiedAt: c.verifiedAt,
    })),
    now,
  );

  const pdfBytes = await buildDbaAuditPdf(auditData);

  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "DBA_DOSSIER_EXPORTED",
    entityType: "Collaboration",
    entityId: id,
    metadata: {
      dbaLevel: auditData.dbaAssessment.level,
      verifiedCredentials: auditData.entrepreneurship.verifiedCredentialCount,
    },
    ...meta,
  });

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="dba-dossier-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
