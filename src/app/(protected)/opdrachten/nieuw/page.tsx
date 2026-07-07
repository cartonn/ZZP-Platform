import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { owns, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getJobRateBands } from "@/lib/data/job-rate-bands";
import { buildJobDuplicateInitial } from "@/lib/job-duplicate";
import { JobForm, type JobFormInitial } from "../job-form";

export const metadata: Metadata = { title: "Nieuwe opdracht · ZZP Platform" };

const BLANK_INITIAL: JobFormInitial = {
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
};

export default async function NieuweOpdrachtPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const actor = await requireRole("CLIENT");
  const { from } = await searchParams;

  const [skills, industries] = await Promise.all([
    // unbounded-allow: skills-referentielijst voor formulier
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // unbounded-allow: branches-referentielijst voor formulier
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rateBands = await getJobRateBands(industries.map((i) => i.id));

  // Dupliceer-startpunt: haal de bron-opdracht server-side op en controleer eigenaarschap.
  // Niet-eigen/onbekende `from` → stil terugvallen op een leeg formulier (geen lek, `from` is
  // een gemak, geen autorisatiegrens).
  let initial = BLANK_INITIAL;
  let duplicated = false;
  if (from) {
    const source = await prisma.job.findUnique({
      where: { id: from },
      include: {
        company: { select: { userId: true } },
        skills: true,
        credentialRequirements: true,
      },
    });
    if (source && owns(actor, source.company.userId)) {
      initial = buildJobDuplicateInitial(source);
      duplicated = true;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/opdrachten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdrachten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {duplicated ? "Opdracht dupliceren" : "Nieuwe opdracht"}
        </h1>
        {duplicated && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Copy className="size-3.5" aria-hidden /> Overgenomen uit een bestaande opdracht. Pas
            aan en plaats als nieuw concept.
          </p>
        )}
      </div>
      <JobForm
        initial={initial}
        skills={skills}
        industries={industries}
        rateBands={rateBands.byIndustry}
        platformRateBand={rateBands.platform}
      />
    </div>
  );
}
