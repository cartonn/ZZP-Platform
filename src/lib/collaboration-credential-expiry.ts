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

export interface ExpiredRequiredCredentialConcern {
  /** Het meest recent verlopen certificaat van het type (de logische vernieuw-kandidaat). */
  credentialId: string;
  credentialTitle: string;
  type: CredentialType;
  /** De samenwerking(en) die dit certificaat vereisen, in stabiele invoervolgorde (≥ 1). */
  collaborations: AffectedCollaboration[];
}

/**
 * Tegenhanger van `collaborationCredentialExpiryConcerns`, maar voor een certificaat dat REEDS is
 * verlopen (geen vooruitkijkende waarschuwing meer, maar een acuut gat): welke door een lopende/
 * voorgestelde samenwerking VEREISTE certificaten van de ZZP'er zijn verlopen zónder een nu-geldige
 * vervanger? Dit is de freelancer-spiegel van de opdrachtgever-alert `clientComplianceTask`
 * (`computeCompliance` → "expired"): de ZZP'er is de enige die kan handelen (het bewijsstuk
 * vernieuwen), dus zonder deze taak zag de opdrachtgever "certificaat verlopen — vraag om vernieuwing"
 * terwijl de ZZP'ers eigen actielijst niets toonde (asymmetrie; persona-sweep run 56).
 *
 * Alleen voor niet-verplichte typen bedoeld: verplichte documenten (VOG/verzekering) krijgen hun eigen
 * `mandatoryDocumentTask` (verlopen) los van een samenwerking — de aanroeper filtert die typen daarom
 * vóóraf uit `requiredTypes`. Een type met een nu-geldig geverifieerd certificaat is géén zorg; een
 * type zonder énig verlopen certificaat (volledig ontbrekend) valt buiten deze specifieke bevinding.
 * Eén resultaat per certificaat (gegroepeerd over samenwerkingen); gesorteerd op titel voor determinisme.
 */
export function collaborationExpiredRequiredCredentials(input: {
  collaborations: readonly CollabRequirementInput[];
  credentials: readonly CollabCredentialInput[];
  now: Date;
}): ExpiredRequiredCredentialConcern[] {
  const nowMs = input.now.getTime();

  // Per type: bestaat er een NU-geldig geverifieerd certificaat? (VERIFIED, en geen vervaldatum of nog
  // niet verlopen). En het meest recent verlopen certificaat per type (de vernieuw-kandidaat).
  const hasValidByType = new Set<CredentialType>();
  const latestExpiredByType = new Map<CredentialType, CollabCredentialInput>();
  for (const c of input.credentials) {
    const isValid =
      c.status === "VERIFIED" && (c.expiresAt == null || c.expiresAt.getTime() > nowMs);
    if (isValid) {
      hasValidByType.add(c.type);
      continue;
    }
    const isExpired =
      c.status === "EXPIRED" ||
      (c.status === "VERIFIED" && c.expiresAt != null && c.expiresAt.getTime() <= nowMs);
    if (!isExpired) continue;
    const cur = latestExpiredByType.get(c.type);
    const curExp = cur?.expiresAt?.getTime() ?? -Infinity;
    const cExp = c.expiresAt?.getTime() ?? -Infinity;
    if (!cur || cExp > curExp) latestExpiredByType.set(c.type, c);
  }

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
      if (hasValidByType.has(type)) continue; // nog een geldig certificaat → geen gat
      const cred = latestExpiredByType.get(type);
      if (!cred) continue; // geen verlopen certificaat van dit type (bv. volledig ontbrekend) → buiten scope
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

  const concerns: ExpiredRequiredCredentialConcern[] = [];
  for (const { credential, collaborations } of byCredential.values()) {
    concerns.push({
      credentialId: credential.id,
      credentialTitle: credential.title,
      type: credential.type,
      collaborations,
    });
  }
  concerns.sort((a, b) => a.credentialTitle.localeCompare(b.credentialTitle));
  return concerns;
}

export interface MissingRequiredCredentialConcern {
  type: CredentialType;
  /**
   * Id van een bestaand DRAFT-certificaat van dit type (de logische aanlever-kandidaat: de ZZP'er
   * begon eraan maar diende het nooit in), of `null` als er van dit type niets bestaat. Bepaalt de
   * deep-link: bewerk het concept vs. een nieuw formulier met vooringevuld type.
   */
  draftCredentialId: string | null;
  /** De samenwerking(en) die dit type vereisen, in stabiele invoervolgorde (≥ 1). */
  collaborations: AffectedCollaboration[];
}

