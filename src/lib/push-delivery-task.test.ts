// Unit-test voor de pure ronde-classifier van de push-delivery-taak (`classifyPushDeliveryOutcome`).
// Deze beslissing voedt de push-aflever-heartbeat (dead-man's-switch): de kernregel is dat verlopen
// abonnementen (churn, 404/410) NIET als kanaalstoring tellen — alleen echte, niet-verlopen endpoints
// die niets ontvingen wijzen op een afwijzend kanaal. Geen DB — puur de beslissingsvorm.

import { describe, it, expect } from "vitest";
import { classifyPushDeliveryOutcome } from "./push-delivery-task";

describe("classifyPushDeliveryOutcome", () => {
  it("≥1 geslaagde aflevering → success (ook mét enkele echte fouten)", () => {
    expect(classifyPushDeliveryOutcome({ delivered: 3, realFailures: 0 })).toBe("success");
    expect(classifyPushDeliveryOutcome({ delivered: 3, realFailures: 2 })).toBe("success");
  });

  it("geen succes maar wél echte (niet-verlopen) fouten → failure", () => {
    expect(classifyPushDeliveryOutcome({ delivered: 0, realFailures: 1 })).toBe("failure");
    expect(classifyPushDeliveryOutcome({ delivered: 0, realFailures: 42 })).toBe("failure");
  });

  it("alleen churn of niets geprobeerd → none (neutraal, niets registreren)", () => {
    // delivered=0 én realFailures=0: alle pogingen waren verlopen endpoints (churn) of er was niets.
    expect(classifyPushDeliveryOutcome({ delivered: 0, realFailures: 0 })).toBe("none");
  });

  it("verlopen abonnementen tellen niet mee — churn maskeert een gezonde ronde niet als storing", () => {
    // In de taak verhogen verlopen endpoints noch `delivered` noch `realFailures`; ze worden apart
    // opgeruimd. Een ronde met louter churn is dus `none`, geen `failure`.
    expect(classifyPushDeliveryOutcome({ delivered: 0, realFailures: 0 })).not.toBe("failure");
  });
});
