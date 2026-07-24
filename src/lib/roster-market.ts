// Rooster-marktplaats: pure bucketing van gepubliceerde opdrachten met startdatum per kalenderdag.
// Geen I/O, geen Prisma, geen Next.js — alleen deterministisch transformeren van input naar output.
// Server-side waarheid (CLAUDE.md regel 1); mutaties lopen via bestaande opdracht-detail/reageer-flow.

import { type Weekday, WEEKDAYS } from "@/lib/enums";
import { startOfIsoWeek } from "@/lib/week-overview";

export interface RosterShiftInput {
  jobId: string;
  title: string;
  companyName: string;
  startDate: Date;
  rateMin: number | null;
  rateMax: number | null;
  location: string | null;
  workMode: string;
  matchScore: number | null; // null als geen ZZP-profiel (bv. ADMIN)
  alreadyApplied: boolean;
  topReason?: string | null; // zwaarst wegende troef uit de matchmotor (null als geen)
  topGap?: string | null; // zwaarst wegende minpunt uit de matchmotor (null als geen)
}

export interface RosterDay {
  date: Date; // UTC-middernacht van de kalenderdag
  weekday: Weekday; // "MON".."SUN" uit @/lib/enums
  isToday: boolean;
  shifts: RosterShiftInput[];
}

export interface RosterCalendar {
  days: RosterDay[]; // alleen dagen mét diensten, oplopend gesorteerd
  total: number; // aantal diensten geplaatst binnen de horizon
  beyondHorizon: number; // aantal diensten ná de horizon (telt voor een "later"-noot)
}

/** Leidt de UTC-middernacht van een datum af (ms). */
function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Mapt getUTCDay() (0=zo..6=za) naar WEEKDAYS-index (0=ma..6=zo). */
function utcDayToWeekday(utcDay: number): Weekday {
  // ISO: maandag = 0, ..., zondag = 6 → (utcDay + 6) % 7
  // Alle 7 waarden (0-6) zijn gegarandeerd aanwezig; de niet-null-assertie is veilig.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return WEEKDAYS[(utcDay + 6) % 7]!;
}

/**
 * Groepeert diensten met startdatum in een rooster-kalender voor de komende horizonDays dagen.
 * - Diensten vóór vandaag worden genegeerd.
 * - Diensten ná de horizon worden geteld in `beyondHorizon` maar niet in `days` geplaatst.
 * - Binnen een dag: matchScore desc (null achteraan), dan startDate asc, dan title asc.
 * - Muteert de input-array niet.
 */
export function buildRosterCalendar(
  shifts: readonly RosterShiftInput[],
  now: Date = new Date(),
  horizonDays = 21,
): RosterCalendar {
  const todayMs = utcMidnightMs(now);
  const horizonMs = todayMs + horizonDays * 86_400_000;

  // Bucket: dayMs -> index in days-array
  const dayIndex = new Map<number, number>();
  const days: RosterDay[] = [];
  let beyondHorizon = 0;

  for (const shift of shifts) {
    const dayMs = utcMidnightMs(shift.startDate);

    if (dayMs < todayMs) continue; // verleden → negeren
    if (dayMs > horizonMs) {
      beyondHorizon++;
      continue;
    }

    const existing = dayIndex.get(dayMs);
    if (existing === undefined) {
      const idx = days.length;
      dayIndex.set(dayMs, idx);
      const date = new Date(dayMs);
      days.push({
        date,
        weekday: utcDayToWeekday(date.getUTCDay()),
        isToday: dayMs === todayMs,
        shifts: [shift],
      });
    } else {
      days[existing]!.shifts.push(shift);
    }
  }

  // Sorteer dagen oplopend
  days.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Sorteer shifts binnen elke dag: matchScore desc (null achteraan), startDate asc, title asc
  for (const day of days) {
    day.shifts.sort((a, b) => {
      // null-score gaat achteraan
      if (a.matchScore !== null && b.matchScore !== null) {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      } else if (a.matchScore !== null) {
        return -1; // a heeft score, b niet → a vóór b
      } else if (b.matchScore !== null) {
        return 1; // b heeft score, a niet → b vóór a
      }
      // tie-break: startDate asc
      const dateDiff = a.startDate.getTime() - b.startDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      // tie-break: title asc
      return a.title.localeCompare(b.title);
    });
  }

  const total = days.reduce((sum, d) => sum + d.shifts.length, 0);

  return { days, total, beyondHorizon };
}

