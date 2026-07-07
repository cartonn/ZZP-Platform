// Acquisitie-pijplijn-samenvatting voor de bemiddelaar (franchiser). Pure, deterministische
// aggregatie over de reeds tenant-gescopet opgehaalde leads — geen I/O, los getest. Beantwoordt op
// het lead-overzicht direct "waar staat mijn acquisitie en wat vraagt nu actie?": per-stadium
// tellingen, de actieve pijplijn, het aandachtssignaal (stille + te-late leads) en de conversieratio.
// De server bepaalt de waarheid; deze helper levert enkel de afgeleide presentatie (CLAUDE.md regel 1).

import { LEAD_STATUSES, type LeadStatus } from "@/lib/enums";
import { isLeadStale, isActiveLeadStatus } from "@/lib/leads";

/** Onder deze steekproef tonen we geen conversieratio (anders misleidt een "100%"/"0%"). */
export const LEAD_CONVERSION_MIN_SAMPLE = 4;

/** Minimale invoer per lead — volledig afleidbaar uit de al opgehaalde overzichtsrijen. */
export interface LeadPipelineInput {
  status: LeadStatus;
  /** Hele dagen sinds het laatste contactmoment (zie `daysSinceContact`). */
  daysSinceContact: number;
  /** Geplande opvolgdatum, of `null` als er geen staat. */
  nextFollowUp: Date | null;
}

export interface LeadPipelineSummary {
  total: number;
  /** Telling per stadium (altijd alle stadia aanwezig, ook met 0). */
  byStatus: Record<LeadStatus, number>;
  /** Nog te bewerken pijplijn: koud + warm. */
  active: number;
  /** Binnengehaald: klant. */
  won: number;
  /** Beslist (klant + afgevallen) — de noemer van de conversieratio. */
  decided: number;
  /** Stille warme leads (≥ drempel dagen geen contact). */
  stale: number;
  /** Actieve leads met een opvolgdatum vóór vandaag (te laat opgevolgd). */
  overdueFollowUps: number;
  /** Leads die nu actie vragen: stil óf te laat opgevolgd (geen dubbeltelling). */
  attention: number;
  /**
   * Aandeel gewonnen van de beslíste leads (0–100, afgerond), of `null` bij te weinig steekproef —
   * een percentage over 1–2 leads zou misleiden.
   */
  conversionRate: number | null;
}

/** Een opvolgdatum strikt vóór de UTC-dag van `now` telt als "te laat". */
function isFollowUpOverdue(nextFollowUp: Date | null, now: Date): boolean {
  if (!nextFollowUp) return false;
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dueUTC = Date.UTC(
    nextFollowUp.getUTCFullYear(),
    nextFollowUp.getUTCMonth(),
    nextFollowUp.getUTCDate(),
  );
  return dueUTC < todayUTC;
}

/**
 * Aggregeer de acquisitie-pijplijn. Puur en deterministisch: telt per stadium, bepaalt de actieve
 * pijplijn, het aandachtssignaal (stille warme + te-laat opgevolgde actieve leads, zonder
 * dubbeltelling) en de conversieratio (klant / beslist), en onderdrukt die ratio onder de
 * steekproefdrempel.
 */
export function summarizeLeadPipeline(
  leads: readonly LeadPipelineInput[],
  now: Date,
): LeadPipelineSummary {
  const byStatus: Record<LeadStatus, number> = { KOUD: 0, WARM: 0, KLANT: 0, NO_DEAL: 0 };
  let stale = 0;
  let overdueFollowUps = 0;
  let attention = 0;

  for (const lead of leads) {
    // Defensief: negeer een onbekend stadium i.p.v. een verkeerde telling te produceren.
    if (!(LEAD_STATUSES as readonly string[]).includes(lead.status)) continue;
    byStatus[lead.status] += 1;

    const leadStale = isLeadStale(lead.status, lead.daysSinceContact);
    const leadOverdue =
      isActiveLeadStatus(lead.status) && isFollowUpOverdue(lead.nextFollowUp, now);
    if (leadStale) stale += 1;
    if (leadOverdue) overdueFollowUps += 1;
    if (leadStale || leadOverdue) attention += 1;
  }

  const total = byStatus.KOUD + byStatus.WARM + byStatus.KLANT + byStatus.NO_DEAL;
  const active = byStatus.KOUD + byStatus.WARM;
  const won = byStatus.KLANT;
  const decided = byStatus.KLANT + byStatus.NO_DEAL;
  const conversionRate =
    decided >= LEAD_CONVERSION_MIN_SAMPLE ? Math.round((won / decided) * 100) : null;

  return {
    total,
    byStatus,
    active,
    won,
    decided,
    stale,
    overdueFollowUps,
    attention,
    conversionRate,
  };
}
