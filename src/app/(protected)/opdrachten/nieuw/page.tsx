import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getJobRateBands } from "@/lib/data/job-rate-bands";
import { JobForm } from "../job-form";

export const metadata: Metadata = { title: "Nieuwe opdracht · ZZP Platform" };

export default async function NieuweOpdrachtPage() {
  await requireRole("CLIENT");
  const [skills, industries] = await Promise.all([
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rateBands = await getJobRateBands(industries.map((i) => i.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/opdrachten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdrachten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Nieuwe opdracht</h1>
      </div>
      <JobForm
        initial={{
          title: "",
          description: "",
          industryId: "",
          rateMin: "",
          rateMax: "",
          location: "",
          workMode: "HYBRID",
          startDate: "",
          requiredSkillIds: [],
          optionalSkillIds: [],
          requiredCredentialTypes: [],
          optionalCredentialTypes: [],
          modelAgreementType: "",
          dba: {
            dbaDirectSupervision: false,
            dbaEmbedded: false,
            dbaFixedSchedule: false,
            dbaNoSubstitution: false,
            dbaExclusive: false,
            dbaWeakEntrepreneurship: false,
            dbaDurationMonths: "",
          },
        }}
        skills={skills}
        industries={industries}
        rateBands={rateBands.byIndustry}
        platformRateBand={rateBands.platform}
      />
    </div>
  );
}
