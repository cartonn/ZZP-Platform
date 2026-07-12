import { describe, expect, it } from "vitest";
import {
  MAX_REQUEST_ID_LENGTH,
  REQUEST_ID_HEADER,
  generateRequestId,
  resolveRequestId,
  sanitizeRequestId,
  shortRequestId,
} from "./request-id";

describe("request-id", () => {
  it("exposeert de standaard header-naam", () => {
    expect(REQUEST_ID_HEADER).toBe("x-request-id");
  });

  describe("sanitizeRequestId", () => {
    it("houdt een geldige UUID ongewijzigd", () => {
      const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
      expect(sanitizeRequestId(id)).toBe(id);
    });

    it("houdt alfanumeriek + . _ - toegestaan", () => {
      expect(sanitizeRequestId("abc.DEF_123-xyz")).toBe("abc.DEF_123-xyz");
    });

    it("strips CR/LF en spaties (header-/log-injectie)", () => {
      expect(sanitizeRequestId("abc\r\ndef ghi")).toBe("abcdefghi");
    });

    it("weert control-tekens en niet-toegestane leestekens", () => {
      expect(sanitizeRequestId("a<b>c/d\\e?f")).toBe("abcdef");
    });

    it("kapt af op de maxlengte", () => {
      const long = "a".repeat(MAX_REQUEST_ID_LENGTH + 50);
      expect(sanitizeRequestId(long)).toHaveLength(MAX_REQUEST_ID_LENGTH);
    });

    it("geeft null bij lege/ongeldige/niet-string invoer", () => {
      expect(sanitizeRequestId("")).toBeNull();
      expect(sanitizeRequestId("   ")).toBeNull();
      expect(sanitizeRequestId("<<<>>>")).toBeNull();
      expect(sanitizeRequestId(null)).toBeNull();
      expect(sanitizeRequestId(undefined)).toBeNull();
      expect(sanitizeRequestId(123 as unknown as string)).toBeNull();
    });
  });

  describe("generateRequestId", () => {
    it("geeft een niet-lege, veilige string", () => {
      const id = generateRequestId();
      expect(id.length).toBeGreaterThan(0);
      // Wat gegenereerd wordt moet ook door de eigen sanitatie komen (round-trip).
      expect(sanitizeRequestId(id)).toBe(id);
    });

    it("is uniek over meerdere aanroepen", () => {
      const ids = new Set(Array.from({ length: 50 }, () => generateRequestId()));
      expect(ids.size).toBe(50);
    });
  });

  describe("resolveRequestId", () => {
    it("neemt een geldige upstream-waarde over", () => {
      expect(resolveRequestId("upstream-trace-42")).toBe("upstream-trace-42");
    });

    it("saneert een rommelige upstream-waarde", () => {
      expect(resolveRequestId("trace 42\n")).toBe("trace42");
    });

    it("genereert een nieuwe ID als er geen (geldige) upstream-waarde is", () => {
      const generated = resolveRequestId(null);
      expect(generated.length).toBeGreaterThan(0);
      expect(resolveRequestId("<<<")).not.toBe("");
    });
  });

  describe("shortRequestId", () => {
    it("neemt het eerste segment van een UUID", () => {
      expect(shortRequestId("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe("3f2504e0");
    });

    it("kapt af tot 8 tekens als er geen segment is", () => {
      expect(shortRequestId("abcdefghijklmnop")).toBe("abcdefgh");
    });
  });
});
