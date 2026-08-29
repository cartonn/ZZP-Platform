// SEPA scan-to-pay (EPC069-12) betaal-QR voor het factuurdetail. De opdrachtgever scant de code
// met zijn bankapp (ING/Rabo/ABN/bunq/Knab ondersteunen de EPC-standaard) en IBAN, tenaamstelling,
// bedrag én betaalkenmerk staan vooringevuld — geen overtikken, geen typefouten, en het correcte
// kenmerk voor de reconciliatie bij de ZZP'er. Puur + server-side afgeleid (grootboek-waarheid).
//
// Payload volgt EPC069-12 ("Quick Response Code: Guidelines to Enable the Data Capture for the
// Initiation of a SEPA Credit Transfer"), versie 002, tekenset UTF-8.
import qrcode from "qrcode-generator";
import { normalizeIban, isValidIban } from "@/lib/fiscal";

/** Invoer voor één SEPA-overboeking. Bedrag in centen (grootboek-waarheid). */
export interface EpcPaymentInput {
  /** Tenaamstelling van de begunstigde (de ZZP'er). */
  name: string;
  /** IBAN van de begunstigde; wordt genormaliseerd + gevalideerd. */
  iban: string;
  /** Te betalen bedrag in centen. */
  amountCents: number;
  /** Ongestructureerd betaalkenmerk (bijv. "Factuur ZZP-2026-0007"). */
  remittance: string;
}

/** Een gerenderde QR-matrix: modules per zijde + één SVG-pad dat alle donkere modules dekt. */
export interface SepaQr {
  /** Aantal modules per zijde (zonder quiet zone). */
  size: number;
  /** SVG-pad ('d') met unit = 1 module, dekt elke donkere module. */
  darkPath: string;
}

/** EPC-limieten (EPC069-12). */
const MAX_NAME = 70;
const MAX_REMITTANCE = 140;
const MAX_PAYLOAD_BYTES = 331;
/** EPC-bedrag: 0,01–999.999.999,99 → 1..99_999_999_999 centen. */
const MAX_AMOUNT_CENTS = 99_999_999_999;

/** Verwijder regeleindes/control-tekens zodat externe tekst de EPC-regelstructuur niet kan breken. */
function sanitizeLine(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Bouw de EPC069-12 SEPA-Credit-Transfer-payload. Retourneert `null` wanneer de invoer geen
 * spec-geldige payload kan opleveren (ongeldige IBAN, lege naam, bedrag buiten bereik, te groot).
 * Puur.
 */
export function buildEpcPayload(input: EpcPaymentInput): string | null {
  const iban = normalizeIban(input.iban);
  if (!isValidIban(iban)) return null;

  const name = sanitizeLine(input.name).slice(0, MAX_NAME).trim();
  if (!name) return null;

  if (
    !Number.isInteger(input.amountCents) ||
    input.amountCents < 1 ||
    input.amountCents > MAX_AMOUNT_CENTS
  ) {
    return null;
  }
  // Exact geformatteerd vanuit hele centen (geen float-drift): EUR<euro>.<cent, 2 posities>.
  const euros = Math.floor(input.amountCents / 100);
  const cents = input.amountCents % 100;
  const amount = `EUR${euros}.${String(cents).padStart(2, "0")}`;

  const remittance = sanitizeLine(input.remittance).slice(0, MAX_REMITTANCE).trim();

  const payload = [
    "BCD", // Service Tag
    "002", // Versie
    "1", // Tekenset: UTF-8
    "SCT", // Identificatie: SEPA Credit Transfer
    "", // BIC (optioneel; leeg toegestaan binnen de EER)
    name, // Naam begunstigde
    iban, // IBAN begunstigde
    amount, // Bedrag
    "", // Doel (optioneel)
    "", // Gestructureerd betaalkenmerk (ongebruikt)
    remittance, // Ongestructureerd betaalkenmerk
  ].join("\n");

  if (byteLength(payload) > MAX_PAYLOAD_BYTES) return null;
  return payload;
}

/** Codeer een payload tot een QR-matrix (byte-modus, correctieniveau M). Puur. */
export function encodeQrMatrix(payload: string): SepaQr {
  const qr = qrcode(0, "M");
  qr.addData(payload, "Byte");
  qr.make();
  const size = qr.getModuleCount();
  let darkPath = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) {
        darkPath += `M${col} ${row}h1v1h-1z`;
      }
    }
  }
  return { size, darkPath };
}

/**
 * Bouw de SEPA-betaal-QR voor één overboeking, of `null` als de invoer geen geldige payload geeft.
 * Puur; server-side aan te roepen (geen DOM-afhankelijkheid).
 */
export function buildSepaQr(input: EpcPaymentInput): SepaQr | null {
  const payload = buildEpcPayload(input);
  if (payload === null) return null;
  return encodeQrMatrix(payload);
}
