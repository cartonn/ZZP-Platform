// Timing-pariteit voor de 404-maskering op resource-op-id-routes (documenten, factuur-/prestatie-/
// modelovereenkomst-PDF, compliance-/DBA-dossier). Die routes geven bewust een IDENTIEKE 404 voor
// zowel "id bestaat niet" als "id bestaat maar je bent geen partij", zodat een 403-op-een-vreemd-id
// het bestaan van een gevoelig document (VOG/diploma/BIG/factuur) niet verraadt (existence-oracle,
// CWE-203).
//
// Maar de verboden-tak deed een audit-write (requestMeta + audit) vóór de 404, terwijl de
// niet-gevonden-tak direct terugkeerde zónder DB-write. Dat verschil in werk is meetbaar aan de
// responstijd (onbekend < verboden): een timing-zijkanaal (CWE-208) dat exact het existence-oracle
// heropent dat de 404-maskering dicht. `auditDeniedAccess` is het ENE afsluitpunt voor béíde
// uitkomsten, zodat ze identiek werk doen (dezelfde requestMeta + één audit-write) en dus
// ononderscheidbaar traag zijn. OWASP A01/A04.
//
// `outcome` onderscheidt de twee alleen INTERN in het auditspoor — recon op een niet-bestaand id is
// óók een signaal dat de beheerder wil zien; de EXTERNE respons (404 + identieke body) blijft
// ononderscheidbaar. De caller houdt zijn eigen respons-opbouw (JSON vs. text) en geeft alleen de
// audit-velden mee.

import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";

export interface DeniedAccessAudit {
  actorId: string;
  /** Bestaande DENIED-actie van de route, bv. "DOCUMENT_ACCESS_DENIED". */
  action: string;
  entityType: string;
  entityId: string;
  /** "forbidden" = id bestaat, geen partij. "not-found" = id bestaat niet (recon-probe). */
  outcome: "forbidden" | "not-found";
  /** Route-specifieke extra velden (bv. viewerRole, ownerId). `outcome` wordt erbij gemerged. */
  metadata?: Record<string, unknown>;
}

/**
 * Schrijft de audit-regel voor een geweigerde OF niet-gevonden toegang, met identiek werk voor beide
 * uitkomsten (requestMeta + één audit-write) zodat de responstijd ze niet onderscheidt. Roep dit op
 * de niet-gevonden- én de verboden-tak aan, telkens vóór de identieke 404.
 */
export async function auditDeniedAccess(entry: DeniedAccessAudit): Promise<void> {
  const meta = await requestMeta();
  await audit({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: { ...entry.metadata, outcome: entry.outcome },
    ...meta,
  });
}
