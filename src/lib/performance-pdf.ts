// Server-side urenstaat/oplevering-PDF (pure JS via pdf-lib). Gegenereerd ON-DEMAND uit de actuele
// prestatie zodat de opdrachtgever de te-beoordelen uren/oplevering als echte PDF kan openen en
// controleren vóór goed-/afkeuren. De route /api/prestaties/[id]/pdf doet auth/ownership + serveert
// dit inline. Deelt de teken-helpers met de factuur-PDF (pdf-common).
import "server-only";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  A4,
  PDF_MARGIN,
  PDF_RIGHT,
  PDF_MUTED,
  PDF_LINE,
  euro,
  makeWriter,
  winAnsiSafe,
} from "@/lib/pdf-common";
import { computeOrt, resolveOrtRates, type OrtSegment } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";

export interface PerformancePdfData {
  perfType: string; // "HOURS" | "MILESTONE"
  jobTitle: string;
  freelancerName: string;
  clientName: string;
  periodStart: string; // "yyyy-mm-dd" of ""
  periodEnd: string;
  hours: number | null;
  rateCents: number | null;
  amountCents: number | null;
  milestoneTitle: string | null;
  description: string;
  ortSegments: string | null;
  ortProfile: string | null;
  ortCustomRates: string | null;
  submittedAt: string; // "yyyy-mm-dd" of ""
}

function parseSegments(raw: string | null): OrtSegment[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as OrtSegment[]) : [];
  } catch {
    return [];
  }
}

export async function buildPerformancePdf(data: PerformancePdfData): Promise<Uint8Array> {
  const isMilestone = data.perfType === "MILESTONE";
  const pdf = await PDFDocument.create();
  pdf.setTitle(isMilestone ? "Oplevering" : "Urenstaat");
  const page = pdf.addPage(A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { draw, drawRight, hr } = makeWriter(page, font);

  const M = PDF_MARGIN;
  const right = PDF_RIGHT;
  let y = A4[1] - M;

  // Kop
  draw(isMilestone ? "OPLEVERING" : "URENSTAAT", M, y, { size: 22, f: bold });
  if (data.submittedAt) {
    drawRight(`Ingediend: ${data.submittedAt}`, right, y, { size: 9, color: PDF_MUTED });
  }
  y -= 16;
  if (data.jobTitle) {
    drawRight(data.jobTitle, right, y, { size: 9, color: PDF_MUTED });
  }
  y -= 24;

  // Partijen
  const colR = 320;
  draw("ZZP'er", M, y, { size: 8, f: bold, color: PDF_MUTED });
  draw("Opdrachtgever", colR, y, { size: 8, f: bold, color: PDF_MUTED });
  y -= 14;
  draw(data.freelancerName, M, y, { f: bold });
  draw(data.clientName, colR, y, { f: bold });
  y -= 22;

  if (isMilestone) {
    draw("Oplevering", M, y, { size: 8, f: bold, color: PDF_MUTED });
    y -= 14;
    draw(data.milestoneTitle || "—", M, y, { size: 11, f: bold });
    if (data.amountCents != null) {
      drawRight(euro(data.amountCents), right, y, { size: 11, f: bold });
    }
    y -= 22;
  } else {
    // Periode
    const period =
      data.periodStart && data.periodEnd ? `${data.periodStart} – ${data.periodEnd}` : "—";
    draw(`Periode: ${period}`, M, y, { size: 9, color: PDF_MUTED });
    y -= 20;

    const segments = parseSegments(data.ortSegments);
    if (data.rateCents && segments.length > 0) {
      // ORT-uitsplitsing
      const result = computeOrt(
        segments,
        data.rateCents,
        resolveOrtRates({ ortProfile: data.ortProfile, ortCustomRates: data.ortCustomRates }),
      );
      const cHours = 330;
      const cSur = 440;
      hr(y);
      y -= 14;
      draw("Categorie", M, y, { size: 8, f: bold, color: PDF_MUTED });
      drawRight("Uren", cHours, y, { size: 8, f: bold, color: PDF_MUTED });
      drawRight("Toeslag", cSur, y, { size: 8, f: bold, color: PDF_MUTED });
      drawRight("Totaal", right, y, { size: 8, f: bold, color: PDF_MUTED });
      y -= 8;
      hr(y);
      y -= 16;
      for (const l of result.lines) {
        const label =
          l.category === "NORMAL"
            ? "Regulier"
            : (ORT_CATEGORY_LABEL[l.category as OrtCategory] ?? l.category);
        draw(label, M, y, { size: 10 });
        drawRight(String(l.hours), cHours, y, { size: 10 });
        drawRight(
          l.surchargeCents > 0
            ? `+${euro(l.surchargeCents)} (${Math.round(l.surchargeBps / 100)}%)`
            : "—",
          cSur,
          y,
          { size: 10 },
        );
        drawRight(euro(l.totalCents), right, y, { size: 10 });
        y -= 16;
      }
      y -= 6;
      hr(y);
      y -= 18;
      draw("Subtotaal excl. btw", M, y, { size: 11, f: bold });
      drawRight(euro(result.subtotalCents), right, y, { size: 11, f: bold });
      y -= 22;
    } else {
      // Geen ORT: losse uren × tarief.
      const hours = data.hours ?? 0;
      const total = data.rateCents ? Math.round(hours * data.rateCents) : (data.amountCents ?? 0);
      draw(`${hours} uur${data.rateCents ? ` × ${euro(data.rateCents)}` : ""}`, M, y, { size: 10 });
      drawRight(euro(total), right, y, { size: 11, f: bold });
      y -= 22;
    }
  }

  // Omschrijving
  if (data.description) {
    hr(y);
    y -= 16;
    draw("Omschrijving", M, y, { size: 8, f: bold, color: PDF_MUTED });
    y -= 14;
    // Eenvoudige woordwrap binnen de marges. Sanitize vóór het meten: widthOfTextAtSize gooit op
    // tekens buiten WinAnsi (de draw-helper sanitizet ook, maar de breedtemeting hier niet).
    const maxWidth = right - M;
    const words = winAnsiSafe(data.description).split(/\s+/);
    let lineText = "";
    const flush = () => {
      if (lineText) {
        draw(lineText, M, y, { size: 10 });
        y -= 14;
        lineText = "";
      }
    };
    for (const w of words) {
      const candidate = lineText ? `${lineText} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, 10) > maxWidth) {
        flush();
        lineText = w;
      } else {
        lineText = candidate;
      }
      if (y < M + 30) break; // niet onder de ondermarge schrijven
    }
    flush();
  }

  // Voet
  page.drawLine({
    start: { x: M, y: M + 14 },
    end: { x: right, y: M + 14 },
    thickness: 0.75,
    color: PDF_LINE,
  });
  draw("Deze urenstaat dient ter beoordeling; betaling verloopt buiten het platform.", M, M, {
    size: 8,
    color: PDF_MUTED,
  });

  return pdf.save();
}
