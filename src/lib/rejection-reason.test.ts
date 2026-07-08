import { describe, it, expect } from "vitest";

import {
  REJECTION_REASONS,
  rejectionReasonCodeSchema,
  optionalRejectionReasonSchema,
  rejectionReasonLabel,
  rejectionReasonFeedback,
  buildRejectionNotificationBody,
  type RejectionReasonCode,
} from "./rejection-reason";

const ALL_CODES = REJECTION_REASONS.map((r) => r.code);

describe("REJECTION_REASONS", () => {
  it("bevat de verwachte codes in de juiste volgorde", () => {
    expect(ALL_CODES).toEqual([
      "POSITION_FILLED",
      "RATE_TOO_HIGH",
      "EXPERIENCE_MISMATCH",
      "AVAILABILITY",
      "LOCATION",
      "OTHER",
    ]);
  });

  it("heeft voor elke code een niet-lege label en feedback", () => {
    for (const reason of REJECTION_REASONS) {
      expect(reason.label.length).toBeGreaterThan(0);
      expect(reason.feedback.length).toBeGreaterThan(0);
    }
  });

  it("heeft unieke codes", () => {
    expect(new Set(ALL_CODES).size).toBe(ALL_CODES.length);
  });

  it("bevat het woord 'AI' nergens in de teksten", () => {
    for (const reason of REJECTION_REASONS) {
      expect(/\bAI\b/.test(reason.label)).toBe(false);
      expect(/\bAI\b/.test(reason.feedback)).toBe(false);
    }
  });

  it("gebruikt voor OTHER een neutrale terugval", () => {
    const other = REJECTION_REASONS.find((r) => r.code === "OTHER");
    expect(other?.label).toBe("Anders");
    expect(other?.feedback).toBe("De opdrachtgever koos deze keer voor een andere kandidaat.");
  });
});

describe("rejectionReasonCodeSchema", () => {
  it("accepteert elke geldige code", () => {
    for (const code of ALL_CODES) {
      const result = rejectionReasonCodeSchema.safeParse(code);
      expect(result.success).toBe(true);
    }
  });

  it("weigert een onbekende code", () => {
    expect(rejectionReasonCodeSchema.safeParse("NOPE").success).toBe(false);
  });

  it("weigert een lege string", () => {
    expect(rejectionReasonCodeSchema.safeParse("").success).toBe(false);
  });
});

describe("optionalRejectionReasonSchema", () => {
  it("accepteert undefined als 'geen reden'", () => {
    const result = optionalRejectionReasonSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("normaliseert een lege string naar undefined", () => {
    const result = optionalRejectionReasonSchema.safeParse("");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("accepteert een geldige code en behoudt de waarde", () => {
    const result = optionalRejectionReasonSchema.safeParse("POSITION_FILLED");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe<RejectionReasonCode>("POSITION_FILLED");
  });

  it("accepteert elke geldige code", () => {
    for (const code of ALL_CODES) {
      const result = optionalRejectionReasonSchema.safeParse(code);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe(code);
    }
  });

  it("weigert een niet-lege ongeldige waarde", () => {
    expect(optionalRejectionReasonSchema.safeParse("INVALID").success).toBe(false);
  });
});

describe("rejectionReasonLabel", () => {
  it("geeft het label voor elke bekende code", () => {
    for (const reason of REJECTION_REASONS) {
      expect(rejectionReasonLabel(reason.code)).toBe(reason.label);
    }
  });

  it("geeft null voor een onbekende code", () => {
    expect(rejectionReasonLabel("NOPE")).toBeNull();
  });

  it("geeft null voor null, undefined en lege string", () => {
    expect(rejectionReasonLabel(null)).toBeNull();
    expect(rejectionReasonLabel(undefined)).toBeNull();
    expect(rejectionReasonLabel("")).toBeNull();
  });
});

describe("rejectionReasonFeedback", () => {
  it("geeft de feedback voor elke bekende code", () => {
    for (const reason of REJECTION_REASONS) {
      expect(rejectionReasonFeedback(reason.code)).toBe(reason.feedback);
    }
  });

  it("geeft de neutrale feedback voor OTHER", () => {
    expect(rejectionReasonFeedback("OTHER")).toBe(
      "De opdrachtgever koos deze keer voor een andere kandidaat.",
    );
  });

  it("geeft null voor een onbekende code", () => {
    expect(rejectionReasonFeedback("NOPE")).toBeNull();
  });

  it("geeft null voor null, undefined en lege string", () => {
    expect(rejectionReasonFeedback(null)).toBeNull();
    expect(rejectionReasonFeedback(undefined)).toBeNull();
    expect(rejectionReasonFeedback("")).toBeNull();
  });
});

describe("buildRejectionNotificationBody", () => {
  it("bouwt de body zonder reden bij een lege/onbekende code", () => {
    expect(buildRejectionNotificationBody("Backend-opdracht", null)).toBe(
      'Voor "Backend-opdracht".',
    );
    expect(buildRejectionNotificationBody("Backend-opdracht", undefined)).toBe(
      'Voor "Backend-opdracht".',
    );
    expect(buildRejectionNotificationBody("Backend-opdracht", "")).toBe('Voor "Backend-opdracht".');
    expect(buildRejectionNotificationBody("Backend-opdracht", "NOPE")).toBe(
      'Voor "Backend-opdracht".',
    );
  });

  it("bouwt de body met label bij een geldige code", () => {
    expect(buildRejectionNotificationBody("Backend-opdracht", "POSITION_FILLED")).toBe(
      'Voor "Backend-opdracht". Reden: Positie is al vervuld.',
    );
  });

  it("bouwt de body met label voor OTHER", () => {
    expect(buildRejectionNotificationBody("Klus X", "OTHER")).toBe('Voor "Klus X". Reden: Anders.');
  });

  it("gebruikt de opdrachttitel letterlijk", () => {
    expect(buildRejectionNotificationBody('Klus met "quotes"', undefined)).toBe(
      'Voor "Klus met "quotes"".',
    );
  });
});
