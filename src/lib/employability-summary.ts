// Presentatie-unificatie: één afgeleide samenvatting van de inzetbaarheidsstatus voor de UI. GEEN nieuwe
// domeinlogica — dit vertaalt de bestaande EngageabilityResult (computeEngageability) + de verplichte-
// documentenstatus (mandatoryDocuments) naar precies wat dashboard-tegel én profielkop nodig hebben:
// een niveau, een label, de éérste blokkade in mensentaal en een doorklik naar de ontbrekende stap.
// Zo tonen dashboard en profiel gegarandeerd hetzelfde oordeel uit dezelfde bron.

import { type EngageabilityResult } from "@/lib/engageability";
import { type MandatoryDocumentsResult } from "@/lib/mandatory-documents";

export type EmployabilityLevel = "ACTIEF" | "AANDACHT" | "INACTIEF";

export interface EmployabilitySummary {
  /** Doorgezet niveau uit computeEngageability. */
  level: EmployabilityLevel;
  /** Korte statuslabel ("Inzetbaar" / "Aandacht nodig" / "Nog niet inzetbaar"). */
  label: string;
  /** Statuslabel met de eerste blokkade erbij ("Nog niet inzetbaar — VOG ontbreekt"), of het kale label. */
  labelWithBlocker: string;
  /** De eerste blokkade in mensentaal, of null wanneer niet geblokkeerd. */
  blocker: string | null;
  /** Doorklik naar de stap die de blokkade oplost (deep-link naar het ontbrekende document). */
  href: string;
}

// Standaard-doorklik wanneer er geen specifiek ontbrekend document is aan te wijzen.
const DEFAULT_HREF = "/certificaten";

/**
 * Leidt de href af naar de stap die de éérste blokkade oplost. Een ontbrekend/verlopen verplicht
 * document verwijst naar het uploadformulier met het juiste type voorgeselecteerd
 * (/certificaten/nieuw?type=VOG|INSURANCE); anders naar het certificaten-overzicht.
 */
function blockerHref(mandatory: MandatoryDocumentsResult): string {
  const open = mandatory.items.find((i) => i.state === "missing" || i.state === "expired");
  return open ? `/certificaten/nieuw?type=${open.type}` : DEFAULT_HREF;
}

/**
 * Bouwt de gedeelde inzetbaarheids-samenvatting. `engageability` is de ENIGE bron van het oordeel;
 * `mandatory` levert alleen de doorklik-context (welk verplicht document ontbreekt). Bij een blokkade
 * krijgt `labelWithBlocker` de eerste blokkade erbij ("Nog niet inzetbaar — VOG ontbreekt"), zodat een
 * "100%" nooit naast een "0%" of "Nog niet inzetbaar" kan staan zonder benoemde reden.
 */
export function employabilitySummary(
  engageability: EngageabilityResult,
  mandatory: MandatoryDocumentsResult,
): EmployabilitySummary {
  const blocker = engageability.blockers[0] ?? null;
  return {
    level: engageability.status,
    label: engageability.label,
    labelWithBlocker: blocker ? `${engageability.label} — ${blocker}` : engageability.label,
    blocker,
    href: blocker ? blockerHref(mandatory) : DEFAULT_HREF,
  };
}