/** Een vastgelegde/geboekte samenwerking van de ZZP'er zelf (ADR-0004 weekrooster). */
export interface BookedCollaborationInput {
  collaborationId: string;
  jobTitle: string;
  clientName: string;
  rate: number | null; // uurtarief in EURO, of null
  startDate: Date | null;
  endDate: Date | null;
  weekdays?: Weekday[]; // ADR-0004; leeg/ontbrekend = niet vastgelegd
}

/** Eén geprojecteerde geplande dienst op een agendadag. */
export interface BookedShiftEntry {
  collaborationId: string;
  jobTitle: string;
  clientName: string;
  rate: number | null;
  scheduled: boolean; // true = uit vastgelegd weekrooster; false = afgeleid uit looptijd
}

/** Eén agendadag: jouw geplande diensten plus open kansen die dag. */
export interface AgendaDay {
  date: Date; // UTC-middernacht van de kalenderdag
  weekday: Weekday; // "MON".."SUN"
  isToday: boolean;
  booked: BookedShiftEntry[]; // jouw geplande diensten die dag
  open: RosterShiftInput[]; // open kansen die dag (1-op-1 uit de RosterCalendar-dag)
}

/** Geïntegreerde agenda: eigen geplande diensten over de open-kansen-kalender. */
export interface Agenda {
  days: AgendaDay[]; // dagen met booked OF open, oplopend op datum
  openTotal: number; // = open.total
  bookedTotal: number; // som van booked-entries over alle dagen
  beyondHorizon: number; // = open.beyondHorizon
}

/**
 * Legt de eigen geboekte/geplande diensten van een ZZP'er over de open-kansen-kalender,
 * zodat /rooster een echte agenda kan tonen. Pure logica, muteert geen enkele input.
 *
 * Projectie per samenwerking over de horizon (vanaf vandaag t/m horizonDays dagen):
 * - Open start → loopt al, vanaf vandaag; open eind → t/m de horizon.
 * - Venster geklemd op [vandaag, horizon]; venster met start > eind draagt niets bij.
 * - Met niet-lege `weekdays`: alleen op die weekdagen (scheduled=true).
 * - Zonder/lege `weekdays`: elke dag in het venster (scheduled=false).
 */
export function buildAgenda(
  open: RosterCalendar,
  collaborations: readonly BookedCollaborationInput[],
  now: Date = new Date(),
  horizonDays = 21,
): Agenda {
  const todayMs = utcMidnightMs(now);
  const horizonMs = todayMs + horizonDays * 86_400_000;

  // Start vanuit de open-kansen-kalender: één AgendaDay per dag met open diensten.
  const dayIndex = new Map<number, number>();
  const days: AgendaDay[] = [];

  for (const day of open.days) {
    const dayMs = day.date.getTime();
    const idx = days.length;
    dayIndex.set(dayMs, idx);
    days.push({
      date: day.date,
      weekday: day.weekday,
      isToday: day.isToday,
      booked: [],
      open: day.shifts, // overnemen, niet hersorteren
    });
  }

  const ensureDay = (dayMs: number): AgendaDay => {
    const existing = dayIndex.get(dayMs);
    if (existing !== undefined) return days[existing]!;
    const idx = days.length;
    dayIndex.set(dayMs, idx);
    const date = new Date(dayMs);
    const agendaDay: AgendaDay = {
      date,
      weekday: utcDayToWeekday(date.getUTCDay()),
      isToday: dayMs === todayMs,
      booked: [],
      open: [],
    };
    days.push(agendaDay);
    return agendaDay;
  };

  for (const collab of collaborations) {
    // Actief venster bepalen, geklemd op [vandaag, horizon].
    let winStart = collab.startDate ? utcMidnightMs(collab.startDate) : todayMs;
    let winEnd = collab.endDate ? utcMidnightMs(collab.endDate) : horizonMs;
    winStart = Math.max(winStart, todayMs);
    winEnd = Math.min(winEnd, horizonMs);
    if (winStart > winEnd) continue; // volledig in verleden of na de horizon

    const hasWeekdays = collab.weekdays !== undefined && collab.weekdays.length > 0;

    for (let dayMs = winStart; dayMs <= winEnd; dayMs += 86_400_000) {
      let scheduled: boolean;
      if (hasWeekdays) {
        const weekday = utcDayToWeekday(new Date(dayMs).getUTCDay());
        if (!collab.weekdays!.includes(weekday)) continue;
        scheduled = true;
      } else {
        scheduled = false;
      }
      ensureDay(dayMs).booked.push({
        collaborationId: collab.collaborationId,
        jobTitle: collab.jobTitle,
        clientName: collab.clientName,
        rate: collab.rate,
        scheduled,
      });
    }
  }

  // Dagen oplopend op datum.
  days.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Booked binnen een dag: clientName, dan jobTitle, dan collaborationId.
  for (const day of days) {
    day.booked.sort((a, b) => {
      const byClient = a.clientName.localeCompare(b.clientName);
      if (byClient !== 0) return byClient;
      const byTitle = a.jobTitle.localeCompare(b.jobTitle);
      if (byTitle !== 0) return byTitle;
      return a.collaborationId.localeCompare(b.collaborationId);
    });
  }

  const bookedTotal = days.reduce((sum, d) => sum + d.booked.length, 0);

  return {
    days,
    openTotal: open.total,
    bookedTotal,
    beyondHorizon: open.beyondHorizon,
  };
}

