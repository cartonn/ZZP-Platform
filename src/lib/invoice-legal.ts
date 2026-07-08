// Pure module: beoordeelt of een factuur voldoet aan de Nederlandse wettelijke factuureisen
// (art. 35a Wet OB / Belastingdienst). Geen imports uit app/db — deterministisch en server-side
// afgeleid uit de al opgehaalde factuur- en profielgegevens.
//
// Onderscheid (belangrijk, geen over-claim):
//  - "required": een harde eis; ontbreekt er één, dan is de factuur juridisch onvolledig.
//  - "recommended": geen strikte OB-eis, maar opdrachtgevers/boekhouders verwachten het (bv. KvK).
//
// Het btw-identificatienummer is verplicht op elke factuur waarop btw wordt gerekend. Bij een
// vrijstelling (KOR/EXEMPT) rekent de ZZP'er geen btw en vervalt de harde btw-id-eis; we tonen het
// dan als aanbeveling zodat we geen valse "onwettig"-melding geven.

export type ComplianceSeverity = "required" | "recommended";

/** Waar de ZZP'er een ontbrekend punt herstelt: op het profiel of niet-herstelbaar via een knop. */
export type ComplianceFixTarget = "profile" | null;

export interface ComplianceRequirement {
  key: string;
  label: string;
  met: boolean;
  severity: ComplianceSeverity;
  /** Actie-tekst getoond wanneer het punt ontbreekt. */
  hint?: string;
  fixTarget: ComplianceFixTarget;
}

export interface InvoiceComplianceInput {
  /** Definitief factuurnummer (partij-reeks of legacy `number`); null/leeg = nog geen nummer. */
  invoiceNumber?: string | null;
  /** Factuurdatum; null zolang de factuur nog concept is. */
  issuedAt?: Date | null;
  /** Naam van de opdrachtgever. */
  clientName?: string | null;
  /** Is er een omschrijving van de geleverde dienst (regels, prestatie of opdrachttitel)? */
  hasDescription?: boolean;
  /** Zijn de bedragen + btw-uitsplitsing bekend? */
  hasAmounts?: boolean;
  /** Btw-regime van de factuur; "EXEMPT" = vrijgesteld/KOR (geen btw gerekend). */
  vatRegime?: string | null;
  /** Btw-identificatienummer van de ZZP'er (van het profiel). */
  issuerBtw?: string | null;
  /** KvK-nummer van de ZZP'er (van het profiel). */
  issuerKvk?: string | null;
}

export interface InvoiceCompliance {
  requirements: ComplianceRequirement[];
  /** Alleen de niet-voldane punten, in dezelfde volgorde. */
  missing: ComplianceRequirement[];
  metCount: number;
  totalCount: number;
  /** "complete" zodra alle *required*-punten voldaan zijn (aanbevelingen tellen niet mee). */
  level: "complete" | "incomplete";
  /** Zijn er ontbrekende punten die de ZZP'er op zijn profiel kan herstellen (btw-id/KvK)? */
  profileFixNeeded: boolean;
}

function present(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Beoordeelt een factuur tegen de wettelijke factuureisen. Puur en deterministisch: geen datum-
 * afhankelijke logica, geen side-effects.
 */
export function assessInvoiceCompliance(input: InvoiceComplianceInput): InvoiceCompliance {
  // Bij een vrijstelling (EXEMPT/KOR) wordt geen btw gerekend → het btw-id is dan geen harde eis.
  const vatExempt = (input.vatRegime ?? "").toUpperCase() === "EXEMPT";

  const requirements: ComplianceRequirement[] = [
    {
      key: "number",
      label: "Uniek, opeenvolgend factuurnummer",
      met: present(input.invoiceNumber),
      severity: "required",
      fixTarget: null,
      hint: "Het factuurnummer wordt toegekend zodra je de factuur indient.",
    },
    {
      key: "issuedAt",
      label: "Factuurdatum",
      met: input.issuedAt != null,
      severity: "required",
      fixTarget: null,
      hint: "De factuurdatum wordt gezet zodra je de factuur indient.",
    },
    {
      key: "clientName",
      label: "Naam van de opdrachtgever",
      met: present(input.clientName),
      severity: "required",
      fixTarget: null,
    },
    {
      key: "description",
      label: "Omschrijving van de geleverde dienst",
      met: input.hasDescription === true,
      severity: "required",
      fixTarget: null,
    },
    {
      key: "amounts",
      label: "Bedrag en btw-uitsplitsing",
      met: input.hasAmounts === true,
      severity: "required",
      fixTarget: null,
    },
    {
      key: "btw",
      label: "Jouw btw-identificatienummer",
      met: present(input.issuerBtw),
      // Zonder btw-heffing (vrijstelling) is het btw-id geen harde eis, maar wel netjes.
      severity: vatExempt ? "recommended" : "required",
      fixTarget: "profile",
      hint: "Vul je btw-id in op je profiel — het hoort verplicht op elke factuur waarop btw staat.",
    },
    {
      key: "kvk",
      label: "Jouw KvK-nummer",
      met: present(input.issuerKvk),
      severity: "recommended",
      fixTarget: "profile",
      hint: "Voeg je KvK-nummer toe op je profiel; opdrachtgevers en boekhouders verwachten dit.",
    },
  ];

  const missing = requirements.filter((r) => !r.met);
  const metCount = requirements.length - missing.length;
  const requiredMissing = missing.some((r) => r.severity === "required");
  const profileFixNeeded = missing.some((r) => r.fixTarget === "profile");

  return {
    requirements,
    missing,
    metCount,
    totalCount: requirements.length,
    level: requiredMissing ? "incomplete" : "complete",
    profileFixNeeded,
  };
}
