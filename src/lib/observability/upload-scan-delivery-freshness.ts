// Upload-scanner-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de
// malware-scan van geüploade bewijsstukken (VOG, diploma's, verzekering) op dit moment gezond AFLEVERT.
// De scan-grens (src/lib/services/upload-scanner.ts, assertUploadClean) stuurt elk geüpload bestand vóór
// opslag langs een ClamAV-daemon (UPLOAD_SCANNER=clamav). Standaard is die grens FAIL-CLOSED: is de
// scanner onbereikbaar, dan wordt de upload geweigerd — een storing is dan luidruchtig zichtbaar. Maar
// met UPLOAD_SCAN_FAIL_OPEN=true (bewust doorlaten tijdens een clamd-storing waarin beschikbaarheid boven
// scannen gaat) wordt de grens STIL fail-open: élk bestand gaat dan ONGESCAND naar de opslag zonder dat
// iets dat toont — precies de stille faalmodus die de andere aflever-heartbeats ook afvangen. Bovendien
// telt een clamd die wél antwoordt maar met een onherkenbare/lege respons (bv. lege/kapotte
// virusdefinities → verdict "error") als een niet-afleverend kanaal: de scan levert dan geen echt oordeel.
//
// Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// upload-scan-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: scans zijn event-gedreven (per
// upload), niet schema-gedreven. Een rustige periode zonder uploads is GEZOND, geen storing. We
// beoordelen daarom de UITKOMST van de laatste échte scan, niet hoe lang geleden die was. Een monitor
// paget pas bij OPEENVOLGENDE mislukkingen (systematische storing), niet bij één transiënte fout.
//
// BELANGRIJK — "aflevering" = de scanner leverde een beslissend verdict (clean/infected) terug, dus de
// clamd-daemon was bereikbaar én operationeel. Een geworpen scan (onbereikbaar/time-out) of een verdict
// "error" (onherkenbare/lege respons — kapotte defs) telt als een mislukking. Het point-in-time bewijs
// dat de defs ook echt een virus détecteren blijft de EICAR-Upload-scanner-zelftest; deze heartbeat vangt
// de dóórlopende afleverstoring af die de zelftest alleen op een menselijke klik ziet.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele scan via de ClamAV-scanner geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde scanner die nog geen bestand hoefde te scannen is gezond, niet stuk.
 * - `ok`      : de laatste scan leverde een beslissend verdict (clean/infected) — de scanner werkt.
 * - `failing` : de laatste scan kon de clamd-daemon niet bereiken (geworpen/time-out) of kreeg een
 *               onherkenbare respons (verdict "error"). `consecutiveFailures` geeft de ernst.
 */
export type UploadScanDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface UploadScanDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** scanner-modus bij de laatste poging ("clamav"), of null. */
  driver: string | null;
}

export interface UploadScanDeliveryFreshness {
  status: UploadScanDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukkingen sinds de laatste geslaagde scan (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
  driver: string | null;
}

/**
 * Beoordeelt de upload-scanner-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking
 * "in de toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateUploadScanDeliveryFreshness(
  fields: UploadScanDeliveryHeartbeatFields | null,
  now: Date,
): UploadScanDeliveryFreshness {
  if (!fields || !fields.lastAttemptAt) {
    return {
      status: "never",
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      driver: fields?.driver ?? null,
    };
  }

  const consecutiveFailures =
    Number.isFinite(fields.consecutiveFailures) && fields.consecutiveFailures > 0
      ? Math.floor(fields.consecutiveFailures)
      : 0;

  const status: UploadScanDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

  let failureAgeSeconds: number | null = null;
  if (fields.lastFailureAt) {
    const rawMs = now.getTime() - fields.lastFailureAt.getTime();
    failureAgeSeconds = Math.floor((rawMs > 0 ? rawMs : 0) / 1000);
  }

  return {
    status,
    lastAttemptAt: fields.lastAttemptAt,
    lastSuccessAt: fields.lastSuccessAt,
    lastFailureAt: fields.lastFailureAt,
    consecutiveFailures: status === "failing" ? consecutiveFailures : 0,
    failureAgeSeconds,
    driver: fields.driver ?? null,
  };
}

const LABEL = "Malware-scan uploads (laatste scan)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit secrets, host/poort of de
 * bestandsinhoud — alleen tijdstippen, de driver-modus en het oordeel.
 */
export function uploadScanDeliveryStatusItem(freshness: UploadScanDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "upload-scan-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen scan",
      level: "ok",
      detail:
        "Er is via de malware-scanner (UPLOAD_SCANNER=clamav) nog geen bestand gescand. Zodra een " +
        "bewijsstuk wordt geüpload verschijnt hier of de scanner een beslissend verdict leverde. Zonder " +
        "actieve scanner (UPLOAD_SCANNER staat op noop) is er niets te bewaken — uploads worden dan " +
        "ongescand doorgelaten (pilot-modus).",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste scan mislukte";
    return {
      key: "upload-scan-delivery-heartbeat",
      label: LABEL,
      mode: `levert niet af${driverSuffix}`,
      level: "attention",
      detail:
        `De malware-scanner levert geen beslissend verdict meer (${count}). De clamd-daemon is ` +
        "onbereikbaar (verkeerde/geblokkeerde CLAMAV_HOST/CLAMAV_PORT, netwerkstoring, time-out) of " +
        "antwoordt met een onherkenbare respons (lege/kapotte virusdefinities). Staat de scan-grens op " +
        "fail-closed (default), dan worden uploads nú geweigerd; staat UPLOAD_SCAN_FAIL_OPEN=true, dan " +
        "gaan bewijsstukken STIL ongescand naar de opslag. Controleer de clamd-daemon en draai de " +
        "Upload-scanner-zelftest om herstel te bevestigen.",
    };
  }

  return {
    key: "upload-scan-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatst geüploade bewijsstukken werden door de clamd-daemon van een beslissend verdict voorzien " +
      "— geüploade documenten worden vóór opslag op malware gecontroleerd.",
  };
}
