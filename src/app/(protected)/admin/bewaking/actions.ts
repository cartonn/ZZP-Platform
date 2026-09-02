"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
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

  assertIncidentTransition(incident.status as IncidentStatus, to);
  await prisma.healthIncident.update({
    where: { id: incidentId },
    data: {
      status: to,
      acknowledgedAt: to === "ACKNOWLEDGED" ? new Date() : incident.acknowledgedAt,
      resolvedAt: to === "RESOLVED" ? new Date() : incident.resolvedAt,
    },
  });
  await audit({
    actorId: actor.id,
    action,
    entityType: "HealthIncident",
    entityId: incidentId,
  });
  revalidatePath("/admin/toezicht");
}

export async function acknowledgeIncident(incidentId: string): Promise<void> {
  await setStatus(incidentId, "ACKNOWLEDGED", "HEALTH_INCIDENT_ACKNOWLEDGED");
}

export async function resolveIncident(incidentId: string): Promise<void> {
  await setStatus(incidentId, "RESOLVED", "HEALTH_INCIDENT_RESOLVED");
}
