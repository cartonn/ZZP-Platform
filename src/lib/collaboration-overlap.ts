// Dubbelboeking-detectie voor de ZZP'er zelf: overlappen twee eigen lopende/voorgestelde
// samenwerkingen qua looptijd? Een vakmens kan niet twee opdrachten tegelijk draaien; werk komt
// echter uit meerdere kanalen (platform-opdrachten, directe klanten, verschillende bemiddelaars),
// dus twee toezeggingen kunnen ongemerkt botsen. De bemiddelaar krijgt dit signaal al bij een
// voordracht (`franchise/roster-double-booking`); de vakmens zelf niet. Planningsvriendelijke
// platforms (Zorgwerk/Pidz) waarschuwen vóór de botsing i.p.v. achteraf een no-show op te lossen.
// Puur en deterministisch; geen I/O; server-side waarheid (CLAUDE.md regel 1). Los getest.

// Schildwacht voor een open einde: een samenwerking zonder einddatum loopt door tot "ver in de
// toekomst". `new Date(8640000000000000)` is de maximaal representeerbare Date — elke reële
// startdatum valt eronder, dus een open-einde-samenwerking overlapt altijd vanaf haar start.
const FAR_FUTURE = new Date(8640000000000000);

/** Eén eigen samenwerking van de ZZP'er — genoeg om overlap met een andere te bepalen. */
export interface OverlapPlacementInput {
  id: string;
  jobTitle: string;
  clientName: string;
  /** Looptijd-start; null = onbekend → genegeerd (geen vals alarm). */
  startDate: Date | null;
  /** Looptijd-eind; null = open einde (loopt door tot de schildwacht). */
  endDate: Date | null;
}

/** Eén gedetecteerde dubbelboeking tussen twee eigen samenwerkingen. */
export interface CollaborationOverlap {
  aId: string;
  aTitle: string;
  aClient: string;
  bId: string;
  bTitle: string;
  bClient: string;
  /** Begin van de overlappende periode (inclusief). */
  overlapStart: Date;
  /** Einde van de overlappende periode (inclusief). */
  overlapEnd: Date;
}

/**
 * Detecteer overlappende paren onder de eigen lopende/voorgestelde samenwerkingen. Geeft per uniek
 * paar (i < j) precies één conflict terug, gesorteerd op overlapStart oplopend; bij gelijkheid op de
 * gecombineerde ids voor determinisme.
 *
 * Regels:
 * - Een samenwerking zonder `startDate` doet niet mee (looptijd onbepaald → geen vals alarm), gelijk
 *   aan de bemiddelaar-tegenhanger.
 * - `endDate` null = open einde → schildwacht `FAR_FUTURE`.
 * - Inclusieve bereiken [aStart,aEnd] en [bStart,bEnd] overlappen als aStart <= bEnd && bStart <= aEnd.
 * - Een overlap die volledig in het verleden ligt (overlapEnd < now) wordt overgeslagen: een botsing
 *   die al voorbij is, vraagt geen actie meer.
 *
 * @param placements - Eigen samenwerkingen (PROPOSED/ACTIVE).
 * @param now        - Referentiemoment; standaard `new Date()`.
 */
export function findCollaborationOverlaps(
  placements: readonly OverlapPlacementInput[],
  now: Date = new Date(),
): CollaborationOverlap[] {
  // Alleen samenwerkingen met een bekende start doen mee; behoud de oorspronkelijke volgorde.
  const dated = placements.filter((p) => p.startDate !== null);
  const overlaps: CollaborationOverlap[] = [];

  for (let i = 0; i < dated.length; i += 1) {
    const a = dated[i];
    if (!a) continue;
    for (let j = i + 1; j < dated.length; j += 1) {
      const b = dated[j];
      if (!b) continue;

      // startDate is hierboven op non-null gefilterd; de `?? now` is puur een type-narrowing-vangnet.
      const aStart = (a.startDate ?? now).getTime();
      const aEnd = (a.endDate ?? FAR_FUTURE).getTime();
      const bStart = (b.startDate ?? now).getTime();
      const bEnd = (b.endDate ?? FAR_FUTURE).getTime();

      // Twee inclusieve bereiken overlappen als aStart <= bEnd && bStart <= aEnd.
      if (aStart > bEnd || bStart > aEnd) continue;

      const overlapStart = new Date(Math.max(aStart, bStart));
      const overlapEnd = new Date(Math.min(aEnd, bEnd));

      // Sla een botsing over die volledig in het verleden ligt.
      if (overlapEnd.getTime() < now.getTime()) continue;

      overlaps.push({
        aId: a.id,
        aTitle: a.jobTitle,
        aClient: a.clientName,
        bId: b.id,
        bTitle: b.jobTitle,
        bClient: b.clientName,
        overlapStart,
        overlapEnd,
      });
    }
  }

  overlaps.sort((x, y) => {
    const timeDiff = x.overlapStart.getTime() - y.overlapStart.getTime();
    if (timeDiff !== 0) return timeDiff;
    return `${x.aId}-${x.bId}`.localeCompare(`${y.aId}-${y.bId}`);
  });

  return overlaps;
}
