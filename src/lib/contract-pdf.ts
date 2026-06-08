// Server-side modelovereenkomst-PDF (pdf-lib, geen headless browser). On-demand gegenereerd uit de
// actuele samenwerkings-/opdrachtdata + het akkoord per partij, zodat de PDF altijd actueel is.
// De route /api/samenwerkingen/[id]/modelovereenkomst doet auth/ownership + serveert dit inline.
import "server-only";
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
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
}

const CONTENT_WIDTH = PDF_RIGHT - PDF_MARGIN;
const BOTTOM_LIMIT = PDF_MARGIN + 40;
const TOP = A4[1] - PDF_MARGIN;

/** Breekt tekst af op woordgrenzen zodat een alinea binnen de tekstbreedte past. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = winAnsiSafe(text).split(/\s+/).filter(Boolean);
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
  writer.draw(data.content.title, PDF_MARGIN, y, { size: 18, f: bold });
  y -= 20;
  writer.draw(`Overeenkomstvorm: ${data.content.typeLabel}`, PDF_MARGIN, y, {
    size: 10,
    color: PDF_MUTED,
  });
  y -= 13;
  if (data.reference) {
    writer.draw(data.reference, PDF_MARGIN, y, { size: 9, color: PDF_MUTED });
    y -= 13;
  }
  y -= 6;
  writer.hr(y);
  y -= 18;

  // Intro
  paragraph(data.content.intro, 10, font);
  y -= 8;

  // Artikelen
  for (const article of data.content.articles) {
    ensure(28);
    writer.draw(article.heading, PDF_MARGIN, y, { size: 11, f: bold });
    y -= 16;
    for (const para of article.body) {
      paragraph(para, 10, font);
      y -= 4;
    }
    y -= 6;
  }

  // Ondertekening — bij elkaar houden
  ensure(40 + data.signatories.length * 34);
  y -= 6;
  writer.hr(y);
  y -= 18;
  writer.draw("Ondertekening", PDF_MARGIN, y, { size: 11, f: bold });
  y -= 18;
  for (const s of data.signatories) {
    writer.draw(`${s.role}: ${s.name}`, PDF_MARGIN, y, { size: 10, f: bold });
    y -= 13;
    writer.draw(s.status, PDF_MARGIN, y, { size: 9, color: PDF_MUTED });
    y -= 21;
  }

  // Disclaimer + opmaakdatum onderaan
  ensure(48);
  y -= 4;
  paragraph(data.content.note, 8, font, PDF_MUTED, 11);
  y -= 4;
  writer.draw(`Gegenereerd op ${data.generatedAtLabel}.`, PDF_MARGIN, y, {
    size: 8,
    color: PDF_MUTED,
  });

  return pdf.save();
}
