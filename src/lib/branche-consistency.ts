// Branche-consistentie: een demo-vacature hoort qua branche (industry) bij het bedrijf waaronder
// ze hangt — een zorg-vacature onder een zorgbedrijf, IT onder een IT-bedrijf, enz. Zonder deze
// invariant ontstaat verwarrende demo-data (bv. "Verpleegkundige" onder een softwarebedrijf met een
// hoge match-score). Deze pure helpers controleren die invariant; de seed leunt erop en een unit-test
// bewaakt hem.

export interface JobBranche {
  id: string;
  /** industry-slug van de vacature */
  industry: string;
  /** bedrijf-key waaronder de vacature hangt */
  companyKey: string;
}

/** Map van bedrijf-key naar de industry-slug van dat bedrijf. */
export type CompanyIndustryMap = Record<string, string>;

export interface BrancheMismatch {
  jobId: string;
  jobIndustry: string;
  companyKey: string;
  companyIndustry: string | undefined;
}

/**
 * Geeft elke vacature terug waarvan de branche niet past bij het bedrijf waaronder ze hangt.
 * Een lege array betekent: alles is branche-consistent.
 */
export function findBrancheMismatches(
  jobs: JobBranche[],
  companyIndustry: CompanyIndustryMap,
): BrancheMismatch[] {
  const mismatches: BrancheMismatch[] = [];
  for (const job of jobs) {
    const companyInd = companyIndustry[job.companyKey];
    if (companyInd !== job.industry) {
      mismatches.push({
        jobId: job.id,
        jobIndustry: job.industry,
        companyKey: job.companyKey,
        companyIndustry: companyInd,
      });
    }
  }
  return mismatches;
}

/** True als élke vacature branche-consistent is met haar bedrijf. */
export function isBrancheConsistent(
  jobs: JobBranche[],
  companyIndustry: CompanyIndustryMap,
): boolean {
  return findBrancheMismatches(jobs, companyIndustry).length === 0;
}
