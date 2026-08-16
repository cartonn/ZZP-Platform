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

/**
 * Is de OPDRACHTGEVER de partij die aan zet is bij deze certificaat-melding?
 *
 * - `missing`/`expired` (gap) of `expiringSoon` → **ja**: er is een geldig certificaat dat een gat
 *   vertoont of dreigt te vervallen; de opdrachtgever moet de ZZP'er om vernieuwing/aanlevering vragen.
 * - **alleen `inReview`** (een verse SUBMITTED-indiening die nog niet geverifieerd is) → **nee**: de
 *   ADMIN is aan zet (verifiëren), niet de opdrachtgever. Hij kan niets doen en de melding verdwijnt
 *   pas als de admin verifieert — een `inReview`-only-melding hoort dus niet als openstaande
 *   next-action in `/acties`, de "Volgende acties"-rail of de zijbalk-badge (dan zou een niet-
 *   afhandelbare taak de badge blijvend opblazen). Het blijft wél informatief in de dashboard-
 *   momentopname (`summarizeClientCompliance`), maar dat is context, geen actie.
 *
 * Pure functie (geen I/O); één bron voor de emissie-gate in de item-engine.
 */
export function clientHasComplianceAction(alert: CredentialAlert): boolean {
  return alert.missing.length > 0 || alert.expired.length > 0 || alert.expiringSoon.length > 0;
}

