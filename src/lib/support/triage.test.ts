import { describe, expect, it } from "vitest";
import { classifyTicket, triageDecision } from "@/lib/support/triage";
import { knowledgeAnswer, ASSISTANT_NAME } from "@/lib/support/knowledge-base";

describe("classifyTicket", () => {
  it("herkent een factuurvraag", () => {
    const r = classifyTicket({
      subject: "Vraag over mijn factuur",
      body: "Is de betaling al binnen?",
    });
    expect(r.category).toBe("INVOICE");
    expect(r.intent).toBe("INVOICE_STATUS");
    expect(r.confidence).toBeGreaterThanOrEqual(50);
  });

  it("herkent een certificaat/verificatie-vraag", () => {
    const r = classifyTicket({
      subject: "VOG verificatie",
      body: "Mijn diploma is nog niet geverifieerd",
    });
    expect(r.category).toBe("CREDENTIAL");
    expect(r.intent).toBe("CREDENTIAL_STATUS");
  });

  it("herkent een wachtwoord/inlog-vraag", () => {
    const r = classifyTicket({ subject: "Kan niet inloggen", body: "Mijn wachtwoord werkt niet" });
    expect(r.category).toBe("ACCOUNT");
    expect(r.intent).toBe("PASSWORD_RESET");
  });

  it("herkent een privacy/AVG-verzoek (gevoelig)", () => {
    const r = classifyTicket({
      subject: "AVG",
      body: "Ik wil mijn persoonsgegevens laten verwijderen",
    });
    expect(r.category).toBe("PRIVACY");
    expect(r.intent).toBe("PRIVACY_REQUEST");
  });

  it("onbekende vraag → OTHER met confidence 0", () => {
    const r = classifyTicket({ subject: "Hallo", body: "Zomaar een berichtje" });
    expect(r.category).toBe("OTHER");
    expect(r.confidence).toBe(0);
  });

  it("meer treffers → hogere betrouwbaarheid", () => {
    const een = classifyTicket({ subject: "factuur", body: "" });
    const meer = classifyTicket({ subject: "factuur betaling btw", body: "openstaand aanmaning" });
    expect(meer.confidence).toBeGreaterThan(een.confidence);
  });
});

describe("triageDecision", () => {
  it("antwoordt automatisch bij hoge betrouwbaarheid en veilige categorie", () => {
    expect(triageDecision({ category: "INVOICE", confidence: 70, autoAttempts: 0 })).toBe(
      "AUTO_ANSWER",
    );
  });

  it("escaleert privacy-verzoeken altijd", () => {
    expect(triageDecision({ category: "PRIVACY", confidence: 95, autoAttempts: 0 })).toBe(
      "ESCALATE",
    );
  });

  it("escaleert bij lage betrouwbaarheid", () => {
    expect(triageDecision({ category: "OTHER", confidence: 0, autoAttempts: 0 })).toBe("ESCALATE");
  });

  it("escaleert na 2 mislukte auto-pogingen (guardrail)", () => {
    expect(triageDecision({ category: "INVOICE", confidence: 90, autoAttempts: 2 })).toBe(
      "ESCALATE",
    );
  });
});

describe("knowledgeAnswer", () => {
  it("geeft een concreet antwoord voor bekende intenties", () => {
    expect(knowledgeAnswer("INVOICE_STATUS")).toContain("Facturen");
    expect(knowledgeAnswer("PASSWORD_RESET")).toContain("Wachtwoord vergeten");
  });

  it("geeft null voor gevoelige/algemene intenties (mens nodig)", () => {
    expect(knowledgeAnswer("PRIVACY_REQUEST")).toBeNull();
    expect(knowledgeAnswer("GENERAL")).toBeNull();
  });

  it("de assistent heet nooit 'AI'", () => {
    expect(ASSISTANT_NAME).not.toMatch(/\bAI\b/);
  });
});
