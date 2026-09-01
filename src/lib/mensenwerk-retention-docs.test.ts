// Verantwoordings-poort (AVG art. 5 lid 2): MENSENWERK.md is het document waarop de eigenaar/FG
// leunt om te weten WELKE geautomatiseerde PII-verwijdering al live is en wat nog een juridische
// keuze vergt. Sinds de retentie-vensters fail-safe AAN werden (PR #1308 e.v. — lege env ⇒ actieve
// verwijdering op het beloofde venster) mag dat document een fail-safe-AAN-venster niet langer als
// "standaard UIT / onbeperkt bewaren" beschrijven: dat inverteert de waarheid over wat er in
// productie al onomkeerbaar wist. Deze test klinkt de doc-tekst vast aan de daadwerkelijke
// config-defaults, zodat een toekomstige drift (default flipt, of de doc verwatert) hard opvalt.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUDIT_LOG_RETENTION_DEFAULT_DAYS,
  LEAD_RETENTION_DEFAULT_DAYS,
  NOTIFICATION_RETENTION_DEFAULT_DAYS,
  APPLICATION_RETENTION_DEFAULT_DAYS,
  HEALTH_INCIDENT_IP_RETENTION_DEFAULT_DAYS,
  SUPPORT_TICKET_RETENTION_DEFAULT_DAYS,
  MAIL_INTAKE_RETENTION_DEFAULT_DAYS,
} from "@/lib/config";

const doc = readFileSync(join(process.cwd(), "MENSENWERK.md"), "utf8");
const lines = doc.split("\n");

/**
 * PII-dragende retentie-vensters die bij een lege env fail-safe AAN staan (default > 0 = actieve
 * verwijdering/redactie op dat venster). Voor elk hiervan is "standaard UIT / onbeperkt bewaren" in
 * de doc een feitelijke inversie. `MESSAGE_RETENTION_DAYS`/`WEBHOOK_EVENT_RETENTION_DAYS` staan
 * bewust default UIT (onomkeerbaarheid/geschillenwaarde) en horen daarom NIET in deze lijst.
 */
const FAIL_SAFE_ON: ReadonlyArray<readonly [string, number]> = [
  ["AUDIT_LOG_RETENTION_DAYS", AUDIT_LOG_RETENTION_DEFAULT_DAYS],
  ["LEAD_RETENTION_DAYS", LEAD_RETENTION_DEFAULT_DAYS],
  ["NOTIFICATION_RETENTION_DAYS", NOTIFICATION_RETENTION_DEFAULT_DAYS],
  ["APPLICATION_RETENTION_DAYS", APPLICATION_RETENTION_DEFAULT_DAYS],
  ["HEALTH_INCIDENT_IP_RETENTION_DAYS", HEALTH_INCIDENT_IP_RETENTION_DEFAULT_DAYS],
  ["SUPPORT_TICKET_RETENTION_DAYS", SUPPORT_TICKET_RETENTION_DEFAULT_DAYS],
  ["MAIL_INTAKE_RETENTION_DAYS", MAIL_INTAKE_RETENTION_DEFAULT_DAYS],
];

describe("MENSENWERK.md retentie-documentatie ↔ config-defaults (AVG art. 5 lid 2)", () => {
  it("elk gedocumenteerd venster staat fail-safe AAN in de config (premisse van deze poort)", () => {
    for (const [name, def] of FAIL_SAFE_ON) {
      expect(def, `${name} zou fail-safe AAN (default > 0) moeten zijn`).toBeGreaterThan(0);
    }
  });

  it("beschrijft geen fail-safe-AAN venster als 'leeg/0 = onbeperkt bewaren' (inversie)", () => {
    for (const [name] of FAIL_SAFE_ON) {
      // De exacte inversie-frase die de FG zou misleiden: dit venster wist juist WEL bij een lege env.
      expect(
        doc.includes(`\`${name}\` leeg/0 = onbeperkt bewaren`),
        `MENSENWERK.md beschrijft ${name} nog als "onbeperkt bewaren" bij lege env — inversie t.o.v. de fail-safe-AAN default`,
      ).toBe(false);
    }
  });

  it("noemt elk fail-safe-AAN venster in de env-var-referentietabel (operator-zichtbaarheid)", () => {
    for (const [name] of FAIL_SAFE_ON) {
      const inTable = lines.some((l) => l.trimStart().startsWith("|") && l.includes(`\`${name}\``));
      expect(
        inTable,
        `${name} ontbreekt in de env-var-tabel — een stil-wissende PII-hefboom die de operator niet ziet`,
      ).toBe(true);
    }
  });

  it("de auditlog-tabelrij claimt geen 'default: onbeperkt' (wist juist standaard na 365 dagen)", () => {
    const auditRow = lines.find(
      (l) => l.trimStart().startsWith("|") && l.includes("`AUDIT_LOG_RETENTION_DAYS`"),
    );
    expect(auditRow, "auditlog-tabelrij ontbreekt").toBeDefined();
    expect(auditRow!.includes("onbeperkt"), auditRow).toBe(false);
  });
});
