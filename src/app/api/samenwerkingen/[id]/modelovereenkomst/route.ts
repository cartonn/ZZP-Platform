import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { recommendModelAgreement } from "@/lib/model-agreement";
import { buildModelAgreementContent, resolveAgreementType } from "@/lib/contract-agreement";
import { buildModelAgreementPdf, type ModelAgreementSignatory } from "@/lib/contract-pdf";

export const runtime = "nodejs";

const dLong = (d: Date | null) =>
  d ? d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : null;

// Actuele modelovereenkomst-PDF, on-demand gegenereerd. Alleen de betrokken partijen of een admin
// mogen 'm inzien (server-side waarheid, CLAUDE.md regel 1+2).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
      rate: true,
      startDate: true,
      endDate: true,
      agreementType: true,
      agreementFreelancerSignedAt: true,
      agreementClientSignedAt: true,
      company: { select: { name: true, userId: true } },
      freelancer: { select: { userId: true, user: { select: { name: true } } } },
      job: {
        select: {
          title: true,
          description: true,
          modelAgreementType: true,
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

  const allowed =
    actor.role === "ADMIN" || actor.id === col.company.userId || actor.id === col.freelancer.userId;
  if (!allowed) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

  const recommendation = recommendModelAgreement({
    directSupervision: col.job.dbaDirectSupervision,
    embedded: col.job.dbaEmbedded,
    fixedSchedule: col.job.dbaFixedSchedule,
    noSubstitution: col.job.dbaNoSubstitution,
    exclusive: col.job.dbaExclusive,
    weakEntrepreneurship: col.job.dbaWeakEntrepreneurship,
    durationMonths: col.job.dbaDurationMonths,
  });
  const agreementType = resolveAgreementType(
    col.agreementType,
    col.job.modelAgreementType,
    recommendation.type,
  );

  const start = dLong(col.startDate);
  const end = dLong(col.endDate);
  const periodLabel =
    start && end
      ? `van ${start} tot ${end}`
      : start
        ? `vanaf ${start}`
        : "voor de duur van de opdracht, in onderling overleg vast te stellen";

  const content = buildModelAgreementContent({
    agreementType,
    jobTitle: col.job.title,
    jobDescription: col.job.description,
    freelancerName: col.freelancer.user.name ?? "Opdrachtnemer",
    clientName: col.company.name ?? "Opdrachtgever",
    rateLabel: col.rate != null ? `EUR ${col.rate} per uur` : null,
    periodLabel,
  });

  const sig = (signedAt: Date | null) =>
    signedAt ? `Digitaal akkoord op ${dLong(signedAt)}` : "Nog niet ondertekend";
  const signatories: ModelAgreementSignatory[] = [
    {
      role: "Opdrachtnemer (ZZP'er)",
      name: col.freelancer.user.name ?? "Opdrachtnemer",
      status: sig(col.agreementFreelancerSignedAt),
    },
    {
      role: "Opdrachtgever",
      name: col.company.name ?? "Opdrachtgever",
      status: sig(col.agreementClientSignedAt),
    },
  ];

  const bytes = await buildModelAgreementPdf({
    content,
    reference: `Opdracht: ${col.job.title}`,
    signatories,
    generatedAtLabel: dLong(new Date()) ?? "",
  });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="modelovereenkomst-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
