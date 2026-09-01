import { describe, expect, it } from "vitest";
import { billingProfileTask } from "@/lib/actions/tasks";
import { P } from "@/lib/next-actions";
import type { BillingGap } from "@/lib/billing-readiness";

const btwGap: BillingGap = {
  key: "btw",
  label: "btw-identificatienummer",
  hint: "Verplicht op elke factuur waarop btw staat (art. 35a Wet OB).",
};
const ibanGap: BillingGap = {
  key: "iban",
  label: "betaalrekening (IBAN)",
  hint: "Zonder IBAN op de factuur kan de opdrachtgever je niet betalen.",
};

describe("billingProfileTask", () => {
  it("bindt de vaste identiteit, prioriteit en deep-link (link-resolver, geen dode één-klik)", () => {
    const task = billingProfileTask([btwGap]);
    expect(task.kind).toBe("billing-profile");
    expect(task.id).toBe("billing-profile:fields");
    expect(task.priority).toBe(P.billingProfileIncomplete);
    expect(task.resolver).toBe("link");
    expect(task.href).toBe("/profiel/bewerken");
    expect(task.tone).toBe("attention");
  });

  it("somt de ontbrekende gegevens in de subtitel op (btw vóór iban)", () => {
    const task = billingProfileTask([btwGap, ibanGap]);
    expect(task.subtitle).toBe("Ontbreekt: btw-identificatienummer, betaalrekening (IBAN)");
  });

  it("draagt de gaten mee zodat de UI ze desgewenst kan tonen", () => {
    const task = billingProfileTask([ibanGap]);
    expect(task.kind === "billing-profile" && task.gaps).toEqual([ibanGap]);
    expect(task.subtitle).toBe("Ontbreekt: betaalrekening (IBAN)");
  });

  it("staat onder het acute geld-/deadline-cluster maar boven de cosmetische compleetheid", () => {
    // Systemische facturatie-blokkade: urgenter dan compleetheid/relatie, minder dan verstreken geld.
    expect(P.billingProfileIncomplete).toBeLessThan(P.overdueInvoice);
    expect(P.billingProfileIncomplete).toBeLessThan(P.conceptInvoiceAging);
    expect(P.billingProfileIncomplete).toBeGreaterThan(P.collaborationRenewal);
    expect(P.billingProfileIncomplete).toBeGreaterThan(P.completeness);
  });
});
