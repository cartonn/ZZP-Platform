// CSV-export van de relatie-uitsplitsing op /inzicht: de ZZP'er downloadt zijn betaalde omzet per
// opdrachtgever, de opdrachtgever zijn betaalde uitgaven per ZZP'er — het debiteuren-/crediteuren-
// per-relatie-overzicht voor de boekhouder. Rol-bewust en alleen de eigen relaties: hergebruikt exact
// dezelfde fetchers als de kaarten op het scherm (`getFreelancerRevenueBreakdown` /
// `getClientSpendBreakdown`), dus de export spiegelt de kaart. Geen gegevens van derden. Auditregel
// bij export (AVG art. 5(2)). De franchiser heeft zijn eigen per-opdrachtgever-export
// (/franchise/opdrachtgevers/export); ADMIN gebruikt /admin/facturatie.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getFreelancerRevenueBreakdown } from "@/lib/freelancer-revenue-breakdown";
import { getClientSpendBreakdown } from "@/lib/client-spend-breakdown";
import { relationBreakdownCsv } from "@/lib/relation-breakdown-csv";
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

  if (actor.role !== "FREELANCER" && actor.role !== "CLIENT") {
    return new Response("Niet beschikbaar voor deze rol.", { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `relaties:${actor.id}`);
  if (limited) return limited;

  const isFreelancer = actor.role === "FREELANCER";
  const breakdown = isFreelancer
    ? await getFreelancerRevenueBreakdown(actor.id)
    : await getClientSpendBreakdown(actor.id);

  const csv = relationBreakdownCsv(
    breakdown.rows,
    isFreelancer
      ? { relation: "Opdrachtgever", amount: "Omzet (EUR)" }
      : { relation: "ZZP'er", amount: "Uitgaven (EUR)" },
  );

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "RELATION_BREAKDOWN_EXPORTED",
      entityType: "Invoice",
      entityId: "self",
      metadata: { count: breakdown.rows.length, role: actor.role },
    }),
  });

  const base = isFreelancer ? "omzet-per-opdrachtgever" : "uitgaven-per-zzper";
  const filename = `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
