// Unit-tests voor de pure incident-IP-retentielogica: de afkapdatum en de redactie van het bron-IP
// uit evidence + summary. Geen DB, geen klok-afhankelijkheid (now geïnjecteerd).

import { describe, it, expect } from "vitest";
import { healthIncidentIpRetentionCutoff, redactIncidentIp } from "@/lib/health-incident-retention";
import { AUDIT_PII_REDACTED } from "@/lib/account-anonymization";

const NOW = new Date("2026-07-23T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("healthIncidentIpRetentionCutoff", () => {
  it("berekent now minus retentievenster in dagen", () => {
    const cutoff = healthIncidentIpRetentionCutoff(90, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 90 * DAY));
  });

  it("geeft null wanneer retentie uit staat (0/negatief/niet-eindig)", () => {
    expect(healthIncidentIpRetentionCutoff(0, NOW)).toBeNull();
    expect(healthIncidentIpRetentionCutoff(-5, NOW)).toBeNull();
    expect(healthIncidentIpRetentionCutoff(Number.NaN, NOW)).toBeNull();
    expect(healthIncidentIpRetentionCutoff(Number.POSITIVE_INFINITY, NOW)).toBeNull();
  });

  it("kapt fractionele dagen af (floor)", () => {
    const cutoff = healthIncidentIpRetentionCutoff(90.9, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 90 * DAY));
  });
});

describe("redactIncidentIp", () => {
  it("vervangt het bron-IP in evidence EN summary door de redactie-sentinel", () => {
    const result = redactIncidentIp({
      evidence: JSON.stringify({ ip: "203.0.113.7", count: 12, window: "2026-07-23T11" }),
      summary: "12 mislukte inlogpogingen vanaf IP 203.0.113.7 in het laatste uur.",
    });
    expect(result).not.toBeNull();
    // IP weg uit de summary — geen enkel spoor van het adres meer.
    expect(result!.summary).not.toContain("203.0.113.7");
    expect(result!.summary).toBe(
      `12 mislukte inlogpogingen vanaf IP ${AUDIT_PII_REDACTED} in het laatste uur.`,
    );
    // IP weg uit de evidence, overige velden intact (beveiligingssignaal blijft bruikbaar).
    const parsed = JSON.parse(result!.evidence) as Record<string, unknown>;
    expect(parsed.ip).toBe(AUDIT_PII_REDACTED);
    expect(parsed.count).toBe(12);
    expect(parsed.window).toBe("2026-07-23T11");
  });

  it("is idempotent: een reeds-geredigeerd incident levert null (niets meer te doen)", () => {
    const once = redactIncidentIp({
      evidence: JSON.stringify({ ip: "203.0.113.7", count: 3, window: "w" }),
      summary: "3 pogingen vanaf IP 203.0.113.7.",
    })!;
    const twice = redactIncidentIp({ evidence: once.evidence, summary: once.summary });
    expect(twice).toBeNull();
  });

  it("slaat het 'onbekend'-sentinel over (geen persoonsgegeven)", () => {
    const result = redactIncidentIp({
      evidence: JSON.stringify({ ip: "onbekend", count: 9, window: "w" }),
      summary: "9 pogingen vanaf IP onbekend.",
    });
    expect(result).toBeNull();
  });

  it("laat incidenten zonder ip-veld ongemoeid (bv. rolwijziging-burst, CVE)", () => {
    expect(
      redactIncidentIp({
        evidence: JSON.stringify({ count: 6, window: "w" }),
        summary: "6 rolwijzigingen in het laatste uur.",
      }),
    ).toBeNull();
    expect(
      redactIncidentIp({
        evidence: JSON.stringify({ package: "left-pad", severity: "high" }),
        summary: "Kwetsbaarheid (high) in dependency left-pad.",
      }),
    ).toBeNull();
  });

  it("geeft null bij ontbrekende of onparseerbare evidence", () => {
    expect(redactIncidentIp({ evidence: null, summary: "x" })).toBeNull();
    expect(redactIncidentIp({ evidence: "{not json", summary: "x" })).toBeNull();
    expect(redactIncidentIp({ evidence: "[1,2,3]", summary: "x" })).toBeNull();
  });

  it("redigeert een IP met regex-metatekens veilig (letterlijke vervanging, geen patroon)", () => {
    // Verdedigt tegen een geïnjecteerd 'IP' dat regex-tekens bevat (X-Forwarded-For is client-nabij).
    const weird = "1.2.3.4|.*";
    const result = redactIncidentIp({
      evidence: JSON.stringify({ ip: weird, count: 2, window: "w" }),
      summary: `2 pogingen vanaf IP ${weird} in het laatste uur.`,
    });
    expect(result).not.toBeNull();
    expect(result!.summary).not.toContain(weird);
    expect(result!.summary).toContain(AUDIT_PII_REDACTED);
  });
});
