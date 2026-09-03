// Opslag-kant van de upload-scanner-aflever-heartbeat (dead-man's-switch). De DB-interactie + de
// write-coalescing zitten sinds de consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met
// een `channel`-kolom); hier blijft alleen de kanaalbinding + de vertaling naar het scan-oordeel staan.
//
// De registratie wordt aangeroepen vanuit assertUploadClean() (upload-scanner.ts) — het échte
// scan-kanaal (UPLOAD_SCANNER=clamav). De Noop-default (geen scanner) registreert bewust niet (geen
// productie-kanaal, uploads worden ongescand doorgelaten).
//
// WAAROM COALESCING: de scan zit op het upload-pad; bij een reeks uploads zou één DB-upsert per scan
// extra DB-load geven. Daarom worden GESLAAGDE scans gecoalesceerd (UPLOAD_SCAN_HEARTBEAT_COALESCE_MS,
// default 15s per proces); mislukkingen en herstel schrijven altijd meteen.
//
// Faalt NOOIT naar buiten: de heartbeat is observability, geen kernpad — een DB-storing hier mag een
// upload niet alsnog laten falen. Het kanaal staat met `errorSink: "log"` in de registratie: een
// schrijffout gaat rechtstreeks naar de logger (die redacteert PII zelf) en wordt geslikt. Bevat nooit
// host/poort, secrets of de bestandsinhoud. De pure beoordeling zit in upload-scan-delivery-freshness.ts.

import {
  __resetHeartbeatCoalescing,
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateUploadScanDeliveryFreshness,
  type UploadScanDeliveryFreshness,
} from "@/lib/observability/upload-scan-delivery-freshness";

const SPEC = heartbeatChannelSpec("upload-scan");

/** Canonieke naam van het upload-scan-kanaal (singleton-rij). */
export const UPLOAD_SCAN_CHANNEL = SPEC.channel;

/** Driver-modus die de echte scanner aanduidt (de enige echte modus; noop = geen kanaal). */
export const UPLOAD_SCAN_DRIVER = "clamav";

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetUploadScanHeartbeatCoalescingForTests(): void {
  __resetHeartbeatCoalescing();
}

/**
 * Registreert dat een malware-scan via de echte scanner zojuist SLAAGDE (de scanner gaf een geldig
 * oordeel, schoon of besmet): markeert het kanaal als operationeel en zet de opeenvolgende-mislukkingen-
 * teller terug op 0. Gecoalesceerd bij aanhoudend succes, maar altijd meteen bij een herstel of de eerste
 * operatie sinds boot. Faalt nooit naar buiten.
 */
export async function recordUploadScanDeliverySuccess(
  now: Date = new Date(),
  channel: string = UPLOAD_SCAN_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, UPLOAD_SCAN_DRIVER, now, channel);
}

/**
 * Registreert dat een malware-scan via de echte scanner zojuist MISLUKTE (daemon onbereikbaar, time-out,
 * onleesbaar antwoord): markeert het kanaal als afwijzend en telt de opeenvolgende-mislukkingen-teller
 * atomair op. Wordt altijd direct geschreven (nooit gecoalesceerd). Bewaart nooit host/poort, de
 * bestandsnaam of de bestandsinhoud — alleen tijdstip, de teller en de driver-modus. Faalt nooit naar
 * buiten.
 */
export async function recordUploadScanDeliveryFailure(
  now: Date = new Date(),
  channel: string = UPLOAD_SCAN_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, UPLOAD_SCAN_DRIVER, now, channel);
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
  return evaluateUploadScanDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
