// Afdwing-poort voor de k-anonimiteitsvloer op beoordelingsaggregaten (AVG art. 5(1)(f)/25 +
// art. 5(2) verantwoordingsplicht).
//
// PROBLEEM (security-/privacy-auditronde 8-9-2026): de vloer REVIEW_AGGREGATE_MIN_SAMPLE (=3) was
// correct toegepast in `freelancerReputationFromReviews` (publiek dossier), maar STIL WEGGELATEN in
// de twee spiegelfuncties die exact dezelfde `Review`-tabel aggregeren voor de tegenpartij:
// `companyReputationFromReviews` (opdracht-detailpagina, elke ZZP'er) en `groupCandidateRatings`
// (/kandidaten + kandidaat-ranking, elke opdrachtgever) — beide poortten enkel op `count > 0` en
// toonden zo een individueel herleidbaar cijfer bij n=1/n=2. De bestaande gate
// (`k-anonymity-floors.test.ts`) bewaakt alleen de WAARDE van de constante, niet of elke consument
// hem TOEPAST — dezelfde soort coverage-poort als `anonymize-schema-coverage.test.ts` voor erasure
// ontbrak hier. Deze test dicht dat gat op twee niveaus.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";
import { freelancerReputationFromReviews } from "@/lib/freelancer-reputation";
import { companyReputationFromReviews } from "@/lib/company-reputation";
import { groupCandidateRatings } from "@/lib/candidate-reviews";

const LIB_DIR = join(process.cwd(), "src", "lib");

/** Rijen die net ONDER de vloer zitten (allemaal geldige cijfers 1..5). */
function belowFloorRows(): { rating: number }[] {
  const n = Math.max(1, REVIEW_AGGREGATE_MIN_SAMPLE - 1);
  return Array.from({ length: n }, (_, i) => ({ rating: ((i % 5) + 1) as number }));
}

/** Rijen die precies OP de vloer zitten. */
function atFloorRows(): { rating: number }[] {
  return Array.from({ length: REVIEW_AGGREGATE_MIN_SAMPLE }, (_, i) => ({
    rating: ((i % 5) + 1) as number,
  }));
}

describe("k-anonimiteitsvloer op beoordelingsaggregaten — afdwing-poort", () => {
  it("alle spiegelfuncties verbergen een aggregaat ONDER de vloer (n < REVIEW_AGGREGATE_MIN_SAMPLE)", () => {
    const rows = belowFloorRows();
    expect(freelancerReputationFromReviews(rows)).toBeNull();
    expect(companyReputationFromReviews(rows)).toBeNull();

    const candidateMap = groupCandidateRatings(
      rows.map((r) => ({ subjectId: "u1", rating: r.rating })),
      ["u1"],
    );
    expect(candidateMap.has("u1")).toBe(false);
  });

  it("alle spiegelfuncties tonen een aggregaat OP de vloer (n === REVIEW_AGGREGATE_MIN_SAMPLE)", () => {
    const rows = atFloorRows();
    expect(freelancerReputationFromReviews(rows)).not.toBeNull();
    expect(companyReputationFromReviews(rows)).not.toBeNull();

    const candidateMap = groupCandidateRatings(
      rows.map((r) => ({ subjectId: "u1", rating: r.rating })),
      ["u1"],
    );
    expect(candidateMap.get("u1")).toMatchObject({ count: REVIEW_AGGREGATE_MIN_SAMPLE });
  });

  it("elke consument van aggregateReviews past REVIEW_AGGREGATE_MIN_SAMPLE toe (vangt een 4e call-site)", () => {
    // Statische coverage-poort: scan src/lib voor elk (niet-test) bestand dat `aggregateReviews`
    // gebruikt, en eis dat het óók REVIEW_AGGREGATE_MIN_SAMPLE noemt. Zo kan een toekomstige nieuwe
    // aggregatie-consument de vloer niet stil weglaten (build faalt i.p.v. een privacylek). `reviews.ts`
    // definieert de helper zelf en is bewust uitgezonderd.
    const EXEMPT = new Set(["reviews.ts"]);
    const offenders: string[] = [];

    const files = readdirSync(LIB_DIR, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith(".ts") && !d.name.endsWith(".test.ts"))
      .map((d) => d.name);

    for (const name of files) {
      if (EXEMPT.has(name)) continue;
      const src = readFileSync(join(LIB_DIR, name), "utf8");
      if (!src.includes("aggregateReviews")) continue;
      if (!src.includes("REVIEW_AGGREGATE_MIN_SAMPLE")) offenders.push(name);
    }

    expect(
      offenders,
      `Deze aggregateReviews-consumenten passen de k-anonimiteitsvloer niet toe: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
