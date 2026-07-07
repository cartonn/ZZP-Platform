// CSV-export van het BTW-kwartaaloverzicht voor het lopende jaar (§5). Alleen de eigen administratie.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { type LedgerParty } from "@/lib/administration/ledger";
import { vatYear, type LedgerEntry } from "@/lib/administration/overview";
import { vatReturnsCsv } from "@/lib/administration/csv";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const limited = await enforceRateLimit(exportRateLimiter, `administratie-btw:${actor.id}`);
  if (limited) return limited;

  const party: LedgerParty = actor.role === "CLIENT" ? "CLIENT" : "FREELANCER";
  const year = new Date().getFullYear();

  // unbounded-allow: BTW-aggregatie; volledigheid vereist
  const rows = await prisma.administrationEntry.findMany({
    where: { ownerUserId: actor.id },
    select: { party: true, account: true, debitCents: true, creditCents: true, occurredAt: true },
  });
  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerParty,
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));

  const csv = vatReturnsCsv(vatYear(entries, party, year));

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "VAT_OVERVIEW_EXPORTED",
      entityType: "AdministrationEntry",
      entityId: "self",
      metadata: { year },
    }),
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="btw-${year}.csv"`,
    },
  });
}
