// Gestructureerde e-factuur in UBL 2.1 (NLCIUS / SI-UBL 2.0, EN 16931-conform subset). Naast de
// PDF- en CSV-export levert dit een machineleesbare factuur die de opdrachtgever rechtstreeks in
// zijn boekhouding kan importeren (geen overtikken) en die de ZZP'er als professionele
// e-facturatiestandaard aanbiedt. Puur en deterministisch: uit exact dezelfde factuurdata als de
// PDF (`InvoicePdfData`-vorm), server-side de waarheid (CLAUDE.md regel 1), geen neveneffecten.
//
// INDICATIEF: afgeleid uit de platform-facturen; de btw-percentages volgen het regime van de
// factuur. Geen fiscaal advies. De route /api/facturen/[id]/ubl doet auth/ownership + serveert dit.

/** Eén regel van de e-factuur (spiegelt `InvoicePdfLine`). */
export interface InvoiceUblLine {
  description: string;
  /** Aantal eenheden (bv. uren); mag decimaal zijn. */
  quantity: number;
  /** Prijs per eenheid in centen. */
  unitCents: number;
  /** Regelbedrag excl. btw in centen. */
  amountCents: number;
}

/** Factuurdata voor de UBL-export — identiek aan `InvoicePdfData` zodat de route één object voedt. */
export interface InvoiceUblData {
  number: string;
  /** "yyyy-mm-dd" of "" (nog geen uitgiftedatum). */
  issuedAt: string;
  /** "yyyy-mm-dd" of "". */
  dueAt: string;
  fromName: string;
  fromKvk?: string | null;
  fromBtw?: string | null;
  toName: string;
  jobTitle: string;
  /** STANDARD_HIGH | REVERSE_CHARGE | EXEMPT. */
  vatRegime: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: InvoiceUblLine[];
  /** SEPA-IBAN van de crediteur; leeg/afwezig → geen betaalmiddel-blok. */
  iban?: string | null;
  /** Wacht de factuur nog op betaling? `false` onderdrukt het betaalmiddel-blok (parity met de PDF). */
  paymentDue?: boolean;
}

/** UBL-btw-categorie afgeleid uit het factuurregime (EN 16931 BT-118 / UNCL5305). */
interface TaxCategoryInfo {
  /** Categoriecode: "S" (standaard), "AE" (btw verlegd), "E" (vrijgesteld/KOR). */
  id: "S" | "AE" | "E";
  /** Btw-percentage van de categorie. */
  percent: number;
  /** Vrijstellingsreden (alleen voor AE/E; EN 16931 BT-120). */
  exemptionReason?: string;
}

/** Map het factuurregime naar de UBL-btw-categorie. Onbekend regime → standaard 21% (veilig default). */
function taxCategoryFor(vatRegime: string): TaxCategoryInfo {
  switch (vatRegime) {
    case "REVERSE_CHARGE":
      return { id: "AE", percent: 0, exemptionReason: "Btw verlegd naar de opdrachtgever" };
    case "EXEMPT":
      return { id: "E", percent: 0, exemptionReason: "Vrijgesteld van omzetbelasting" };
    case "STANDARD_HIGH":
    default:
      return { id: "S", percent: 21 };
  }
}

/** Escape de vijf XML-metatekens zodat vrije tekst (namen, omschrijvingen) de XML niet kan breken. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Centen → UBL-bedrag met punt-decimaal en exact twee decimalen ("100.00", "-12.50"). */
function amount(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

/** Aantal → UBL-hoeveelheid: tot vier decimalen, zonder overbodige nullen ("8", "8.5", "1.25"). */
function quantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10000) / 10000;
  // toFixed(4) en trailing nullen (incl. de punt) strippen → compacte, deterministische weergave.
  return rounded.toFixed(4).replace(/\.?0+$/, "") || "0";
}

/** Verwijder alle witruimte uit een IBAN — UBL wil het rekeningnummer zonder spaties. */
function compactIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

const EUR = ' currencyID="EUR"';

/**
 * Bouw de UBL 2.1 Invoice-XML voor één factuur. Retourneert een complete XML-string (met
 * `<?xml ?>`-declaratie). Deterministisch: dezelfde input → byte-voor-byte dezelfde output.
 */
