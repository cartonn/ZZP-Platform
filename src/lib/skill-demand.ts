// Vaardigheid-vraagsignaal voor de ZZP'er. Spiegel van `credential-demand.ts`, maar voor skills:
// welke vereiste vaardigheden vragen de open opdrachten die deze ZZP'er ziet, terwijl hij die nog
// niet in zijn profiel heeft staan? Voedt de sectie "Gevraagde vaardigheden die je nog mist" op
// `/profiel/bewerken` — een verklaarbare nudge om het profiel te vervolledigen zodat de matching
// meer opdrachten oplevert. Puur en deterministisch; geen server-only imports (geen db/auth) — de
// aanroeper levert de geaggregeerde rijen aan.
//
// --- Bron ---
// `requirements` zijn de vereiste skill-eisen (`JobSkill` met `required: true`) over de open
// opdrachten die de ZZP'er mag zien; één rij per (opdracht, skill). `ownedSkillIds` zijn de skill-id's
// die al in het profiel staan (`FreelancerSkill`). Skills zijn binair — je hebt ze of niet; er is geen
// status/verloop zoals bij certificaten. Een vereiste skill die niet in `ownedSkillIds` zit is een
// "gat"; we rangschikken op hoeveel distinct open opdrachten elk ontbrekend skill zou ontsluiten.

export interface JobSkillRequirementRow {
  jobId: string;
  skillId: string;
  skillName: string;
}

export interface SkillDemandGap {
  skillId: string;
  name: string;
  /** Aantal distinct open opdrachten dat deze vaardigheid vereist (en dat de ZZP'er nog niet heeft). */
  opportunityCount: number;
}

export interface SkillDemand {
  /** Ontbrekende vereiste vaardigheden, gesorteerd op opportunityCount desc, daarna naam asc. */
  gaps: SkillDemandGap[];
  /** Aantal distinct open opdrachten dat minstens één ontbrekende vereiste vaardigheid vraagt. */
  blockedOpportunities: number;
}

/**
 * Berekent het vaardigheid-vraagsignaal: welke vereiste vaardigheden de ZZP'er nog niet in zijn
 * profiel heeft, gerangschikt op hoeveel distinct open opdrachten elk ontbrekend skill zou ontsluiten.
 * Puur en deterministisch; geschikt voor unit-tests zonder DB.
 */
export function computeSkillDemand(
  requirements: readonly JobSkillRequirementRow[],
  ownedSkillIds: readonly string[],
): SkillDemand {
  if (requirements.length === 0) {
    return { gaps: [], blockedOpportunities: 0 };
  }

  const owned = new Set(ownedSkillIds);

  // Per ontbrekende skill de set distinct jobId's bijhouden. De Set dedupliceert tegelijk de
  // (jobId, skillId)-rijen defensief (de DB heeft hier een unique constraint, maar wees veilig).
  const jobsBySkill = new Map<string, { name: string; jobIds: Set<string> }>();
  const blockedJobs = new Set<string>();

  for (const r of requirements) {
    if (owned.has(r.skillId)) continue; // al in profiel → geen gat, niet geblokkeerd

    const entry = jobsBySkill.get(r.skillId);
    if (entry) {
      entry.jobIds.add(r.jobId);
    } else {
      jobsBySkill.set(r.skillId, { name: r.skillName, jobIds: new Set([r.jobId]) });
    }
    blockedJobs.add(r.jobId);
  }

  const gaps: SkillDemandGap[] = [];
  for (const [skillId, { name, jobIds }] of jobsBySkill) {
    gaps.push({ skillId, name, opportunityCount: jobIds.size });
  }

  // Sorteren: meest-ontsluitende skill eerst, bij gelijke telling alfabetisch op naam
  // (deterministisch; case-insensitief, dan op id als laatste tiebreaker).
  gaps.sort((a, b) => {
    if (b.opportunityCount !== a.opportunityCount) {
      return b.opportunityCount - a.opportunityCount;
    }
    const byName = a.name.localeCompare(b.name, "nl", { sensitivity: "base" });
    if (byName !== 0) return byName;
    return a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0;
  });

  return { gaps, blockedOpportunities: blockedJobs.size };
}
