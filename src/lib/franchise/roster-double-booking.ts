// Dubbele-boeking-signaal voor de bemiddelaar (franchiser) die een roster-ZZP'er wil voordragen op een
// dienst (`/franchise/diensten/[id]/voordragen`). Pure, deterministische berekening over de reeds
// tenant-gescopet opgehaalde ACTIEVE samenwerkingen van de ZZP'er — geen I/O, los getest. Een vakmens
// kan niet twee diensten tegelijk draaien; plan je iemand op twee overlappende opdrachten, dan valt er
// gegarandeerd één om. Planningsvriendelijke platforms (Zorgwerk/Pidz) waarschuwen daarom vóór de
// voordracht in plaats van achteraf een no-show te moeten oplossen. De server bepaalt de waarheid;
// deze helper levert enkel het afgeleide waarschuwingssignaal (CLAUDE.md regel 1).

/**
 * Schildwacht voor een open einde: een samenwerking zonder einddatum loopt door tot "ver in de
 * toekomst". `new Date(8640000000000000)` is de maximaal representeerbare Date — elke reële
 * dienststartdatum valt eronder, dus een open-einde-plaatsing overlapt altijd vanaf haar start.
 */
export const FAR_FUTURE = new Date(8640000000000000);

/** Eén ACTIEVE samenwerking van de ZZP'er — genoeg om overlap met een nieuwe dienst te bepalen. */
export interface ActivePlacement {
  collaborationId: string;
  /** De dienst waarop deze samenwerking loopt. */
  jobId: string;
  jobTitle: string;
  /**
   * Tenant van de opdracht/dienst waarop deze samenwerking loopt (`Job.tenantId`); null = platform-
   * opdracht. Bepaalt of de bemiddelaar de TITEL van deze plaatsing mag zien: een roster-ZZP'er kan óók
   * op een opengestelde (overflow) dienst van een ándere franchise of een platform-opdracht staan — die
   * titel is data van een andere tenant en mag nooit naar deze bemiddelaar lekken (tenant-isolatie).
   */
  tenantId: string | null;
  /** Looptijd-start van de samenwerking; null = onbekend → genegeerd (geen vals alarm). */
  startDate: Date | null;
  /** Looptijd-eind; null = open einde (loopt door). */
  endDate: Date | null;
}

export interface DoubleBookingInput {
  /** Startdatum van de dienst waarvoor wordt voorgedragen; null = onbekend → niet te bepalen. */
  dienstStart: Date | null;
  /** Id van de dienst zelf — een samenwerking op DEZE dienst is per definitie geen conflict. */
  dienstJobId: string;
  /**
   * Tenant van de bekijkende bemiddelaar (`actor.tenantId`). Alleen plaatsingen binnen déze tenant
   * geven hun titel prijs; overlappingen op een andere tenant of een platform-opdracht tellen wél mee
   * in de telling maar tonen nooit hun titel (cross-tenant-isolatie, CLAUDE.md regel 2).
   */
  viewerTenantId: string | null;
  /** ACTIEVE samenwerkingen van deze ZZP'er. */
  placements: readonly ActivePlacement[];
}

export interface DoubleBookingSignal {
  /** Aantal overlappende actieve plaatsingen. */
  count: number;
  /** Titel van de vroegst-startende overlappende plaatsing (voor label/tooltip), of null. */
  firstTitle: string | null;
}

/**
 * Of een plaatsing de dienststart afdekt: haar looptijd-venster `[startDate, endDate ?? FAR_FUTURE]`
 * bevat `dienstStart`, inclusief beide grenzen (`start <= dienstStart <= end`). Plaatsingen op de
 * dienst zelf of zonder startdatum tellen niet mee — die worden vóór deze check al uitgefilterd.
 */
function overlapsDienstStart(placement: ActivePlacement, dienstStartMs: number): boolean {
  // startDate is hier gegarandeerd niet-null (uitgefilterd door de aanroeper).
  const startMs = (placement.startDate as Date).getTime();
  const endMs = (placement.endDate ?? FAR_FUTURE).getTime();
  return startMs <= dienstStartMs && dienstStartMs <= endMs;
}

/**
 * Berekent het dubbele-boeking-signaal voor een voordracht: hoeveel andere ACTIEVE samenwerkingen van
 * de ZZP'er lopen op de startdatum van deze dienst, plus de titel van de vroegst-startende daarvan
 * (voor een sprekend label/tooltip). Zuiver afgeleid, geen mutatie van de invoer.
 *
 * Regels:
 * - `dienstStart == null` → `{ count: 0, firstTitle: null }`: zonder datum valt niets te bepalen, dus
 *   geen vals alarm.
 * - Een plaatsing telt als overlap wanneer `jobId !== dienstJobId`, `startDate != null` en het venster
 *   `[startDate, endDate ?? FAR_FUTURE]` de dienststart inclusief omsluit.
 * - Plaatsingen zonder startdatum worden genegeerd (te onzeker → geen vals alarm).
 * - De plaatsing op de dienst zelf telt nooit als conflict (je draagt voor op dezelfde dienst).
 */
export function detectDoubleBooking(input: DoubleBookingInput): DoubleBookingSignal {
  if (input.dienstStart === null) {
    return { count: 0, firstTitle: null };
  }

  const dienstStartMs = input.dienstStart.getTime();

  const overlapping = input.placements.filter(
    (p) =>
      p.jobId !== input.dienstJobId &&
      p.startDate !== null &&
      overlapsDienstStart(p, dienstStartMs),
  );

  // Stabiel sorteren op looptijd-start oplopend (kopie via slice() — de invoer wordt nooit gemuteerd).
  const sorted = overlapping
    .slice()
    .sort((a, b) => (a.startDate as Date).getTime() - (b.startDate as Date).getTime());

  // `firstTitle` is de vroegst-startende overlap BINNEN de eigen tenant; een overlap op een andere
  // tenant of een platform-opdracht telt wél mee (de ZZP'er is die dag bezet) maar geeft nooit haar
  // titel prijs — dat zou dienst-data van een andere bemiddeling naar deze bemiddelaar lekken.
  const earliestSameTenant = sorted.find((p) => p.tenantId === input.viewerTenantId);

  return {
    count: overlapping.length,
    firstTitle: earliestSameTenant ? earliestSameTenant.jobTitle : null,
  };
}
