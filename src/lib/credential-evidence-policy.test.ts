import { describe, expect, it } from "vitest";
import {
  EVIDENCE_REMOVAL_REASON,
  evidenceRetentionFor,
  parseEvidenceRetentionOverride,
  shouldRemoveEvidenceAfterReview,
} from "./credential-evidence-policy";
import { CREDENTIAL_TYPES, type CredentialType } from "./enums";

describe("evidenceRetentionFor", () => {
  it("houdt voor een VOG standaard alleen metadata over (AP-lijn: gezien + datum)", () => {
    expect(evidenceRetentionFor("VOG", undefined)).toBe("metadata");
    expect(shouldRemoveEvidenceAfterReview("VOG", undefined)).toBe(true);
  });

  it("bewaart het bestand voor alle overige certificaattypen", () => {
    const others = CREDENTIAL_TYPES.filter((t) => t !== "VOG");
    expect(others.length).toBeGreaterThan(0);
    for (const type of others) {
      expect(evidenceRetentionFor(type, undefined)).toBe("file");
      expect(shouldRemoveEvidenceAfterReview(type, undefined)).toBe(false);
    }
  });

  it("laat de env-override het VOG-bestand bewaren (uitzonderlijke contractuele noodzaak)", () => {
    expect(evidenceRetentionFor("VOG", "file")).toBe("file");
    expect(shouldRemoveEvidenceAfterReview("VOG", "file")).toBe(false);
  });

  it("negeert de override voor andere types — die blijven hoe dan ook op 'file'", () => {
    expect(evidenceRetentionFor("DIPLOMA", "metadata" as string)).toBe("file");
  });
});

describe("parseEvidenceRetentionOverride", () => {
  it("valt fail-safe terug op metadata bij leeg, onbekend of half-getypt", () => {
    for (const raw of [undefined, "", "   ", "File", "FILE", "bestand", "metadata", "true"]) {
      expect(parseEvidenceRetentionOverride(raw)).toBe("metadata");
    }
  });

  it("accepteert exact 'file' (ook met omringende spaties)", () => {
    expect(parseEvidenceRetentionOverride("file")).toBe("file");
    expect(parseEvidenceRetentionOverride("  file  ")).toBe("file");
  });
});

describe("EVIDENCE_REMOVAL_REASON", () => {
  it("benoemt het beleid leesbaar voor het auditlogboek", () => {
    expect(EVIDENCE_REMOVAL_REASON).toContain("gezien + datum");
  });
});

// Typecontrole: de policy dekt élk certificaattype (geen stilzwijgend gat bij een nieuw type).
const _exhaustive: Record<CredentialType, string> = Object.fromEntries(
  CREDENTIAL_TYPES.map((t) => [t, evidenceRetentionFor(t, undefined)]),
) as Record<CredentialType, string>;
void _exhaustive;
