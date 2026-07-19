import { prisma } from "@/lib/db";
import { administrationPartyForRole, type LedgerEntry } from "@/lib/administration/overview";
import {
  precedingQuarter,
  previousQuarter,
  summarizeVatDeadlines,
  vatQuarterRange,
  VAT_DEADLINE_LOOKBACK_QUARTERS,
  type VatDeadlineSummary,
} from "@/lib/administration/vat-deadline";
import { type UserRole } from "@/lib/enums";

/**
 * Haalt álle openstaande BTW-aangiftevensters op die nú een next-action verdienen (deadline
 * binnenkort/verstreken én een niet-nul saldo) — niet alleen het vorige kwartaal, zodat een
 * overgeslagen, nooit-afgehandeld kwartaal niet stil verdwijnt bij de kwartaal-rollover. Voedt de
 * betaal-/aangifte-taken in de actie-rail (`/acties` + dashboard). Geen fiscaal advies.
 *
 * De query is hard begrensd tot het scanvenster (`VAT_DEADLINE_LOOKBACK_QUARTERS` kwartalen, t/m het
 * vorige kwartaal) en owner-gescoopt: die set is inherent klein en spiegelt exact de entries die de
 * pure `vatReturn` per kwartaal ziet. Alleen ZZP'er/opdrachtgever hebben een eigen grootboek; andere
 * rollen leveren een lege lijst.
 */
export async function getVatDeadlinesForActor(
  userId: string,
  role: UserRole,
  now: Date = new Date(),
): Promise<VatDeadlineSummary[]> {
  const party = administrationPartyForRole(role);
  if (!party) return [];

  const target = previousQuarter(now);
  const { end } = vatQuarterRange(target.year, target.quarter);
  // Oudste kwartaal in het scanvenster (VAT_DEADLINE_LOOKBACK_QUARTERS-1 stappen terug).
  let oldest = target;
  for (let i = 1; i < VAT_DEADLINE_LOOKBACK_QUARTERS; i++) {
    oldest = precedingQuarter(oldest.year, oldest.quarter);
  }
  const { start } = vatQuarterRange(oldest.year, oldest.quarter);

  // venster-gescoopte, owner-gescoopte query: begrensd tot het scanvenster van BTW-tijdvakken.
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

  return summarizeVatDeadlines(entries, party, now);
}
