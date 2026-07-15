import { describe, it, expect } from "vitest";
import { diagnoseVacancyRate } from "@/lib/vacancy-rate-diagnosis";

describe("diagnoseVacancyRate", () => {
  const base = {
    attention: true as boolean,
    scope: "platform" as const,
    median: 60 as number | null,
    rateMax: 45 as number | null,
  };

  it("diagnoseert een koude opdracht met bovengrens onder de mediaan", () => {
    const d = diagnoseVacancyRate(base);
    expect(d).not.toBeNull();
    expect(d!.median).toBe(60);
    expect(d!.rateMax).toBe(45);
    expect(d!.label).toBe("Tarief onder de markt");
    expect(d!.hint).toContain("€ 45/u");
    expect(d!.hint).toContain("€ 60/u");
  });

  it("geeft null wanneer de opdracht niet koud loopt (geen attention)", () => {
    expect(diagnoseVacancyRate({ ...base, attention: false })).toBeNull();
  });

  it("geeft null bij te weinig markt-data (scope none / median null)", () => {
    expect(diagnoseVacancyRate({ ...base, scope: "none", median: null })).toBeNull();
    expect(diagnoseVacancyRate({ ...base, median: null })).toBeNull();
    expect(diagnoseVacancyRate({ ...base, median: 0 })).toBeNull();
  });

  it("geeft null bij een open-eind tarief (rateMax null)", () => {
    expect(diagnoseVacancyRate({ ...base, rateMax: null })).toBeNull();
  });

  it("geeft null wanneer de bovengrens het markttarief haalt of overtreft", () => {
    expect(diagnoseVacancyRate({ ...base, rateMax: 60 })).toBeNull(); // gelijk aan mediaan
    expect(diagnoseVacancyRate({ ...base, rateMax: 75 })).toBeNull(); // boven mediaan
  });

  it("geeft null bij een niet-eindige of niet-positieve bovengrens", () => {
    expect(diagnoseVacancyRate({ ...base, rateMax: Number.NaN })).toBeNull();
    expect(diagnoseVacancyRate({ ...base, rateMax: -10 })).toBeNull();
    expect(diagnoseVacancyRate({ ...base, rateMax: 0 })).toBeNull();
  });

  it("fireert net onder de mediaan (grensgeval)", () => {
    expect(diagnoseVacancyRate({ ...base, rateMax: 59, median: 60 })).not.toBeNull();
  });
});
