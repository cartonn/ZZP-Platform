import { describe, expect, it } from "vitest";
import { generateTempPassword } from "@/lib/onboarding/password";

describe("generateTempPassword", () => {
  it("respecteert de minimumlengte van 12", () => {
    expect(generateTempPassword(8).length).toBe(12);
    expect(generateTempPassword(20).length).toBe(20);
    expect(generateTempPassword().length).toBe(14);
  });

  it("bevat altijd elke tekensoort", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTempPassword();
      expect(/[a-z]/.test(pw)).toBe(true);
      expect(/[A-Z]/.test(pw)).toBe(true);
      expect(/[0-9]/.test(pw)).toBe(true);
      expect(/[!@#$%&*]/.test(pw)).toBe(true);
    }
  });

  it("vermijdt verwarrende tekens (0 O 1 l I)", () => {
    for (let i = 0; i < 50; i++) {
      expect(/[0O1lI]/.test(generateTempPassword())).toBe(false);
    }
  });

  it("is met hoge waarschijnlijkheid uniek", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateTempPassword()));
    expect(set.size).toBe(100);
  });
});
