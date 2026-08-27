// Opslag-kant van de upload-scanner-aflever-heartbeat (dead-man's-switch). Schrijft/leest de uitkomst van
// de laatste échte malware-scan via de ClamAV-scanner en levert het oordeel voor /admin/systeemstatus +
// /api/metrics. De pure beoordeling zit in upload-scan-delivery-freshness.ts; hier alleen de DB-interactie
// + de write-coalescing.
//
// De registratie wordt aangeroepen vanuit assertUploadClean() (upload-scanner.ts) — het échte
// scan-kanaal (UPLOAD_SCANNER=clamav). De Noop-default (geen scanner) registreert bewust niet (geen
// productie-kanaal, uploads worden ongescand doorgelaten).
//
// WAAROM COALESCING: de scan zit op het upload-pad; bij een reeks uploads zou één DB-upsert per scan
// extra DB-load geven. Daarom worden GESLAAGDE scans gecoalesceerd: hooguit één success-schrijf per
// venster (UPLOAD_SCAN_HEARTBEAT_COALESCE_MS, default 15s) per proces. MISLUKKINGEN worden altijd direct
// geschreven (de teller moet scherp blijven), en een HERSTEL (eerste success ná een mislukking, of de
// allereerste operatie) schrijft ook altijd meteen zodat een opgeloste storing de alert direct wist.
//
// Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
// upload niet alsnog laten falen. Een schrijffout wordt rechtstreeks via de logger gelogd (die redacteert
// PII zelf) en geslikt. Bevat nooit host/poort, secrets of de bestandsinhoud.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import {
  evaluateUploadScanDeliveryFreshness,
  type UploadScanDeliveryFreshness,
} from "@/lib/observability/upload-scan-delivery-freshness";

/** Canonieke naam van het upload-scan-kanaal (singleton-rij). */
export const UPLOAD_SCAN_CHANNEL = "upload-scan";

/** Driver-modus die de echte scanner aanduidt (de enige echte modus; noop = geen kanaal). */
export const UPLOAD_SCAN_DRIVER = "clamav";

// Per-proces coalescing-state. `null` = nog niets geregistreerd sinds boot (dwing dan een schrijf af).
let lastRecordedOk: boolean | null = null;
let lastSuccessWriteMs = 0;

const DEFAULT_COALESCE_MS = 15_000;
const MIN_COALESCE_MS = 0;
const MAX_COALESCE_MS = 300_000;

/** Leest + klemt het success-coalescing-venster (ms). `0` schakelt coalescing bewust uit (elke success schrijft). */
function resolveCoalesceMs(): number {
  const raw = process.env.UPLOAD_SCAN_HEARTBEAT_COALESCE_MS;
  if (raw === undefined || raw === "") return DEFAULT_COALESCE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_COALESCE_MS;
  return Math.min(MAX_COALESCE_MS, Math.max(MIN_COALESCE_MS, Math.floor(parsed)));
}

/** Reset de per-proces coalescing-state — uitsluitend voor tests (deterministische schrijf-beslissing). */
export function __resetUploadScanHeartbeatCoalescingForTests(): void {
  lastRecordedOk = null;
  lastSuccessWriteMs = 0;
}

/**
 * Registreert dat een scan via de ClamAV-scanner zojuist SLAAGDE (de daemon leverde een beslissend
 * verdict — clean of infected): markeert het kanaal als operationeel en zet de opeenvolgende-mislukkingen-
 * teller terug op 0. Gecoalesceerd: hooguit één schrijf per venster bij aanhoudend succes, maar altijd
 * meteen bij een herstel (na een mislukking) of de eerste operatie sinds boot.
 *
 * Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag de
 * upload niet alsnog laten falen. Een schrijffout wordt rechtstreeks gelogd en geslikt.
 */
export async function recordUploadScanDeliverySuccess(
  now: Date = new Date(),
  channel: string = UPLOAD_SCAN_CHANNEL,
): Promise<void> {
  const nowMs = now.getTime();
  const coalesceMs = resolveCoalesceMs();
  // Coalesce alleen success-ná-success binnen het venster. Herstel (lastRecordedOk !== true) en de eerste
  // operatie (lastRecordedOk === null) schrijven altijd.
  if (lastRecordedOk === true && coalesceMs > 0 && nowMs - lastSuccessWriteMs < coalesceMs) {
    return;
  }
  try {
    await prisma.uploadScanDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: UPLOAD_SCAN_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver: UPLOAD_SCAN_DRIVER,
      },
    });
    // Alleen ná een geslaagde schrijf de coalescing-state bijwerken, zodat een mislukte schrijf niet stil
    // wordt weggecoalesceerd (de volgende success probeert dan opnieuw).
    lastRecordedOk = true;
    lastSuccessWriteMs = nowMs;
  } catch (error) {
    logger.error("upload-scan-delivery-heartbeat", {
      op: "success",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Registreert dat een scan via de ClamAV-scanner zojuist MISLUKTE (de clamd-daemon was onbereikbaar/
 * time-outte, óf antwoordde met een onherkenbare/lege respons — verdict "error", bv. kapotte defs):
 * markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller atomair op (zodat een
 * monitor op een AANHOUDENDE storing kan alarmeren i.p.v. op één transiënte fout). Wordt altijd direct
 * geschreven (nooit gecoalesceerd). Bewaart nooit host/poort, de foutinhoud of de bestandsinhoud — alleen
 * tijdstip, de teller en de driver-modus.
 *
 * Faalt NOOIT naar buiten: de scan-grens heeft de fout al afgehandeld (fail-closed weigering of, bij
 * UPLOAD_SCAN_FAIL_OPEN, doorlaten); deze registratie is best-effort en logt een DB-schrijffout
 * rechtstreeks.
 */
export async function recordUploadScanDeliveryFailure(
  now: Date = new Date(),
  channel: string = UPLOAD_SCAN_CHANNEL,
): Promise<void> {
  // Markeer de intentie meteen "failing" zodat de eerstvolgende success (herstel) sowieso schrijft — ook
  // als de onderstaande schrijf zelf faalt.
  lastRecordedOk = false;
  try {
    await prisma.uploadScanDeliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
        driver: UPLOAD_SCAN_DRIVER,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
        driver: UPLOAD_SCAN_DRIVER,
      },
    });
  } catch (error) {
    logger.error("upload-scan-delivery-heartbeat", {
      op: "failure",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste scan, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getUploadScanDeliveryFreshness(
  now: Date = new Date(),
  channel: string = UPLOAD_SCAN_CHANNEL,
): Promise<UploadScanDeliveryFreshness> {
  try {
    const row = await prisma.uploadScanDeliveryHeartbeat.findUnique({ where: { channel } });
    return evaluateUploadScanDeliveryFreshness(
      row
        ? {
            lastAttemptAt: row.lastAttemptAt,
            lastOk: row.lastOk,
            lastSuccessAt: row.lastSuccessAt,
            lastFailureAt: row.lastFailureAt,
            consecutiveFailures: row.consecutiveFailures,
            driver: row.driver,
          }
        : null,
      now,
    );
  } catch (error) {
    logger.error("upload-scan-delivery-heartbeat", {
      op: "read",
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return evaluateUploadScanDeliveryFreshness(null, now);
  }
}
