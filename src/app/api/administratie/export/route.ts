// CSV-export van de eigen administratie (§5, voor de boekhouder). Alleen de eigen grootboekregels;
// geen gegevens van derden. Auditregel bij export.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { administrationCsv } from "@/lib/administration/csv";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const rows = await prisma.administrationEntry.findMany({
    where: { ownerUserId: actor.id },
    select: { occurredAt: true, account: true, debitCents: true, creditCents: true, invoiceId: true, correlationId: true },
  });

  const csv = administrationCsv(rows);

  await prisma.auditLog.create({
    data: auditData({ actorId: actor.id, action: "ADMINISTRATION_EXPORTED", entityType: "AdministrationEntry", entityId: "self", metadata: { count: rows.length } }),
  });

  const filename = `administratie-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
