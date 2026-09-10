// k-anonimiteits-accountability-gate (AVG art. 5(2) verantwoordingsplicht + art. 30).
//
// PROBLEEM (security-/privacy-auditronde 6-9-2026): het platform toont op meerdere plekken
// GEAGGREGEERDE persoonsgegevens (markttariefband, beoordelings-, betaalgedrag-, betrouwbaarheids-
// en leverbetrouwbaarheidssignalen). Elk van die aggregaties leunt op een minimale-steekproefvloer
// (k-anonimiteit) zodat een individueel cijfer niet herleidbaar is. Die vloeren staan als losse
// constantes verspreid over de code, en het art. 30-verwerkingsregister citeerde de markttarief-vloer
// als een HARD-GECODEERDE prosa-"10" — volledig ontkoppeld van de werkelijke constante
// (`MARKET_RATE_MIN_SAMPLE`). Er was — anders dan bij de erasure (`anonymize-schema-coverage.test.ts`)
// — GEEN geautomatiseerde poort die (a) een stille verlaging van een vloer onder zijn
// herleidbaarheids-ondergrens tegenhoudt, noch (b) de register-prosa aan de code bindt. Een
// toekomstige wijziging kon zo ongemerkt de privacybescherming verzwakken én het register onwaar maken.
//
// DEZE POORT dekt dat gat: ze faalt de build zodra een k-anonimiteitsvloer onder zijn
// gedocumenteerde ondergrens zakt, of zodra de register-prosa en de werkelijke constante uiteenlopen.
// Faalklasse = dezelfde die het platform al erkende en dichtte voor de publieke beoordelingsaggregatie
// (AVG art. 5(1)(f)/25, privacy by design).

import { describe, expect, it } from "vitest";
import { MARKET_RATE_MIN_SAMPLE, REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";
import { PAYMENT_MIN_SAMPLE_SIZE } from "@/lib/payment-behavior";
import { RELIABILITY_MIN_SAMPLE_SIZE } from "@/lib/client-reliability";
import { RESPONSIVENESS_MIN_SAMPLE_SIZE } from "@/lib/client-responsiveness";
import { DELIVERY_MIN_SAMPLE } from "@/lib/collaboration-quality";
import { PROCESSING_REGISTER } from "@/lib/compliance/processing-register";

describe("k-anonimiteitsvloeren — accountability-gate", () => {
  // In-app geaggregeerde signalen (tegenpartij met gerechtvaardigd belang, geen publiek internet):
  // vanaf drie waarnemingen is geen enkel individueel cijfer nog exact te herleiden uit gemiddelde +
  // aantal (zie de rationale bij REVIEW_AGGREGATE_MIN_SAMPLE in config.ts). Dat is de ondergrens.
  const REIDENTIFICATION_FLOOR = 3;

  it("markttariefband houdt de strengere k=10-vloer (publiek/tegenpartij, financiële PII)", () => {
    // Uurtarief is persoonlijke financiële data die ook aan opdrachtgevers (en historisch: publiek)
    // wordt getoond; de security-review van 14-6-2026 legde k=10 vast. Een regressie hieronder lekt
    // individuele tarieven uit p25/mediaan/p75 bij een kleine steekproef.
    expect(MARKET_RATE_MIN_SAMPLE).toBeGreaterThanOrEqual(10);
  });

  it.each([
    ["REVIEW_AGGREGATE_MIN_SAMPLE", REVIEW_AGGREGATE_MIN_SAMPLE],
    ["PAYMENT_MIN_SAMPLE_SIZE", PAYMENT_MIN_SAMPLE_SIZE],
    ["RELIABILITY_MIN_SAMPLE_SIZE", RELIABILITY_MIN_SAMPLE_SIZE],
    ["RESPONSIVENESS_MIN_SAMPLE_SIZE", RESPONSIVENESS_MIN_SAMPLE_SIZE],
    ["DELIVERY_MIN_SAMPLE", DELIVERY_MIN_SAMPLE],
  ] as const)(
    "geaggregeerde signaalvloer %s blijft >= de herleidbaarheids-ondergrens",
    (_naam, waarde) => {
      expect(waarde).toBeGreaterThanOrEqual(REIDENTIFICATION_FLOOR);
    },
  );

  it("het verwerkingsregister citeert de WERKELIJKE MARKET_RATE_MIN_SAMPLE (geen doc-drift)", () => {
    // Bindt de art. 30-register-prosa aan de code: verandert de constante, dan dwingt deze poort een
    // register-update af (en andersom). Voorkomt dat het register een onware bescherming claimt
    // (AVG art. 5(2) verantwoordingsplicht).
    const marktband = PROCESSING_REGISTER.find((a) => a.key === "markttarief-indicatie");
    expect(marktband, "verwerkingsactiviteit 'markttarief-indicatie' ontbreekt").toBeDefined();
    const measures = marktband!.securityMeasures.join(" ");
    expect(measures).toContain(`minimaal ${MARKET_RATE_MIN_SAMPLE} profielen`);
  });
});
