// Unit-tests voor de pure webhook-ledger-retentie-logica + de config-parser (opt-in + veilige vloer).

import { describe, it, expect } from "vitest";
import { webhookEventRetentionCutoff } from "@/lib/webhook-event-retention";
import { parseWebhookEventRetentionDays, WEBHOOK_EVENT_RETENTION_MIN_DAYS } from "@/lib/config";

const NOW = new Date("2026-07-18T12:00:00.000Z");

describe("parseWebhookEventRetentionDays", () => {
  it("is standaard UIT (leeg/undefined = 0)", () => {
    expect(parseWebhookEventRetentionDays(undefined)).toBe(0);
    expect(parseWebhookEventRetentionDays("")).toBe(0);
    expect(parseWebhookEventRetentionDays("   ")).toBe(0);
  });

  it("behandelt 0/negatief/onzin als uit", () => {
    expect(parseWebhookEventRetentionDays("0")).toBe(0);
    expect(parseWebhookEventRetentionDays("-5")).toBe(0);
    expect(parseWebhookEventRetentionDays("abc")).toBe(0);
    expect(parseWebhookEventRetentionDays("NaN")).toBe(0);
  });

  it("neemt een geldig venster over en kapt op hele dagen af", () => {
    expect(parseWebhookEventRetentionDays("90")).toBe(90);
    expect(parseWebhookEventRetentionDays("120.7")).toBe(120);
  });

  it("klemt een te lage waarde naar de minimumvloer (replay-venster-bescherming)", () => {
    expect(parseWebhookEventRetentionDays("1")).toBe(WEBHOOK_EVENT_RETENTION_MIN_DAYS);
    expect(parseWebhookEventRetentionDays("29")).toBe(WEBHOOK_EVENT_RETENTION_MIN_DAYS);
    expect(parseWebhookEventRetentionDays("30")).toBe(30);
  });
});

describe("webhookEventRetentionCutoff", () => {
  it("geeft null als retentie uit staat", () => {
    expect(webhookEventRetentionCutoff(0, NOW)).toBeNull();
    expect(webhookEventRetentionCutoff(-1, NOW)).toBeNull();
    expect(webhookEventRetentionCutoff(Number.NaN, NOW)).toBeNull();
  });

  it("berekent de afkapdatum als now minus het venster", () => {
    const cutoff = webhookEventRetentionCutoff(90, NOW);
    expect(cutoff).toEqual(new Date("2026-04-19T12:00:00.000Z"));
  });

  it("kapt een fractioneel venster af op hele dagen", () => {
    const cutoff = webhookEventRetentionCutoff(30.9, NOW)!;
    expect(cutoff).toEqual(new Date("2026-06-18T12:00:00.000Z"));
  });
});
