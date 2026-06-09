// Export van het compliance-dossier per samenwerking (onderbouwingsbundel voor de boekhouder/
// administratie). Alleen voor de eigenaar (opdrachtgever), de ZZP'er zelf, of admin. Auditregel
// bij export (DOSSIER_EXPORTED). Geen oordeel/garantie (Besluit 2) — feiten + signalen.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildComplianceDossier, type DossierInput } from "@/lib/compliance/dossier";

export const dynamic = "force-dynamic";

function parseReasons(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  const { id } = await ctx.params;

  const col = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      job: { select: { title: true, dbaRisk: true, dbaReasons: true, modelAgreementType: true } },
      company: { select: { name: true, userId: true } },
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
          // Alleen beoordeelde (geverifieerd/verlopen) certificaten: het dossier mag het bestaan van
          // concept-/afgewezen/in-behandeling-pogingen van de ZZP'er niet aan de opdrachtgever lekken
          // via het totaaltal ("X van N"). De verificatiesectie gebruikt enkel VERIFIED + EXPIRED.
          credentials: {
            where: { status: { in: ["VERIFIED", "EXPIRED"] } },
            select: { type: true, title: true, status: true, verifiedAt: true },
          },
        },
      },
      performances: { select: { description: true, status: true, approvedAt: true } },
      invoices: {
        select: { number: true, lifecycleStatus: true, totalCents: true, issuedAt: true },
      },
    },
  });
  if (!col) return new Response("Niet gevonden.", { status: 404 });
  if (
    col.company.userId !== actor.id &&
    col.freelancer.userId !== actor.id &&
    actor.role !== "ADMIN"
  ) {
    return new Response("Geen toegang.", { status: 403 });
  }

  const input: DossierInput = {
    jobTitle: col.job.title,
    freelancerName: col.freelancer.user.name,
    companyName: col.company.name,
    contractStatus: col.contractStatus,
    dbaRisk: col.job.dbaRisk,
    dbaReasons: parseReasons(col.job.dbaReasons),
    modelAgreementType: col.job.modelAgreementType,
    credentials: col.freelancer.credentials,
    performances: col.performances,
    invoices: col.invoices.map((i) => ({
      number: i.number,
      lifecycleStatus: i.lifecycleStatus,
      totalCents: i.totalCents,
      submittedAt: i.issuedAt,
    })),
    startDate: col.startDate,
    createdAt: col.createdAt,
  };
  const dossier = buildComplianceDossier(input);

  const lines = [
    `Compliance-dossier (onderbouwingsbundel, geen goedkeuring/vrijwaring)`,
    `Samenwerking: ${dossier.jobTitle}`,
    `ZZP'er: ${dossier.freelancerName}`,
    `Opdrachtgever: ${dossier.companyName}`,
    `Geexporteerd: ${new Date().toISOString()}`,
    `Aandachtspunten: ${dossier.attentionCount}`,
    ``,
    `--- Secties ---`,
    ...dossier.sections.map((s) => `[${s.attention ? "LET OP" : "OK"}] ${s.title}: ${s.summary}`),
    ``,
    `--- Tijdlijn ---`,
    ...dossier.timeline.map((t) => `${t.at.toISOString().slice(0, 10)}  ${t.label}`),
  ];
  const body = lines.join("\n");

  await audit({
    actorId: actor.id,
    action: "DOSSIER_EXPORTED",
    entityType: "Collaboration",
    entityId: id,
    metadata: { attentionCount: dossier.attentionCount },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="compliance-dossier-${id}.txt"`,
    },
  });
}
