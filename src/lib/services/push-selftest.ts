// Operationele zelftest voor het web-push (VAPID) afleverkanaal (admin-only, /admin/systeemstatus).
//
// Web-push was de enige geconfigureerde integratie ZONDER connectiviteits-/operationele zelftest in de
// go-live-sweep: elke andere koppeling (opslag/mail/rate-limit/verificatie/betaling/routing/upload-scanner/
// error-monitoring/database) kan een beheerder vóór livegang met één klik bevestigen; web-push niet. Het
// enige signaal was de event-gedreven aflever-heartbeat (`push-delivery-heartbeat.ts`), die pas iets toont
// zodra er een échte pushronde heeft gedraaid — dus vóór de eerste notificatie is er GEEN bevestiging dat de
// VAPID-sleutels correct gewired zijn. Een verkeerd geplakte of niet-bij-elkaar-horende keypair blijft
// daardoor onzichtbaar tot de eerste echte melding stil mislukt.
//
// Anders dan de overige zelftests is de probe een LOKALE crypto-operatie — geen externe round-trip. De
// probe (`probeWebPushVapid` in src/lib/push/web-push.ts) bewijst drie dingen zonder één pushbericht te
// versturen: (1) VAPID_SUBJECT is geldig (mailto:/https:, RFC 8292), (2) de private key kan een echte
// VAPID-JWT signeren — exact de signering die élke echte verzending doet — en (3) de geconfigureerde
// public key hoort daadwerkelijk bij de private key (vangt de klassieke copy-paste-mismatch: de verkeerde
// helft van een keypair, of twee sleutels uit verschillende paren).
//
// Deze module is de tegenhanger van de opslag-/mail-/routing-/semantische-matching-zelftests: puur en
// injecteerbaar (een spec in, een rapport uit; geen I/O-globals, geen klok) zodat het deterministisch te
// testen is. De aanroeper (server-actie) levert een `run()` die de lokale VAPID-probe uitvoert.
//
// Kernonderscheid: staat web-push bewust uit (`off`, geen VAPID-sleutels — pilot-default), dan is er niets
// te testen en meldt de zelftest dat eerlijk (geen vals groen — in-app meldingen blijven werken). Een
// halve config (`partial`, precies één sleutel) is een gevaarlijke stille-uit-stand en telt als fout
// (aandacht) — de env-validatie blokkeert dit al hard bij boot in productie; de zelftest surfacet het ook
// op het statusscherm.
//
// Geen secrets in de uitvoer: uitsluitend welgevormd-ja/nee-uitkomsten + de config-stand — nooit een
// sleutelwaarde.

import type { WebPushConfigState } from "@/lib/push/config";
import type { WebPushProbeResult } from "@/lib/push/web-push";

/** Actieve web-push-config-stand. Alleen `configured` doet een echte probe; `off` = niets te testen. */
export type WebPushDriverMode = WebPushConfigState;

/** Te testen web-push-kanaal. `run` (de lokale VAPID-probe) wordt alleen aangeroepen wanneer `configured`. */
export interface WebPushProbeSpec {
  /** Kan web-push écht afleveren (beide VAPID-sleutels gezet)? */
  active: boolean;
  /** Actieve config-stand (`off`/`partial`/`configured`). Geen sleutelwaarden. */
  driverMode: WebPushDriverMode;
  /**
   * Lokale, read-only VAPID-probe (via `probeWebPushVapid`): signeert een VAPID-JWT en vergelijkt de
   * keypair. Alleen vereist/aangeroepen wanneer de config `configured` is.
   */
  run?: () => Promise<WebPushProbeResult> | WebPushProbeResult;
}

/** Uitkomst van de zelftest. */
export interface WebPushSelfTestReport {
  ok: boolean;
  /** Is web-push echt geconfigureerd? Zo niet: er is niets getest (geen vals groen). */
  active: boolean;
  /** Actieve config-stand. Geen sleutelwaarden. */
  driverMode: WebPushDriverMode;
  /** Korte, niet-gevoelige toelichting (uitkomst of uitleg). */
  detail?: string;
}

const OFF_DETAIL =
  "Web-push staat bewust uit (geen VAPID-sleutels) — in-app meldingen blijven werken; er is niets te testen.";
const PARTIAL_DETAIL =
  "Halve VAPID-config: precies één sleutel gezet. Web-push staat dan STIL uit (de runtime eist beide sleutels). Zet beide VAPID-sleutels of geen — de env-validatie blokkeert dit al bij boot in productie.";
const SUBJECT_DETAIL =
  "VAPID_SUBJECT is ongeldig — moet een mailto:- of https:-contact zijn (RFC 8292), bv. mailto:support@jouwdomein.nl.";
const SIGN_DETAIL =
  "De VAPID-sleutels kunnen geen geldige verzendheader signeren — controleer of VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY correct (base64url, onbeschadigd) geplakt zijn.";
const MISMATCH_DETAIL =
  "De geconfigureerde VAPID_PUBLIC_KEY hoort NIET bij VAPID_PRIVATE_KEY — vermoedelijk de verkeerde helft geplakt of twee sleutels uit verschillende paren. Browsers weigeren pushberichten met deze mismatch.";
const OK_DETAIL =
  "Operationeel — de VAPID-sleutels signeren een geldige verzendheader en de public/private-keypair hoort bij elkaar.";

/**
 * Brengt een fout terug tot een korte, secret-vrije toelichting: uitsluitend de error-NAAM, nooit een
 * rauw bericht dat (een deel van) een sleutel zou kunnen bevatten.
 */
export function safeWebPushDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit.
 * - `off` (inactief) → eerlijk "niets getest" (ok, met uitleg).
 * - `partial` → fout (aandacht): gevaarlijke halve activering, web-push staat stil uit.
 * - `configured` → draait de lokale VAPID-probe in try/catch:
 *   ongeldige subject / geen geldige signering / keypair-mismatch → fout met een gerichte toelichting;
 *   alles goed → succes.
 * Een `configured`-config zonder `run` is een programmeerfout van de aanroeper en telt als fout.
 */
export async function runWebPushSelfTest(spec: WebPushProbeSpec): Promise<WebPushSelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode };

  if (spec.driverMode === "off") {
    return { ...base, ok: true, detail: OFF_DETAIL };
  }

  if (spec.driverMode === "partial") {
    return { ...base, ok: false, detail: PARTIAL_DETAIL };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar voor web-push." };
  }

  try {
    const result = await spec.run();
    if (!result.subjectValid) {
      return { ...base, ok: false, detail: SUBJECT_DETAIL };
    }
    if (!result.signed) {
      return { ...base, ok: false, detail: SIGN_DETAIL };
    }
    if (!result.keypairMatches) {
      return { ...base, ok: false, detail: MISMATCH_DETAIL };
    }
    return { ...base, ok: true, detail: OK_DETAIL };
  } catch (error) {
    return { ...base, ok: false, detail: safeWebPushDetail(error) };
  }
}
