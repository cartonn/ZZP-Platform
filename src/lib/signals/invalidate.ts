// Invalidatie van signaal-snapshots — bewust een EIGEN, piepklein bestand.
//
// Mutatiepaden (de cascade-commando's, serveracties) moeten een snapshot kunnen laten vervallen
// zonder de hele berekening te importeren: `snapshot.ts` trekt `signals.ts` + `pending-tasks.ts` mee,
// en die horen niet in de importgraaf van een schrijfpad thuis. Hier staat daarom alleen de write.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";

/** Verleden-tijdstempel dat élke verssheidstoets faalt (`staleAfter <= nu`). */
const EXPIRED_AT = new Date(0);

/**
 * Markeer de snapshots van deze gebruikers als verlopen — de volgende shell-render herberekent.
 * Bewust een `staleAfter`-stempel en geen delete: de bewaarde waarden blijven beschikbaar voor de
 * drift-meting in de reconciliatietaak. Best-effort en stil bij fouten: invalidatie mag een mutatie
 * nooit laten falen (de TTL op de snapshot vangt 'm dan alsnog op). Lege/dubbele id's worden
 * gefilterd, zodat aanroepers geen defensieve code nodig hebben.
 */
export async function invalidateSignals(
  userIds: readonly (string | null | undefined)[],
): Promise<void> {
  const ids = [
    ...new Set(userIds.filter((id): id is string => typeof id === "string" && id.length > 0)),
  ];
  if (ids.length === 0) return;
  try {
    await prisma.userSignalSnapshot.updateMany({
      where: { userId: { in: ids } },
      data: { staleAfter: EXPIRED_AT },
    });
  } catch (err) {
    logger.warn("signal-snapshot: invalidatie mislukt", { count: ids.length, err: String(err) });
  }
}
