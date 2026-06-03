// Gedeelde bouwstenen voor server-side PDF's (pdf-lib). Gedeeld door de factuur- en urenstaat-PDF
// zodat de tekst-encoding, het euro-formaat en de teken-helpers één bron hebben.
import "server-only";
import { rgb, type Color, type PDFFont, type PDFPage } from "pdf-lib";

export const A4: [number, number] = [595.28, 841.89];
export const PDF_MARGIN = 50;
export const PDF_RIGHT = A4[0] - PDF_MARGIN;

export const PDF_INK = rgb(0.12, 0.12, 0.14);
export const PDF_MUTED = rgb(0.42, 0.42, 0.46);
export const PDF_LINE = rgb(0.82, 0.82, 0.85);

/** pdf-lib StandardFonts gebruiken WinAnsi; tekens daarbuiten (emoji, andere scripts) crashen de
 *  encoder. Vervang die door "?" zodat user-invoer nooit de PDF-generatie laat falen. */
export function winAnsiSafe(s: string): string {
  // ASCII + Latin-1 + de gangbare WinAnsi-extra's (€, slimme quotes, em/en-dash, bullet, ellipsis).
  return s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF€‘’“”–—•…]/g, "?");
}

/** Bedrag in centen → "EUR 1.234,56" (nl-NL duizendtallen). */
export function euro(cents: number): string {
  const neg = cents < 0;
  const v = Math.abs(cents);
  const whole = Math.floor(v / 100).toLocaleString("nl-NL");
  const frac = String(v % 100).padStart(2, "0");
  return `${neg ? "-" : ""}EUR ${whole},${frac}`;
}

export interface TextOpts {
  size?: number;
  f?: PDFFont;
  color?: Color;
}

export interface PdfWriter {
  /** Tekst links uitgelijnd op x. */
  draw: (text: string, x: number, y: number, opts?: TextOpts) => void;
  /** Tekst rechts uitgelijnd op xRight (bv. bedragen in een kolom). */
  drawRight: (text: string, xRight: number, y: number, opts?: TextOpts) => void;
  /** Horizontale scheidingslijn op y, van marge tot marge. */
  hr: (y: number) => void;
}

/** Maakt teken-helpers voor één pagina + standaardfont (WinAnsi-veilig). */
export function makeWriter(page: PDFPage, defaultFont: PDFFont): PdfWriter {
  const draw = (text: string, x: number, y: number, opts?: TextOpts) => {
    page.drawText(winAnsiSafe(text), {
      x,
      y,
      size: opts?.size ?? 10,
      font: opts?.f ?? defaultFont,
      color: opts?.color ?? PDF_INK,
    });
  };
  const drawRight = (text: string, xRight: number, y: number, opts?: TextOpts) => {
    const size = opts?.size ?? 10;
    const f = opts?.f ?? defaultFont;
    draw(text, xRight - f.widthOfTextAtSize(winAnsiSafe(text), size), y, opts);
  };
  const hr = (y: number) =>
    page.drawLine({
      start: { x: PDF_MARGIN, y },
      end: { x: PDF_RIGHT, y },
      thickness: 0.75,
      color: PDF_LINE,
    });
  return { draw, drawRight, hr };
}
