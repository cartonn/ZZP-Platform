// Malware-scan van geüploade bewijsstukken (VOG, diploma's, verzekering) achter een schone
// service-grens — hetzelfde seam-patroon als StorageDriver / MailSender / RateLimitStore.
//
// De upload-keten valideert al type + grootte + magic-bytes (storage.ts). Deze module voegt de
// laatste productie-laag toe die OWASP aanraadt voor gevoelige bestand-uploads: een virus-/malware-
// scan vóór het bestand naar de opslag gaat.
//
//  - NoopUploadScanner (default): slaat de scan over. De pilot draait ongewijzigd door zolang er
//    geen scanner geconfigureerd is (graceful fallback).
//  - ClamAvUploadScanner (env UPLOAD_SCANNER=clamav): praat via het rauwe clamd TCP-protocol
//    (INSTREAM) met een ClamAV-daemon. Geen extra SDK-dependency (net-socket), net als de Upstash-
//    en Resend-adapters. Onboarding (een clamd-daemon draaien) is mensenwerk; zonder host faalt de
//    env-validatie helder.
//
// Beleid bij een onbereikbare scanner: **fail-closed** (weiger de upload) — een beveiligingsscanner
// die faalt-open is erger dan nutteloos. Zet UPLOAD_SCAN_FAIL_OPEN=true om bewust door te laten
// (bv. tijdens een clamd-storing waarin beschikbaarheid boven scannen gaat).

import { UploadValidationError } from "@/lib/services/storage";
import { logger } from "@/lib/observability/logger";
import { getErrorReporter } from "@/lib/observability/report";
import {
  recordUploadScanDeliverySuccess,
  recordUploadScanDeliveryFailure,
} from "@/lib/observability/upload-scan-delivery-heartbeat";

/** clamd luistert standaard op TCP-poort 3310. */
export const CLAMAV_DEFAULT_PORT = 3310;
/** Chunkgrootte voor het INSTREAM-protocol (ruim onder clamd's StreamMaxLength). */
const INSTREAM_CHUNK_BYTES = 64 * 1024;
/** Time-out voor een enkele clamd-scan. */
const CLAMD_TIMEOUT_MS = 10_000;

export type UploadScanVerdict = "clean" | "infected" | "skipped" | "error";

export interface UploadScanResult {
  verdict: UploadScanVerdict;
  scanner: string;
  /** Naam van de gevonden dreiging (alleen bij "infected"). */
  signature?: string;
  /** Vrije, niet-gevoelige toelichting (alleen bij "error"). */
  message?: string;
}

/** Niet-gevoelige metadata over het bestand (nooit de bestandsnaam — die kan PII bevatten). */
export interface UploadScanTarget {
  mimeType: string;
  size: number;
}

export interface UploadScanner {
  readonly name: string;
  scan(buffer: Buffer): Promise<UploadScanResult>;
}

/** Geen-scan-default: de pilot draait ongewijzigd door. */
export class NoopUploadScanner implements UploadScanner {
  readonly name = "noop";
  async scan(_buffer: Buffer): Promise<UploadScanResult> {
    void _buffer;
    return { verdict: "skipped", scanner: "noop" };
  }
}

/**
 * Interpreteert de rauwe clamd INSTREAM-respons. Puur (testbaar) — de netwerklaag levert de string.
 *   - "stream: OK"                       → clean
 *   - "stream: <Signature> FOUND"        → infected
 *   - "... ERROR" / onherkenbaar / leeg  → error (caller beslist fail-open/closed)
 */
export function interpretClamAvResponse(raw: string): UploadScanResult {
  const line = raw.replace(/\0/g, "").trim();
  const found = line.match(/^stream:\s*(.+?)\s+FOUND$/i);
  if (found) {
    return { verdict: "infected", scanner: "clamav", signature: found[1] };
  }
  if (/(^|\s)OK$/.test(line)) {
    return { verdict: "clean", scanner: "clamav" };
  }
  return { verdict: "error", scanner: "clamav", message: line || "Lege respons van clamd." };
}

/** Leest de clamd-host/poort uit de omgeving. Poort valt terug op de default bij een ongeldige waarde. */
export function resolveClamdTarget(): { host: string; port: number } {
  const host = process.env.CLAMAV_HOST?.trim() || "";
  const port = Number(process.env.CLAMAV_PORT);
  return { host, port: Number.isInteger(port) && port > 0 ? port : CLAMAV_DEFAULT_PORT };
}

