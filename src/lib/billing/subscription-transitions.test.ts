// De betaal-webhook (en toekomstige status-schrijvers) is gebonden aan de expliciete overgangsmap
// (CLAUDE.md regel 3). Deze tests borgen de fail-closed-invariant: de kern van de fix is dat een
// onbekende/ongeldige bronstatus geen enkele overgang oplevert, zodat een aangescherpte map
// automatisch wordt gerespecteerd i.p.v. dat een pad zijn eigen `!==`-logica blijft volgen.

import { describe, it, expect } from "vitest";
import { canSubscriptionTransition } from "@/lib/billing/subscription-transitions";

describe("canSubscriptionTransition", () => {
  it("staat de overgangen toe die de webhook uitvoert", () => {
    // paid → ACTIVE vanaf elke huidige bron; failed → PAST_DUE vanaf PENDING.
    expect(canSubscriptionTransition("PENDING", "ACTIVE")).toBe(true);
    expect(canSubscriptionTransition("PAST_DUE", "ACTIVE")).toBe(true);
    expect(canSubscriptionTransition("CANCELLED", "ACTIVE")).toBe(true);
    expect(canSubscriptionTransition("PENDING", "PAST_DUE")).toBe(true);
  });

  it("is fail-closed: een onbekende/ongeldige bronstatus levert geen enkele overgang op", () => {
    expect(canSubscriptionTransition("GESLOOPT", "ACTIVE")).toBe(false);
    expect(canSubscriptionTransition("", "ACTIVE")).toBe(false);
    // ACTIVE → ACTIVE staat niet in de map (zelf-overgang); de webhook slaat dit hoe dan ook over.
    expect(canSubscriptionTransition("ACTIVE", "ACTIVE")).toBe(false);
  });
});
