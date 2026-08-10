// Server-side loader: verzamelt de administratieve deadlines van één gebruiker (certificaat-verloop,
// factuur-vervaldatum, BTW-aangifte) en mapt ze naar de pure AdministrativeDeadlines-projectie die de
// .ics-serialisatie voedt. Gedeeld door de sessie-export (/api/agenda) én de publieke abonneer-feed
// (/api/agenda/feed.ics), zodat beide exact dezelfde deadlines en scoping gebruiken — alleen de eigen
// data van de gebruiker, nooit die van een ander.
//
// Hergebruikt bestaande engines/regels (geen nieuwe rekenlogica): de canonieke "openstaand"-where
// (administration/outstanding.ts) en de BTW-deadline-engine (data/vat-deadline.ts).

import { prisma } from "@/lib/db";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import { getVatDeadlinesForActor } from "@/lib/data/vat-deadline";
import { getIncomeTaxDeadlineForActor } from "@/lib/data/income-tax-deadline";
import { type UserRole } from "@/lib/enums";
import { type AdministrativeDeadlines } from "@/lib/calendar/deadlines";

/**
 * Laadt de administratieve deadlines van `userId` (met rol `role`). Puur read-only; geen mutatie.
 *
 * - Certificaten: alleen ZZP'ers hebben een eigen dossier — VERIFIED credentials met een verloopdatum.
 * - Facturen: openstaand (canonieke where) waarin de gebruiker uitschrijver (ZZP'er) óf tegenpartij
 *   (opdrachtgever) is, met een gezette `dueAt`.
 * - BTW: gedelegeerd aan de bestaande deadline-engine (leeg voor rollen zonder eigen grootboek).
 * - Inkomstenbelasting: de eerstvolgende IB-aangifte-deadline (1 mei ná het belastingjaar), alleen
 *   voor een ZZP'er met omzet in dat jaar; anders `null`.
 *
 * BTW-reikwijdte (bewust smaller dan certificaten/facturen): `getVatDeadlinesForActor` levert alleen
 * kwartalen die nú actie verdienen — deadline binnen ~14 dagen óf verstreken, én een niet-nul saldo.
 * Voor een agenda is dat precies het bruikbare venster: een nihil-kwartaal hoeft geen herinnering en
 * een deadline drie maanden vooruit is nog geen actie. Certificaten/facturen tonen wél de volle
 * horizon omdat hun verloop-/vervaldatum op zichzelf al de te agenderen datum ís. De IB-deadline is
 * bewust forward-looking (er is geen "ingediend"-vlag): we agenderen altijd de eerstvolgende, nog niet
 * verstreken deadline zodat een agenda-app hem ruim vooraf toont.
 */
export async function loadUserAdministrativeDeadlines(
  userId: string,
  role: UserRole,
  now: Date = new Date(),
): Promise<AdministrativeDeadlines> {
  const [credentialRows, invoiceRows, vatSummaries, incomeTax] = await Promise.all([
    role === "FREELANCER"
      ? prisma.credential.findMany({
          where: {
            status: "VERIFIED",
            expiresAt: { not: null },
            freelancerProfile: { userId },
          },
          orderBy: { expiresAt: "asc" },
          select: { id: true, title: true, expiresAt: true },
        })
      : Promise.resolve([]),
    prisma.invoice.findMany({
      where: {
        dueAt: { not: null },
        AND: [
          outstandingInvoiceWhere,
          { OR: [{ issuerUserId: userId }, { counterpartyUserId: userId }] },
        ],
      },
      orderBy: { dueAt: "asc" },
      select: { id: true, number: true, dueAt: true, counterpartyUserId: true },
    }),
    getVatDeadlinesForActor(userId, role, now),
    getIncomeTaxDeadlineForActor(userId, role, now),
  ]);

  return {
    // expiresAt/dueAt zijn door de where-clausules gegarandeerd non-null; de `== null`-guard in de
    // flatMap maakt dat typebreed expliciet (narrowing) zonder een non-null-assertion.
    credentials: credentialRows.flatMap((c) =>
      c.expiresAt == null ? [] : [{ id: c.id, title: c.title, expiresAt: c.expiresAt }],
    ),
    invoices: invoiceRows.flatMap((i) =>
      i.dueAt == null
        ? []
        : [
            {
              id: i.id,
              number: i.number,
              dueAt: i.dueAt,
              // De opdrachtgever (tegenpartij) betaalt; de uitschrijver (ZZP'er) ontvangt.
              payable: i.counterpartyUserId === userId,
            },
          ],
    ),
    vat: vatSummaries.map((v) => ({ year: v.year, quarter: v.quarter, deadline: v.deadline })),
    incomeTax: incomeTax ? { taxYear: incomeTax.taxYear, deadline: incomeTax.deadline } : null,
  };
}