/** Verstuurt de bytes via clamd INSTREAM en geeft de rauwe respons terug. Werpt bij een netwerkfout. */
async function clamdInstream(buffer: Buffer): Promise<string> {
  const { host, port } = resolveClamdTarget();
  if (!host) throw new Error("CLAMAV_HOST ontbreekt.");
  const net = await import("node:net");

  return new Promise<string>((resolve, reject) => {
    const socket = net.connect({ host, port });
    let response = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error("clamd time-out"))),
      CLAMD_TIMEOUT_MS,
    );

    socket.on("error", (err) => finish(() => reject(err)));
    socket.on("data", (d: Buffer) => {
      response += d.toString("latin1");
    });
    socket.on("end", () => finish(() => resolve(response)));
    socket.on("connect", () => {
      // z-prefix = null-getermineerd commando.
      socket.write("zINSTREAM\0");
      for (let i = 0; i < buffer.length; i += INSTREAM_CHUNK_BYTES) {
        const chunk = buffer.subarray(i, i + INSTREAM_CHUNK_BYTES);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(chunk.length, 0);
        socket.write(len);
        socket.write(chunk);
      }
      // Zero-length chunk = einde van de stream.
      socket.write(Buffer.alloc(4));
    });
  });
}

/** Echte ClamAV-scanner. De netwerklaag is injecteerbaar zodat de daemon niet nodig is in tests. */
export class ClamAvUploadScanner implements UploadScanner {
  readonly name = "clamav";
  constructor(private readonly transport: (buffer: Buffer) => Promise<string> = clamdInstream) {}

  async scan(buffer: Buffer): Promise<UploadScanResult> {
    const raw = await this.transport(buffer);
    return interpretClamAvResponse(raw);
  }
}

let cached: UploadScanner | null = null;

/** Geeft de geconfigureerde scanner terug (singleton). ClamAV alleen bij UPLOAD_SCANNER=clamav. */
export function getUploadScanner(): UploadScanner {
  if (cached) return cached;
  cached =
    process.env.UPLOAD_SCANNER === "clamav" ? new ClamAvUploadScanner() : new NoopUploadScanner();
  return cached;
}

/** Test-hook: reset de singleton (env kan tussen tests wisselen). */
export function resetUploadScannerForTest(): void {
  cached = null;
}

/** Bij een onbereikbare scanner standaard weigeren; UPLOAD_SCAN_FAIL_OPEN=true laat bewust door. */
export function uploadScanFailOpen(): boolean {
  return process.env.UPLOAD_SCAN_FAIL_OPEN === "true";
}

/**
 * Scant de buffer en werpt `UploadValidationError` bij een besmet bestand — of, bij een onbereikbare
 * scanner en fail-closed (default), een nette "kon niet worden gecontroleerd"-fout. Wordt vóór
 * `storage.put` aangeroepen; beide upload-call-sites vangen `UploadValidationError` al af.
 */
export async function assertUploadClean(
  buffer: Buffer,
  target: UploadScanTarget,
  scanner: UploadScanner = getUploadScanner(),
): Promise<void> {
  // Alleen de échte ClamAV-scanner voedt de aflever-heartbeat; de Noop-default is geen productie-kanaal
  // (uploads worden dan bewust ongescand doorgelaten) en registreert daarom niets.
  const isRealScanner = scanner.name === "clamav";

  let result: UploadScanResult;
  try {
    result = await scanner.scan(buffer);
  } catch (err) {
    // Scanner onbereikbaar. Rapporteer voor observability (de reporter/logger redacteert zelf).
    await getErrorReporter().capture(err, {
      source: "upload-scanner",
      extra: { scanner: scanner.name, mimeType: target.mimeType, size: target.size },
    });
    // Dead-man's-switch: een onbereikbare/time-outte daemon is een afleverstoring. Best-effort; werpt niet.
    if (isRealScanner) await recordUploadScanDeliveryFailure();
    if (uploadScanFailOpen()) {
      logger.warn("upload-scan-degraded", { scanner: scanner.name, failOpen: true });
      return;
    }
    throw new UploadValidationError(
      "Dit bestand kon niet op malware worden gecontroleerd. Probeer het later opnieuw.",
    );
  }

  // Een verdict "error" betekent dat clamd wél antwoordde maar met een onherkenbare/lege respons (bv.
  // kapotte virusdefinities): het kanaal levert geen echt oordeel. Registreer als afleverstoring (de
  // controle-flow blijft ongewijzigd — dit voegt alleen zichtbaarheid toe). Een beslissend verdict
  // (clean/infected) bewijst dat de scanner bereikbaar én operationeel is → success.
  if (isRealScanner) {
    if (result.verdict === "error") await recordUploadScanDeliveryFailure();
    else await recordUploadScanDeliverySuccess();
  }

  if (result.verdict === "infected") {
    logger.warn("upload-scan-rejected", {
      scanner: result.scanner,
      signature: result.signature,
      mimeType: target.mimeType,
      size: target.size,
    });
    throw new UploadValidationError(
      "Dit bestand is geweigerd: de malware-scan sloeg aan. Upload een schoon bestand.",
    );
  }
  // "clean" of "skipped" → doorlaten.
}
