// Platformbrede verplichte documenten: de bewijsstukken die élke ZZP'er moet aanleveren om opdrachten
// te mogen vervullen — los van een specifieke opdracht. Spiegelt de zorg-praktijk (vgl. Pidz: VOG +
// aansprakelijkheidsverzekering). Pure logica, hergebruikt computeCompliance; geen I/O.

import { computeCompliance, type FreelancerCredential } from "@/lib/matching";
import { type CredentialType } from "@/lib/enums";

/**
 * De verplichte documenttypes. Configureerbaar; de exacte set (en of niet-voldoen een ZZP'er
 * onboekbaar maakt) is een productkeuze — zie de Pidz-pariteit-ADR (activatie-gate).
 */
export const MANDATORY_CREDENTIAL_TYPES = [
  "VOG",
  "INSURANCE",
] as const satisfies readonly CredentialType[];

export type MandatoryDocState = "satisfied" | "inReview" | "expired" | "missing";

export interface MandatoryDocStatus {
  type: CredentialType;
  state: MandatoryDocState;
}

export interface MandatoryDocumentsResult {
  items: MandatoryDocStatus[];
  /** Aantal verplichte documenten dat nog actie vraagt (ontbreekt/verlopen/in beoordeling). */
  openCount: number;
  /** Alle verplichte documenten geldig aangeleverd. */
  allSatisfied: boolean;
}

/**
 * Bepaalt per verplicht documenttype de status: aanwezig (geldig geverifieerd), in beoordeling,
 * verlopen of ontbrekend. Hergebruikt de bestaande compliance-buckets zodat de regels één bron hebben.
 */
export function mandatoryDocuments(
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): MandatoryDocumentsResult {
  const c = computeCompliance(MANDATORY_CREDENTIAL_TYPES, credentials, now);
  const items: MandatoryDocStatus[] = MANDATORY_CREDENTIAL_TYPES.map((type) => ({
    type,
    state: c.satisfied.includes(type)
      ? "satisfied"
      : c.inReview.includes(type)
        ? "inReview"
        : c.expired.includes(type)
          ? "expired"
          : "missing",
  }));
  const openCount = items.filter((i) => i.state !== "satisfied").length;
  return { items, openCount, allSatisfied: openCount === 0 };
}

/**
 * Aantal verplichte documenten dat een *openstaande next-action* voor de ZZP'er oplevert: ontbrekend
 * of verlopen, maar NIET van een type dat al een REJECTED-certificaat heeft (die krijgt de
 * `credentialFixTask` als enige canonieke rij). Dit is exact de emissieconditie van
 * `mandatoryDocumentTask` in `pending-tasks.ts` — dezelfde bron van waarheid zodat de nav-badge
 * (`credentialAlerts`), `/acties` en de dashboard-rail niet driften (DOEL 1b: één signaal, alle
 * oppervlakken gelijk). `inReview` telt niet mee: daar is de admin aan zet, niet de ZZP'er.
 */
export function mandatoryDocumentAlertCount(
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): number {
  const { items } = mandatoryDocuments(credentials, now);
  const rejectedTypes = new Set(
    credentials.filter((c) => c.status === "REJECTED").map((c) => c.type),
  );
  return items.filter(
    (i) => (i.state === "missing" || i.state === "expired") && !rejectedTypes.has(i.type),
  ).length;
}
