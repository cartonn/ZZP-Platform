import { describe, it, expect } from "vitest";
import {
  invoiceRejectedNotificationBody,
  performanceRejectedNotificationBody,
} from "@/lib/cascade/notification-bodies";

// Locked-body-test: de exacte body-vorm is de contractuele koppeling tussen de schrijver
// (`planInvoiceRejectedEvent` / `planPerformanceRejectedEvent`) en de AVG-erasure (`anonymizeUser`, die
// bij verwijdering van de opdrachtgever díe body op de ZZP'er-feed reconstrueert en redact). Drift hier
// betekent dat de erasure een andere body matcht dan er staat en de reden art. 17 overleeft.
describe("cascade notification bodies (locked)", () => {
  it("invoiceRejectedNotificationBody heeft een vaste vorm met de reden erin", () => {
    expect(invoiceRejectedNotificationBody("Uren kloppen niet")).toBe(
      "Reden: Uren kloppen niet. Corrigeer de factuur en dien hem opnieuw in.",
    );
  });

  it("performanceRejectedNotificationBody heeft een vaste vorm met de reden erin", () => {
    expect(performanceRejectedNotificationBody("Oplevering onvolledig")).toBe(
      "Reden: Oplevering onvolledig. Pas het aan en dien opnieuw in.",
    );
  });
});
