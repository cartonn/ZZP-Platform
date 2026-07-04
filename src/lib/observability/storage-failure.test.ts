import { afterEach, describe, expect, it, vi } from "vitest";

import { logStorageCleanupFailure } from "./storage-failure";

// De logger schrijft `error`-regels via console.error als één JSON-string. We vangen die op en
// controleren dat een mislukte opslag-opruiming nooit rauwe PII of provider-specifieke velden naar
// de hosting-logs schrijft. Alle argumenten worden samengevoegd zodat een terugval op het oude
// antipatroon (`console.error(source, key, err)` met het rauwe foutobject) de assertie óók vangt.
function captureLog(fn: () => void): string {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    fn();
    expect(spy).toHaveBeenCalledTimes(1);
    return (spy.mock.calls[0] ?? []).map((a) => String(a)).join(" ");
  } finally {
    spy.mockRestore();
  }
}

describe("logStorageCleanupFailure — PII-veilige opslag-foutlogging (AVG art. 5 lid 1f)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maskeert een e-mailadres dat in de storage-fout-message meelift", () => {
    // Een S3/lokale driver kan in de message een pad of adres-achtige waarde dragen.
    const line = captureLog(() =>
      logStorageCleanupFailure(
        "[documenten]",
        "docs/user-42/vog.pdf",
        new Error("delete failed for owner jan@firma.nl"),
      ),
    );
    expect(line).not.toContain("jan@firma.nl");
    expect(line).toContain("j***@firma.nl");
    // Herkomst + sleutel blijven leesbaar zodat een achtergebleven bestand terug te vinden is (AVG-opruiming).
    expect(line).toContain("[documenten]");
    expect(line).toContain("docs/user-42/vog.pdf");
  });

  it("laat provider-specifieke velden op het foutobject niet meelekken (describeError reduceert tot naam/message/stack)", () => {
    // Simuleer een driver-fout met een extra, PII-dragend veld dat NIET in de log mag belanden.
    const err = Object.assign(new Error("access denied"), {
      requesterEmail: "piet@bedrijf.nl",
      bucketPolicy: "s3://prod-secret-bucket",
    });
    const line = captureLog(() =>
      logStorageCleanupFailure("[gebruikers] AVG", "avg/user-9/diploma.pdf", err),
    );
    expect(line).not.toContain("piet@bedrijf.nl");
    expect(line).not.toContain("prod-secret-bucket");
    expect(line).toContain("access denied");
  });

  it("gooit nooit door naar de caller bij niet-Error input", () => {
    expect(() =>
      captureLog(() => logStorageCleanupFailure("[bedrijf]", "logos/co-1.png", "driver weg")),
    ).not.toThrow();
  });
});
