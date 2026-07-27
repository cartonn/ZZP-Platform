// Acuut-onbezet-signaal voor de opdrachtgever op de eigen opdrachtkaart ("Mijn opdrachten"): een
// gepubliceerde opdracht waarvan de startdatum nadert of al verstreken is, terwijl er nog niemand
// geplaatst is. Dit is een distinct, urgenter risico dan het vacaturetempo (`summarizeVacancyPerformance`,
// respons-momentum): een opdracht kan prima reacties krijgen en tóch morgen ongevuld starten. Spiegelt
// de bemiddelaar-acute-onbezet-taak (`franchise/acute-open-diensten.ts`), maar dan voor de directe
// opdrachtgever op zijn eigen opdrachtkaart. Puur en deterministisch; geen I/O.
//
// "Vervuld" = er loopt een niet-geannuleerde samenwerking (PROPOSED/ACTIVE/COMPLETED) op de opdracht;
// dat wordt server-side bepaald en als `filled` doorgegeven. Zwijgt bij een vervulde opdracht, een
// niet-gepubliceerde opdracht (concept/gesloten) én een opdracht zonder startdatum (dan is er geen
// planning-deadline om alarm op te slaan) — zo blijft de kaart rustig.

import { type JobStatus } from "@/lib/enums";

/** Binnen dit venster (dagen tot start) telt een ongevulde opdracht als "acuut". */
export const JOB_FILL_ACUTE_DAYS = 7;
/** Binnen dit venster (dagen tot start) tonen we het zachtere "start binnenkort"-signaal. */
export const JOB_FILL_SOON_DAYS = 21;

export type JobFillUrgencyTone = "acute" | "soon";

export interface JobFillUrgencyChip {
  tone: JobFillUrgencyTone;
  /** Korte NL-tekst voor de kaart, bv. "Start morgen · nog niet vervuld". */
  label: string;
  /** Hele dagen tot de start (UTC-dagen); negatief = startdatum al verstreken. */
  days: number;
}

export interface JobFillUrgencyInput {
  status: JobStatus;
  startDate: Date | null;
  /** True zodra er een niet-geannuleerde samenwerking op de opdracht loopt. */
  filled: boolean;
}

function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Classificeert een opdracht naar een acuut-onbezet-signaal t.o.v. `now`. Geeft `null` (geen chip)
 * wanneer de opdracht niet gepubliceerd is, al vervuld is, geen startdatum heeft, of de start verder
 * weg ligt dan de soon-horizon.
 */
export function jobFillUrgency(
  input: JobFillUrgencyInput,
  now: Date = new Date(),
): JobFillUrgencyChip | null {
  if (input.status !== "PUBLISHED" || input.filled || input.startDate == null) return null;

  const days = Math.round((utcMidnightMs(input.startDate) - utcMidnightMs(now)) / 86_400_000);

  if (days < 0) {
    return { tone: "acute", label: "Startdatum verstreken · nog niet vervuld", days };
  }
  const when =
    days === 0 ? "Start vandaag" : days === 1 ? "Start morgen" : `Start over ${days} dagen`;
  if (days <= JOB_FILL_ACUTE_DAYS) {
    return { tone: "acute", label: `${when} · nog niet vervuld`, days };
  }
  if (days <= JOB_FILL_SOON_DAYS) {
    return { tone: "soon", label: `${when} · nog niet vervuld`, days };
  }
  return null;
}
