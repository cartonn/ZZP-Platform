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
  // Bouwt een realistisch LOGIN_BURST-incident waarin het IP op alle drie de plekken zit die de
  // detector schrijft: evidence.ip, de summary én de machine-dedupeKey.
  function burst(ip: string, id = "inc-1", window = "2026-07-23T11") {
    return {
      id,
      evidence: JSON.stringify({ ip, count: 12, window }),
      summary: `12 mislukte inlogpogingen vanaf IP ${ip} in het laatste uur.`,
      dedupeKey: `auth-login-burst-${ip}-${window}`,
    };
  }

  it("vervangt het bron-IP in evidence, summary EN dedupeKey door de redactie-sentinel", () => {
    const result = redactIncidentIp(burst("203.0.113.7"));
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
    // IP weg uit de dedupeKey; rij-id als suffix voor de @unique-constraint.
    expect(result!.dedupeKey).not.toContain("203.0.113.7");
    expect(result!.dedupeKey).toBe(`auth-login-burst-${AUDIT_PII_REDACTED}-2026-07-23T11-inc-1`);
    expect(result!.originalIp).toBe("203.0.113.7");
  });

  it("laat GEEN enkele kolom het IP behouden (regressie op de dedupeKey-lek-blocker)", () => {
    const ip = "203.0.113.7";
    const result = redactIncidentIp(burst(ip))!;
    const allColumns = `${result.evidence}\n${result.summary}\n${result.dedupeKey}`;
    expect(allColumns).not.toContain(ip);
  });

  it("houdt de dedupeKey uniek per rij (verschillende id → verschillende sleutel)", () => {
    // Twee bursts met verschillende IP's in hetzelfde venster: na redactie mogen ze niet botsen.
    const a = redactIncidentIp(burst("203.0.113.7", "inc-a"))!;
    const b = redactIncidentIp(burst("198.51.100.9", "inc-b"))!;
    expect(a.dedupeKey).not.toBe(b.dedupeKey);
  });

  it("is idempotent: een reeds-geredigeerd incident levert null (niets meer te doen)", () => {
    const once = redactIncidentIp(burst("203.0.113.7"))!;
    const twice = redactIncidentIp({
      id: "inc-1",
      evidence: once.evidence,
      summary: once.summary,
      dedupeKey: once.dedupeKey,
    });
    expect(twice).toBeNull();
  });

  it("slaat het 'onbekend'-sentinel over (geen persoonsgegeven)", () => {
    const result = redactIncidentIp({
      id: "inc-1",
      evidence: JSON.stringify({ ip: "onbekend", count: 9, window: "w" }),
      summary: "9 pogingen vanaf IP onbekend.",
      dedupeKey: "auth-login-burst-onbekend-w",
    });
    expect(result).toBeNull();
  });

  it("laat incidenten zonder ip-veld ongemoeid (bv. rolwijziging-burst, CVE)", () => {
    expect(
      redactIncidentIp({
        id: "inc-1",
        evidence: JSON.stringify({ count: 6, window: "w" }),
        summary: "6 rolwijzigingen in het laatste uur.",
        dedupeKey: "auth-role-burst-w",
      }),
    ).toBeNull();
    expect(
      redactIncidentIp({
        id: "inc-2",
        evidence: JSON.stringify({ package: "left-pad", severity: "high" }),
        summary: "Kwetsbaarheid (high) in dependency left-pad.",
        dedupeKey: "cve-left-pad-high-2026-07-23",
      }),
    ).toBeNull();
  });

  it("geeft null bij ontbrekende of onparseerbare evidence", () => {
    const base = { id: "inc-1", summary: "x", dedupeKey: "k" };
    expect(redactIncidentIp({ ...base, evidence: null })).toBeNull();
    expect(redactIncidentIp({ ...base, evidence: "{not json" })).toBeNull();
    expect(redactIncidentIp({ ...base, evidence: "[1,2,3]" })).toBeNull();
  });

  it("redigeert een IP met regex-metatekens veilig (letterlijke vervanging, geen patroon)", () => {
    // Verdedigt tegen een geïnjecteerd 'IP' dat regex-tekens bevat (X-Forwarded-For is client-nabij).
    const weird = "1.2.3.4|.*";
    const result = redactIncidentIp(burst(weird));
    expect(result).not.toBeNull();
    expect(`${result!.summary}\n${result!.dedupeKey}`).not.toContain(weird);
    expect(result!.summary).toContain(AUDIT_PII_REDACTED);
  });
});
