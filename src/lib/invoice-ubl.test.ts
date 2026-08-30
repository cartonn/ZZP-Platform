import { describe, expect, it } from "vitest";
import { buildInvoiceUbl, type InvoiceUblData } from "@/lib/invoice-ubl";

const base: InvoiceUblData = {
  number: "2026-0007",
  issuedAt: "2026-08-01",
  dueAt: "2026-08-31",
  fromName: "Sanne de Vries",
  fromKvk: "12345678",
  fromBtw: "NL001234567B01",
  toName: "ZorgGroep Noord B.V.",
  jobTitle: "Wijkverpleging avonddienst",
  vatRegime: "STANDARD_HIGH",
  subtotalCents: 100000,
  vatCents: 21000,
  totalCents: 121000,
  lines: [
    { description: "Verpleegkundige uren", quantity: 20, unitCents: 5000, amountCents: 100000 },
  ],
  iban: "NL02 ABNA 0123 4567 89",
  paymentDue: true,
};

/** Naïeve well-formedness-check: elke open-tag heeft een sluiter, geen losse haken. */
function tagBalance(xml: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of xml.matchAll(/<\/?([A-Za-z:]+)[\s>]/g)) {
    const tag = m[1];
    if (!tag) continue;
    const closing = m[0].startsWith("</");
    counts[tag] = (counts[tag] ?? 0) + (closing ? -1 : 1);
  }
  return counts;
}

