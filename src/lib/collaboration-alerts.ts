// Compliance-ripple: een verlopend of ontbrekend certificaat van een ZZP'er is niet alleen
// zíjn zorg — bij een lopende samenwerking raakt het ook de opdrachtgever. Deze module legt
// dat verband en zet het om in één duidelijke "wat-vraagt-actie"-melding. Server-berekend,
// deterministisch (CLAUDE.md regel 1). Hergebruikt de bestaande compliance- en expiry-logica.

import { prisma } from "@/lib/db";
import { isExpired, isExpiringSoon, CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import {
  computeCompliance,
  type ComplianceStatus,
  type FreelancerCredential,
} from "@/lib/matching";
import { type CredentialType } from "@/lib/enums";

const EXPIRY_WINDOW_DAYS = 30;

export interface CredentialAlert {
  status: ComplianceStatus; // COMPLIANT = geen actie nodig
  missing: CredentialType[];
  expired: CredentialType[];
  expiringSoon: CredentialType[];
  inReview: CredentialType[];
}

/**
 * Beoordeelt de vereiste certificaten van een lopende samenwerking.
 * - missing/expired  -> NON_COMPLIANT (er is nú een gat)
 * - expiringSoon/inReview -> WARNING (handel vóór het vervalt)
 * Pure functie, testbaar zonder DB.
 */
export function assessCollaborationCredentials(
  requiredTypes: readonly CredentialType[],
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
  withinDays: number = EXPIRY_WINDOW_DAYS,
): CredentialAlert {
  const base = computeCompliance(requiredTypes, credentials, now);

  // Een type dreigt te vervallen als al z'n geldige certificaten binnenkort verlopen.
  const expiringSoon = base.satisfied.filter((type) => {
    const valid = credentials.filter(
      (c) => c.type === type && c.status === "VERIFIED" && !isExpired(c, now),
    );
    return valid.length > 0 && valid.every((c) => isExpiringSoon(c, withinDays, now));
  });

  let status: ComplianceStatus = "COMPLIANT";
  if (base.missing.length > 0 || base.expired.length > 0) status = "NON_COMPLIANT";
  else if (base.inReview.length > 0 || expiringSoon.length > 0) status = "WARNING";

  return {
    status,
    missing: base.missing,
    expired: base.expired,
    expiringSoon,
    inReview: base.inReview,
  };
}

/** Korte, gerichte omschrijving van de melding (vanuit het perspectief van de opdrachtgever). */
export function describeCredentialAlert(
  name: string,
  jobTitle: string,
  alert: CredentialAlert,
): string {
  const types = (list: CredentialType[]) => list.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ");
  if (alert.missing.length > 0)
    return `${name} mist een vereist certificaat (${types(alert.missing)}) — ${jobTitle}`;
  if (alert.expired.length > 0)
    return `Certificaat van ${name} is verlopen (${types(alert.expired)}) — ${jobTitle}`;
  if (alert.expiringSoon.length > 0)
    return `Certificaat van ${name} verloopt binnenkort (${types(alert.expiringSoon)}) — ${jobTitle}`;
  return `Certificaat van ${name} in beoordeling (${types(alert.inReview)}) — ${jobTitle}`;
}

export interface ClientCredentialAlert {
  collaborationId: string;
  jobId: string;
  jobTitle: string;
  freelancerName: string;
  alert: CredentialAlert;
}

/** Lopende samenwerkingen van een opdrachtgever waarvan de certificaat-compliance actie vraagt. */
export async function clientCredentialAlerts(userId: string): Promise<ClientCredentialAlert[]> {
  const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
  if (!company) return [];

  const collaborations = await prisma.collaboration.findMany({
    where: { companyId: company.id, status: "ACTIVE" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      freelancer: {
        select: {
          user: { select: { name: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
    },
  });

  const now = new Date();
  const alerts: ClientCredentialAlert[] = [];
  for (const c of collaborations) {
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    if (requiredTypes.length === 0) continue;
    const credentials: FreelancerCredential[] = c.freelancer.credentials.map((cr) => ({
      type: cr.type as CredentialType,
      status: cr.status as FreelancerCredential["status"],
      expiresAt: cr.expiresAt,
    }));
    const alert = assessCollaborationCredentials(requiredTypes, credentials, now);
    if (alert.status !== "COMPLIANT") {
      alerts.push({
        collaborationId: c.id,
        jobId: c.job.id,
        jobTitle: c.job.title,
        freelancerName: c.freelancer.user.name ?? "—",
        alert,
      });
    }
  }
  return alerts;
}