/** Beknopte "deze week"-samenvatting bovenaan de rooster-agenda. */
export interface RosterWeekSummary {
  /** Maandag 00:00:00.000 UTC van de ISO-week rond de referentiedatum. */
  weekStart: Date;
  /** Zondag 23:59:59.999 UTC van diezelfde ISO-week. */
  weekEnd: Date;
  /** Verschillende geplande diensten (samenwerkingen) die deze week op de agenda staan. */
  plannedCount: number;
  /** Verschillende opdrachtgevers waar deze week een dienst voor gepland staat. */
  clientCount: number;
  /** Open kansen (diensten met startdatum) die deze week beginnen. */
  openCount: number;
}

/**
 * Vat de rooster-agenda samen voor de ISO-week rond `now`: hoeveel geplande diensten en bij hoeveel
 * verschillende opdrachtgevers de ZZP'er deze week staat, plus het aantal open kansen dat deze week
 * begint. Pure afleiding over de reeds-gebouwde agenda (geen I/O), zodat het strip-getal nooit kan
 * driften t.o.v. wat er per dag onder staat.
 *
 * - Een geplande dienst (samenwerking) die meerdere dagen deze week loopt, telt **één keer**
 *   (ontdubbeld op `collaborationId`) — geen opgeblazen dag-telling.
 * - Opdrachtgevers ontdubbeld op naam; open kansen ontdubbeld op `jobId`.
 * - Alleen dagen waarvan de UTC-middernacht binnen [weekStart, weekEnd] valt tellen mee.
 * - Muteert de invoer niet.
 */
export function summarizeRosterWeek(
  days: readonly AgendaDay[],
  now: Date = new Date(),
): RosterWeekSummary {
  const weekStart = startOfIsoWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000 - 1);

  const plannedCollaborations = new Set<string>();
  const clients = new Set<string>();
  const openJobs = new Set<string>();

  for (const day of days) {
    const at = day.date.getTime();
    if (at < weekStart.getTime() || at > weekEnd.getTime()) continue;
    for (const entry of day.booked) {
      plannedCollaborations.add(entry.collaborationId);
      clients.add(entry.clientName);
    }
    for (const shift of day.open) {
      openJobs.add(shift.jobId);
    }
  }

  return {
    weekStart,
    weekEnd,
    plannedCount: plannedCollaborations.size,
    clientCount: clients.size,
    openCount: openJobs.size,
  };
}

/** Drempel waarboven een dienst als "sterke match" voor de ZZP'er telt. */
export const ROSTER_STRONG_MATCH_MIN = 70;

/**
 * Filtert een rooster-kalender tot diensten met een matchScore ≥ min.
 * - Diensten zonder score (null, bv. ADMIN) vallen altijd weg — een drempelfilter
 *   is alleen betekenisvol voor een ZZP'er met een profiel.
 * - Lege dagen worden weggelaten; `total` wordt herberekend.
 * - `beyondHorizon` blijft ongemoeid (telt diensten buiten de horizon, ongefilterd).
 * - Muteert de invoer niet.
 */
export function filterRosterByMinMatch(calendar: RosterCalendar, min: number): RosterCalendar {
  const days: RosterDay[] = [];

  for (const day of calendar.days) {
    const shifts = day.shifts.filter((s) => s.matchScore !== null && s.matchScore >= min);
    if (shifts.length > 0) {
      days.push({ ...day, shifts });
    }
  }

  const total = days.reduce((sum, d) => sum + d.shifts.length, 0);

  return { days, total, beyondHorizon: calendar.beyondHorizon };
}
