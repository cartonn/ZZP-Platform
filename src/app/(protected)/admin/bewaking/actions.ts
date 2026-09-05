"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { INCIDENT_TRANSITIONS, type IncidentStatus } from "@/lib/enums";

/** Werpt als de incident-statusovergang niet is toegestaan. */
function assertIncidentTransition(from: IncidentStatus, to: IncidentStatus): void {
  if (!INCIDENT_TRANSITIONS[from].includes(to)) {
    throw new Error(`Ongeldige incident-overgang: ${from} -> ${to}`);
  }
}

async function setStatus(incidentId: string, to: IncidentStatus, action: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const incident = await prisma.healthIncident.findUnique({ where: { id: incidentId } });
  if (!incident) return;

  const from = incident.status as IncidentStatus;
  assertIncidentTransition(from, to);
  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from` bínnen de transactie: `INCIDENT_TRANSITIONS` staat
    // terug-overgangen naar OPEN toe, dus twee gelijktijdige admin-klikken (bv. één acknowledge,
    // één resolve) passeren beide de vóór-lees. Een kaal `update({ where: { id } })` zou het
    // tweede oordeel er overheen schrijven én een dubbele auditregel geven. updateMany met de
    // statusguard laat alleen de eerste committen; de tweede matcht niet meer (count 0) → geen
    // stale-overschrijving, geen dubbele audit (spiegelt admin/no-shows/actions.ts).
    const res = await tx.healthIncident.updateMany({
      where: { id: incidentId, status: from },
      data: {
        status: to,
        acknowledgedAt: to === "ACKNOWLEDGED" ? new Date() : incident.acknowledgedAt,
        resolvedAt: to === "RESOLVED" ? new Date() : incident.resolvedAt,
      },
    });
    if (res.count === 0) return;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action,
        entityType: "HealthIncident",
        entityId: incidentId,
      }),
    });
  });
  revalidatePath("/admin/toezicht");
}

export async function acknowledgeIncident(incidentId: string): Promise<void> {
  await setStatus(incidentId, "ACKNOWLEDGED", "HEALTH_INCIDENT_ACKNOWLEDGED");
}

export async function resolveIncident(incidentId: string): Promise<void> {
  await setStatus(incidentId, "RESOLVED", "HEALTH_INCIDENT_RESOLVED");
}
