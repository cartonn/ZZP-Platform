// Roster-capaciteitsoverzicht voor de bemiddelaar (franchiser) boven het ZZP'er-roster
// (`/franchise/zzpers`). Pure, deterministische aggregatie over de reeds tenant-gescopet opgehaalde
// ZZP'ers — geen I/O, los getest. Beantwoordt de kernvraag van de bemiddelaar direct: "wie kan ik nu
// aan het werk zetten?" De hoofdmaat is de **vrij inzetbare** capaciteit: inzetbaar (ACTIEF),
// beschikbaar (AVAILABLE/LIMITED) én zonder lopende opdracht — precies de vakmensen die je vandaag
// nog kunt plaatsen (bezetting maximaliseren, benchmark Pidz/Zorgwerk). De server bepaalt de waarheid;
// deze helper levert enkel de afgeleide presentatie (CLAUDE.md regel 1).

import { type EngageabilityStatus } from "@/lib/engageability";
import { plural } from "@/lib/plural";

/** Beschikbaarheidswaarden die als "kan nu ingezet worden" tellen (spiegelt Availability). */
const AVAILABLE_FOR_WORK = new Set(["AVAILABLE", "LIMITED"]);

/** Minimale invoer per ZZP'er — volledig afleidbaar uit de al opgehaalde roster-rijen. */
export interface RosterCapacityInput {
  engageabilityStatus: EngageabilityStatus;
  availability: string;
  /** Aantal lopende (ACTIVE) samenwerkingen; > 0 = nu ingezet. */
  activeCollaborations: number;
  /**
   * Heeft de ZZP'er zich via een beschikbaarheidsvenster (`AvailabilityWindow` = UNAVAILABLE) NU
   * expliciet onbeschikbaar gemaakt (vakantie/verlof)? Dit is een tijdgebonden zelf-blokkade die de
   * grove `availability`-status (op het profiel) niet meebeweegt — iemand kan "Beschikbaar" staan én
   * deze week op vakantie zijn. Zo'n vakmens telt niet als vrij inzetbaar: hem nú voordragen is een
   * verspilde ronde (de ZZP'er moet de uitnodiging alsnog afwijzen). Optioneel/`false` = geen
   * afwezigheidsvenster dekt nu (gedragsbehoudend voor bestaande aanroepers). Server bepaalt de
   * waarheid via `awayUntil` (`src/lib/availability.ts`); deze helper leest alleen af.
   */
  unavailableNow?: boolean;
}

export interface RosterCapacitySummary {
  total: number;
  /** Vrij inzetbaar: ACTIEF + beschikbaar + geen lopende opdracht — plaats ze nu. */
  idleReady: number;
  /** Nu ingezet: minstens één lopende samenwerking. */
  placed: number;
  /** Niet ingezet én (nog) niet inzetbaar (AANDACHT/INACTIEF) — pijplijn vóór plaatsing. */
  needsAttention: number;
  /** Niet ingezet, inzetbaar, maar bewust niet beschikbaar. */
  unavailable: number;
}

/**
 * Of een ZZP'er nu vrij inzetbaar is: inzetbaar (ACTIEF), beschikbaar (AVAILABLE/LIMITED) én zonder
 * lopende opdracht. Gedeelde bron van waarheid voor zowel de samenvatting als het roster-filter
 * (`?idle=1`), zodat de tegel en het gefilterde overzicht nooit uiteenlopen.
 */
export function isIdleReady(z: RosterCapacityInput): boolean {
  return (
    z.activeCollaborations === 0 &&
    z.engageabilityStatus === "ACTIEF" &&
    AVAILABLE_FOR_WORK.has(z.availability) &&
    // Een lopend UNAVAILABLE-venster (vakantie/verlof) dekt nu → geen vrije capaciteit, ook al staat
    // de grove availability-status op beschikbaar. Voorkomt een verspilde voordracht.
    !z.unavailableNow
  );
}

/**
 * Partitioneert het roster in vier elkaar uitsluitende buckets (placed → needsAttention → idleReady
 * → unavailable), zodat de tellingen samen exact `total` vormen. "Nu ingezet" wint van alle andere
 * signalen: iemand die werkt telt niet mee als vrije capaciteit, ook niet met een aandachtspunt.
 */
export function summarizeRosterCapacity(
  items: readonly RosterCapacityInput[],
): RosterCapacitySummary {
  const summary: RosterCapacitySummary = {
    total: items.length,
    idleReady: 0,
    placed: 0,
    needsAttention: 0,
    unavailable: 0,
  };

  for (const z of items) {
    if (z.activeCollaborations > 0) {
      summary.placed += 1;
    } else if (z.engageabilityStatus !== "ACTIEF") {
      summary.needsAttention += 1;
    } else if (AVAILABLE_FOR_WORK.has(z.availability) && !z.unavailableNow) {
      summary.idleReady += 1;
    } else {
      // Grof niet-beschikbaar (UNAVAILABLE/UNKNOWN) óf een lopend afwezigheidsvenster (vakantie): in
      // beide gevallen bewust nu niet inzetbaar → pijplijn, geen vrije capaciteit.
      summary.unavailable += 1;
    }
  }

  return summary;
}

/**
 * Eén verklarende regel boven de tegels ("wat vraagt nu mijn aandacht?"). `null` bij een leeg roster
 * — dan toont de pagina zijn eigen lege staat.
 */
export function rosterCapacityHeadline(summary: RosterCapacitySummary): string | null {
  if (summary.total === 0) return null;
  if (summary.idleReady > 0) {
    return `${plural(summary.idleReady, "vakmens", "vakmensen")} nu vrij inzetbaar — beschikbaar, inzetbaar en zonder lopende opdracht.`;
  }
  if (summary.needsAttention > 0) {
    return `Geen vrij-inzetbare vakmensen; ${summary.needsAttention} ${summary.needsAttention === 1 ? "vraagt" : "vragen"} aandacht vóór plaatsing.`;
  }
  if (summary.placed === summary.total) {
    return "Iedereen in je roster is nu ingezet.";
  }
  return "Geen vrij-inzetbare vakmensen op dit moment.";
}
