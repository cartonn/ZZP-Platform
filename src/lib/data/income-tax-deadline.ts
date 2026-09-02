import { prisma } from "@/lib/db";
import {
  administrationPartyForRole,
  revenueCents,
  type LedgerEntry,
} from "@/lib/administration/overview";
import {
  summarizeIncomeTaxDeadline,
  taxYearRange,
  type IncomeTaxDeadlineSummary,
} from "@/lib/administration/income-tax-deadline";
import { type UserRole } from "@/lib/enums";

/**
 * De eerstvolgende aangifte-inkomstenbelasting-deadline die de gebruiker moet agenderen, óf `null`.
 *
 * Alleen relevant voor de ZZP'er (winst uit onderneming); andere rollen → `null`. Om ruis te vermijden
 * bij een net-gestarte of slapende onderneming leveren we de deadline alléén op als er in het te
 * agenderen belastingjaar daadwerkelijk omzet is geboekt (`revenueCents > 0`) — vergelijkbaar met de
 * niet-nul-saldo-gate op de BTW-deadline. De query is hard begrensd tot dat ene belastingjaar en
 * owner-gescoopt. Geen fiscaal advies.
 */
export async function getIncomeTaxDeadlineForActor(
  userId: string,
  role: UserRole,
  now: Date = new Date(),
): Promise<IncomeTaxDeadlineSummary | null> {
  const party = administrationPartyForRole(role);
  if (party !== "FREELANCER") return null;

  const summary = summarizeIncomeTaxDeadline(now);
  const { start, end } = taxYearRange(summary.taxYear);

  // unbounded-allow: jaar- én owner-gescoopte grootboekregels; afkappen zou het jaartotaal vervalsen
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

  // Geen geboekte omzet in dit jaar → geen agendapunt (voorkomt ruis bij nul-activiteit).
  if (revenueCents(entries, party, summary.taxYear) <= 0) return null;

  return summary;
}
