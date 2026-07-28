import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { auditActionLabel, hasAuditActionLabel } from "@/lib/audit-labels";

describe("auditActionLabel", () => {
  it("vertaalt een bekende actie naar een NL-label", () => {
    expect(auditActionLabel("PROFILE_UPDATED")).toBe("Profiel bijgewerkt");
    expect(auditActionLabel("CREDENTIAL_VERIFIED")).toBe("Certificaat geverifieerd");
  });

  it("valt voor een onbekende actie terug op een geleesbare vorm", () => {
    expect(auditActionLabel("SOME_NEW_ACTION")).toBe("Some new action");
  });

  it("verandert geen losse spaties of hoofdletters onnodig", () => {
    expect(auditActionLabel("X")).toBe("X");
  });
});

// ---------------------------------------------------------------------------
// Drift-gate: elke audit-actie die de code écht wegschrijft moet een expliciet
// NL-label hebben. Zonder dit hek zakt een nieuw geëmitteerde actie stil weg in
// de geleesbare-fallback ("Shift handoff requested") in het admin-/bemiddelaar-
// audit-logboek — een ruwe enum i.p.v. nette Nederlandse tekst. De test scant
// de broncode op `action: "UPPER_SNAKE"`-literalen in bestanden die de audit-
// machinerie gebruiken en faalt zodra er één zonder label bijkomt.
// ---------------------------------------------------------------------------

/** Recursief alle niet-test .ts/.tsx-bestanden onder src lezen. */
function walkSrc(): Array<{ rel: string; content: string }> {
  const root = join(process.cwd(), "src");
  const results: Array<{ rel: string; content: string }> = [];

  function walk(dir: string, relBase: string) {
    // withFileTypes: bepaal map-vs-bestand uit de Dirent zelf — geen aparte
    // statSync op hetzelfde pad dat we daarna lezen (vermijdt de TOCTOU-race).
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const entry = dirent.name;
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const abs = join(dir, entry);
      const rel = relBase ? `${relBase}/${entry}` : entry;
      if (dirent.isDirectory()) {
        walk(abs, rel);
      } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
        results.push({ rel, content: readFileSync(abs, "utf8") });
      }
    }
  }
  walk(root, "");
  return results;
}

const ACTION_RE = /\baction:\s*"([A-Z][A-Z0-9_]+)"/g;

/** Alle audit-acties die de (niet-test) broncode wegschrijft, met vindplaats. */
function emittedAuditActions(): Map<string, string> {
  const found = new Map<string, string>();
  for (const { rel, content } of walkSrc()) {
    // Alleen bestanden die de audit-machinerie aanraken tellen mee — zo blijven
    // ongerelateerde `action:`-velden (bv. een formulier) buiten de gate.
    if (rel === "lib/audit-labels.ts" || !/\baudit/i.test(content)) continue;
    for (const m of content.matchAll(ACTION_RE)) {
      if (!found.has(m[1]!)) found.set(m[1]!, rel);
    }
  }
  return found;
}

describe("audit-label drift-gate", () => {
  it("elke geëmitteerde audit-actie heeft een expliciet NL-label", () => {
    const missing = [...emittedAuditActions().entries()]
      .filter(([action]) => !hasAuditActionLabel(action))
      .map(([action, rel]) => `${action} (${rel})`);
    expect(
      missing,
      `Audit-acties zonder NL-label in src/lib/audit-labels.ts:\n${missing.join("\n")}`,
    ).toEqual([]);
  });

  it("vindt de bekende kern-acties (scanner werkt)", () => {
    const actions = new Set(emittedAuditActions().keys());
    // Een greep uit de nieuw-gelabelde acties, zodat de scanner zelf niet stil
    // kan breken (een lege scan zou de drift-gate anders vals-groen maken).
    expect(actions.has("AVAILABILITY_UPDATED")).toBe(true);
    expect(actions.has("SHIFT_HANDOFF_REQUESTED")).toBe(true);
    expect(actions.has("CREDENTIAL_VERIFY_BLOCKED")).toBe(true);
    expect(actions.size).toBeGreaterThan(100);
  });
});
