// Standalone bewijsstuk-PDF-generator voor de demo-seed (pdf-lib direct; GEEN `server-only`/`@/lib`
// imports, want de seed draait via tsx/node — niet in een RSC-context). Produceert een geloofwaardig,
// duidelijk gemarkeerd demo-document zodat VOG/diploma/certificaat als echte PDF te bekijken zijn.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type Color } from "pdf-lib";

const TYPE_LABEL: Record<string, string> = {
  VOG: "Verklaring Omtrent het Gedrag (VOG)",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificaat",
  INSURANCE: "Verzekeringsbewijs",
  LICENSE: "Beroepsregistratie",
  OTHER: "Bewijsstuk",
};

// pdf-lib StandardFonts gebruiken WinAnsi; tekens daarbuiten crashen de encoder → vervang door "?".
function safe(s: string): string {
  return s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF€‘’“”–—•…]/g, "?");
}

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

export interface CredentialPdfInput {
  holderName: string;
  title: string;
  issuer?: string | null;
  type: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
}

export async function credentialBewijsPdf(input: CredentialPdfInput): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Bewijsstuk — ${input.title}`);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.12, 0.12, 0.14);
  const muted = rgb(0.42, 0.42, 0.46);
  const line = rgb(0.8, 0.8, 0.83);
  const M = 56;
  let y = 841.89 - 80;

  const draw = (
    text: string,
    x: number,
    yy: number,
    size = 11,
    f: PDFFont = font,
    c: Color = ink,
  ) => page.drawText(safe(text), { x, y: yy, size, font: f, color: c });

  draw("BEWIJSSTUK", M, y, 24, bold);
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: 595.28 - M, y }, thickness: 1, color: line });
  y -= 36;

  draw(TYPE_LABEL[input.type] ?? "Bewijsstuk", M, y, 9, bold, muted);
  y -= 18;
  draw(input.title, M, y, 16, bold);
  y -= 36;

  const row = (label: string, value: string) => {
    if (!value) return;
    draw(label, M, y, 9, font, muted);
    draw(value, M + 150, y, 11, bold);
    y -= 22;
  };
  row("Houder", input.holderName);
  row("Uitgever", input.issuer ?? "");
  row("Uitgegeven", ymd(input.issuedAt));
  row("Geldig tot", input.expiresAt ? ymd(input.expiresAt) : "Geen einddatum");

  draw("Demonstratie-bewijsstuk voor het ZZP-platform — niet rechtsgeldig.", M, 70, 8, font, muted);

  return Buffer.from(await pdf.save());
}
