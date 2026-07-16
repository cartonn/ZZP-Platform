// Pure, deterministische helper: welke door een lopende/voorgestelde samenwerking VEREISTE
// certificaten van de ZZP'er verlopen binnenkort? Dit is de proactieve tegenhanger van de
// generieke "certificaat verloopt binnenkort"-taak (die op elk verlopend certificaat vuurt,
// ongeacht of er een opdracht op leunt). Hier koppelen we het verval aan een concrete opdracht
// waar het certificaat verplicht is, zodat de ZZP'er ziet wélke samenwerking hij riskeert te
// blokkeren als hij niet op tijd vernieuwt.
//
// Anker = `now` (het certificaat verloopt tijdens de lopende inzet), niet de startdatum van de
// opdracht — dat laatste is het beslismoment-signaal van de opdrachtgever
// (candidate-credential-expiry.ts). Geen I/O; `now` injecteerbaar voor tests.

import { type CredentialType, type CredentialStatus } from "@/lib/enums";

export const COLLAB_CREDENTIAL_EXPIRY_WINDOW_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CollabCredentialInput {
  id: string;
  title: string;
  type: CredentialType;
  status: CredentialStatus;
  expiresAt?: Date | null;
}

export interface CollabRequirementInput {
  collaborationId: string;
  companyName: string;
  jobTitle: string;
  requiredTypes: readonly CredentialType[];
}

export interface AffectedCollaboration {
  collaborationId: string;
  companyName: string;
  jobTitle: string;
}

export interface CollabCredentialExpiryConcern {
  credentialId: string;
  credentialTitle: string;
  type: CredentialType;
  expiresAt: Date;
  /** Hele dagen van `now` tot verval (≥ 0). */
  daysUntilExpiry: number;
  /** De samenwerking(en) die dit certificaat vereisen, in stabiele invoervolgorde (≥ 1). */
  collaborations: AffectedCollaboration[];
}

/**
 * Bepaalt per certificaat of het door minstens één lopende/voorgestelde samenwerking wordt vereist
 * én binnen het venster (`windowDays`, standaard 30 dagen) verloopt. Alleen op dit moment geldige,
 * geverifieerde certificaten tellen (VERIFIED, mét vervaldatum, nog niet verlopen) — een reeds
 * verlopen of ontbrekend vereist certificaat is een acuut compliance-gat dat elders wordt
 * afgehandeld (verplicht-document-taak / compliance-ripple), niet dit vooruitkijkende signaal.
 *
 * Per type leunt de compliance op het laatst-vervallende geverifieerde certificaat — dat bepaalt
 * de vervaldatum. Eén resultaat per certificaat (gegroepeerd over samenwerkingen); gesorteerd op
 * de vroegste vervaldatum eerst.
 */
export function collaborationCredentialExpiryConcerns(input: {
  collaborations: readonly CollabRequirementInput[];
  credentials: readonly CollabCredentialInput[];
  now: Date;
  windowDays?: number;
}): CollabCredentialExpiryConcern[] {
  const nowMs = input.now.getTime();
  const windowMs = (input.windowDays ?? COLLAB_CREDENTIAL_EXPIRY_WINDOW_DAYS) * MS_PER_DAY;
  const cutoffMs = nowMs + windowMs;

  // Per type: het laatst-vervallende, nu-geldige geverifieerde certificaat (waar de compliance op leunt).
  const latestByType = new Map<CredentialType, CollabCredentialInput>();
  for (const c of input.credentials) {
    if (c.status !== "VERIFIED" || !c.expiresAt) continue;
    if (c.expiresAt.getTime() <= nowMs) continue; // al verlopen → elders afgehandeld
    const cur = latestByType.get(c.type);
    if (!cur || c.expiresAt.getTime() > (cur.expiresAt as Date).getTime())
      latestByType.set(c.type, c);
  }

  // Per certificaat-id verzamelen we de samenwerkingen die het vereisen (dedup op collaborationId).
  const byCredential = new Map<
    string,
    {
      credential: CollabCredentialInput;
      collaborations: AffectedCollaboration[];
      seen: Set<string>;
    }
  >();

  for (const collab of input.collaborations) {
    for (const type of new Set(collab.requiredTypes)) {
      const cred = latestByType.get(type);
      if (!cred || !cred.expiresAt) continue;
      if (cred.expiresAt.getTime() > cutoffMs) continue; // verloopt buiten het venster → geen zorg

      let entry = byCredential.get(cred.id);
      if (!entry) {
        entry = { credential: cred, collaborations: [], seen: new Set() };
        byCredential.set(cred.id, entry);
      }
      if (entry.seen.has(collab.collaborationId)) continue;
      entry.seen.add(collab.collaborationId);
      entry.collaborations.push({
        collaborationId: collab.collaborationId,
        companyName: collab.companyName,
        jobTitle: collab.jobTitle,
      });
    }
  }

  const concerns: CollabCredentialExpiryConcern[] = [];
  for (const { credential, collaborations } of byCredential.values()) {
    const expiresAt = credential.expiresAt as Date;
    concerns.push({
      credentialId: credential.id,
      credentialTitle: credential.title,
      type: credential.type,
      expiresAt,
      daysUntilExpiry: Math.max(0, Math.floor((expiresAt.getTime() - nowMs) / MS_PER_DAY)),
      collaborations,
    });
  }

  // Vroegste verval eerst; bij gelijke datum stabiel op titel voor determinisme.
  concerns.sort(
    (a, b) =>
      a.expiresAt.getTime() - b.expiresAt.getTime() ||
      a.credentialTitle.localeCompare(b.credentialTitle),
  );
  return concerns;
}
