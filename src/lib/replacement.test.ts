import { describe, it, expect } from "vitest";
import { planReplacement } from "@/lib/replacement";

describe("planReplacement", () => {
  // --- Uitval: ACTIVE → CANCELLED ---

  describe("ACTIVE → CANCELLED (uitval)", () => {
    it("jobStatus CLOSED → heropent de dienst en signaleert de opdrachtgever", () => {
      expect(planReplacement({ from: "ACTIVE", to: "CANCELLED", jobStatus: "CLOSED" })).toEqual({
        reopenJob: true,
        targetJobStatus: "PUBLISHED",
        signal: true,
      });
    });

    it("jobStatus PUBLISHED → alleen signaleren, dienst al open", () => {
      expect(planReplacement({ from: "ACTIVE", to: "CANCELLED", jobStatus: "PUBLISHED" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: true,
      });
    });

    it("jobStatus DRAFT → geen actie (opdrachtgever heeft bewust gedepubliceerd)", () => {
      expect(planReplacement({ from: "ACTIVE", to: "CANCELLED", jobStatus: "DRAFT" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: false,
      });
    });
  });

  // --- Niet-uitval: andere overgangen → altijd leeg plan ---

  describe("niet-uitval overgangen", () => {
    it("PROPOSED → CANCELLED met jobStatus CLOSED → geen actie", () => {
      expect(planReplacement({ from: "PROPOSED", to: "CANCELLED", jobStatus: "CLOSED" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: false,
      });
    });

    it("PROPOSED → CANCELLED met jobStatus PUBLISHED → geen actie", () => {
      expect(
        planReplacement({ from: "PROPOSED", to: "CANCELLED", jobStatus: "PUBLISHED" }),
      ).toEqual({ reopenJob: false, targetJobStatus: null, signal: false });
    });

    it("PROPOSED → CANCELLED met jobStatus DRAFT → geen actie", () => {
      expect(planReplacement({ from: "PROPOSED", to: "CANCELLED", jobStatus: "DRAFT" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: false,
      });
    });

    it("ACTIVE → COMPLETED → geen actie", () => {
      expect(planReplacement({ from: "ACTIVE", to: "COMPLETED", jobStatus: "CLOSED" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: false,
      });
    });

    it("PROPOSED → ACTIVE → geen actie", () => {
      expect(planReplacement({ from: "PROPOSED", to: "ACTIVE", jobStatus: "PUBLISHED" })).toEqual({
        reopenJob: false,
        targetJobStatus: null,
        signal: false,
      });
    });
  });
});
