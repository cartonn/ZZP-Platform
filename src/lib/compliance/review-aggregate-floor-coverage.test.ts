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

import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";
import { freelancerReputationFromReviews } from "@/lib/freelancer-reputation";
import { companyReputationFromReviews } from "@/lib/company-reputation";
import { groupCandidateRatings } from "@/lib/candidate-reviews";

const LIB_DIR = join(process.cwd(), "src", "lib");

/**
 * Scan `root` RECURSIEF naar elk (niet-test) `.ts`-bestand dat `aggregateReviews` gebruikt maar
 * `REVIEW_AGGREGATE_MIN_SAMPLE` niet noemt. Retourneert de overtreders als pad relatief aan `root`
 * (POSIX-scheiders, stabiel over platforms). Recursie is essentieel: `src/lib` heeft ~27 submappen
 * (`data/`, `franchise/`, `compliance/`, …) waarin een nieuwe aggregatie-consument organisch landt;
 * een niet-recursieve scan zou de vloer-poort stil laten falen voor precies die bestanden.
 */
function findFloorlessAggregateConsumers(root: string, exempt: ReadonlySet<string>): string[] {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts"))
        continue;
      const rel = relative(root, abs).split(sep).join("/");
      if (exempt.has(rel)) continue;
      const src = readFileSync(abs, "utf8");
      if (!src.includes("aggregateReviews")) continue;
      if (!src.includes("REVIEW_AGGREGATE_MIN_SAMPLE")) offenders.push(rel);
    }
  };
  walk(root);
  return offenders.sort();
}

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

  it("elke consument van aggregateReviews past REVIEW_AGGREGATE_MIN_SAMPLE toe (vangt een 4e call-site, óók in submappen)", () => {
    // Statische coverage-poort: scan src/lib RECURSIEF voor elk (niet-test) bestand dat
    // `aggregateReviews` gebruikt, en eis dat het óók REVIEW_AGGREGATE_MIN_SAMPLE noemt. Zo kan een
    // toekomstige nieuwe aggregatie-consument de vloer niet stil weglaten (build faalt i.p.v. een
    // privacylek) — ongeacht of hij direct in `src/lib` of in een submap (`data/`, `franchise/`, …)
    // landt. `reviews.ts` definieert de helper zelf en is bewust uitgezonderd.
    const EXEMPT = new Set(["reviews.ts"]);
    const offenders = findFloorlessAggregateConsumers(LIB_DIR, EXEMPT);

    expect(
      offenders,
      `Deze aggregateReviews-consumenten passen de k-anonimiteitsvloer niet toe: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  // Regressie voor het auditgat (8-9-2026): de eerdere scan gebruikte `readdirSync` zonder recursie
  // en dekte dus alleen bestanden DIRECT in `src/lib` — precies de submappen (`data/`, `franchise/`,
  // …) waar een nieuwe aggregatie-consument thuishoort vielen buiten de poort, terwijl de test-naam
  // een volledige garantie claimde (AVG art. 5(2) verantwoordingsplicht). Deze test pint dat de
  // scanner een overtreder in een SUBMAP daadwerkelijk detecteert (en een correcte consument niet).
  describe("de coverage-scan is recursief (dekt submappen)", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "agg-floor-cov-"));
    afterAll(() => rmSync(fixtureRoot, { recursive: true, force: true }));

    it("flagt een floorless consument in een submap", () => {
      const subdir = join(fixtureRoot, "franchise");
      mkdirSync(subdir, { recursive: true });
      writeFileSync(
        join(subdir, "team-reputation.ts"),
        "import { aggregateReviews } from '@/lib/reviews';\nexport const x = aggregateReviews([]);\n",
      );
      expect(findFloorlessAggregateConsumers(fixtureRoot, new Set())).toEqual([
        "franchise/team-reputation.ts",
      ]);
    });

    it("flagt een submap-consument NIET als hij de vloer toepast", () => {
      const subdir = join(fixtureRoot, "data");
      mkdirSync(subdir, { recursive: true });
      writeFileSync(
        join(subdir, "ok-reputation.ts"),
        "import { aggregateReviews } from '@/lib/reviews';\nimport { REVIEW_AGGREGATE_MIN_SAMPLE } from '@/lib/config';\nexport const x = REVIEW_AGGREGATE_MIN_SAMPLE;\nexport const y = aggregateReviews([]);\n",
      );
      expect(findFloorlessAggregateConsumers(subdir, new Set())).toEqual([]);
    });
  });
});
