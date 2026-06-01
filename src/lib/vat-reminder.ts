// Periodieke BTW-aangifte-herinnering (PLATFORM_OVERHAUL.md §6, backlog item 6).
// Nederland: ZZP'ers dienen elk kwartaal BTW-aangifte te doen bij de Belastingdienst.
// Het platform herinnert de ZZP'er in de laatste 7 dagen van het kwartaal.
// Pure planner; idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.

export interface VatReminderCandidate {
  userId: string;
}

export interface VatReminderItem {
  userId: string;
  quarter: number;
  year: number;
  dedupeKey: string;
  notificationType: string;
  title: string;
  body: string;
}

export interface VatReminderPlan {
  reminders: VatReminderItem[];
}

/** Geeft het kwartaalnummer (1–4) en jaar voor een gegeven datum (UTC). */
export function quarterOf(date: Date): { quarter: number; year: number } {
  return { quarter: Math.ceil((date.getUTCMonth() + 1) / 3), year: date.getUTCFullYear() };
}

/** Laatste dag van een kwartaal (bijv. Q1 = 31 maart), einde van de dag UTC. */
export function quarterEndDate(year: number, quarter: number): Date {
  const lastMonth = quarter * 3; // 3, 6, 9, 12
  return new Date(Date.UTC(year, lastMonth, 0, 23, 59, 59, 999));
}

/**
 * Is `now` binnen de laatste `windowDays` dagen van het lopende kwartaal?
 * Standaard 7 dagen. Dag 0 t/m windowDays-1 vóór het einde triggert de herinnering.
 */
export function isInReminderWindow(now: Date, windowDays = 7): boolean {
  const { quarter, year } = quarterOf(now);
  const end = quarterEndDate(year, quarter);
  const msInDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.floor((end.getTime() - now.getTime()) / msInDay);
  return daysLeft >= 0 && daysLeft < windowDays;
}

export function planVatReminders(
  candidates: readonly VatReminderCandidate[],
  now: Date = new Date(),
): VatReminderPlan {
  if (!isInReminderWindow(now)) return { reminders: [] };

  const { quarter, year } = quarterOf(now);
  const reminders: VatReminderItem[] = candidates.map((c) => ({
    userId: c.userId,
    quarter,
    year,
    dedupeKey: `vat-reminder-${c.userId}-${year}-Q${quarter}`,
    notificationType: "VAT_REMINDER",
    title: `BTW-aangifte Q${quarter} ${year}`,
    body: `Het einde van kwartaal ${quarter} (${year}) nadert. Vergeet niet je BTW-aangifte in te dienen bij de Belastingdienst.`,
  }));

  return { reminders };
}
