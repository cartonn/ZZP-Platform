import { describe, it, expect } from "vitest";
import { TERM, TERM_PLURAL, term, type DomainConcept } from "@/lib/terminology";
import { navForRole } from "@/lib/nav";

const ALL_CONCEPTS: DomainConcept[] = [
  "job",
  "application",
  "candidate",
  "collaboration",
  "performance",
  "shift",
  "invoice",
  "action",
  "message",
  "credential",
  "document",
];

const itemFor = (role: Parameters<typeof navForRole>[0], href: string) =>
  navForRole(role).find((i) => i.href === href);

describe("terminology", () => {
  describe("TERM completeness", () => {
    it("every DomainConcept has a non-empty TERM entry", () => {
      for (const concept of ALL_CONCEPTS) {
        expect(TERM[concept], `TERM["${concept}"] moet een niet-lege string zijn`).toBeTruthy();
      }
    });

    it("every DomainConcept has a non-empty TERM_PLURAL entry", () => {
      for (const concept of ALL_CONCEPTS) {
        expect(
          TERM_PLURAL[concept],
          `TERM_PLURAL["${concept}"] moet een niet-lege string zijn`,
        ).toBeTruthy();
      }
    });
  });

  describe("TERM uniqueness", () => {
    it("all TERM values are unique", () => {
      const values = Object.values(TERM);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });

    it("all TERM_PLURAL values are unique", () => {
      const values = Object.values(TERM_PLURAL);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe("term() function", () => {
    it("returns singular by default", () => {
      expect(term("job")).toBe("Opdracht");
      expect(term("invoice")).toBe("Factuur");
    });

    it("returns plural when { plural: true }", () => {
      expect(term("job", { plural: true })).toBe("Opdrachten");
      expect(term("invoice", { plural: true })).toBe("Facturen");
    });

    it("plural differs from singular for every concept", () => {
      for (const concept of ALL_CONCEPTS) {
        expect(
          TERM_PLURAL[concept],
          `Plural van "${concept}" moet verschillen van singular`,
        ).not.toBe(TERM[concept]);
      }
    });
  });

  describe("nav guardrail — labels moeten overeenkomen met canonical terms", () => {
    it("FREELANCER /opdrachten label === TERM_PLURAL.job", () => {
      const item = itemFor("FREELANCER", "/opdrachten");
      expect(item, "nav item /opdrachten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.job);
    });

    it("FREELANCER /reacties label === `Mijn ${TERM_PLURAL.application.toLowerCase()}`", () => {
      const item = itemFor("FREELANCER", "/reacties");
      expect(item, "nav item /reacties niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(`Mijn ${TERM_PLURAL.application.toLowerCase()}`);
    });

    it("FREELANCER /samenwerkingen label === TERM_PLURAL.collaboration", () => {
      const item = itemFor("FREELANCER", "/samenwerkingen");
      expect(item, "nav item /samenwerkingen niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.collaboration);
    });

    it("FREELANCER /diensten label === 'Urenstaten'", () => {
      const item = itemFor("FREELANCER", "/diensten");
      expect(item, "nav item /diensten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe("Urenstaten");
    });

    // /facturen, /openstaand, /administratie, /ontzorgd en /prognose staan niet meer apart in de
    // FREELANCER-zijbalk: ze zijn samengevoegd in de Administratie-hub (/financien, tabs).
    it("FREELANCER Administratie-items zitten in de hub /financien (niet meer los in de zijbalk)", () => {
      expect(itemFor("FREELANCER", "/facturen")).toBeUndefined();
      expect(itemFor("FREELANCER", "/openstaand")).toBeUndefined();
      expect(itemFor("FREELANCER", "/administratie")).toBeUndefined();
      expect(itemFor("FREELANCER", "/ontzorgd")).toBeUndefined();
      expect(itemFor("FREELANCER", "/prognose")).toBeUndefined();
      const hub = itemFor("FREELANCER", "/financien");
      expect(hub, "nav item /financien niet gevonden voor FREELANCER").toBeDefined();
      expect(hub!.label).toBe("Administratie");
    });

    it("CLIENT Administratie-items zitten in de hub /financien (niet meer los in de zijbalk)", () => {
      expect(itemFor("CLIENT", "/facturen")).toBeUndefined();
      expect(itemFor("CLIENT", "/openstaand")).toBeUndefined();
      expect(itemFor("CLIENT", "/administratie")).toBeUndefined();
      expect(itemFor("CLIENT", "/verplichtingen")).toBeUndefined();
      const hub = itemFor("CLIENT", "/financien");
      expect(hub, "nav item /financien niet gevonden voor CLIENT").toBeDefined();
      expect(hub!.label).toBe("Administratie");
    });

    it("FREELANCER /acties label === TERM_PLURAL.action", () => {
      const item = itemFor("FREELANCER", "/acties");
      expect(item, "nav item /acties niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.action);
    });

    it("FREELANCER /berichten label === TERM_PLURAL.message", () => {
      const item = itemFor("FREELANCER", "/berichten");
      expect(item, "nav item /berichten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.message);
    });

    // /certificaten, /documenten en /beschikbaarheid staan niet meer in de FREELANCER-zijbalk:
    // ze zijn samengevoegd in de "Mijn profiel"-hub (tabs), dus geen nav-guardrail meer.
    it("FREELANCER zijbalk bevat /certificaten en /documenten NIET (samengevoegd in profiel-hub)", () => {
      expect(itemFor("FREELANCER", "/certificaten")).toBeUndefined();
      expect(itemFor("FREELANCER", "/documenten")).toBeUndefined();
      expect(itemFor("FREELANCER", "/beschikbaarheid")).toBeUndefined();
    });

    it("CLIENT /prestaties label === 'Uren goedkeuren'", () => {
      const item = itemFor("CLIENT", "/prestaties");
      expect(item, "nav item /prestaties niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe("Uren goedkeuren");
    });

    it("CLIENT /kandidaten label === 'Reacties'", () => {
      const item = itemFor("CLIENT", "/kandidaten");
      expect(item, "nav item /kandidaten niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe("Reacties");
    });

    it("CLIENT /opdrachten label === `Mijn ${TERM_PLURAL.job.toLowerCase()}`", () => {
      const item = itemFor("CLIENT", "/opdrachten");
      expect(item, "nav item /opdrachten niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe(`Mijn ${TERM_PLURAL.job.toLowerCase()}`);
    });
  });
});
