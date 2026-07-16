// Vat de acute (nu aandacht vragende) open diensten van de bemiddelaar samen tot één next-action.
// De "Wat dreigt onbezet"-kaart op `/franchise/diensten` toont deze diensten al mét de vulbaar/werving-
// triage, maar dat operationeel-urgentste signaal ontbrak in het actiecentrum (`/acties`), de dashboard-
// rail "Volgende acties" en de zijbalk-badge — de item-engine had geen enkele dienst-taak voor de
// bemiddelaar. Deze module levert de pure samenvatting die `pending-tasks.ts` naar een next-action bouwt.
//
// Één bron van waarheid voor "acuut": een open (gepubliceerde, ongevulde) dienst vraagt NU aandacht als
// hij deze week/verleden start of geen startdatum heeft — exact dezelfde definitie als de kaart op de
// diensten-pagina, die `isStartAcute` hergebruikt zodat de twee oppervlakken nooit driften. Pure functie,
// geen DB/IO, deterministisch, los unit-getest. Read-only — geen mutatie, geen nieuw auth-oppervlak.

import { startOfIsoWeek } from "@/lib/franchise/dekkingsprognose";
import {
  summarizeAcuteFillability,
  type AcuteFillabilitySummary,
} from "@/lib/franchise/acute-fillability";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Begin van de eerstvolgende ISO-week (maandag). Alles vóór dit moment telt als "deze week/verleden". */
export function acuteWindowStart(now: Date): number {
  return startOfIsoWeek(now).getTime() + 7 * DAY_MS;
}

/**
 * Startdatum acuut? Geen datum (dan is er sowieso geen planning-buffer), of vóór het begin van volgende
 * week — d.w.z. de dienst start deze week of is al gestart. Zelfde grens als de dekkingsprognose
 * (maandag-start), zodat de diensten-kaart en deze next-action dezelfde diensten als acuut behandelen.
 */
export function isStartAcute(startDate: Date | null, now: Date): boolean {
  return startDate == null || startDate.getTime() < acuteWindowStart(now);
}

/** Eén open dienst met zijn vulgraad-status + al-berekende vulbaar-signaal. */
export interface OpenDienstFillRow {
  /** Gepubliceerd (concept/gesloten tellen niet mee als open dienst). */
  published: boolean;
  /** Gevuld = er loopt een actieve samenwerking op de dienst. */
  filled: boolean;
  /** Startdatum van de dienst (of null = geen datum gepland). */
  startDate: Date | null;
  /** Aantal direct voordraagbare roster-matches (`readyMatches` uit `dienst-fill-signal.ts`). */
  readyMatches: number;
}

/**
 * Vat de acute open diensten samen: aantal + triage (direct vulbaar uit het roster vs. werving nodig).
 * `null` wanneer er geen acute open dienst is (dan hoeft er geen next-action te verschijnen). Leunt op de
 * geteste `summarizeAcuteFillability` voor de vulbaar/werving-splitsing — geen nieuwe rekenlogica.
 */
export function summarizeAcuteOpenDiensten(
  rows: readonly OpenDienstFillRow[],
  now: Date = new Date(),
): AcuteFillabilitySummary | null {
  const acute = rows.filter((r) => r.published && !r.filled && isStartAcute(r.startDate, now));
  if (acute.length === 0) return null;
  return summarizeAcuteFillability(acute.map((r) => ({ readyMatches: r.readyMatches })));
}
