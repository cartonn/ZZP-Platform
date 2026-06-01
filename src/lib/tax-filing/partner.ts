// Partner-seam: de koppeling met het aangesloten belastingkantoor dat de aangifte feitelijk
// indient. Zelfde driver-patroon als MailSender/verifiers: een interface + een veilige
// no-op/simulatie-default, met een echte koppeling pluggable via env zodra het partnercontract
// en de SBR/Digipoort-aansluiting er zijn. Het platform IS geen gemachtigde — het routeert.

export interface TaxDossier {
  taxYear: number;
  kind: "IB" | "BTW";
  quarter?: number | null;
  /** Geschat bedrag uit het voorbereide dossier (centen). */
  estimateCents: number;
  /** Machine-leesbare onderbouwing (in productie bv. AWA-winstexport / SBR-conform). */
  payload: Record<string, unknown>;
}

export interface PartnerConceptResult {
  conceptAmountCents: number;
  partnerName: string;
}

export interface PartnerSubmissionResult {
  submissionRef: string; //  ontvangstbevestiging Digipoort/SBR
  partnerName: string;
}

export interface TaxFilingPartner {
  readonly name: string;
  /** Het kantoor neemt het dossier in behandeling en levert een concept met bedrag. */
  prepareConcept(dossier: TaxDossier): Promise<PartnerConceptResult>;
  /** Na het definitieve akkoord van de klant dient het kantoor in en geeft een referentie terug. */
  submit(dossier: TaxDossier): Promise<PartnerSubmissionResult>;
}

import { PARTNER_NAME } from "@/lib/tax-filing/config";

/**
 * Default-partner: simuleert de overdracht zonder externe koppeling, zodat de volledige flow
 * (akkoord → concept → review-then-submit → ingediend) werkt en demonstreerbaar is. Een echte
 * partner (SBR/Digipoort) vervangt dit via getPartner() zodra TAX_PARTNER_DRIVER=live.
 */
export class NoopTaxFilingPartner implements TaxFilingPartner {
  readonly name = PARTNER_NAME;

  async prepareConcept(dossier: TaxDossier): Promise<PartnerConceptResult> {
    // Het kantoor neemt het voorbereide bedrag als concept over (in productie: eigen controle).
    return { conceptAmountCents: dossier.estimateCents, partnerName: this.name };
  }

  async submit(dossier: TaxDossier): Promise<PartnerSubmissionResult> {
    // Deterministische, niet-geheime pseudo-referentie voor de demo (geen echte Digipoort-call).
    const ref = `SBR-${dossier.kind}-${dossier.taxYear}${dossier.quarter ? `Q${dossier.quarter}` : ""}`;
    return { submissionRef: ref, partnerName: this.name };
  }
}

let cached: TaxFilingPartner | null = null;

/** Geeft de actieve partner-implementatie. Default = simulatie; echte koppeling via env. */
export function getTaxFilingPartner(): TaxFilingPartner {
  if (cached) return cached;
  // Plek voor een echte SBR/Digipoort-partner: if (process.env.TAX_PARTNER_DRIVER === "live") ...
  cached = new NoopTaxFilingPartner();
  return cached;
}
