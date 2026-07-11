// Compliance-overzicht voor de bemiddelaar (franchiser) boven het ZZP'er-roster
// (`/franchise/zzpers`). Pure, deterministische aggregatie over de reeds tenant-gescopet opgehaalde
// ZZP'ers — geen I/O, los getest. Beantwoordt de kernvraag van een zorg-/detacheringsbureau direct:
// "houd ik mijn pool compliant?" — welke vakmensen hebben een verplicht certificaat dat al verlopen
// is (hard gat: het vertrouwensniveau zakt en per-opdracht kan de compliance-gate blokkeren) of dat
// binnen de horizon verloopt (vernieuw op tijd). Benchmark Pidz/Zorgwerk: een bureau moet dit vóór
// zijn, niet achteraf ontdekken. De server bepaalt de waarheid; deze helper levert enkel de afgeleide
// presentatie (CLAUDE.md regel 1). Hergebruikt het bestaande vervalvenster uit de vervalkalender —
// geen eigen drempels.

import { type ExpiryWindow } from "@/lib/credential-expiry-overview";
import { plural } from "@/lib/plural";

/** Minimale invoer per ZZP'er — het meest urgente vervalvenster (uit `summarizeExpiryAlert`). */
export interface CredentialComplianceInput {
  /**
   * Meest urgente vervalvenster van deze ZZP'er, of `null` als geen enkel VERIFIED-certificaat
   * aandacht vraagt. `EXPIRED` = al verlopen; `WITHIN_*` = verloopt binnen de horizon.
   */
  window: ExpiryWindow | null;
}

export interface CredentialComplianceSummary {
  total: number;
  /** Minstens één certificaat al verlopen — hard compliance-gat, met spoed vernieuwen. */
  expired: number;
  /** Certificaat verloopt binnen de horizon (nog geldig) — vernieuw op tijd. */
  expiringSoon: number;
  /** expired + expiringSoon — het aantal vakmensen dat actie vraagt. */
  flagged: number;
  /** Geen vervalsignaal — niets te vernieuwen op korte termijn. */
  clear: number;
}

/**
 * Partitioneert het roster in drie elkaar uitsluitende buckets (expired → expiringSoon → clear),
 * zodat de tellingen samen exact `total` vormen. "Verlopen" wint van "verloopt binnenkort": het
 * meest urgente venster per ZZP'er is al bepaald door `summarizeExpiryAlert`. Elke item telt als
 * één vakmens (niet als aantal certificaten).
 */
export function summarizeCredentialCompliance(
  items: readonly CredentialComplianceInput[],
): CredentialComplianceSummary {
  const summary: CredentialComplianceSummary = {
    total: items.length,
    expired: 0,
    expiringSoon: 0,
    flagged: 0,
    clear: 0,
  };

  for (const it of items) {
    if (it.window === "EXPIRED") {
      summary.expired += 1;
    } else if (it.window !== null) {
      summary.expiringSoon += 1;
    } else {
      summary.clear += 1;
    }
  }

  summary.flagged = summary.expired + summary.expiringSoon;
  return summary;
}

/**
 * Eén verklarende regel boven de tegels ("wat vraagt nu mijn aandacht?"). `null` bij een leeg roster
 * — dan toont de pagina zijn eigen lege staat. Verlopen weegt zwaarder dan aankomend verloop.
 */
export function credentialComplianceHeadline(summary: CredentialComplianceSummary): string | null {
  if (summary.total === 0) return null;
  if (summary.expired > 0) {
    return `${plural(summary.expired, "vakmens", "vakmensen")} met een verlopen certificaat — vernieuw met spoed om het vertrouwensniveau te behouden.`;
  }
  if (summary.expiringSoon > 0) {
    return `${plural(summary.expiringSoon, "vakmens", "vakmensen")} met een aflopend certificaat — plan de vernieuwing op tijd.`;
  }
  return "Alle certificaten in je roster zijn op orde.";
}
