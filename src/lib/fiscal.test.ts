import { describe, expect, it } from "vitest";
import {
  formatBtwId,
  formatKvk,
  isValidBtwId,
  isValidKvk,
  normalizeBtwId,
  normalizeKvk,
} from "@/lib/fiscal";

describe("normalizeKvk", () => {
  it("strips spaces", () => {
    expect(normalizeKvk("1234 5678")).toBe("12345678");
  });

  it("strips dots", () => {
    expect(normalizeKvk("12.34.56.78")).toBe("12345678");
  });

  it("strips mixed spaces and dots", () => {
    expect(normalizeKvk("12. 34.56 .78")).toBe("12345678");
  });

  it("leaves an already-clean value unchanged", () => {
    expect(normalizeKvk("12345678")).toBe("12345678");
  });
});

describe("isValidKvk", () => {
  it("accepts a plain 8-digit string", () => {
    expect(isValidKvk("12345678")).toBe(true);
  });

  it("accepts 8 digits with internal space", () => {
    expect(isValidKvk("1234 5678")).toBe(true);
  });

  it("accepts 8 digits with dots", () => {
    expect(isValidKvk("12.34.56.78")).toBe(true);
  });

  it("rejects 7 digits", () => {
    expect(isValidKvk("1234567")).toBe(false);
  });

  it("rejects 9 digits", () => {
    expect(isValidKvk("123456789")).toBe(false);
  });

  it("rejects a value containing a non-digit character", () => {
    expect(isValidKvk("1234567a")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidKvk("")).toBe(false);
  });
});

describe("formatKvk", () => {
  it("returns the normalized value", () => {
    expect(formatKvk("12.34.56.78")).toBe("12345678");
    expect(formatKvk("12345678")).toBe("12345678");
  });
});

describe("normalizeBtwId", () => {
  it("uppercases lowercase input", () => {
    expect(normalizeBtwId("nl123456789b01")).toBe("NL123456789B01");
  });

  it("strips spaces", () => {
    expect(normalizeBtwId("NL 123456789 B01")).toBe("NL123456789B01");
  });

  it("strips dots", () => {
    expect(normalizeBtwId("NL.123456789.B01")).toBe("NL123456789B01");
  });
});

describe("isValidBtwId", () => {
  it("accepts a valid BTW-id", () => {
    expect(isValidBtwId("NL123456789B01")).toBe(true);
  });

  it("accepts lowercased input (normalizes to uppercase)", () => {
    expect(isValidBtwId("nl123456789b01")).toBe(true);
  });

  it("accepts input with spaces", () => {
    expect(isValidBtwId("NL 123456789 B01")).toBe(true);
  });

  it("accepts suffix 99", () => {
    expect(isValidBtwId("NL123456789B99")).toBe(true);
  });

  it("rejects suffix 00 (reserved, not a valid entity number)", () => {
    expect(isValidBtwId("NL123456789B00")).toBe(false);
  });

  it("rejects 8-digit body (too short)", () => {
    expect(isValidBtwId("NL12345678B01")).toBe(false);
  });

  it("rejects wrong country prefix", () => {
    expect(isValidBtwId("BE123456789B01")).toBe(false);
  });

  it("rejects a single-digit suffix", () => {
    expect(isValidBtwId("NL123456789B1")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidBtwId("")).toBe(false);
  });
});

describe("formatBtwId", () => {
  it("returns the normalized (uppercased, stripped) value", () => {
    expect(formatBtwId("nl 123456789 b01")).toBe("NL123456789B01");
    expect(formatBtwId("NL123456789B01")).toBe("NL123456789B01");
  });
});
