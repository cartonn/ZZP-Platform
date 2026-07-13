// De betaal-webhook (en toekomstige status-schrijvers) is gebonden aan de expliciete overgangsmap
// (CLAUDE.md regel 3). Deze tests borgen de fail-closed-invariant: de kern van de fix is dat een
// onbekende/ongeldige bronstatus geen enkele overgang oplevert, zodat een aangescherpte map
// automatisch wordt gerespecteerd i.p.v. dat een pad zijn eigen `!==`-logica blijft volgen.

import { describe, it, expect } from "vitest";
import { canSubscriptionTransition } from "@/lib/billing/subscription-transitions";

describe("canSubscriptionTransition", () => {
  it("staat de overgangen toe die de webhook uitvoert", () => {
    // paid → ACTIVE vanaf een openstaande/afgekeurde betaling; failed → PAST_DUE vanaf PENDING.
    expect(canSubscriptionTransition("PENDING", "ACTIVE")).toBe(true);
    expect(canSubscriptionTransition("PAST_DUE", "ACTIVE")).toBe(true);
    expect(canSubscriptionTransition("PENDING", "PAST_DUE")).toBe(true);
  });

  it("weigert CANCELLED → ACTIVE (geen gratis heractivatie via een herspeelde providerRef)", () => {
    // De expiry-taak zet een verlopen abonnement op CANCELLED zonder de providerRef te wissen; met een
    // ongesigneerde (Mollie-)webhook zou het herspelen van die oude, permanent-"paid" referentie het
    // abonnement anders telkens gratis heractiveren. Heractiveren vereist een verse PENDING-checkout.
    expect(canSubscriptionTransition("CANCELLED", "ACTIVE")).toBe(false);
    // Her-aanmelding start altijd op PENDING (nieuwe betaling), niet direct op ACTIVE.
    expect(canSubscriptionTransition("CANCELLED", "PENDING")).toBe(true);
  });

  it("is fail-closed: een onbekende/ongeldige bronstatus levert geen enkele overgang op", () => {
    expect(canSubscriptionTransition("GESLOOPT", "ACTIVE")).toBe(false);
    expect(canSubscriptionTransition("", "ACTIVE")).toBe(false);
    // ACTIVE → ACTIVE staat niet in de map (zelf-overgang); de webhook slaat dit hoe dan ook over.
    expect(canSubscriptionTransition("ACTIVE", "ACTIVE")).toBe(false);
  });
});
