// Unit-test voor het gedeelde where-predicaat van de reviews-reveal-taak
// (`overdueReviewRevealWhere`). Deze conditie is één bron van waarheid: de taak publiceert ermee en de
// stille-faal-gauge (zzp_reviews_overdue_reveal) telt ermee. De test klinkt de vorm vast zodat de gauge
// niet stil kan driften t.o.v. wat de cron daadwerkelijk onthult. Geen DB — puur de predicaatvorm.

import { describe, it, expect } from "vitest";
import { overdueReviewRevealWhere } from "./reviews-reveal-task";

describe("overdueReviewRevealWhere", () => {
  it("selecteert PENDING_REVEAL-beoordelingen wier venster ≤ nu is verstreken", () => {
    const now = new Date("2026-08-12T05:00:00Z");
    expect(overdueReviewRevealWhere(now)).toEqual({
      status: "PENDING_REVEAL",
      revealDeadline: { lte: now },
    });
  });

  it("geeft de exacte, meegegeven `now` door als bovengrens (geen afronding/kloklek)", () => {
    const now = new Date("2026-01-01T00:00:00.123Z");
    const where = overdueReviewRevealWhere(now);
    expect(where.revealDeadline).toEqual({ lte: now });
    // Alleen nog-niet-gepubliceerde beoordelingen tellen: de status-guard hoort er hard in te zitten.
    expect(where.status).toBe("PENDING_REVEAL");
  });
});
