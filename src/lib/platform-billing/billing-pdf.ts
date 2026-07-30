// Server-side PDF voor een platformfactuur (incasso van de platform-verdienste). On-demand uit de
// actuele data; pdf-lib via de gedeelde pdf-common-helpers. Het platform is de uitschrijver, de
// betaler (franchise-owner of ZZP'er) de ontvanger.
import "server-only";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { A4, PDF_MARGIN, PDF_RIGHT, PDF_MUTED, PDF_LINE, euro, makeWriter } from "@/lib/pdf-common";
import { type BillingInvoiceDetail } from "@/lib/platform-billing/billing-data";

const KIND_LABEL: Record<string, string> = {
  TENANT_FEE: "Bemiddelingsfee",
  ZZP_MEMBERSHIP: "ZZP-platformabonnement",
};

const REGIME_LABEL: Record<string, string> = {
  STANDARD_HIGH: "21% btw",
  STANDARD_LOW: "9% btw",
  ZERO: "0% (nultarief)",
  REVERSE_CHARGE: "Btw verlegd",
  EXEMPT: "Vrijgesteld van btw",
};

export async function buildPlatformBillingPdf(data: BillingInvoiceDetail): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${data.number}`);
  let page = pdf.addPage(A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let { draw, drawRight, hr } = makeWriter(page, font);

  const M = PDF_MARGIN;
  const right = PDF_RIGHT;
  let y = A4[1] - M;

  draw("FACTUUR", M, y, { size: 22, f: bold });
  drawRight(`Nr. ${data.number}`, right, y, { size: 11, f: bold });
  y -= 16;
  drawRight(KIND_LABEL[data.kind] ?? data.kind, right, y, { size: 9, color: PDF_MUTED });
  y -= 24;

  const colR = 320;
  draw("Van", M, y, { size: 8, f: bold, color: PDF_MUTED });
  draw("Aan", colR, y, { size: 8, f: bold, color: PDF_MUTED });
  y -= 14;
  draw("Handslag", M, y, { f: bold });
  draw(data.payerName, colR, y, { f: bold });
  y -= 24;
  draw(`Factuurdatum: ${data.issuedAtYmd || "—"}`, M, y, { size: 9, color: PDF_MUTED });
  draw(`Periode: ${data.periodLabel}`, colR, y, { size: 9, color: PDF_MUTED });
  y -= 22;

  hr(y);
  y -= 14;
  draw("Omschrijving", M, y, { size: 8, f: bold, color: PDF_MUTED });
  drawRight("Bedrag", right, y, { size: 8, f: bold, color: PDF_MUTED });
  y -= 8;
  hr(y);
  y -= 16;

  if (data.lines.length > 0) {
    for (const l of data.lines) {
      if (y < M + 90) {
        // paginabreak voor lange facturen: nieuwe pagina + writer die daarop tekent
        page = pdf.addPage(A4);
        ({ draw, drawRight, hr } = makeWriter(page, font));
        y = A4[1] - M;
      }
      draw(l.description, M, y, { size: 10 });
      drawRight(euro(l.subtotalCents), right, y, { size: 10 });
      y -= 16;
    }
  } else {
    draw(KIND_LABEL[data.kind] ?? "Platformkosten", M, y, { size: 10 });
    drawRight(euro(data.subtotalCents), right, y, { size: 10 });
    y -= 16;
  }

  y -= 6;
  hr(y);
  y -= 18;
  const labelR = 360;
  draw("Subtotaal excl. btw", labelR - 130, y, { size: 10, color: PDF_MUTED });
  drawRight(euro(data.subtotalCents), right, y, { size: 10 });
  y -= 16;
  draw(`Btw (${REGIME_LABEL[data.vatRegime] ?? "btw"})`, labelR - 130, y, {
    size: 10,
    color: PDF_MUTED,
  });
  drawRight(euro(data.vatCents), right, y, { size: 10 });
  y -= 18;
  page.drawLine({
    start: { x: labelR - 130, y: y + 6 },
    end: { x: right, y: y + 6 },
    thickness: 0.75,
    color: PDF_LINE,
  });
  draw("Totaal incl. btw", labelR - 130, y, { size: 11, f: bold });
  drawRight(euro(data.totalCents), right, y, { size: 11, f: bold });

  return pdf.save();
}
