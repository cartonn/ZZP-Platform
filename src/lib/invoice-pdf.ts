// Server-side factuur-PDF (pure JS via pdf-lib — geen headless browser, geen fonts-op-schijf, geen
// Docker-risico). Genereert ON-DEMAND uit de actuele factuurdata, zodat de PDF altijd up-to-date is.
// De route /api/facturen/[id]/pdf doet auth/ownership + serveert dit inline (browser-PDF-viewer).
import "server-only";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { A4, PDF_MARGIN, PDF_RIGHT, PDF_MUTED, PDF_LINE, euro, makeWriter } from "@/lib/pdf-common";
import { formatIban } from "@/lib/fiscal";

export interface InvoicePdfLine {
  description: string;
  quantity: number;
  unitCents: number;
  amountCents: number;
}

export interface InvoicePdfData {
  number: string;
  issuedAt: string; // "yyyy-mm-dd" of ""
  dueAt: string;
  fromName: string;
  fromKvk?: string | null;
  fromBtw?: string | null;
  toName: string;
  jobTitle: string;
  vatRegime: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: InvoicePdfLine[];
  /** SEPA-IBAN van de crediteur; leeg/afwezig → geen betaalgegevens-blok op de PDF. */
  iban?: string | null;
  /**
   * Staat de factuur nog open voor betaling (zie `isInvoicePaymentPending`)? `false` onderdrukt het
   * betaalgegevens-blok — een betaalde/geannuleerde/gecrediteerde factuur mag geen betaalinstructie
   * tonen. Weggelaten → niet onderdrukt (toont zodra er een IBAN is); de route levert de waarde altijd.
   */
  paymentDue?: boolean;
}

export interface InvoicePaymentRow {
  label: string;
  value: string;
}

/**
 * Betaalgegevens-rijen voor op de factuur-PDF. Spiegelt de on-screen `PaymentDetailsCard` (IBAN,
 * t.n.v., betaalkenmerk, bedrag, uiterlijk betalen) — zelfde velden en dezelfde betaal-pending-gate
 * (`isInvoicePaymentPending`, via `paymentDue`) zodat scherm en PDF niet driften; de datumopmaak
 * volgt de PDF-conventie (ISO `yyyy-mm-dd`, gelijk aan de overige datums op de PDF). Puur/testbaar.
 *
 * Geeft `null` zonder IBAN óf wanneer de factuur niet meer op betaling wacht (`paymentDue === false`)
 * — een betaalde/geannuleerde factuur krijgt zo geen betaalinstructie die tot onterecht betalen leidt.
 *
 * `Bedrag` = totaal incl. btw (`totalCents`), gelijk aan de kaart en aan het factuurtotaal; bij
 * verlegde btw is dat het door de opdrachtgever daadwerkelijk over te maken bedrag (btw = 0).
 */
export function invoicePaymentRows(data: InvoicePdfData): InvoicePaymentRow[] | null {
  if (data.paymentDue === false) return null;
  const iban = data.iban?.trim();
  if (!iban) return null;
  const rows: InvoicePaymentRow[] = [
    { label: "IBAN", value: formatIban(iban) },
    { label: "T.n.v.", value: data.fromName },
    { label: "Betaalkenmerk", value: `Factuur ${data.number}` },
    { label: "Bedrag", value: euro(data.totalCents) },
  ];
  if (data.dueAt) rows.push({ label: "Uiterlijk betalen", value: data.dueAt });
  return rows;
}

const REGIME_LABEL: Record<string, string> = {
  STANDARD_HIGH: "21% btw",
  STANDARD_LOW: "9% btw",
  ZERO: "0% (nultarief)",
  REVERSE_CHARGE: "Btw verlegd naar opdrachtgever",
  EXEMPT: "Vrijgesteld van btw",
};

