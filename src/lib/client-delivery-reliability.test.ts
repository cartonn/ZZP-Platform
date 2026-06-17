import { describe, expect, it } from "vitest";
import { clientReliabilityCaption } from "@/lib/client-delivery-reliability";
import {
  type DeliveryQuality,
  type DeliveryTone,
  DELIVERY_MIN_SAMPLE,
} from "@/lib/collaboration-quality";

function quality(overrides: Partial<DeliveryQuality> = {}): DeliveryQuality {
  return {
    completedCollaborations: 0,
    approvedPerformances: 0,
    firstTimeRightRate: 0,
    correctedPerformances: 0,
    avgApprovalDays: null,
    tone: "INSUFFICIENT" as DeliveryTone,
    ...overrides,
  };
}

describe("clientReliabilityCaption", () => {
  it("meldt te kleine steekproef onder de drempel", () => {
    const caption = clientReliabilityCaption(
      quality({ approvedPerformances: DELIVERY_MIN_SAMPLE - 1 }),
    );
    expect(caption).toContain(`minimaal ${DELIVERY_MIN_SAMPLE}`);
    expect(caption).toContain("te weinig");
  });

  it("prijst een schoon dossier zonder correcties", () => {
    const caption = clientReliabilityCaption(
      quality({ approvedPerformances: 8, firstTimeRightRate: 100, correctedPerformances: 0 }),
    );
    expect(caption).toContain("100%");
    expect(caption).toContain("geen enkele");
  });

  it("benoemt één gecorrigeerde prestatie in enkelvoud", () => {
    const caption = clientReliabilityCaption(
      quality({ approvedPerformances: 10, firstTimeRightRate: 90, correctedPerformances: 1 }),
    );
    expect(caption).toContain("90%");
    expect(caption).toContain("1 prestatie werd");
  });

  it("benoemt meerdere gecorrigeerde prestaties in meervoud", () => {
    const caption = clientReliabilityCaption(
      quality({ approvedPerformances: 10, firstTimeRightRate: 70, correctedPerformances: 3 }),
    );
    expect(caption).toContain("3 prestaties werden");
  });

  it("toont het cijfer precies op de drempel-steekproef", () => {
    const caption = clientReliabilityCaption(
      quality({ approvedPerformances: DELIVERY_MIN_SAMPLE, firstTimeRightRate: 67 }),
    );
    expect(caption).toContain("67%");
    expect(caption).not.toContain("te weinig");
  });
});
