import { describe, expect, it } from "vitest";
import { credentialFixAction, type CredentialFixState } from "./credential-fix-action";

describe("credentialFixAction", () => {
  it("een ontbrekend certificaat → Toevoegen naar het nieuw-formulier", () => {
    expect(credentialFixAction("missing")).toEqual({
      label: "Toevoegen",
      href: "/certificaten/nieuw",
    });
  });

  it("een verlopen certificaat → Vernieuwen naar het dossier (niet 'Toevoegen')", () => {
    const action = credentialFixAction("expired");
    // Regressie: een verlopen certificaat bestaat al; de ZZP'er vernieuwt het, hij voegt geen
    // tweede toe. De actie mag dus nooit "Toevoegen" heten of naar het nieuw-formulier wijzen.
    expect(action).toEqual({ label: "Vernieuwen", href: "/certificaten" });
    expect(action?.label).not.toBe("Toevoegen");
    expect(action?.href).not.toBe("/certificaten/nieuw");
  });

  it("een geldig certificaat vraagt geen actie", () => {
    expect(credentialFixAction("satisfied")).toBeNull();
  });

  it("een certificaat in beoordeling vraagt geen actie (wacht op de admin)", () => {
    expect(credentialFixAction("inReview")).toBeNull();
  });

  it("dekt elke staat af (geen ongedefinieerde uitkomst)", () => {
    const states: CredentialFixState[] = ["satisfied", "inReview", "expired", "missing"];
    for (const state of states) {
      // Elke staat levert óf een actie met een niet-lege label+href, óf expliciet null.
      const action = credentialFixAction(state);
      if (action !== null) {
        expect(action.label.length).toBeGreaterThan(0);
        expect(action.href.startsWith("/")).toBe(true);
      }
    }
  });
});
