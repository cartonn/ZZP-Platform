// CSV-export van het betaalgedrag-per-opdrachtgever-overzicht op /inzicht: de ZZP'er downloadt per
// opdrachtgever de gemiddelde betaaltijd, het op-tijd-percentage en het oordeel — de debiteuren-
// betrouwbaarheidslijst voor de boekhouder of om te beslissen wie na te bellen. Alleen de ZZP'er:
// hergebruikt exact dezelfde fetcher als de kaart op het scherm (`getFreelancerPayerBehavior`), dus de
// export spiegelt de kaart en scoopt op de eigen facturen. Geen gegevens van derden (alleen de eigen
// betaalrelatie, geaggregeerd). Auditregel bij export (AVG art. 5(2)). CLIENT ziet zijn eigen
// betaalreputatie op /verplichtingen; ADMIN heeft /admin/facturatie.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getFreelancerPayerBehavior } from "@/lib/freelancer-payer-behavior";
import { payerBehaviorCsv } from "@/lib/payer-behavior-csv";
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
    return new Response("Niet beschikbaar voor deze rol.", { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `betaalgedrag:${actor.id}`);
  if (limited) return limited;

  const rows = await getFreelancerPayerBehavior(actor.id);
  const csv = payerBehaviorCsv(rows);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "PAYER_BEHAVIOR_EXPORTED",
      entityType: "Invoice",
      entityId: "self",
      metadata: { count: rows.length, role: actor.role },
    }),
  });

  const filename = `betaalgedrag-per-opdrachtgever-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
