import { describe, it, expect } from "vitest";
import {
  buildModelAgreementContent,
  resolveAgreementType,
  MODEL_AGREEMENT_DISCLAIMER,
  type ModelAgreementContentInput,
} from "@/lib/contract-agreement";

const base: ModelAgreementContentInput = {
  agreementType: "GEEN_WERKGEVERSGEZAG",
  jobTitle: "Verpleegkundige nachtdienst",
  jobDescription: "Zorg voor cliënten op afdeling 3.",
  freelancerName: "Jamila de Vries",
  clientName: "Zorggroep West",
  rateLabel: "€ 45 per uur",
  periodLabel: "van 01-06-2026 tot 31-12-2026",
};

describe("buildModelAgreementContent", () => {
  it("levert de vaste artikelen + intro + disclaimer", () => {
    const c = buildModelAgreementContent(base);
    expect(c.title).toBe("Modelovereenkomst van opdracht");
    expect(c.note).toBe(MODEL_AGREEMENT_DISCLAIMER);
    expect(c.intro).toContain("Zorggroep West");
    expect(c.intro).toContain("Jamila de Vries");
    // 8 artikelen (1 opdracht t/m 8 toepasselijk recht), incl. het type-artikel op plek 5
    expect(c.articles).toHaveLength(8);
  });

  it("neemt opdrachttitel, tarief en periode op", () => {
    const c = buildModelAgreementContent(base);
    const text = c.articles.flatMap((a) => a.body).join(" ");
    expect(text).toContain("Verpleegkundige nachtdienst");
    expect(text).toContain("€ 45 per uur");
    expect(text).toContain("van 01-06-2026 tot 31-12-2026");
  });

  it("valt terug op 'in onderling overleg' zonder tarief", () => {
    const c = buildModelAgreementContent({ ...base, rateLabel: null });
    const text = c.articles.flatMap((a) => a.body).join(" ");
    expect(text).toContain("in onderling overleg vastgesteld");
  });

  it("laat de omschrijving weg als die ontbreekt", () => {
    const c = buildModelAgreementContent({ ...base, jobDescription: "  " });
    const art1 = c.articles[0]!;
    expect(art1.body.some((b) => b.startsWith("Omschrijving"))).toBe(false);
  });

  it.each([
    ["GEEN_WERKGEVERSGEZAG", "Geen werkgeversgezag"],
    ["VRIJE_VERVANGING", "Vrije vervanging"],
    ["TUSSENKOMST", "Tussenkomst"],
  ] as const)("bevat het type-specifieke artikel voor %s", (type, heading) => {
    const c = buildModelAgreementContent({ ...base, agreementType: type });
    expect(c.type).toBe(type);
    expect(c.articles.some((a) => a.heading === heading)).toBe(true);
  });
});

describe("resolveAgreementType", () => {
  it("geeft voorrang aan de samenwerking-keuze", () => {
    expect(resolveAgreementType("VRIJE_VERVANGING", "TUSSENKOMST", "GEEN_WERKGEVERSGEZAG")).toBe(
      "VRIJE_VERVANGING",
    );
  });

  it("valt terug op de opdracht-keuze, dan de aanbeveling", () => {
    expect(resolveAgreementType(null, "TUSSENKOMST", "GEEN_WERKGEVERSGEZAG")).toBe("TUSSENKOMST");
    expect(resolveAgreementType(null, null, "VRIJE_VERVANGING")).toBe("VRIJE_VERVANGING");
  });

  it("negeert ongeldige waarden en valt veilig terug op GEEN_WERKGEVERSGEZAG", () => {
    expect(resolveAgreementType("ONZIN", null, null)).toBe("GEEN_WERKGEVERSGEZAG");
    expect(resolveAgreementType(null, null, null)).toBe("GEEN_WERKGEVERSGEZAG");
  });
});
