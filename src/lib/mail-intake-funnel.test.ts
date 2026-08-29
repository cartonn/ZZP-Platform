import { describe, expect, it } from "vitest";
import { buildMailIntakeFunnel, formatDoorlooptijd } from "@/lib/mail-intake-funnel";

const d = (iso: string) => new Date(iso);

// Hulpfunctie: bouw een intake-record.
function intake(opts: {
  status: "NEW" | "ACCEPTED" | "DISMISSED";
  receivedAt: string;
  decidedAt?: string;
  jobPublishedAt?: string;
}) {
  return {
    status: opts.status,
    receivedAt: d(opts.receivedAt),
    decidedAt: opts.decidedAt ? d(opts.decidedAt) : null,
    jobPublishedAt: opts.jobPublishedAt ? d(opts.jobPublishedAt) : null,
  };
}

describe("buildMailIntakeFunnel", () => {
  it("geeft nullen bij een lege reeks", () => {
    const f = buildMailIntakeFunnel([]);
    expect(f.total).toBe(0);
    expect(f.accepted).toBe(0);
    expect(f.pending).toBe(0);
    expect(f.dismissed).toBe(0);
    expect(f.acceptanceRatePct).toBeNull();
    expect(f.medianReviewMinutes).toBeNull();
    expect(f.medianPublishMinutes).toBeNull();
  });

  it("telt statussen correct", () => {
    const inputs = [
      intake({ status: "NEW", receivedAt: "2026-08-01T10:00:00Z" }),
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T11:00:00Z",
      }),
      intake({
        status: "DISMISSED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:30:00Z",
      }),
    ];
    const f = buildMailIntakeFunnel(inputs);
    expect(f.total).toBe(3);
    expect(f.accepted).toBe(1);
    expect(f.dismissed).toBe(1);
    expect(f.pending).toBe(1);
  });

  it("berekent acceptanceRatePct correct", () => {
    const inputs = [
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T11:00:00Z",
      }),
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T11:00:00Z",
      }),
      intake({
        status: "DISMISSED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:30:00Z",
      }),
      intake({ status: "NEW", receivedAt: "2026-08-01T10:00:00Z" }),
    ];
    const f = buildMailIntakeFunnel(inputs);
    expect(f.acceptanceRatePct).toBe(50); // 2/4 = 50%
  });

  it("medianReviewMinutes: mediaan over besliste intakes (ook DISMISSED)", () => {
    // Beoordeling: ACCEPTED na 60 min, DISMISSED na 30 min → mediaan = 45 min
    const inputs = [
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T11:00:00Z",
      }),
      intake({
        status: "DISMISSED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:30:00Z",
      }),
    ];
    const f = buildMailIntakeFunnel(inputs);
    expect(f.medianReviewMinutes).toBe(45);
  });

  it("medianReviewMinutes: null als niemand heeft beslist", () => {
    const f = buildMailIntakeFunnel([
      intake({ status: "NEW", receivedAt: "2026-08-01T10:00:00Z" }),
    ]);
    expect(f.medianReviewMinutes).toBeNull();
  });

  it("medianPublishMinutes: alleen ACCEPTED+gepubliceerd", () => {
    // Ontvangen → gepubliceerd: 120 min en 60 min → mediaan = 90
    const inputs = [
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:30:00Z",
        jobPublishedAt: "2026-08-01T12:00:00Z", // 120 min
      }),
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:20:00Z",
        jobPublishedAt: "2026-08-01T11:00:00Z", // 60 min
      }),
      // Overgenomen maar nog niet gepubliceerd — telt niet mee in medianPublishMinutes
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:10:00Z",
      }),
    ];
    const f = buildMailIntakeFunnel(inputs);
    expect(f.medianPublishMinutes).toBe(90);
  });

  it("medianPublishMinutes: null als geen gepubliceerde accepted-intakes", () => {
    const f = buildMailIntakeFunnel([
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:10:00Z",
      }),
    ]);
    expect(f.medianPublishMinutes).toBeNull();
  });

  it("klempt negatieve tijden op 0 (data-ruis: decidedAt < receivedAt)", () => {
    const f = buildMailIntakeFunnel([
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T11:00:00Z",
        decidedAt: "2026-08-01T10:00:00Z",
      }),
    ]);
    expect(f.medianReviewMinutes).toBe(0);
  });

  it("enkele rij: mediaan = de rij zelf", () => {
    const f = buildMailIntakeFunnel([
      intake({
        status: "ACCEPTED",
        receivedAt: "2026-08-01T10:00:00Z",
        decidedAt: "2026-08-01T10:45:00Z",
        jobPublishedAt: "2026-08-01T13:00:00Z", // 180 min
      }),
    ]);
    expect(f.medianReviewMinutes).toBe(45);
    expect(f.medianPublishMinutes).toBe(180);
  });
});

describe("formatDoorlooptijd", () => {
  it("null → null", () => expect(formatDoorlooptijd(null)).toBeNull());
  it("0 → '0 min'", () => expect(formatDoorlooptijd(0)).toBe("0 min"));
  it("45 → '45 min'", () => expect(formatDoorlooptijd(45)).toBe("45 min"));
  it("59 → '59 min'", () => expect(formatDoorlooptijd(59)).toBe("59 min"));
  it("60 → '1 uur'", () => expect(formatDoorlooptijd(60)).toBe("1 uur"));
  it("90 → '2 uur' (afgerond)", () => expect(formatDoorlooptijd(90)).toBe("2 uur"));
  it("1440 → '24 uur'", () => expect(formatDoorlooptijd(1440)).toBe("24 uur"));
  it("2880 → '2 dagen' (48u grens)", () => expect(formatDoorlooptijd(2880)).toBe("2 dagen"));
  it("10080 → '7 dagen'", () => expect(formatDoorlooptijd(10080)).toBe("7 dagen"));
});
