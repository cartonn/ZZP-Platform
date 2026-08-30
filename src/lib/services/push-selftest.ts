// Connectiviteits-/configzelftest voor het web-push-kanaal (VAPID) — admin-only,
// /admin/systeemstatus + go-live-sweep.
//
// De systeemstatus toont de web-push-MODUS (aan/uit op basis van de twee VAPID-sleutels), en er is een
// aflever-heartbeat + alert (ZzpPushDeliveryFailing) die een AANHOUDENDE storing achteraf zichtbaar
// maakt. Wat ontbrak — anders dan bij mail/opslag/routing/rate-limit/verificatie/betaalprovider — is
// een controle VOORAF: bewijzen dat het geconfigureerde VAPID-sleutelpaar écht klopt. Een mismatched
// paar (publieke sleutel uit paar A, private uit paar B) overleeft de boot én de browser-subscribe,
// maar laat élke aflevering stil met 403 mislukken. Deze zelftest valt die mismatch vóór go-live af.
//
// Onderscheid met de overige zelftests: web-push doet geen server-round-trip (VAPID is stateless
// zonder abonnee), dus dit is een PUUR-lokale cryptografische validatie (sleutelparing + formaat +
// subject) — geen netwerk, geen abonnee, geen verzending, geen mutatie. Daardoor is het veilig in de
// één-klik go-live-sweep. Zelfde vorm als routing-selftest: een spec/validator in, een rapport uit;
// puur en injecteerbaar zodat het deterministisch te testen is.
//
// Geen secrets in de uitvoer: alleen de uitkomst-categorie + een vaste, veilige toelichting — nooit
// een (deel van een) sleutel.

import type { VapidValidationOutcome, VapidValidationResult } from "@/lib/push/vapid-validate";
import type { WebPushConfigState } from "@/lib/push/config";

export interface PushSelfTestReport {
  /** GO-veilig? Alleen "off" (niets getest) en "valid" zijn ok; elke misconfiguratie is een fout. */
  ok: boolean;
  /** Draait web-push echt (beide sleutels gezet)? Zo niet: er is niets te valideren (geen vals groen). */
  active: boolean;
  /** Ruwe configuratiestand (off/partial/configured). Geen sleutelwaarden. */
  configState: WebPushConfigState;
  /** Gecategoriseerde validatie-uitkomst. */
  outcome: VapidValidationOutcome;
  /** Korte, niet-gevoelige toelichting. */
  detail?: string;
}

/**
 * Te valideren web-push-kanaal. `validate` (de pure VAPID-validatie) wordt alleen aangeroepen wanneer
 * er iets te valideren valt (configState === "configured"). Injecteerbaar zodat de test niet van env
 * afhangt.
 */
export interface PushProbeSpec {
  configState: WebPushConfigState;
  validate?: () => VapidValidationResult;
}

const DETAILS: Record<VapidValidationOutcome, string> = {
  off: "Geen web-push geconfigureerd (VAPID-sleutels niet gezet) — er is niets getest.",
  partial:
    "Halve activering: precies één VAPID-sleutel gezet. Zet beide sleutels of geen (de boot-validatie blokkeert dit al).",
  "invalid-public":
    "Publieke VAPID-sleutel heeft niet het verwachte formaat (65-byte ongecomprimeerd P-256-punt).",
  "invalid-private":
    "Private VAPID-sleutel heeft niet het verwachte formaat (32-byte P-256-scalar).",
  "invalid-subject":
    "VAPID_SUBJECT is geen geldig mailto:- of https:-contact (RFC 8292), bv. mailto:support@jouwdomein.nl.",
  mismatched:
    "VAPID-sleutels vormen geen paar: de publieke sleutel leidt niet af uit de private sleutel. Push levert stil met 403 af. Genereer één paar met `npx web-push generate-vapid-keys`.",
  valid:
    "VAPID-sleutelpaar geldig — de publieke sleutel leidt af uit de private sleutel en het subject klopt.",
};

/** Uitkomsten die als "gezond" tellen: niets geconfigureerd (niets getest) of een geldig paar. */
function outcomeOk(outcome: VapidValidationOutcome): boolean {
  return outcome === "off" || outcome === "valid";
}

/**
 * Voert de zelftest uit. Is web-push niet (volledig) geconfigureerd, dan wordt dat eerlijk gemeld
 * ("off" = niets getest; "partial" = fout, want stil-uit). Bij een volledig geconfigureerd kanaal
 * draait de pure validator; het resultaat wordt op een vaste, veilige toelichting gemapt. Ontbreekt
 * `validate` bij een geconfigureerd kanaal, dan is dat een programmeerfout van de aanroeper en telt
 * het als fout (nooit vals groen).
 */
export function runPushSelfTest(spec: PushProbeSpec): PushSelfTestReport {
  if (spec.configState !== "configured") {
    const outcome: VapidValidationOutcome = spec.configState === "partial" ? "partial" : "off";
    return {
      ok: outcomeOk(outcome),
      active: false,
      configState: spec.configState,
      outcome,
      detail: DETAILS[outcome],
    };
  }

  if (!spec.validate) {
    return {
      ok: false,
      active: true,
      configState: spec.configState,
      outcome: "invalid-private",
      detail: "Geen validatie beschikbaar voor het web-push-kanaal.",
    };
  }

  const result = spec.validate();
  return {
    ok: outcomeOk(result.outcome),
    active: true,
    configState: result.configState,
    outcome: result.outcome,
    detail: DETAILS[result.outcome],
  };
}
