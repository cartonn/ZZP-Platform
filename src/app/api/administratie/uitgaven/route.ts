// CSV-export van de vastgelegde zakelijke uitgaven van de ZZP'er (§5: exporteerbaar voor de
// boekhouder). Alleen de eigen administratie (owner-gescopet op `userId`), rol FREELANCER (alleen de
// ZZP'er boekt uitgaven — parity met `uitgaven/actions.ts`). Read-only, rate-limited, geaudit
// (AVG art. 5(2), parity met de andere administratie-export-routes). Server-side is de waarheid.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { expensesCsv, type ExpenseCsvRow } from "@/lib/administration/expenses-csv";
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
  if (actor.role !== "FREELANCER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `administratie-uitgaven:${actor.id}`);
  if (limited) return limited;

  // unbounded-allow: volledige kostenlijst voor de boekhouder; owner-gescopet, geen cross-tenant lek.
  const rows = await prisma.expense.findMany({
    where: { userId: actor.id },
    select: { occurredAt: true, description: true, category: true, netCents: true, vatCents: true },
  });

  const csv = expensesCsv(rows as ExpenseCsvRow[]);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "EXPENSES_EXPORTED",
      entityType: "Expense",
      entityId: "self",
      metadata: { count: rows.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="uitgaven-${date}.csv"`,
    },
  });
}
