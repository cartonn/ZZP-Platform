// Vervolgsignaal — wijst beide partijen op een naderende einddatum van een lopende
// samenwerking, zodat ze tijdig een vervolg plannen (Temper/Pidz: "verleng je serie";
// de opdrachtgever raakt een goede ZZP'er niet kwijt, de ZZP'er lijnt de volgende opdracht
// op tijd op). Puur en deterministisch; de server bepaalt de fase, de UI toont alleen.
import { startOfUtcDay } from "./signals";

export type CollaborationRenewalPhase = "none" | "on_track" | "ending_soon" | "overdue" | "lapsed";

export interface CollaborationRenewalInput {
  /** CollaborationStatus — alleen een ACTIVE inzet vraagt om vervolgplanning. */
  status: string;
  /** Einddatum van de samenwerking; null = open einde, geen signaal. */
  endDate: Date | null;
  /** Bevroren door een dispuut → geen vervolg-nudge tot dat is opgelost. */
  disputed?: boolean;
  now?: Date;
  /** Aantal dagen vóór de einddatum waarbinnen we waarschuwen (default 21). */
  windowDays?: number;
  /** Hoeveel dagen ná de einddatum de overdue-nudge nog aandacht vraagt (default 30). */
  overdueGraceDays?: number;
}

export interface CollaborationRenewalSummary {
  phase: CollaborationRenewalPhase;
  /** Hele dagen tot de einddatum (UTC-dag), negatief als de datum verstreken is; null bij geen datum. */
  daysRemaining: number | null;
  /** ending_soon of overdue → toon de nudge. */
  attention: boolean;
}

/** Standaard-venster: binnen drie weken vóór het einde gaan we plannen. */
export const RENEWAL_WINDOW_DAYS = 21;

/**
 * Grace ná de einddatum: een over-de-einddatum ACTIVE-inzet vraagt nog een maand lang aandacht
 * ("plan alsnog een vervolg"), daarna dempt het signaal (`phase: "lapsed"`, geen aandacht meer).
 * Zonder deze grens blijft de overdue-nudge oneindig staan als next-action/badge terwijl geen enkele
 * actie op díe samenwerking hem afhandelt (de vervolg-CTA raakt status/einddatum niet) — exact het
 * anti-patroon dat de codebase voor no-shows bewust vermeed (`no-show.ts`, PR #854). De inzet blijft
 * gewoon zichtbaar in de lijst; alleen de onafhandelbare aandacht-nudge stopt.
 */
export const RENEWAL_OVERDUE_GRACE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Hele kalenderdagen tussen twee momenten (UTC-dag, TZ-robuust). */
function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

export function summarizeCollaborationRenewal(
  input: CollaborationRenewalInput,
): CollaborationRenewalSummary {
  const { status, endDate, disputed = false } = input;
  const now = input.now ?? new Date();
  const windowDays = input.windowDays ?? RENEWAL_WINDOW_DAYS;
  const overdueGraceDays = input.overdueGraceDays ?? RENEWAL_OVERDUE_GRACE_DAYS;

  const none: CollaborationRenewalSummary = {
    phase: "none",
    daysRemaining: null,
    attention: false,
  };

  // Alleen lopende, niet-bevroren inzet met een concrete einddatum.
  if (status !== "ACTIVE" || disputed || !endDate) return none;

  const daysRemaining = wholeDaysBetween(now, endDate);

  if (daysRemaining < 0) {
    // Voorbij de einddatum: vraag nog binnen het grace-venster aandacht, daarna dempen ("lapsed")
    // zodat de onafhandelbare nudge niet oneindig als next-action/badge blijft staan.
    if (-daysRemaining > overdueGraceDays)
      return { phase: "lapsed", daysRemaining, attention: false };
    return { phase: "overdue", daysRemaining, attention: true };
  }
  if (daysRemaining <= windowDays) return { phase: "ending_soon", daysRemaining, attention: true };
  return { phase: "on_track", daysRemaining, attention: false };
}

/**
 * Aantal ACTIVE, niet-bevroren samenwerkingen waarvan het vervolgsignaal aandacht vraagt
 * (`ending_soon` of `overdue`). Exact dezelfde bron als de `collaborationRenewalTask` op /acties +
 * de dashboard-rail (`renewalTasks` in pending-tasks.ts roept dezelfde `summarizeCollaborationRenewal`
 * aan) — zodat de `/samenwerkingen`-nav-badge (`cascadeWork`) die actie meetelt en niet stiller is dan
 * /acties. De caller pre-filtert al op `status:ACTIVE`, `disputedAt:null` en het endDate-venster; de
 * pure functie bepaalt hier de definitieve `attention`-grens (de query-vloer staat één dag losser dan de
 * `lapsed`-demping, dus een enkele doorgelaten rij kan alsnog `lapsed` zijn → telt niet mee). Puur en
 * los testbaar.
 */
export function countAttentionRenewals(
  collabs: readonly { endDate: Date | null }[],
  now: Date,
): number {
  let count = 0;
  for (const c of collabs) {
    if (
      summarizeCollaborationRenewal({ status: "ACTIVE", endDate: c.endDate, disputed: false, now })
        .attention
    )
      count += 1;
  }
  return count;
}

/** Compacte, rustige kop per fase/rol — de nudge zelf blijft advies, geen blokkade. */
export function renewalHeadline(
  phase: CollaborationRenewalPhase,
  daysRemaining: number | null,
): string {
  if (phase === "overdue") return "Deze samenwerking is voorbij de einddatum";
  if (phase === "ending_soon") {
    if (daysRemaining === 0) return "Deze samenwerking loopt vandaag af";
    if (daysRemaining === 1) return "Deze samenwerking loopt morgen af";
    return `Deze samenwerking loopt over ${daysRemaining} dagen af`;
  }
  return "Deze samenwerking loopt nog";
}
