/**
 * Cutover-migratie: vul cascade-velden in op alle legacy-facturen (lifecycleStatus IS NULL).
 *
 * Wat dit doet:
 *  1. Zoekt facturen zonder lifecycleStatus (aangemaakt vóór de overhaul-cascade).
 *  2. Legt issuer/counterparty vast vanuit de koppeling collaboration → freelancer + company.
 *  3. Kent per uitschrijvende partij een doorlopend partyInvoiceNumber toe (jaargebonden).
 *  4. Bijt status op de nieuwe lifecycle (SENT → SUBMITTED, PAID → PROCESSED, OVERDUE → OVERDUE).
 *  5. Werkt InvoiceSequence bij zodat toekomstige cascade-facturen de reeks doorlopen.
 *  6. Alles in één transactie — atomair, idempotent (draai meerdere keren: geen dubbele nummers).
 *
 * Gebruik:
 *   node scripts/migrate-legacy-invoices.mjs [--dry-run]
 *
 * --dry-run: print wat er zou gebeuren, schrijft niets naar de DB.
 */

import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");
const db = new PrismaClient();

// ── Statusmapping ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT: "DRAFT",
  SENT: "SUBMITTED", // verzonden = ingediend bij opdrachtgever
  OVERDUE: "OVERDUE", // te laat → APPROVED was impliciet (werd verzonden)
  PAID: "PROCESSED", // betaald + verwerkt in administratie
  CANCELLED: "CREDITED", // geannuleerd → dichtste eindtoestand in nieuwe lifecycle
};

function mapStatus(oldStatus) {
  const mapped = STATUS_MAP[oldStatus];
  if (!mapped) throw new Error(`Onbekende legacy-status: ${oldStatus}`);
  return mapped;
}

function formatPartyNumber(year, seq) {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

// ── Datum helpers ──────────────────────────────────────────────────────────────
function invoiceYear(inv) {
  const d = inv.issuedAt ?? inv.createdAt;
  return new Date(d).getFullYear();
}

// ── Hoofdlogica ────────────────────────────────────────────────────────────────
async function run() {
  // 1. Laad alle legacy-facturen met hun samenwerking + profielen.
  const legacyInvoices = await db.invoice.findMany({
    where: { lifecycleStatus: null },
    include: {
      collaboration: {
        include: {
          freelancer: { select: { userId: true } },
          company: { select: { userId: true } },
        },
      },
    },
    orderBy: { issuedAt: "asc" }, // chronologisch zodat nummering klopt
  });

  if (legacyInvoices.length === 0) {
    console.log("Geen legacy-facturen gevonden. Migratie niet nodig.");
    await db.$disconnect();
    return;
  }

  console.log(`Gevonden: ${legacyInvoices.length} legacy-factuur(en)\n`);

  // Facturen zonder collaboration (wees-facturen) apart behandelen.
  const orphans = legacyInvoices.filter((inv) => !inv.collaboration);
  const migratable = legacyInvoices.filter((inv) => inv.collaboration);

  if (orphans.length > 0) {
    console.warn(`⚠ ${orphans.length} wees-factuur(en) zonder samenwerking — worden overgeslagen:`);
    for (const o of orphans) console.warn(`   ${o.id} (${o.number}, ${o.status})`);
    console.warn("");
  }

  // 2. Groepeer per issuerKey (freelancerUserId) + jaar.
  //    Sorteer binnen elke groep op datum zodat nummering chronologisch is.
  const groups = new Map(); // key: "${issuerKey}::${year}" → invoice[]
  for (const inv of migratable) {
    const issuerUserId = inv.collaboration.freelancer.userId;
    const year = invoiceYear(inv);
    const key = `${issuerUserId}::${year}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ inv, issuerUserId, year });
  }

  // 3. Laad bestaande InvoiceSequence-records voor de betrokken partijen.
  const issuerYearPairs = [];
  for (const [k] of groups) {
    const [issuerKey, yearStr] = k.split("::");
    issuerYearPairs.push({ issuerKey, year: Number(yearStr) });
  }
  const existingSeqs = await db.invoiceSequence.findMany({
    where: {
      OR: issuerYearPairs.map(({ issuerKey, year }) => ({ issuerKey, year })),
    },
  });
  const seqMap = new Map(); // "${issuerKey}::${year}" → lastSeq
  for (const s of existingSeqs) {
    seqMap.set(`${s.issuerKey}::${s.year}`, s.lastSeq);
  }

  // 4. Wijs nummers toe en bouw update-objecten op.
  const invoiceUpdates = []; // { id, data }
  const seqUpdates = new Map(); // key → { issuerKey, year, lastSeq }

  for (const [groupKey, entries] of groups) {
    const startSeq = seqMap.get(groupKey) ?? 0;
    let seq = startSeq;

    for (const { inv, issuerUserId, year } of entries) {
      seq += 1;
      const counterpartyUserId = inv.collaboration.company.userId;
      const partyInvoiceNumber = formatPartyNumber(year, seq);
      const newLifecycle = mapStatus(inv.status);

      invoiceUpdates.push({
        id: inv.id,
        data: {
          lifecycleStatus: newLifecycle,
          issuerUserId,
          counterpartyUserId,
          issuerKey: issuerUserId,
          partyInvoiceNumber,
          subtotalCents: inv.totalCents,
          vatCents: 0,
          vatRegime: "EXEMPT",
        },
      });

      console.log(
        `  ${inv.id.slice(-8)} | oud: ${inv.number} (${inv.status.padEnd(10)}) ` +
          `→ nieuw: ${partyInvoiceNumber} (${newLifecycle})`,
      );
    }

    seqUpdates.set(groupKey, {
      issuerKey: entries[0].issuerUserId,
      year: entries[0].year,
      lastSeq: seq,
    });
  }

  console.log(
    `\n${invoiceUpdates.length} factuur/facturen te migreren, ${seqUpdates.size} reeks(en) bij te werken.`,
  );

  if (dryRun) {
    console.log("\n[DRY-RUN] Niets geschreven. Voer zonder --dry-run uit om te migreren.");
    await db.$disconnect();
    return;
  }

  // 5. Voer de migratie uit in één transactie.
  await db.$transaction(async (tx) => {
    for (const { id, data } of invoiceUpdates) {
      await tx.invoice.update({ where: { id }, data });
    }

    for (const { issuerKey, year, lastSeq } of seqUpdates.values()) {
      await tx.invoiceSequence.upsert({
        where: { issuerKey_year: { issuerKey, year } },
        create: { issuerKey, year, lastSeq },
        update: { lastSeq },
      });
    }
  });

  console.log("\n✓ Migratie geslaagd.");
  await db.$disconnect();
}

run().catch((err) => {
  console.error("Migratie mislukt:", err);
  process.exit(1);
});
