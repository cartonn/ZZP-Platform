// Compliance-ripple, ZZP-zijde: het spiegelbeeld van de opdrachtgever-ripple (collaboration-alerts.ts).
// Een verlopend of verlopen certificaat van de ZZP'er raakt ook zijn lopende inzetten — deze module
// koppelt de vervalkalender (credential-expiry-overview.ts) aan die inzetten, zodat de ZZP'er in één
// oogopslag ziet welke samenwerking in gevaar komt en wat hij nú moet vernieuwen. Puur, geen I/O,
// deterministisch (CLAUDE.md regel 1). Muteert de invoer niet.

import { type CredentialType } from "@/lib/enums";
import { type ExpiryItem, type ExpiryOverview } from "@/lib/credential-expiry-overview";

/** Eén actieve samenwerking van de ZZP'er met de harde certificaateisen van de opdracht. */
export interface ActiveCollaborationRequirement {
  collaborationId: string;
  jobTitle: string;
  clientName: string;
  requiredTypes: CredentialType[]; // alleen verplichte (required) types
}

/** Eén kort referentie-object naar een geraakte inzet. */
export interface AffectedCollaboration {
  collaborationId: string;
  jobTitle: string;
  clientName: string;
}

/** Een (bijna-)vervallend certificaat gekoppeld aan de inzet die het raakt. */
export interface InzetImpactItem {
  item: ExpiryItem;
  affected: AffectedCollaboration[];
}

export interface InzetImpact {
  /** Alleen items die ten minste één actieve inzet raken; volgorde van overview.items behouden (urgentst eerst). */
  items: InzetImpactItem[];
  /** Distinct samenwerkingen die door een EXPIRED- of WITHIN_30-item worden geraakt (de echt urgente). */
  collaborationsAtRisk: number;
}

/**
 * Koppelt elk (bijna-)vervallend certificaat uit de vervalkalender aan de lopende inzetten die het
 * vereisen. Behoudt de volgorde van `overview.items` (urgentst eerst) en houdt alleen certificaten
 * over die ten minste één inzet raken. Read-only, deterministisch; muteert de invoer niet.
 */
export function linkExpiryToInzet(
  overview: ExpiryOverview,
  collaborations: readonly ActiveCollaborationRequirement[],
): InzetImpact {
  const items: InzetImpactItem[] = [];
  const atRisk = new Set<string>();

  for (const item of overview.items) {
    const affected: AffectedCollaboration[] = collaborations
      .filter((c) => c.requiredTypes.includes(item.type))
      .map((c) => ({
        collaborationId: c.collaborationId,
        jobTitle: c.jobTitle,
        clientName: c.clientName,
      }))
      .sort(
        (a, b) =>
          a.clientName.localeCompare(b.clientName) ||
          a.jobTitle.localeCompare(b.jobTitle) ||
          a.collaborationId.localeCompare(b.collaborationId),
      );

    if (affected.length === 0) continue;

    items.push({ item, affected });

    if (item.window === "EXPIRED" || item.window === "WITHIN_30") {
      for (const a of affected) atRisk.add(a.collaborationId);
    }
  }

  return { items, collaborationsAtRisk: atRisk.size };
}