/**
 * Tegenhanger van `collaborationExpiredRequiredCredentials`, maar voor een vereist (niet-verplicht)
 * certificaattype dat volledig ONTBREEKT — de ZZP'er heeft er geen enkel bruikbaar bewijsstuk van
 * (geen rij, of alleen een DRAFT die nooit is ingediend). Dit is de freelancer-spiegel van de
 * opdrachtgever-alert `clientComplianceTask` voor `computeCompliance` → "missing": de opdrachtgever
 * ziet "mist een vereist certificaat — vraag de ZZP'er om aan te leveren", maar de ZZP'er — de enige
 * die het bewijsstuk kan aanleveren — zag in zijn eigen actielijst NIETS (asymmetrie; persona-sweep
 * run 57). De EXPIRED-tak (er bestaat een verlopen exemplaar om te vernieuwen) hoort bij
 * `collaborationExpiredRequiredCredentials`; deze functie dekt uitsluitend het "geen bruikbaar
 * exemplaar"-gat.
 *
 * Uitgesloten (de aanroeper filtert de types vóóraf, symmetrisch met de EXPIRED-tak):
 * - VERPLICHTE typen (VOG/verzekering) → eigen `mandatoryDocumentTask("missing")`.
 * - AFGEWEZEN typen → eigen `credentialFixTask("rejected")` (opnieuw indienen).
 * Verder overslaan we hier per type wanneer er een nu-geldig geverifieerd, een IN-BEOORDELING
 * (SUBMITTED) of een VERLOPEN exemplaar bestaat: geldig = geen gat; SUBMITTED = de ZZP'er heeft al
 * aangeleverd (admin verifieert, net als de client géén taak krijgt); verlopen = de EXPIRED-tak.
 * Eén resultaat per type; gesorteerd op type voor determinisme.
 */
export function collaborationMissingRequiredCredentials(input: {
  collaborations: readonly CollabRequirementInput[];
  credentials: readonly CollabCredentialInput[];
  now: Date;
}): MissingRequiredCredentialConcern[] {
  const nowMs = input.now.getTime();

  // Per type: bestaat er een exemplaar dat het "missing"-gat opheft of elders wordt afgehandeld?
  // (geldig-geverifieerd, in beoordeling, of verlopen). Zo ja → dit type is géén "missing"-zorg.
  const coveredByType = new Set<CredentialType>();
  // Per type: het meest recente DRAFT-exemplaar (aanlever-kandidaat voor de deep-link).
  const latestDraftByType = new Map<CredentialType, CollabCredentialInput>();
  for (const c of input.credentials) {
    const isValid =
      c.status === "VERIFIED" && (c.expiresAt == null || c.expiresAt.getTime() > nowMs);
    const isExpired =
      c.status === "EXPIRED" ||
      (c.status === "VERIFIED" && c.expiresAt != null && c.expiresAt.getTime() <= nowMs);
    if (isValid || c.status === "SUBMITTED" || isExpired) {
      coveredByType.add(c.type);
      continue;
    }
    if (c.status === "DRAFT" && !latestDraftByType.has(c.type)) {
      latestDraftByType.set(c.type, c);
    }
  }

  const byType = new Map<
    CredentialType,
    { collaborations: AffectedCollaboration[]; seen: Set<string> }
  >();
  for (const collab of input.collaborations) {
    for (const type of new Set(collab.requiredTypes)) {
      if (coveredByType.has(type)) continue; // een bruikbaar/elders-afgehandeld exemplaar → geen missing-gat
      let entry = byType.get(type);
      if (!entry) {
        entry = { collaborations: [], seen: new Set() };
        byType.set(type, entry);
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

  const concerns: MissingRequiredCredentialConcern[] = [];
  for (const [type, { collaborations }] of byType) {
    concerns.push({
      type,
      draftCredentialId: latestDraftByType.get(type)?.id ?? null,
      collaborations,
    });
  }
  concerns.sort((a, b) => a.type.localeCompare(b.type));
  return concerns;
}

/**
 * Bundelt de twee collab-gebonden certificaat-gaten (REEDS VERLOPEN + volledig ONTBREKEND) achter één
 * gedeelde uitsluitingsfilter, zodat elke aanroeper ze identiek berekent:
 * - VERPLICHTE typen (VOG/verzekering) → eigen `mandatoryDocumentTask` los van een samenwerking;
 * - reeds AFGEWEZEN typen → eigen `credentialFixTask` (opnieuw indienen).
 * Beide worden vóóraf uit elke `requiredTypes` gefilterd (`rejectedTypes` afgeleid uit de
 * certificaatset zelf → geen aparte query nodig).
 *
 * `/acties` (`pending-tasks.ts`) vertaalt de teruggegeven arrays naar `credentialCollabExpired`/
 * `credentialCollabMissing`-taken; de `/certificaten`-nav-badge (`signals.ts`) telt alleen hun lengte.
 * Door dezelfde helper te delen kan de badge niet stiller (of luider) worden dan /acties — precies de
 * badge↔lijst-drift die de codebase herhaaldelijk dicht (persona-sweep run 70, GEPARKEERD LOW).
 *
 * Puur/deterministisch, geen I/O; `now` injecteerbaar.
 */
export function collaborationRequiredCredentialGaps(input: {
  collaborations: readonly CollabRequirementInput[];
  credentials: readonly CollabCredentialInput[];
  mandatoryTypes: readonly CredentialType[];
  now: Date;
}): { expired: ExpiredRequiredCredentialConcern[]; missing: MissingRequiredCredentialConcern[] } {
  const mandatory = new Set(input.mandatoryTypes);
  const rejectedTypes = new Set(
    input.credentials.filter((c) => c.status === "REJECTED").map((c) => c.type),
  );
  const filtered = input.collaborations.map((c) => ({
    ...c,
    requiredTypes: c.requiredTypes.filter((t) => !mandatory.has(t) && !rejectedTypes.has(t)),
  }));
  return {
    expired: collaborationExpiredRequiredCredentials({
      collaborations: filtered,
      credentials: input.credentials,
      now: input.now,
    }),
    missing: collaborationMissingRequiredCredentials({
      collaborations: filtered,
      credentials: input.credentials,
      now: input.now,
    }),
  };
}
