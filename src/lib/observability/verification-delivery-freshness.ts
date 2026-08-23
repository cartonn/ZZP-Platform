// Verificatie-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de
// uitgaande externe verificatie-registers (DUO-diploma's, BIG-register, iDIN-identiteit) momenteel
// gezond antwoorden. De verificatie is de KERN-differentiator van het platform, maar was — anders dan
// storage/mail/push/billing — het enige productie-kernkanaal met een uitgaande externe call ZONDER
// doorlopend afleversignaal: een verlopen/ingetrokken sleutel, een geschorst register-account of een
// register-storing laat élke `verify()` stil mislukken. De upload-/verificatie-actie vangt die fout af
// en toont een generieke melding, dus zonder deze detector merkt niemand een AANHOUDENDE storing tot
// een ZZP'er klaagt dat zijn diploma/BIG/identiteit niet te verifiëren is.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: verificatie-operaties zijn
// event-gedreven (een gebruiker dient een bewijsstuk in), niet schema-gedreven. Een rustige periode
// zonder nieuwe verificaties is normaal, geen storing. We beoordelen daarom de UITKOMST van de laatste
// échte operatie per register, niet hoe lang geleden die was. Een monitor paget pas bij OPEENVOLGENDE
// mislukkingen (systematische storing), niet bij één transiënte fout.
//
// "Slagen" = het register ANTWOORDDE met een geldig contract (ongeacht of het diploma/BIG/de identiteit
// inhoudelijk `verified: true` of `false` was — een terecht afgewezen bewijsstuk is een geslaagde
// aflevering). "Mislukken" = de call wierp (netwerkfout, time-out, 5xx, 429, contract-mismatch).
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel. De opslag/DB-kant zit in
// verification-delivery-heartbeat.ts.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele operatie via het echte register geregistreerd. Neutraal (ok): een vers
 *               geconfigureerd register dat nog geen verificatie hoefde te doen is gezond.
 * - `ok`      : de laatste operatie slaagde — het register accepteert onze calls.
 * - `failing` : de laatste operatie mislukte — het register wijst af. `consecutiveFailures` geeft de
 *               ernst (één blip vs. een aanhoudende storing).
 */
export type VerificationDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface VerificationDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** Register-driver bij de laatste poging ("duo" | "bigregister" | "idin"), of null. */
  driver: string | null;
}

export interface VerificationDeliveryFreshness {
  status: VerificationDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukkingen sinds de laatste geslaagde operatie (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
  driver: string | null;
}

/**
 * Beoordeelt één register-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking "in de
 * toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateVerificationDeliveryFreshness(
  fields: VerificationDeliveryHeartbeatFields | null,
  now: Date,
): VerificationDeliveryFreshness {
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

  const status: VerificationDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

/** Eén register in het overzicht: het label + zijn per-register-freshness. */
export interface VerificationAdapterFreshness {
  /** Stabiele sleutel: "diploma" | "big" | "identity". */
  key: string;
  /** Nederlands label van het register (bv. "DUO — diploma's"). */
  label: string;
  freshness: VerificationDeliveryFreshness;
}

/**
 * Geaggregeerd oordeel over álle registers samen — de bron voor de alarmeerbare gauge. Een dead-man's-
 * switch mag een aanhoudende storing van één register nooit laten maskeren door een ander dat wél
 * antwoordt, dus we aggregeren pessimistisch: `failing` zodra ÉÉN register faalt.
 */
export interface VerificationDeliveryAggregate {
  /** `failing` als ≥1 register faalt; anders `ok` als ≥1 register ooit slaagde; anders `never`. */
  status: VerificationDeliveryStatus;
  /** Hoogste opeenvolgende-mislukkingen-teller over de falende registers (ernst van de ergste storing). */
  consecutiveFailures: number;
  /** Kleinste (meest recente) mislukkings-leeftijd over de falende registers, of null. */
  failureAgeSeconds: number | null;
  /** Labels van de registers die momenteel afwijzen (voor de admin-detailtekst). */
  failingLabels: string[];
}

/**
 * Aggregeert de per-register-freshnesses tot één oordeel. Puur. Alleen registers die daadwerkelijk een
 * operatie deden (status ≠ "never") tellen mee; nooit-gebruikte registers zijn neutraal.
 */
export function aggregateVerificationDelivery(
  adapters: VerificationAdapterFreshness[],
): VerificationDeliveryAggregate {
  const failing = adapters.filter((a) => a.freshness.status === "failing");
  const anyOk = adapters.some((a) => a.freshness.status === "ok");

  if (failing.length === 0) {
    return {
      status: anyOk ? "ok" : "never",
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      failingLabels: [],
    };
  }

  const consecutiveFailures = failing.reduce(
    (max, a) => Math.max(max, a.freshness.consecutiveFailures),
    0,
  );
  const ages = failing
    .map((a) => a.freshness.failureAgeSeconds)
    .filter((n): n is number => n !== null);
  const failureAgeSeconds = ages.length > 0 ? Math.min(...ages) : null;

  return {
    status: "failing",
    consecutiveFailures,
    failureAgeSeconds,
    failingLabels: failing.map((a) => a.label),
  };
}

const LABEL = "Verificatie-registers (laatste operatie)";

/**
 * Vertaalt het geaggregeerde oordeel naar een `StatusItem` in dezelfde taal als de overige
 * systeemstatus-items. Bevat nooit geheimen of PII — alleen het oordeel, de teller en welke registers
 * afwijzen.
 */
export function verificationDeliveryStatusItem(
  aggregate: VerificationDeliveryAggregate,
): StatusItem {
  const { status, consecutiveFailures, failingLabels } = aggregate;

  if (status === "never") {
    return {
      key: "verification-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via een echt verificatie-register (DUO/BIG/iDIN, achter DIPLOMA_VERIFIER=duo / " +
        "BIG_VERIFIER=bigregister / IDENTITY_VERIFIER=idin) nog geen operatie geregistreerd. Zodra een " +
        "ZZP'er het eerste bewijsstuk laat verifiëren verschijnt hier of het register onze calls " +
        "accepteert. Zonder geconfigureerd register (demo-verifier) is er niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    const which = failingLabels.length > 0 ? ` (${failingLabels.join(", ")})` : "";
    return {
      key: "verification-delivery-heartbeat",
      label: LABEL,
      mode: `wijst af${which}`,
      level: "attention",
      detail:
        `Een verificatie-register wijst af (${count}). Diploma-/BIG-/identiteitscontroles kunnen ` +
        "vermoedelijk niet worden uitgevoerd — de ZZP'er kan zijn bewijsstuk niet laten verifiëren. " +
        "Controleer de register-credentials (verlopen/ingetrokken sleutel, geschorst account) en het " +
        "server-logboek (of Sentry) op het foutdetail. Draai daarna de Verificatie-adapters-zelftest om " +
        "herstel te bevestigen.",
    };
  }

  return {
    key: "verification-delivery-heartbeat",
    label: LABEL,
    mode: "operationeel",
    level: "ok",
    detail:
      "De laatste operatie tegen elk geconfigureerd verificatie-register slaagde. Diploma-/BIG-/" +
      "identiteitscontroles worden beantwoord.",
  };
}
