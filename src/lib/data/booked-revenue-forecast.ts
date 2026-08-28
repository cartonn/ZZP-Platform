import { prisma } from "@/lib/db";
import { parseWeekdays } from "@/lib/weekdays";
import {
  buildBookedRevenueForecast,
  type BookedCollaborationInput,
  type BookedRevenueForecast,
} from "@/lib/booked-revenue-forecast";

/**
 * Laadt de lopende (ACTIVE) samenwerkingen van één ZZP'er en berekent daaruit de geboekte-omzet-
 * vooruitblik. Waar de factuurgedreven prognoses (income-forecast.ts, cashflow-forecast.ts) naar
 * *receivables* kijken — geld voor werk dat al geleverd is — kijkt deze de andere kant op: hoeveel
 * inkomen zit er al vást in de agenda, en wanneer droogt dat op?
 *
 * Server-side is de waarheid (CLAUDE.md regel 1): de berekening gebeurt hier + in de pure lib, de
 * client toont het signaal alleen. De query is freelancer-gescoped via `freelancer: { userId }` —
 * tenant-veilig, nooit data van andere ZZP'ers. De rol-gate ligt op de route.
 *
 * Cap: een vooruitblik over de eerstvolgende ~500 lopende samenwerkingen is ruim voldoende;
 * einddatum oplopend (open einde achteraan) zodat de dichtstbijzijnde afloop nooit buiten de cap valt.
 */
export async function getBookedRevenueForecast(
  userId: string,
  now?: Date,
): Promise<BookedRevenueForecast> {
  const rows = await prisma.collaboration.findMany({
    where: { status: "ACTIVE", freelancer: { userId } },
    orderBy: { endDate: { sort: "asc", nulls: "last" } },
    take: 500,
    select: {
      rate: true,
      startDate: true,
      endDate: true,
      weekdays: true,
      job: { select: { title: true } },
      company: { select: { name: true } },
    },
  });

  const inputs: BookedCollaborationInput[] = rows.map((row) => ({
    rate: row.rate,
    startDate: row.startDate,
    endDate: row.endDate,
    weekdays: parseWeekdays(row.weekdays),
    counterpartyName: row.company.name ?? "—",
    jobTitle: row.job.title ?? null,
  }));

  return buildBookedRevenueForecast(inputs, now ?? new Date());
}
