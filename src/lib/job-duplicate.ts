// Opdracht dupliceren: bouwt de voor-ingevulde formulierwaarden voor een NIEUWE opdracht op basis
// van een bestaande. Puur en getest. Server-side is de waarheid (CLAUDE.md regel 1): de bron-opdracht
// wordt server-side opgehaald en op ownership gecontroleerd; deze helper vormt alleen de payload om.
//
// Bewust weggelaten bij het dupliceren:
// - `id`  → de JobForm maakt zonder `jobId` een NIEUWE opdracht aan (concept), i.p.v. de bron te wijzigen.
// - status/reacties → een kopie start altijd als vers concept; niets van de reactie-/publicatiestaat lekt mee.
// - `startDate` → de oude startdatum ligt vaak in het verleden; leeg laten dwingt een bewuste keuze af.

import { type JobFormInitial } from "@/app/(protected)/opdrachten/job-form";

/** Max. titellengte — spiegelt `jobSchema.title` (`trimmed(160)`) in `validation.ts`. */
export const JOB_TITLE_MAX = 160;
const COPY_SUFFIX = " (kopie)";

/**
 * Titel voor de kopie: voegt " (kopie)" toe, maar nooit dubbel en nooit boven de titel-max.
 * Bij overschrijding wordt de basistitel ingekort zodat het geheel binnen de grens past.
 */
export function duplicateJobTitle(title: string): string {
  const base = title.trim();
  if (base.toLowerCase().endsWith(COPY_SUFFIX.trim().toLowerCase()))
    return base.slice(0, JOB_TITLE_MAX);
  const room = JOB_TITLE_MAX - COPY_SUFFIX.length;
  const trimmedBase = base.length > room ? base.slice(0, room).trimEnd() : base;
  return `${trimmedBase}${COPY_SUFFIX}`;
}

/** Bron-opdracht met de relaties die een dupliceer-payload nodig heeft. */
export interface DuplicableJob {
  title: string;
  description: string;
  industryId: string | null;
  rateMin: number | null;
  rateMax: number | null;
  location: string | null;
  workMode: string;
  modelAgreementType: string | null;
  dbaDirectSupervision: boolean;
  dbaEmbedded: boolean;
  dbaFixedSchedule: boolean;
  dbaNoSubstitution: boolean;
  dbaExclusive: boolean;
  dbaWeakEntrepreneurship: boolean;
  dbaDurationMonths: number | null;
  skills: readonly { skillId: string; required: boolean }[];
  credentialRequirements: readonly { credentialType: string; required: boolean }[];
}

/**
 * Vormt een bron-opdracht om tot de `initial` van de nieuwe-opdracht-form — zónder `id`, met een
 * "(kopie)"-titel en zonder startdatum. Alle overige inhoud (omschrijving, tarief, skills,
 * certificaateisen, DBA-antwoorden, modelovereenkomst) wordt overgenomen.
 */
export function buildJobDuplicateInitial(job: DuplicableJob): JobFormInitial {
  return {
    title: duplicateJobTitle(job.title),
    description: job.description,
    industryId: job.industryId ?? "",
    rateMin: job.rateMin?.toString() ?? "",
    rateMax: job.rateMax?.toString() ?? "",
    location: job.location ?? "",
    workMode: job.workMode,
    startDate: "",
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
  };
}
