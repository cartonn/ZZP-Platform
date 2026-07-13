import { prisma } from "@/lib/db";
import { administrationPartyForRole, type LedgerEntry } from "@/lib/administration/overview";
import {
  previousQuarter,
  summarizeVatDeadline,
  vatDeadlineNeedsAction,
  vatQuarterRange,
  type VatDeadlineSummary,
} from "@/lib/administration/vat-deadline";
import { type UserRole } from "@/lib/enums";

/**
 * Haalt het BTW-aangiftevenster van het meest recent afgesloten kwartaal op en geeft het alleen terug
 * wanneer het een next-action verdient (deadline binnenkort/verstreken én een niet-nul saldo). Voedt
 * de betaal-/aangifte-taak in de actie-rail (`/acties` + dashboard). Geen fiscaal advies.
 *
 * De query is hard begrensd tot precies het doelkwartaal (`vatQuarterRange`) en owner-gescoopt: die
 * set is inherent klein en spiegelt exact de entries die de pure `vatReturn` binnen dat kwartaal ziet.
 * Alleen ZZP'er/opdrachtgever hebben een eigen grootboek; andere rollen leveren `null`.
 */
export async function getVatDeadlineForActor(
  userId: string,
  role: UserRole,
  now: Date = new Date(),
): Promise<VatDeadlineSummary | null> {
  const party = administrationPartyForRole(role);
  if (!party) return null;

  const { year, quarter } = previousQuarter(now);
  const { start, end } = vatQuarterRange(year, quarter);

  // kwartaal-gescoopte, owner-gescoopte query: klein en gebonden aan één BTW-tijdvak.
  const rows = await prisma.administrationEntry.findMany({
    where: { ownerUserId: userId, occurredAt: { gte: start, lt: end } },
    select: {
      party: true,
      account: true,
      debitCents: true,
      creditCents: true,
      occurredAt: true,
    },
  });

  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerEntry["party"],
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));

  const summary = summarizeVatDeadline(entries, party, now);
  return vatDeadlineNeedsAction(summary) ? summary : null;
}