export async function buildInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${data.number}`);
  const page = pdf.addPage(A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { draw, drawRight, hr } = makeWriter(page, font);

  const M = PDF_MARGIN;
  const right = PDF_RIGHT;
  let y = A4[1] - M;

  // Kop
  draw("FACTUUR", M, y, { size: 22, f: bold });
  drawRight(`Nr. ${data.number}`, right, y, { size: 11, f: bold });
  y -= 16;
  if (data.jobTitle) {
    drawRight(data.jobTitle, right, y, { size: 9, color: PDF_MUTED });
  }
  y -= 24;

  // Partijen + datums
  const colR = 320;
  draw("Van", M, y, { size: 8, f: bold, color: PDF_MUTED });
  draw("Aan", colR, y, { size: 8, f: bold, color: PDF_MUTED });
  y -= 14;
  draw(data.fromName, M, y, { f: bold });
  draw(data.toName, colR, y, { f: bold });
  y -= 13;
  const fromMeta = [
    data.fromKvk ? `KvK ${data.fromKvk}` : "",
    data.fromBtw ? `BTW ${data.fromBtw}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (fromMeta) {
    draw(fromMeta, M, y, { size: 9, color: PDF_MUTED });
  }
  y -= 24;
  draw(`Factuurdatum: ${data.issuedAt || "—"}`, M, y, { size: 9, color: PDF_MUTED });
  draw(`Vervaldatum: ${data.dueAt || "—"}`, colR, y, { size: 9, color: PDF_MUTED });
  y -= 22;

  // Regels-tabel
  const cQty = 330;
  const cUnit = 430;
  hr(y);
  y -= 14;
  draw("Omschrijving", M, y, { size: 8, f: bold, color: PDF_MUTED });
  drawRight("Aantal", cQty + 30, y, { size: 8, f: bold, color: PDF_MUTED });
  drawRight("Per stuk", cUnit + 30, y, { size: 8, f: bold, color: PDF_MUTED });
  drawRight("Bedrag", right, y, { size: 8, f: bold, color: PDF_MUTED });
  y -= 8;
  hr(y);
  y -= 16;

  if (data.lines.length > 0) {
    for (const l of data.lines) {
      draw(l.description || "—", M, y, { size: 10 });
      drawRight(String(l.quantity), cQty + 30, y, { size: 10 });
      drawRight(euro(l.unitCents), cUnit + 30, y, { size: 10 });
      drawRight(euro(l.amountCents), right, y, { size: 10 });
      y -= 16;
    }
  } else {
    // Cascade-factuur kan leeg zijn qua regels: toon de opdracht als enige post.
    draw(data.jobTitle || "Geleverde diensten", M, y, { size: 10 });
    drawRight(euro(data.subtotalCents), right, y, { size: 10 });
    y -= 16;
  }

  y -= 6;
  hr(y);
  y -= 18;

  // Totalen (rechts uitgelijnd)
  const totalLabelR = cUnit + 30;
  draw("Subtotaal excl. btw", totalLabelR - 130, y, { size: 10, color: PDF_MUTED });
  drawRight(euro(data.subtotalCents), right, y, { size: 10 });
  y -= 16;
  const regimeLabel = REGIME_LABEL[data.vatRegime] ?? "Btw";
  draw(`Btw (${regimeLabel})`, totalLabelR - 130, y, { size: 10, color: PDF_MUTED });
  drawRight(euro(data.vatCents), right, y, { size: 10 });
  y -= 18;
  page.drawLine({
    start: { x: totalLabelR - 130, y: y + 6 },
    end: { x: right, y: y + 6 },
    thickness: 0.75,
    color: PDF_LINE,
  });
  draw("Totaal incl. btw", totalLabelR - 130, y, { size: 11, f: bold });
  drawRight(euro(data.totalCents), right, y, { size: 11, f: bold });

  // Betaalgegevens — de opdrachtgever betaalt rechtstreeks (off-platform); dit blok geeft de
  // gestructureerde gegevens (IBAN, betaalkenmerk, bedrag) zodat correct + op tijd betaald wordt.
  // Spiegelt de on-screen PaymentDetailsCard, die op de printbare pagina juist `print-hide` is —
  // zonder dit blok mist een opgeslagen/geprinte factuur elke betaalinstructie.
  const paymentRows = invoicePaymentRows(data);
  if (paymentRows) {
    y -= 34;
    hr(y);
    y -= 16;
    draw("Betaalgegevens", M, y, { size: 9, f: bold, color: PDF_MUTED });
    y -= 15;
    for (const r of paymentRows) {
      draw(r.label, M, y, { size: 9, color: PDF_MUTED });
      draw(r.value, M + 110, y, { size: 10 });
      y -= 14;
    }
  }

  // Regime-notitie onderaan
  if (data.vatRegime === "REVERSE_CHARGE") {
    draw("Btw verlegd — de opdrachtgever rekent de btw zelf af.", M, M + 20, {
      size: 8,
      color: PDF_MUTED,
    });
  } else if (data.vatRegime === "EXEMPT") {
    draw("Vrijgesteld van btw.", M, M + 20, { size: 8, color: PDF_MUTED });
  }

  return pdf.save();
}
