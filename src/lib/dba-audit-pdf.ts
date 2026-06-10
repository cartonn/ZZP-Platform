// Server-side DBA-dossier-PDF (pdf-lib, geen headless browser). On-demand gegenereerd uit de
// actuele samenwerkings-/opdrachtdata, bedoeld als onderbouwingsbundel voor de Belastingdienst.
// De route /api/samenwerkingen/[id]/dba-dossier doet auth/ownership + serveert dit inline.
// HARD: voettekst-disclaimer op elke pagina (Besluit 2).
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
import { type DbaAuditData } from "@/lib/dba-audit";

const CONTENT_WIDTH = PDF_RIGHT - PDF_MARGIN;
const BOTTOM_LIMIT = PDF_MARGIN + 32; // ruimte voor footer
const TOP = A4[1] - PDF_MARGIN;

/** Tekst afbreken op woordgrenzen zodat de alinea binnen de breedte past. */
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

interface PageCtx {
  page: PDFPage;
  writer: PdfWriter;
  y: number;
}

export async function buildDbaAuditPdf(data: DbaAuditData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(
    winAnsiSafe(`DBA-dossier — ${data.header.jobTitle} — ${data.header.freelancerName}`),
  );
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  /** Maak een nieuwe pagina en zet voettekst direct. */
  const addPage = (): PageCtx => {
    const page = pdf.addPage(A4);
    const writer = makeWriter(page, font);
    // Voettekst op elke pagina (HARD — Besluit 2)
    writer.draw(winAnsiSafe(data.footer), PDF_MARGIN, PDF_MARGIN - 4, {
      size: 7,
      color: PDF_MUTED,
    });
    writer.draw(
      winAnsiSafe(`Gegenereerd: ${fmtDateTime(data.generatedAt)}`),
      PDF_MARGIN,
      PDF_MARGIN - 14,
      { size: 7, color: PDF_MUTED },
    );
    return { page, writer, y: TOP };
  };

  let ctx = addPage();

  const ensure = (needed: number): void => {
    if (ctx.y - needed < BOTTOM_LIMIT) {
      ctx = addPage();
    }
  };

  const draw = (text: string, x: number, opts?: Parameters<PdfWriter["draw"]>[3]) =>
    ctx.writer.draw(text, x, ctx.y, opts);

  const paragraph = (text: string, size: number, f: PDFFont, lh = 13): void => {
    for (const ln of wrapText(text, f, size, CONTENT_WIDTH)) {
      ensure(lh);
      ctx.writer.draw(ln, PDF_MARGIN, ctx.y, { size, f, color: PDF_INK });
      ctx.y -= lh;
    }
  };

  const muted = (text: string, size: number, lh = 13): void => {
    for (const ln of wrapText(text, f, size, CONTENT_WIDTH)) {
      ensure(lh);
      ctx.writer.draw(ln, PDF_MARGIN, ctx.y, { size, f: font, color: PDF_MUTED });
      ctx.y -= lh;
    }
  };

  // Tijdelijk font-alias zodat de helpers het juiste font gebruiken.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const f = font;

  const sectionHeader = (title: string) => {
    ensure(28);
    ctx.y -= 4;
    ctx.writer.hr(ctx.y);
    ctx.y -= 16;
    ctx.writer.draw(winAnsiSafe(title), PDF_MARGIN, ctx.y, { size: 11, f: bold });
    ctx.y -= 16;
  };

  const kv = (label: string, value: string) => {
    ensure(14);
    ctx.writer.draw(winAnsiSafe(`${label}:`), PDF_MARGIN, ctx.y, {
      size: 9,
      f: bold,
      color: PDF_MUTED,
    });
    ctx.writer.draw(winAnsiSafe(value), PDF_MARGIN + 160, ctx.y, { size: 9 });
    ctx.y -= 13;
  };

  // =========================================================================
  // Blok 1 — Kop: samenwerking
  // =========================================================================
  draw(winAnsiSafe("DBA-dossier"), PDF_MARGIN, { size: 20, f: bold });
  ctx.y -= 22;
  draw(winAnsiSafe(data.header.jobTitle), PDF_MARGIN, { size: 13, f: bold });
  ctx.y -= 15;
  draw(winAnsiSafe(`ZZP'er: ${data.header.freelancerName}`), PDF_MARGIN, {
    size: 10,
    color: PDF_MUTED,
  });
  ctx.y -= 13;
  draw(winAnsiSafe(`Opdrachtgever: ${data.header.companyName}`), PDF_MARGIN, {
    size: 10,
    color: PDF_MUTED,
  });
  ctx.y -= 13;
  draw(winAnsiSafe(data.header.rateLabel), PDF_MARGIN, { size: 9, color: PDF_MUTED });
  ctx.y -= 10;

  // =========================================================================
  // Blok 2 — Modelovereenkomst-status
  // =========================================================================
  sectionHeader("Modelovereenkomst-status");
  kv("Type overeenkomst", data.agreement.typeLabel);
  kv("ZZP'er akkoord", data.agreement.freelancerSigned);
  kv("Opdrachtgever akkoord", data.agreement.clientSigned);
  kv(
    "Beide partijen getekend",
    data.agreement.bothSigned
      ? "Ja — beide akkoord gegeven"
      : "Nee — nog niet door beide partijen ondertekend",
  );
  ctx.y -= 4;

  // =========================================================================
  // Blok 3 — DBA-indicatoren
  // =========================================================================
  sectionHeader("DBA-indicatoren");
  kv("Risicosignaal", data.dbaAssessment.levelLabel);
  if (data.dbaAssessment.durationMonths != null) {
    kv("Duur samenwerking", `${data.dbaAssessment.durationMonths} maanden`);
  }
  ctx.y -= 6;

  for (const ind of data.dbaAssessment.indicators) {
    ensure(28);
    const levelStr = ind.level ? ` (${ind.level})` : "";
    const valStr =
      typeof ind.value === "boolean"
        ? ind.value
          ? "Ja"
          : "Nee"
        : ind.value != null
          ? String(ind.value)
          : "—";
    ctx.writer.draw(winAnsiSafe(`${ind.label}: ${valStr}${levelStr}`), PDF_MARGIN, ctx.y, {
      size: 9,
      f: bold,
    });
    ctx.y -= 12;
    for (const ln of wrapText(ind.reason, font, 8, CONTENT_WIDTH - 10)) {
      ensure(11);
      ctx.writer.draw(ln, PDF_MARGIN + 8, ctx.y, { size: 8, color: PDF_MUTED });
      ctx.y -= 11;
    }
    ctx.y -= 3;
  }

  ctx.y -= 4;
  muted(data.dbaAssessment.disclaimer, 8, 11);
  ctx.y -= 4;

  // =========================================================================
  // Blok 4 — Rechtsvermoeden-tarieftoets
  // =========================================================================
  sectionHeader("Rechtsvermoeden werknemerschap — tarieftoets");
  kv(
    "Resultaat",
    data.rateThreshold.belowThreshold ? "Tarief ONDER drempel" : "Tarief boven of op drempel",
  );
  if (data.rateThreshold.rateCentsSnapshot != null) {
    kv("Vastgelegd tarief", `EUR ${Math.round(data.rateThreshold.rateCentsSnapshot / 100)}/uur`);
  } else {
    kv("Vastgelegd tarief", "Niet vastgelegd");
  }
  kv("Drempel", `EUR ${Math.round(data.rateThreshold.thresholdCents / 100)}/uur`);
  ctx.y -= 4;
  muted(winAnsiSafe(data.rateThreshold.hint), 8, 11);
  ctx.y -= 4;

  // =========================================================================
  // Blok 5 — Ondernemerschap-signalen
  // =========================================================================
  sectionHeader("Ondernemerschap-signalen");
  kv("Vertrouwensniveau", data.entrepreneurship.trustLevel);
  kv("Geverifieerde certificaten", String(data.entrepreneurship.verifiedCredentialCount));
  kv("KvK-nummer aanwezig", data.entrepreneurship.hasKvk ? "Ja" : "Nee");
  kv("BTW-nummer aanwezig", data.entrepreneurship.hasBtw ? "Ja" : "Nee");
  ctx.y -= 8;

  // Samenvatting geverifieerde certificaten
  const verified = data.entrepreneurship.verifiedCredentialCount;
  if (verified > 0) {
    paragraph(
      winAnsiSafe(
        `De ZZP'er heeft ${verified} ${verified === 1 ? "geverifieerd certificaat" : "geverifieerde certificaten"} op het platform.`,
      ),
      9,
      font,
    );
  } else {
    muted("Nog geen geverifieerde certificaten op het platform.", 9);
  }

  return pdf.save();
}

/** Datum + tijd voor de kop → "dd-mm-yyyy hh:mm". */
function fmtDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
