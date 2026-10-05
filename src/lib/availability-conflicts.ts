// Conflictdetectie voor beschikbaarheidsvensters: pure helper die bepaalt of een
// UNAVAILABLE-venster overlapt met de looptijd van een actieve samenwerking.
// Server-side waarheid; geen I/O; geen `any`. Pure functies, getest.

import { type AvailabilityWindowType } from "@/lib/enums";

// Verre toekomst als schildwacht voor open-einde samenwerkingen.
const FAR_FUTURE = new Date(8640000000000000);

// Vensters en samenwerkingen bewaren hun einddatum als kale (UTC-middernacht) datum, en de
// einddatum is INCLUSIEF: een venster t/m 12 juni dekt de héle 12e. De rest van de module
// (`availability.ts` → `inclusiveEndMs = endDate + DAY_MS`) hanteert exact deze conventie.
// `now` is daarentegen een echt tijdstip (bv. 12 juni 10:00). Zonder de dag-correctie zou een
// nog-lopend venster/overlap op zijn laatste dag na middernacht al als "verleden" wegvallen,
// waardoor een actief conflict stil verdwijnt juist op de dag dat het nog geldt.
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ConflictWindowInput {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AvailabilityWindowType; // "AVAILABLE" | "LIMITED" | "UNAVAILABLE"
}

export interface ConflictCollaborationInput {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  jobTitle: string;
  clientName: string;
}

export interface AvailabilityConflict {
  collaborationId: string;
  jobTitle: string;
  clientName: string;
  windowId: string;
  windowType: AvailabilityWindowType; // altijd "UNAVAILABLE" in deze versie
  windowStart: Date;
  windowEnd: Date;
  overlapStart: Date;
  overlapEnd: Date;
}

/**
 * Detecteer conflicten: UNAVAILABLE-vensters die overlappen met de looptijd van
 * samenwerkingen. Geeft per (venster × samenwerking) precies één conflict terug,
 * gesorteerd op overlapStart oplopend; bij gelijkheid op collaborationId.
 *
 * @param windows       - Lijst van beschikbaarheidsvensters van de freelancer.
 * @param collaborations - Lijst van samenwerkingen (actief of gepland).
 * @param now           - Referentiemoment; standaard `new Date()`.
 */
export function detectAvailabilityConflicts(
  windows: readonly ConflictWindowInput[],
  collaborations: readonly ConflictCollaborationInput[],
  now: Date = new Date(),
): AvailabilityConflict[] {
  // Stap 1: Alleen UNAVAILABLE-vensters die niet volledig in het verleden liggen. De einddatum is
  // inclusief (zie DAY_MS): een venster t/m vandaag loopt tot en met het einde van vandaag.
  const relevantWindows = windows.filter(
    (w) => w.type === "UNAVAILABLE" && w.endDate.getTime() + DAY_MS > now.getTime(),
  );

  const conflicts: AvailabilityConflict[] = [];

  for (const window of relevantWindows) {
    for (const collab of collaborations) {
      // Effectief bereik van de samenwerking: null wordt vervangen door schildwacht.
      const collabStart = collab.startDate ?? now;
      const collabEnd = collab.endDate ?? FAR_FUTURE;

      // Twee inclusieve bereiken [a1,a2] en [b1,b2] overlappen als a1 <= b2 && b1 <= a2.
      const overlaps =
        window.startDate.getTime() <= collabEnd.getTime() &&
        collabStart.getTime() <= window.endDate.getTime();

      if (!overlaps) continue;

      // Bereken de overlappende periode.
      const overlapStart = new Date(Math.max(collabStart.getTime(), window.startDate.getTime()));
      const overlapEnd = new Date(Math.min(collabEnd.getTime(), window.endDate.getTime()));

      // Sla de overlap over als die volledig in het verleden ligt. overlapEnd is inclusief
      // (kale datum), dus de overlap loopt tot en met het einde van die dag (+ DAY_MS).
      if (overlapEnd.getTime() + DAY_MS <= now.getTime()) continue;

      conflicts.push({
        collaborationId: collab.id,
        jobTitle: collab.jobTitle,
        clientName: collab.clientName,
        windowId: window.id,
        windowType: window.type,
        windowStart: window.startDate,
        windowEnd: window.endDate,
        overlapStart,
        overlapEnd,
      });
    }
  }

  // Sorteer op overlapStart oplopend; bij gelijkheid op collaborationId voor determinisme.
  conflicts.sort((a, b) => {
    const timeDiff = a.overlapStart.getTime() - b.overlapStart.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.collaborationId.localeCompare(b.collaborationId);
  });

  return conflicts;
}
