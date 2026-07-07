import { describe, it, expect } from "vitest";
import {
  isLivecheckTitle,
  isSweepableLivecheck,
  LIVECHECK_MIN_AGE_MS,
  type LivecheckCandidate,
} from "./livecheck-sweep";

const NOW = new Date("2026-07-07T12:00:00.000Z");
const OLD = new Date(NOW.getTime() - LIVECHECK_MIN_AGE_MS - 1);
const FRESH = new Date(NOW.getTime() - 60_000);

const base: LivecheckCandidate = {
  title: "Livecheck publiceren 1781209076945",
  status: "DRAFT",
  createdAt: OLD,
  applicationCount: 0,
  collaborationCount: 0,
};

describe("isLivecheckTitle", () => {
  it("matcht het routine-artefactpatroon (woord + timestamp)", () => {
    expect(isLivecheckTitle("Livecheck publiceren 1781209076945")).toBe(true);
    expect(isLivecheckTitle("  Livecheck publiceren 1781209076945  ")).toBe(true);
  });

  it("matcht geen echte opdrachten die toevallig 'livecheck' bevatten", () => {
    expect(isLivecheckTitle("Verpleegkundige (somatiek)")).toBe(false);
    expect(isLivecheckTitle("Livecheck van de installatie")).toBe(false); // geen timestamp
    expect(isLivecheckTitle("Onze livecheck-monteur 1781209076945")).toBe(false); // niet aan het begin
    expect(isLivecheckTitle("Livecheck 123")).toBe(false); // te korte 'timestamp'
  });
});

describe("isSweepableLivecheck (guard)", () => {
  it("ruimt een oud DRAFT-livecheck-artefact zonder relaties", () => {
    expect(isSweepableLivecheck(base, NOW)).toBe(true);
    expect(isSweepableLivecheck({ ...base, status: "CLOSED" }, NOW)).toBe(true);
  });

  it("raakt nooit echte data: verkeerde titel, status, verse leeftijd of aanwezige relaties", () => {
    // niet-livecheck-titel
    expect(isSweepableLivecheck({ ...base, title: "Data Engineer" }, NOW)).toBe(false);
    // gepubliceerd (geen DRAFT/CLOSED)
    expect(isSweepableLivecheck({ ...base, status: "PUBLISHED" }, NOW)).toBe(false);
    // te vers (lopende run met rust laten)
    expect(isSweepableLivecheck({ ...base, createdAt: FRESH }, NOW)).toBe(false);
    // heeft reacties
    expect(isSweepableLivecheck({ ...base, applicationCount: 1 }, NOW)).toBe(false);
    // heeft samenwerkingen
    expect(isSweepableLivecheck({ ...base, collaborationCount: 1 }, NOW)).toBe(false);
  });
});
