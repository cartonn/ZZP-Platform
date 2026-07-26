import type { ComplianceResult } from "@/lib/matching";

/**
 * Inzetbaarheids-/compliance-chip voor een opdracht op de triage-lijst (ZZP'er).
 *
 * De opdrachtenlijst toont per rij beslis-signalen (tarief, reistijd, betaalreputatie,
 * agenda, concurrentie). De hárde gatingfactor in de zorg — voldoe ik aan de vereiste
 * certificaten van deze dienst? — ontbrak nog op de lijst, terwijl `scoreJobForFreelancer`
 * die compliance al per opdracht berekent. Deze chip maakt dat glanceable, zonder de lijst
 * te overladen: hij zwijgt zodra de ZZP'er wél voldoet (geen actie nodig) en zodra de
 * opdracht geen harde certificaateisen stelt.
 *
 * Toonkeuze spiegelt de andere lijst-chips (alleen de beslis-relevante uitersten tonen):
 * - `warning` — een vereist certificaat ontbreekt of is verlopen → nú niet inzetbaar.
 * - `muted`   — een vereist certificaat is nog in beoordeling → binnenkort duidelijk.
 * - COMPLIANT of geen eisen → `null` (rustige lijst; niets dat actie vraagt).
 */
export type JobComplianceChipTone = "warning" | "muted";

export interface JobComplianceChip {
  tone: JobComplianceChipTone;
  label: string;
}

export function jobComplianceChip(
  compliance: Pick<ComplianceResult, "status" | "missing" | "expired">,
  requiredCredentialCount: number,
): JobComplianceChip | null {
  // Geen harde certificaateisen → geen inzetbaarheids-signaal (voorkomt een chip op elke rij).
  if (requiredCredentialCount <= 0) return null;

  switch (compliance.status) {
    case "COMPLIANT":
      // De ZZP'er voldoet — dat is geen actiepunt; houd de lijst rustig.
      return null;
    case "WARNING":
      // Enige resterende status is "nog in beoordeling" (SUBMITTED) — zacht signaal.
      return { tone: "muted", label: "Certificaat in beoordeling" };
    case "NON_COMPLIANT":
      // Ontbrekend certificaat weegt zwaarder dan verlopen (nieuw halen i.p.v. vernieuwen);
      // toon de meest-blokkerende oorzaak als het beide betreft.
      return compliance.missing.length > 0
        ? { tone: "warning", label: "Mist een vereist certificaat" }
        : { tone: "warning", label: "Vereist certificaat verlopen" };
  }
}
