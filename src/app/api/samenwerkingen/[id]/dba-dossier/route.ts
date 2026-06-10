// DBA-dossier-PDF per samenwerking: onderbouwingsbundel voor een bedrijfsbezoek van de Belastingdienst.
// Beschikbaar voor de betrokken partijen (opdrachtgever / ZZP'er) en admin. Audit bij elke export.
// HARD: geen juridisch advies of oordeel; disclaimer op elke pagina van de PDF (Besluit 2).

import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { buildDbaAuditData } from "@/lib/dba-audit";
import { buildDbaAuditPdf } from "@/lib/dba-audit-pdf";

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
  if (!allowed) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

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

  await audit({
    actorId: actor.id,
    action: "DBA_DOSSIER_EXPORTED",
    entityType: "Collaboration",
    entityId: id,
    metadata: {
      dbaLevel: auditData.dbaAssessment.level,
      verifiedCredentials: auditData.entrepreneurship.verifiedCredentialCount,
    },
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
