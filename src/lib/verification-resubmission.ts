// Herindiening-signaal voor de admin-verificatiewachtrij (kerndifferentiatie: het zegel).
// Een `SUBMITTED`-certificaat dat na een of meer eerdere afwijzingen opnieuw is ingediend, is een
// herindiening (correctie). De admin ziet dat nu niet: een correctie staat anoniem tussen de eerste
// inzendingen. Dit signaal maakt de her-beoordeling sneller — de admin herkent de correctie én ziet
// de vorige afwijsreden, zodat hij gericht kan controleren of het bezwaar is weggenomen — en het
// sluit de lus voor een ZZP'er die door een afwijzing geblokkeerd was.
//
// Server-side is de waarheid (CLAUDE.md regel 1): de bron is de onveranderlijke `CredentialVerification`-
// historie (elke REJECTED-beslissing is één regel). Puur en deterministisch; leidt alleen af uit de
// meegegeven afwijs-historie en muteert de invoer nooit. Lekt geen identiteit — alleen aantal, de
// meest recente reden en het tijdstip.

/** Eén eerdere afwijs-beslissing uit de verificatiehistorie (REJECTED). */
export interface PriorRejection {
  /** Reden van afwijzing; server-side verplicht bij REJECTED, maar defensief nullable. */
  reason: string | null;
  /** Tijdstip van de afwijs-beslissing. */
  createdAt: Date;
}

/** Samenvatting van de herindiening: hoe vaak eerder afgewezen + de laatste afwijzing. */
export interface ResubmissionSignal {
  /** Aantal eerdere afwijzingen (>= 1). */
  count: number;
  /** Meest recente afwijsreden (getrimd), of null als die ontbrak/leeg was. */
  latestReason: string | null;
  /** Tijdstip van de meest recente afwijzing. */
  latestAt: Date;
}

/**
 * Leidt het herindiening-signaal af uit de afwijs-historie van één certificaat. Geeft `null` terug
 * wanneer er geen eerdere afwijzing is (een eerste inzending — geen signaal). Sorteert defensief zelf
 * op tijdstip zodat de helper niet leunt op de volgorde waarin de rijen zijn aangeleverd.
 */
export function resubmissionSignal(
  rejections: ReadonlyArray<PriorRejection>,
): ResubmissionSignal | null {
  let latest: PriorRejection | null = null;
  for (const r of rejections) {
    if (!latest || r.createdAt.getTime() > latest.createdAt.getTime()) latest = r;
  }
  if (!latest) return null;
  const reason = latest.reason?.trim();
  return {
    count: rejections.length,
    latestReason: reason ? reason : null,
    latestAt: latest.createdAt,
  };
}

/** Compact badge-label; noemt het aantal eerdere afwijzingen alleen bij meer dan één. */
export function resubmissionBadgeLabel(count: number): string {
  return count <= 1 ? "Herindiening na afwijzing" : `Herindiening · ${count}× eerder afgewezen`;
}

/**
 * Telt hoeveel inzendingen in de wachtrij een herindiening zijn (>= 1 eerdere afwijzing). Voor het
 * header-signaal over de volledige backlog. De invoer wordt niet gemuteerd.
 */
export function countResubmissions(
  items: ReadonlyArray<{ verifications: ReadonlyArray<PriorRejection> }>,
): number {
  let n = 0;
  for (const item of items) {
    if (item.verifications.length > 0) n += 1;
  }
  return n;
}
