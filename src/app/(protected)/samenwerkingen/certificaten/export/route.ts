// CSV-export van de certificaat-compliance van de opdrachtgever: per lopende samenwerking die
// aandacht vraagt één rij (welke ZZP'er mist/verlopen/verloopt-binnenkort/in-beoordeling welk
// vereist certificaat). Alleen de eigen samenwerkingen, exact dezelfde bron + regel als de
// dashboard-momentopname (@/lib/collaboration-alerts) zodat de export het scherm spiegelt.
// Read-only; auditregel bij export.

import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  clientCredentialAlertsFromRows,
  COLLABORATION_ALERT_INCLUDE,
} from "@/lib/collaboration-alerts";
import { complianceCsv } from "@/lib/collaboration-compliance-csv";
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

  // Alleen de opdrachtgever ziet de certificaat-compliance van zíjn ZZP'ers. De ZZP'er beheert zijn
  // eigen certificaten (/certificaten); ADMIN heeft de verificatiequeue (/admin/verificaties).
  if (actor.role !== "CLIENT") {
    return new Response("Alleen beschikbaar voor opdrachtgevers.", { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `compliance:${actor.id}`);
  if (limited) return limited;

  // unbounded-allow: export-route; volledigheid vereist (de dashboard-momentopname capt op 200 voor
  // de weergave, de export mag geen samenwerking missen). disputedAt: null + verplichte
  // certificaat-vereiste spiegelen `clientCredentialAlerts`; de pure fromRows-functie guardt nogmaals.
  const rows = await prisma.collaboration.findMany({
    where: {
      company: { userId: actor.id },
      status: "ACTIVE",
      disputedAt: null,
      job: { credentialRequirements: { some: { required: true } } },
    },
    orderBy: { createdAt: "asc" },
    include: COLLABORATION_ALERT_INCLUDE,
  });

  const alerts = clientCredentialAlertsFromRows(rows, new Date());
  // Triage-volgorde: acute gaten (NON_COMPLIANT) vóór waarschuwingen (WARNING), daarbinnen op naam.
  const sorted = [...alerts].sort((a, b) => {
    if (a.alert.status !== b.alert.status) return a.alert.status === "NON_COMPLIANT" ? -1 : 1;
    return a.freelancerName.localeCompare(b.freelancerName, "nl");
  });

  const csv = complianceCsv(sorted);

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "COMPLIANCE_REGISTER_EXPORTED",
      entityType: "Collaboration",
      entityId: "self",
      metadata: { count: sorted.length, role: actor.role },
    }),
  });

  const filename = `certificaat-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