/** Zeer korte melding zonder naam/opdracht — voor compacte plekken (bv. een samenwerkingskaart). */
export function shortCredentialAlert(alert: CredentialAlert): string {
  const types = (list: CredentialType[]) => list.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ");
  if (alert.missing.length > 0) return `Mist een vereist certificaat (${types(alert.missing)})`;
  if (alert.expired.length > 0) return `Certificaat verlopen (${types(alert.expired)})`;
  if (alert.expiringSoon.length > 0)
    return `Certificaat verloopt binnenkort (${types(alert.expiringSoon)})`;
  return `Certificaat in beoordeling (${types(alert.inReview)})`;
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

export interface ClientComplianceSnapshot {
  /** Aantal lopende samenwerkingen met een openstaande certificaat-actie. */
  total: number;
  /** Hiervan: er is NU een gat (ontbrekend of verlopen certificaat). */
  nonCompliant: number;
  /** Hiervan: handel vóór het vervalt (in beoordeling of verloopt binnenkort). */
  warning: number;
  /** Som over alle samenwerkingen van het aantal ontbrekende vereiste certificaten. */
  missing: number;
  /** Som van verlopen certificaten. */
  expired: number;
  /** Som van binnenkort verlopende certificaten. */
  expiringSoon: number;
  /** Som van certificaten in beoordeling. */
  inReview: number;
}

/**
 * Vat de certificaat-meldingen van een opdrachtgever samen tot tellingen voor de
 * dashboard-momentopname. Pure functie, geen I/O. `total` telt samenwerkingen;
 * de type-tellingen (missing/expired/...) tellen certificaten over alle samenwerkingen.
 */
export function summarizeClientCompliance(
  alerts: readonly ClientCredentialAlert[],
): ClientComplianceSnapshot {
  let nonCompliant = 0;
  let warning = 0;
  let missing = 0;
  let expired = 0;
  let expiringSoon = 0;
  let inReview = 0;

  for (const a of alerts) {
    if (a.alert.status === "NON_COMPLIANT") nonCompliant += 1;
    else if (a.alert.status === "WARNING") warning += 1;
    missing += a.alert.missing.length;
    expired += a.alert.expired.length;
    expiringSoon += a.alert.expiringSoon.length;
    inReview += a.alert.inReview.length;
  }

  return {
    total: alerts.length,
    nonCompliant,
    warning,
    missing,
    expired,
    expiringSoon,
    inReview,
  };
}

/**
 * Rij-vorm van een lopende samenwerking zoals de certificaat-melding die nodig heeft: de
 * vereiste certificaten van de opdracht + de certificaten van de ZZP'er. Callers die deze rijen
 * al hebben opgehaald (bv. het opdrachtgever-dashboard) geven ze rechtstreeks aan
 * `clientCredentialAlertsFromRows` en vermijden zo een tweede database-query.
 */
export interface CollaborationAlertRow {
  id: string;
  /**
   * Een open dispuut bevriest het werkproces (cascade/stage.ts → "werkproces bevroren",
   * `youAreUp:false`). Zolang `disputedAt` gezet is levert de samenwerking geen enkele
   * next-action op — óók geen compliance-ripple. Zelfde `disputedAt: null`-invariant als de
   * overige opdrachtgever-taken (pending-tasks.ts) en signalen (signals.ts).
   */
  disputedAt: Date | null;
  job: {
    id: string;
    title: string;
    credentialRequirements: { credentialType: string }[];
  };
  freelancer: {
    user: { name: string | null };
    credentials: { type: string; status: string; expiresAt: Date | null }[];
  };
}

/** Prisma-`include` die exact `CollaborationAlertRow` oplevert — één bron voor query én type. */
export const COLLABORATION_ALERT_INCLUDE = {
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
} as const;

/**
 * Zet voorgefetchte samenwerkingsrijen om in certificaat-meldingen. Pure functie (geen I/O):
 * identiek gedrag aan `clientCredentialAlerts`, maar zonder eigen queries — voor callers die de
 * rijen (via `COLLABORATION_ALERT_INCLUDE`) al hebben opgehaald en een dubbele fetch vermijden.
 */
export function clientCredentialAlertsFromRows(
  collaborations: readonly CollaborationAlertRow[],
  now: Date = new Date(),
): ClientCredentialAlert[] {
  const alerts: ClientCredentialAlert[] = [];
  for (const c of collaborations) {
    // Bevroren werkproces (open dispuut) → geen compliance-ripple-taak; het samenwerkingsscherm
    // toont "Dispuut — werkproces bevroren" en de opdrachtgever is niet aan zet. Zonder deze guard
    // sprak de hoogste opdrachtgever-next-action (P.complianceRipple=85) de bevroren fase tegen.
    if (c.disputedAt !== null) continue;
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

/** Lopende samenwerkingen van een opdrachtgever waarvan de certificaat-compliance actie vraagt. */
export async function clientCredentialAlerts(userId: string): Promise<ClientCredentialAlert[]> {
  const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
  if (!company) return [];

  const collaborations = await prisma.collaboration.findMany({
    // disputedAt: null → een bevroren (in dispuut zijnde) samenwerking levert geen next-action op,
    // consistent met pending-tasks.ts en signals.ts. De pure `clientCredentialAlertsFromRows` guardt
    // hier nogmaals op (defense-in-depth + testbaar zonder DB).
    //
    // `job: { credentialRequirements: { some: { required: true } } }` — alleen samenwerkingen met een
    // verplicht certificaat-vereiste kunnen een compliance-alert opleveren (de pure functie slaat
    // `requiredTypes.length === 0` over), dus filteren we ze hier al weg zodat ze geen venster-slot
    // vullen. `orderBy: createdAt asc` maakt het venster deterministisch en self-healing: zonder een
    // expliciete ordening is wélke 200-van-N rijen Prisma teruggeeft niet gegarandeerd, waardoor de
    // hoogste opdrachtgever-taak (P.complianceRipple=85) tussen page-loads kon flapperen bij >200
    // gelijktijdige ACTIVE-samenwerkingen. Spiegelt de determinisme-conventie elders (run 77/79).
    where: {
      companyId: company.id,
      status: "ACTIVE",
      disputedAt: null,
      job: { credentialRequirements: { some: { required: true } } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: COLLABORATION_ALERT_INCLUDE,
  });

  return clientCredentialAlertsFromRows(collaborations, new Date());
}
