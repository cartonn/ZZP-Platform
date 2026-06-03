// Server-side factuur-PDF (pure JS via pdf-lib — geen headless browser, geen fonts-op-schijf, geen
// Docker-risico). Genereert ON-DEMAND uit de actuele factuurdata, zodat de PDF altijd up-to-date is.
// De route /api/facturen/[id]/pdf doet auth/ownership + serveert dit inline (browser-PDF-viewer).
import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

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
}

const REGIME_LABEL: Record<string, string> = {
  STANDARD_HIGH: "21% btw",
  STANDARD_LOW: "9% btw",
  ZERO: "0% (nultarief)",
  REVERSE_CHARGE: "Btw verlegd naar opdrachtgever",
  EXEMPT: "Vrijgesteld van btw",
};

/** pdf-lib StandardFonts gebruiken WinAnsi; tekens daarbuiten (emoji, andere scripts) crashen de
 *  encoder. Vervang die door "?" zodat user-invoer nooit de PDF-generatie laat falen. */
function winAnsiSafe(s: string): string {
  // ASCII + Latin-1 + de gangbare WinAnsi-extra's (€, slimme quotes, em/en-dash, bullet, ellipsis).
  return s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF€‘’“”–—•…]/g, "?");
}

function euro(cents: number): string {
  const neg = cents < 0;
  const v = Math.abs(cents);
  const whole = Math.floor(v / 100).toLocaleString("nl-NL");
  const frac = String(v % 100).padStart(2, "0");
  return `${neg ? "-" : ""}EUR ${whole},${frac}`;
}

export async function buildInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factuur ${data.number}`);
  const page = pdf.addPage([595.28, 841.89]); // A4 in punten
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.12, 0.12, 0.14);
  const muted = rgb(0.42, 0.42, 0.46);
  const line = rgb(0.82, 0.82, 0.85);
  const M = 50; // marge
  const right = 595.28 - M;
  let y = 841.89 - M;

  const draw = (
    text: string,
    x: number,
    yy: number,
    opts?: { size?: number; f?: PDFFont; color?: typeof ink },
  ) => {
    const size = opts?.size ?? 10;
    page.drawText(winAnsiSafe(text), {
      x,
      y: yy,
      size,
      font: opts?.f ?? font,
      color: opts?.color ?? ink,
    });
  };
  const drawRight = (
    text: string,
    xRight: number,
    yy: number,
    opts?: { size?: number; f?: PDFFont; color?: typeof ink },
  ) => {
    const size = opts?.size ?? 10;
    const f = opts?.f ?? font;
    const safe = winAnsiSafe(text);
    draw(text, xRight - f.widthOfTextAtSize(safe, size), yy, opts);
  };
  const hr = (yy: number) =>
    page.drawLine({
      start: { x: M, y: yy },
      end: { x: right, y: yy },
      thickness: 0.75,
      color: line,
    });

  // Kop
  draw("FACTUUR", M, y, { size: 22, f: bold });
  drawRight(`Nr. ${data.number}`, right, y, { size: 11, f: bold });
  y -= 16;
  if (data.jobTitle) {
    drawRight(data.jobTitle, right, y, { size: 9, color: muted });
  }
  y -= 24;

  // Partijen + datums
  const colR = 320;
  draw("Van", M, y, { size: 8, f: bold, color: muted });
  draw("Aan", colR, y, { size: 8, f: bold, color: muted });
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
    draw(fromMeta, M, y, { size: 9, color: muted });
  }
  y -= 24;
  draw(`Factuurdatum: ${data.issuedAt || "—"}`, M, y, { size: 9, color: muted });
  draw(`Vervaldatum: ${data.dueAt || "—"}`, colR, y, { size: 9, color: muted });
  y -= 22;

  // Regels-tabel
  const cQty = 330;
  const cUnit = 430;
  hr(y);
  y -= 14;
  draw("Omschrijving", M, y, { size: 8, f: bold, color: muted });
  drawRight("Aantal", cQty + 30, y, { size: 8, f: bold, color: muted });
  drawRight("Per stuk", cUnit + 30, y, { size: 8, f: bold, color: muted });
  drawRight("Bedrag", right, y, { size: 8, f: bold, color: muted });
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
  draw("Subtotaal excl. btw", totalLabelR - 130, y, { size: 10, color: muted });
  drawRight(euro(data.subtotalCents), right, y, { size: 10 });
  y -= 16;
  const regimeLabel = REGIME_LABEL[data.vatRegime] ?? "Btw";
  draw(`Btw (${regimeLabel})`, totalLabelR - 130, y, { size: 10, color: muted });
  drawRight(euro(data.vatCents), right, y, { size: 10 });
  y -= 18;
  page.drawLine({
    start: { x: totalLabelR - 130, y: y + 6 },
    end: { x: right, y: y + 6 },
    thickness: 0.75,
    color: line,
  });
  draw("Totaal incl. btw", totalLabelR - 130, y, { size: 11, f: bold });
  drawRight(euro(data.totalCents), right, y, { size: 11, f: bold });

  // Regime-notitie onderaan
  if (data.vatRegime === "REVERSE_CHARGE") {
    draw("Btw verlegd — de opdrachtgever rekent de btw zelf af.", M, M + 20, {
      size: 8,
      color: muted,
    });
  } else if (data.vatRegime === "EXEMPT") {
    draw("Vrijgesteld van btw.", M, M + 20, { size: 8, color: muted });
  }

  return pdf.save();
}
