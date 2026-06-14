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

    it("FREELANCER /diensten label === TERM_PLURAL.shift", () => {
      const item = itemFor("FREELANCER", "/diensten");
      expect(item, "nav item /diensten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.shift);
    });

    it("FREELANCER /facturen label === TERM_PLURAL.invoice", () => {
      const item = itemFor("FREELANCER", "/facturen");
      expect(item, "nav item /facturen niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.invoice);
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

    it("FREELANCER /certificaten label === TERM_PLURAL.credential", () => {
      const item = itemFor("FREELANCER", "/certificaten");
      expect(item, "nav item /certificaten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.credential);
    });

    it("FREELANCER /documenten label === TERM_PLURAL.document", () => {
      const item = itemFor("FREELANCER", "/documenten");
      expect(item, "nav item /documenten niet gevonden voor FREELANCER").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.document);
    });

    it("CLIENT /prestaties label === TERM_PLURAL.performance", () => {
      const item = itemFor("CLIENT", "/prestaties");
      expect(item, "nav item /prestaties niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.performance);
    });

    it("CLIENT /kandidaten label === TERM_PLURAL.candidate", () => {
      const item = itemFor("CLIENT", "/kandidaten");
      expect(item, "nav item /kandidaten niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe(TERM_PLURAL.candidate);
    });

    it("CLIENT /opdrachten label === `Mijn ${TERM_PLURAL.job.toLowerCase()}`", () => {
      const item = itemFor("CLIENT", "/opdrachten");
      expect(item, "nav item /opdrachten niet gevonden voor CLIENT").toBeDefined();
      expect(item!.label).toBe(`Mijn ${TERM_PLURAL.job.toLowerCase()}`);
    });
  });
});
