import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { owns, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { JobForm } from "../../job-form";

export const metadata: Metadata = { title: "Opdracht bewerken · ZZP Platform" };

export default async function OpdrachtBewerkenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("CLIENT");
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: { select: { userId: true } },
      skills: true,
      credentialRequirements: true,
    },
  });
  if (!job || !owns(actor, job.company.userId)) notFound();

  const [skills, industries] = await Promise.all([
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/opdrachten/${job.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdracht
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Opdracht bewerken</h1>
      </div>
      <JobForm
        initial={{
          id: job.id,
          title: job.title,
          description: job.description,
          industryId: job.industryId ?? "",
          rateMin: job.rateMin?.toString() ?? "",
          rateMax: job.rateMax?.toString() ?? "",
          location: job.location ?? "",
          workMode: job.workMode,
          startDate: job.startDate ? job.startDate.toISOString().slice(0, 10) : "",
          requiredSkillIds: job.skills.filter((s) => s.required).map((s) => s.skillId),
          optionalSkillIds: job.skills.filter((s) => !s.required).map((s) => s.skillId),
          requiredCredentialTypes: job.credentialRequirements
            .filter((c) => c.required)
            .map((c) => c.credentialType),
          optionalCredentialTypes: job.credentialRequirements
            .filter((c) => !c.required)
            .map((c) => c.credentialType),
          modelAgreementType: job.modelAgreementType ?? "",
          dba: {
            dbaDirectSupervision: job.dbaDirectSupervision,
            dbaEmbedded: job.dbaEmbedded,
            dbaFixedSchedule: job.dbaFixedSchedule,
            dbaNoSubstitution: job.dbaNoSubstitution,
            dbaExclusive: job.dbaExclusive,
            dbaWeakEntrepreneurship: job.dbaWeakEntrepreneurship,
            dbaDurationMonths: job.dbaDurationMonths?.toString() ?? "",
          },
        }}
        skills={skills}
        industries={industries}
      />
    </div>
  );
}
