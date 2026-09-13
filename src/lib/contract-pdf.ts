// Server-side modelovereenkomst-PDF (pdf-lib, geen headless browser). De ondertekenflow
// bewaart het oorspronkelijke bestand onveranderlijk; oudere concepten worden on-demand gemaakt.
// De route /api/samenwerkingen/[id]/modelovereenkomst doet auth/ownership + serveert dit inline.
import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  A4,
  PDF_MARGIN,
  PDF_RIGHT,
  PDF_MUTED,
  PDF_INK,
  winAnsiSafe,
  makeWriter,
  type PdfWriter,
} from "@/lib/pdf-common";
import { type ModelAgreementContent } from "@/lib/contract-agreement";

export interface ModelAgreementSignatory {
  role: string;
  name: string;
  /** "Digitaal akkoord op 8 juni 2026" of "Nog niet ondertekend". */
  status: string;
}

export interface ModelAgreementPdfData {
  content: ModelAgreementContent;
  /** Korte referentie onderaan de kop (bv. opdrachttitel). */
  reference: string;
  signatories: ModelAgreementSignatory[];
  generatedAtLabel: string;
  /** Vaste metadata voor een reproduceerbaar origineel in de ondertekenflow. */
  stableDate?: Date;
}

const CONTENT_WIDTH = PDF_RIGHT - PDF_MARGIN;
const BOTTOM_LIMIT = PDF_MARGIN + 40;
const TOP = A4[1] - PDF_MARGIN;

/** Breekt tekst af op woordgrenzen zodat een alinea binnen de tekstbreedte past. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = winAnsiSafe(text)
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      const parts: string[] = [];
      let part = "";
      for (const char of word) {
        if (part && font.widthOfTextAtSize(part + char, size) > maxWidth) {
          parts.push(part);
          part = "";
        }
        part += char;
      }
      if (part) parts.push(part);
      return parts;
    });
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildModelAgreementPdf(data: ModelAgreementPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  if (data.stableDate) {
    pdf.setCreationDate(data.stableDate);
    pdf.setModificationDate(data.stableDate);
  }
  pdf.setTitle(`${data.content.title} — ${data.content.typeLabel}`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage(A4);
  let writer: PdfWriter = makeWriter(page, font);
  let y = TOP;

  const newPage = () => {
    page = pdf.addPage(A4);
    writer = makeWriter(page, font);
    y = TOP;
  };
  /** Zorgt dat er minstens `needed` px verticale ruimte is; anders nieuwe pagina. */
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM_LIMIT) newPage();
  };
  /** Tekent een afgebroken alinea; pagineert per regel. */
  const paragraph = (text: string, size: number, f: PDFFont, color = PDF_INK, lh = 14) => {
    for (const ln of wrapText(text, f, size, CONTENT_WIDTH)) {
      ensure(lh);
      writer.draw(ln, PDF_MARGIN, y, { size, f, color });
      y -= lh;
    }
  };

  // Kop
  const brand = rgb(0, 0.44, 0.58);
  const orange = rgb(0.83, 0.46, 0.34);
  page.drawSvgPath("M0 0h7a10 10 0 0 1 10 10v4 M27 22h-7a10 10 0 0 1 -10 -10v-4", {
    x: PDF_MARGIN,
    y: y + 4,
    scale: 0.85,
    borderColor: orange,
    borderWidth: 2.6,
  });
  writer.draw("handslag.", PDF_MARGIN + 32, y - 10, { size: 19, f: bold, color: brand });
  y -= 48;
  paragraph(data.content.title, 18, bold, brand, 23);
  writer.draw(`Overeenkomstvorm: ${data.content.typeLabel}`, PDF_MARGIN, y, {
    size: 10,
    color: PDF_MUTED,
  });
  y -= 13;
  if (data.reference) {
    paragraph(data.reference, 9, font, PDF_MUTED, 13);
  }
  y -= 6;
  writer.hr(y);
  y -= 18;

  // Intro
  paragraph(data.content.intro, 10, font);
  y -= 8;

  // Artikelen
  for (const article of data.content.articles) {
    const articleHeight =
      22 +
      article.body.reduce(
        (sum, text) => sum + wrapText(text, font, 10, CONTENT_WIDTH).length * 14 + 4,
        0,
      );
    ensure(Math.min(articleHeight, 140));
    writer.draw(article.heading, PDF_MARGIN, y, { size: 11, f: bold });
    y -= 16;
    for (const para of article.body) {
      paragraph(para, 10, font);
      y -= 4;
    }
    y -= 6;
  }

  // Ondertekening — bij elkaar houden
  if (data.signatories.length) {
    ensure(40 + data.signatories.length * 34);
    y -= 6;
    writer.hr(y);
    y -= 18;
    writer.draw("Ondertekening", PDF_MARGIN, y, { size: 11, f: bold });
    y -= 18;
  }
  for (const s of data.signatories) {
    paragraph(`${s.role}: ${s.name}`, 10, bold, PDF_INK, 13);
    paragraph(s.status, 9, font, PDF_MUTED, 13);
    y -= 8;
  }

  // Disclaimer + opmaakdatum onderaan
  ensure(48);
  y -= 4;
  paragraph(data.content.note, 8, font, PDF_MUTED, 11);
  y -= 4;
  if (data.generatedAtLabel)
    writer.draw(`Gegenereerd op ${data.generatedAtLabel}.`, PDF_MARGIN, y, {
      size: 8,
      color: PDF_MUTED,
    });

  const pages = pdf.getPages();
  for (const [index, current] of pages.entries()) {
    const footer = makeWriter(current, font);
    footer.hr(PDF_MARGIN - 10);
    footer.draw(data.content.title, PDF_MARGIN, PDF_MARGIN - 24, { size: 7, color: PDF_MUTED });
    footer.drawRight(`${index + 1} / ${pages.length}`, PDF_RIGHT, PDF_MARGIN - 24, {
      size: 8,
      color: PDF_MUTED,
    });
  }
  return pdf.save();
}