describe("buildInvoiceUbl", () => {
  it("levert een well-formed UBL-Invoice met XML-declaratie en namespaces", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<Invoice ");
    expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
    expect(xml).toContain("</Invoice>");
    // Alle elementen die openen, sluiten ook (self-closing tags gebruiken we niet).
    const balance = tagBalance(xml);
    for (const [tag, n] of Object.entries(balance)) {
      expect(n, `tag ${tag} is niet gebalanceerd`).toBe(0);
    }
  });

  it("zet kop-velden: NLCIUS-customization, nummer, datums en type 380", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml).toContain("urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0");
    expect(xml).toContain("<cbc:ID>2026-0007</cbc:ID>");
    expect(xml).toContain("<cbc:IssueDate>2026-08-01</cbc:IssueDate>");
    expect(xml).toContain("<cbc:DueDate>2026-08-31</cbc:DueDate>");
    expect(xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(xml).toContain("<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");
    expect(xml).toContain("<cbc:Note>Wijkverpleging avonddienst</cbc:Note>");
  });

  it("bevat leverancier met KvK-endpoint/registratie en btw-scheme", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml).toContain('<cbc:EndpointID schemeID="0106">12345678</cbc:EndpointID>');
    expect(xml).toContain('<cbc:CompanyID schemeID="0106">12345678</cbc:CompanyID>');
    expect(xml).toContain("<cbc:CompanyID>NL001234567B01</cbc:CompanyID>");
    expect(xml).toContain("<cbc:Name>Sanne de Vries</cbc:Name>");
    expect(xml).toContain("<cbc:Name>ZorgGroep Noord B.V.</cbc:Name>");
  });

  it("formatteert bedragen met punt-decimaal en twee decimalen", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml).toContain(
      '<cbc:TaxInclusiveAmount currencyID="EUR">1210.00</cbc:TaxInclusiveAmount>',
    );
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">1210.00</cbc:PayableAmount>');
    expect(xml).toContain(
      '<cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount>',
    );
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">210.00</cbc:TaxAmount>');
  });

  it("standaardregime → btw-categorie S met 21%", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml).toContain("<cbc:ID>S</cbc:ID>");
    expect(xml).toContain("<cbc:Percent>21.00</cbc:Percent>");
    expect(xml).not.toContain("<cbc:TaxExemptionReason>");
  });

  it("verlegde btw → categorie AE, 0% en een vrijstellingsreden", () => {
    const xml = buildInvoiceUbl({
      ...base,
      vatRegime: "REVERSE_CHARGE",
      vatCents: 0,
      totalCents: 100000,
    });
    expect(xml).toContain("<cbc:ID>AE</cbc:ID>");
    expect(xml).toContain("<cbc:Percent>0.00</cbc:Percent>");
    expect(xml).toContain(
      "<cbc:TaxExemptionReason>Btw verlegd naar de opdrachtgever</cbc:TaxExemptionReason>",
    );
  });

  it("vrijstelling/KOR → categorie E, 0% en een vrijstellingsreden", () => {
    const xml = buildInvoiceUbl({ ...base, vatRegime: "EXEMPT", vatCents: 0, totalCents: 100000 });
    expect(xml).toContain("<cbc:ID>E</cbc:ID>");
    expect(xml).toContain(
      "<cbc:TaxExemptionReason>Vrijgesteld van omzetbelasting</cbc:TaxExemptionReason>",
    );
  });

  it("onbekend regime valt veilig terug op standaard 21% (categorie S)", () => {
    const xml = buildInvoiceUbl({ ...base, vatRegime: "IETS_ONBEKENDS" });
    expect(xml).toContain("<cbc:ID>S</cbc:ID>");
    expect(xml).toContain("<cbc:Percent>21.00</cbc:Percent>");
  });

  it("neemt een betaalmiddel-blok met SEPA-code 58, compacte IBAN en betaalkenmerk op", () => {
    const xml = buildInvoiceUbl(base);
    expect(xml).toContain("<cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>");
    expect(xml).toContain("<cbc:PaymentID>Factuur 2026-0007</cbc:PaymentID>");
    // IBAN zonder spaties, in hoofdletters.
    expect(xml).toContain("<cbc:ID>NL02ABNA0123456789</cbc:ID>");
  });

  it("onderdrukt het betaalmiddel-blok bij paymentDue=false", () => {
    const xml = buildInvoiceUbl({ ...base, paymentDue: false });
    expect(xml).not.toContain("<cac:PaymentMeans>");
  });

  it("onderdrukt het betaalmiddel-blok zonder IBAN", () => {
    const xml = buildInvoiceUbl({ ...base, iban: null });
    expect(xml).not.toContain("<cac:PaymentMeans>");
  });

  it("laat leverancier-btw/KvK weg wanneer die ontbreken", () => {
    const xml = buildInvoiceUbl({ ...base, fromKvk: null, fromBtw: "  " });
    expect(xml).not.toContain('schemeID="0106"');
    expect(xml).not.toContain("<cac:PartyTaxScheme>");
  });

  it("laat lege datums weg (concept zonder uitgiftedatum)", () => {
    const xml = buildInvoiceUbl({ ...base, issuedAt: "", dueAt: "" });
    expect(xml).not.toContain("<cbc:IssueDate>");
    expect(xml).not.toContain("<cbc:DueDate>");
  });

  it("escapet XML-metatekens in vrije tekst (naam, omschrijving)", () => {
    const xml = buildInvoiceUbl({
      ...base,
      toName: "Jansen & Zn <B.V.>",
      lines: [
        { description: 'Advies "spoed" & meer', quantity: 1, unitCents: 5000, amountCents: 5000 },
      ],
    });
    expect(xml).toContain("Jansen &amp; Zn &lt;B.V.&gt;");
    expect(xml).toContain("Advies &quot;spoed&quot; &amp; meer");
    expect(xml).not.toContain("Jansen & Zn");
  });

  it("nummert regels vanaf 1 en toont compacte hoeveelheden en stukprijzen", () => {
    const xml = buildInvoiceUbl({
      ...base,
      lines: [
        { description: "Uren week 31", quantity: 20.5, unitCents: 5000, amountCents: 102500 },
        { description: "Reiskosten", quantity: 1, unitCents: 2300, amountCents: 2300 },
      ],
    });
    expect(xml).toContain("<cbc:ID>1</cbc:ID>");
    expect(xml).toContain("<cbc:ID>2</cbc:ID>");
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="C62">20.5</cbc:InvoicedQuantity>');
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>');
    expect(xml).toContain('<cbc:PriceAmount currencyID="EUR">50.00</cbc:PriceAmount>');
    expect(xml).toContain('<cbc:PriceAmount currencyID="EUR">23.00</cbc:PriceAmount>');
  });

  it("is deterministisch: dezelfde input → identieke output", () => {
    expect(buildInvoiceUbl(base)).toBe(buildInvoiceUbl(base));
  });
});