export function buildInvoiceUbl(data: InvoiceUblData): string {
  const cat = taxCategoryFor(data.vatRegime);
  const kvk = data.fromKvk?.trim();
  const btw = data.fromBtw?.trim();
  const iban = data.iban?.trim();
  const showPayment = data.paymentDue !== false && !!iban;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ' +
      'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" ' +
      'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
  );

  // Kop: NLCIUS-customization + Peppol-BIS-profiel, factuurnummer, datums, type 380 (handelsfactuur).
  lines.push(
    "  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0</cbc:CustomizationID>",
  );
  lines.push("  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>");
  lines.push(`  <cbc:ID>${xmlEscape(data.number)}</cbc:ID>`);
  if (data.issuedAt) lines.push(`  <cbc:IssueDate>${xmlEscape(data.issuedAt)}</cbc:IssueDate>`);
  if (data.dueAt) lines.push(`  <cbc:DueDate>${xmlEscape(data.dueAt)}</cbc:DueDate>`);
  lines.push("  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
  if (data.jobTitle) lines.push(`  <cbc:Note>${xmlEscape(data.jobTitle)}</cbc:Note>`);
  lines.push("  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");

  // Leverancier (de ZZP'er/crediteur). KVK als endpoint + wettelijke registratie (schemeID 0106 =
  // KvK); btw-nummer als PartyTaxScheme. Landcode NL (minimale adresverplichting EN 16931).
  lines.push("  <cac:AccountingSupplierParty>");
  lines.push("    <cac:Party>");
  if (kvk) lines.push(`      <cbc:EndpointID schemeID="0106">${xmlEscape(kvk)}</cbc:EndpointID>`);
  lines.push("      <cac:PartyName>");
  lines.push(`        <cbc:Name>${xmlEscape(data.fromName)}</cbc:Name>`);
  lines.push("      </cac:PartyName>");
  lines.push("      <cac:PostalAddress>");
  lines.push("        <cac:Country>");
  lines.push("          <cbc:IdentificationCode>NL</cbc:IdentificationCode>");
  lines.push("        </cac:Country>");
  lines.push("      </cac:PostalAddress>");
  if (btw) {
    lines.push("      <cac:PartyTaxScheme>");
    lines.push(`        <cbc:CompanyID>${xmlEscape(btw)}</cbc:CompanyID>`);
    lines.push("        <cac:TaxScheme>");
    lines.push("          <cbc:ID>VAT</cbc:ID>");
    lines.push("        </cac:TaxScheme>");
    lines.push("      </cac:PartyTaxScheme>");
  }
  lines.push("      <cac:PartyLegalEntity>");
  lines.push(`        <cbc:RegistrationName>${xmlEscape(data.fromName)}</cbc:RegistrationName>`);
  if (kvk) lines.push(`        <cbc:CompanyID schemeID="0106">${xmlEscape(kvk)}</cbc:CompanyID>`);
  lines.push("      </cac:PartyLegalEntity>");
  lines.push("    </cac:Party>");
  lines.push("  </cac:AccountingSupplierParty>");

  // Afnemer (de opdrachtgever/debiteur). Alleen de naam is server-side gegarandeerd bekend.
  lines.push("  <cac:AccountingCustomerParty>");
  lines.push("    <cac:Party>");
  lines.push("      <cac:PartyName>");
  lines.push(`        <cbc:Name>${xmlEscape(data.toName)}</cbc:Name>`);
  lines.push("      </cac:PartyName>");
  lines.push("      <cac:PostalAddress>");
  lines.push("        <cac:Country>");
  lines.push("          <cbc:IdentificationCode>NL</cbc:IdentificationCode>");
  lines.push("        </cac:Country>");
  lines.push("      </cac:PostalAddress>");
  lines.push("      <cac:PartyLegalEntity>");
  lines.push(`        <cbc:RegistrationName>${xmlEscape(data.toName)}</cbc:RegistrationName>`);
  lines.push("      </cac:PartyLegalEntity>");
  lines.push("    </cac:Party>");
  lines.push("  </cac:AccountingCustomerParty>");

  // Betaalmiddel: SEPA-overboeking (code 58) met IBAN + betaalkenmerk. Alleen als de factuur nog
  // openstaat én er een IBAN is (parity met de PDF-betaalgate) — geen betaalinstructie op een
  // betaalde/geannuleerde factuur.
  if (showPayment && iban) {
    lines.push("  <cac:PaymentMeans>");
    lines.push("    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>");
    lines.push(`    <cbc:PaymentID>Factuur ${xmlEscape(data.number)}</cbc:PaymentID>`);
    lines.push("    <cac:PayeeFinancialAccount>");
    lines.push(`      <cbc:ID>${xmlEscape(compactIban(iban))}</cbc:ID>`);
    lines.push(`      <cbc:Name>${xmlEscape(data.fromName)}</cbc:Name>`);
    lines.push("    </cac:PayeeFinancialAccount>");
    lines.push("  </cac:PaymentMeans>");
  }

  // Btw-totaal met één subtotaal in de categorie van het regime.
  lines.push("  <cac:TaxTotal>");
  lines.push(`    <cbc:TaxAmount${EUR}>${amount(data.vatCents)}</cbc:TaxAmount>`);
  lines.push("    <cac:TaxSubtotal>");
  lines.push(`      <cbc:TaxableAmount${EUR}>${amount(data.subtotalCents)}</cbc:TaxableAmount>`);
  lines.push(`      <cbc:TaxAmount${EUR}>${amount(data.vatCents)}</cbc:TaxAmount>`);
  lines.push("      <cac:TaxCategory>");
  lines.push(`        <cbc:ID>${cat.id}</cbc:ID>`);
  lines.push(`        <cbc:Percent>${cat.percent.toFixed(2)}</cbc:Percent>`);
  if (cat.exemptionReason) {
    lines.push(
      `        <cbc:TaxExemptionReason>${xmlEscape(cat.exemptionReason)}</cbc:TaxExemptionReason>`,
    );
  }
  lines.push("        <cac:TaxScheme>");
  lines.push("          <cbc:ID>VAT</cbc:ID>");
  lines.push("        </cac:TaxScheme>");
  lines.push("      </cac:TaxCategory>");
  lines.push("    </cac:TaxSubtotal>");
  lines.push("  </cac:TaxTotal>");

  // Monetaire totalen: excl. btw (regel-/belastbaar), incl. btw en te betalen.
  lines.push("  <cac:LegalMonetaryTotal>");
  lines.push(
    `    <cbc:LineExtensionAmount${EUR}>${amount(data.subtotalCents)}</cbc:LineExtensionAmount>`,
  );
  lines.push(
    `    <cbc:TaxExclusiveAmount${EUR}>${amount(data.subtotalCents)}</cbc:TaxExclusiveAmount>`,
  );
  lines.push(
    `    <cbc:TaxInclusiveAmount${EUR}>${amount(data.totalCents)}</cbc:TaxInclusiveAmount>`,
  );
  lines.push(`    <cbc:PayableAmount${EUR}>${amount(data.totalCents)}</cbc:PayableAmount>`);
  lines.push("  </cac:LegalMonetaryTotal>");

  // Factuurregels. Elke regel draagt de btw-categorie van het factuurregime.
  data.lines.forEach((line, index) => {
    lines.push("  <cac:InvoiceLine>");
    lines.push(`    <cbc:ID>${index + 1}</cbc:ID>`);
    lines.push(
      `    <cbc:InvoicedQuantity unitCode="C62">${quantity(line.quantity)}</cbc:InvoicedQuantity>`,
    );
    lines.push(
      `    <cbc:LineExtensionAmount${EUR}>${amount(line.amountCents)}</cbc:LineExtensionAmount>`,
    );
    lines.push("    <cac:Item>");
    lines.push(`      <cbc:Name>${xmlEscape(line.description)}</cbc:Name>`);
    lines.push("      <cac:ClassifiedTaxCategory>");
    lines.push(`        <cbc:ID>${cat.id}</cbc:ID>`);
    lines.push(`        <cbc:Percent>${cat.percent.toFixed(2)}</cbc:Percent>`);
    lines.push("        <cac:TaxScheme>");
    lines.push("          <cbc:ID>VAT</cbc:ID>");
    lines.push("        </cac:TaxScheme>");
    lines.push("      </cac:ClassifiedTaxCategory>");
    lines.push("    </cac:Item>");
    lines.push("    <cac:Price>");
    lines.push(`      <cbc:PriceAmount${EUR}>${amount(line.unitCents)}</cbc:PriceAmount>`);
    lines.push("    </cac:Price>");
    lines.push("  </cac:InvoiceLine>");
  });

  lines.push("</Invoice>");
  return lines.join("\n") + "\n";
}
