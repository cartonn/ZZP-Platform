// Bereik-specificatie van een concept-opdracht: de onderscheidende eisen die het bereik bepalen,
// los van de persistente opdracht. Hiermee kan de bereikmotor (`job-reach.ts`) al vóór publicatie
// draaien op wat de opdrachtgever nú in het formulier heeft staan, zodat die eisen/tarief/werkvorm
// kan bijsturen voordat de opdracht koud wordt. Pure functies, geen DB — server-side blijft de
// waarheid (de action valideert en scoort; de client toont alleen). Spiegelt de veldnamen die
// `parseJobForm`/`saveJob` gebruiken zodat één FormData-snapshot volstaat.

import { z } from "zod";
import type { JobMatchSource } from "@/lib/matching";

/**
 * Genormaliseerde bereik-spec. Tarieven zijn hele euro's per uur (gelijk aan `Job.rateMin/rateMax`,
 * `Int`). Skills/certificaten zijn ruwe id's/typen; de motor koppelt alleen bestaande.
 */
export const jobReachSpecSchema = z.object({
  title: z.string().max(200).default(""),
  description: z.string().max(20000).default(""),
  requiredSkillIds: z.array(z.string().min(1)).max(100).default([]),
  optionalSkillIds: z.array(z.string().min(1)).max(100).default([]),
  requiredCredentialTypes: z.array(z.string().min(1)).max(100).default([]),
  rateMin: z.number().int().nonnegative().nullable().default(null),
  rateMax: z.number().int().nonnegative().nullable().default(null),
  workMode: z.string().default("ONSITE"),
  location: z.string().nullable().default(null),
  industryId: z.string().nullable().default(null),
});

export type JobReachSpec = z.infer<typeof jobReachSpecSchema>;

/**
 * Heeft de concept-opdracht genoeg onderscheidende eisen om een zinnig bereik te tonen? Zonder één
 * vereiste skill, één vereist certificaat, een branche óf een minimumtarief zou "bereik" simpelweg
 * de hele vindbare pool zijn — een misleidend geruststellend getal. Dan tonen we niets.
 */
export function hasDiscriminatingRequirements(spec: JobReachSpec): boolean {
  return (
    spec.requiredSkillIds.length > 0 ||
    spec.requiredCredentialTypes.length > 0 ||
    spec.industryId !== null ||
    spec.rateMin !== null
  );
}

/**
 * Vertaalt de bereik-spec naar de `JobMatchSource` die de verklaarbare matchmotor verwacht. `required`
 * wint bij overlap tussen vereiste en gewenste skills (een skill die als beide is aangevinkt telt als
 * vereist), gelijk aan `saveJob`. Certificaten in de spec zijn allemaal vereist (het formulier kent
 * geen optionele certificaten voor de bereikcheck).
 */
export function toJobMatchSource(spec: JobReachSpec): JobMatchSource {
  const requiredSkillSet = new Set(spec.requiredSkillIds);
  const allSkillIds = [...new Set([...spec.requiredSkillIds, ...spec.optionalSkillIds])];
  const skills = allSkillIds.map((skillId) => ({
    skillId,
    required: requiredSkillSet.has(skillId),
  }));

  const credentialRequirements = [...new Set(spec.requiredCredentialTypes)].map(
    (credentialType) => ({ credentialType, required: true }),
  );

  return {
    skills,
    credentialRequirements,
    rateMin: spec.rateMin,
    rateMax: spec.rateMax,
    workMode: spec.workMode,
    location: spec.location,
    industryId: spec.industryId,
    title: spec.title || null,
    description: spec.description || null,
  };
}

/** Leest een bereik-spec uit een FormData-snapshot van het opdracht-formulier (zelfde veldnamen als saveJob). */
export function parseReachSpecFromForm(formData: FormData): JobReachSpec {
  const num = (raw: FormDataEntryValue | null): number | null => {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
  };
  const str = (raw: FormDataEntryValue | null): string => (typeof raw === "string" ? raw : "");
  const nullableStr = (raw: FormDataEntryValue | null): string | null => {
    const s = str(raw).trim();
    return s === "" ? null : s;
  };

  return jobReachSpecSchema.parse({
    title: str(formData.get("title")),
    description: str(formData.get("description")),
    requiredSkillIds: formData.getAll("requiredSkillIds").map(String).filter(Boolean),
    optionalSkillIds: formData.getAll("optionalSkillIds").map(String).filter(Boolean),
    requiredCredentialTypes: formData.getAll("requiredCredentialTypes").map(String).filter(Boolean),
    rateMin: num(formData.get("rateMin")),
    rateMax: num(formData.get("rateMax")),
    workMode: str(formData.get("workMode")) || "ONSITE",
    location: nullableStr(formData.get("location")),
    industryId: nullableStr(formData.get("industryId")),
  });
}
