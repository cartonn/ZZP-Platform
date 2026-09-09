import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

// Drift-bewaking op .github/dependabot.yml — houdt de supply-chain-automatisering intact:
// beide ecosystemen aanwezig, wekelijks gepland, gegroepeerd en met een begrensde PR-flux.
// Dependabot draait niet in CI, dus zonder deze test kan de config stil verweken (een
// verwijderd ecosysteem, een verdwenen groepering) zonder dat een poort dat opmerkt.

type Schedule = {
  interval?: string;
  day?: string;
  time?: string;
  timezone?: string;
};

type Update = {
  "package-ecosystem"?: string;
  directory?: string;
  schedule?: Schedule;
  "open-pull-requests-limit"?: number;
  groups?: Record<string, unknown>;
  "commit-message"?: { prefix?: string };
  labels?: string[];
};

type DependabotDoc = {
  version?: number;
  updates?: Update[];
};

const configPath = fileURLToPath(new URL("../.github/dependabot.yml", import.meta.url));
const doc = parse(readFileSync(configPath, "utf8")) as DependabotDoc;

function ecosystem(name: string): Update {
  const found = (doc.updates ?? []).find((u) => u["package-ecosystem"] === name);
  expect(found, `ecosysteem "${name}" ontbreekt in dependabot.yml`).toBeDefined();
  return found as Update;
}

describe("dependabot.yml", () => {
  it("gebruikt configuratieversie 2", () => {
    expect(doc.version).toBe(2);
  });

  it("dekt zowel npm als github-actions", () => {
    const ecosystems = (doc.updates ?? []).map((u) => u["package-ecosystem"]);
    expect(ecosystems).toContain("npm");
    expect(ecosystems).toContain("github-actions");
  });

  it("plant elke update wekelijks in de Europe/Amsterdam-tijdzone", () => {
    for (const update of doc.updates ?? []) {
      expect(update.schedule?.interval).toBe("weekly");
      expect(update.schedule?.timezone).toBe("Europe/Amsterdam");
    }
  });

  it("begrenst de gelijktijdige versie-PR's per ecosysteem", () => {
    for (const update of doc.updates ?? []) {
      const limit = update["open-pull-requests-limit"];
      expect(typeof limit).toBe("number");
      expect(limit as number).toBeGreaterThan(0);
    }
  });

  it("groepeert npm-updates in productie- en dev-buckets", () => {
    const npm = ecosystem("npm");
    const groups = npm.groups ?? {};
    expect(Object.keys(groups)).toContain("production-dependencies");
    expect(Object.keys(groups)).toContain("development-dependencies");
  });

  it("groepeert de github-actions-updates", () => {
    const actions = ecosystem("github-actions");
    expect(Object.keys(actions.groups ?? {}).length).toBeGreaterThan(0);
  });

  it("scant de repository-root", () => {
    for (const update of doc.updates ?? []) {
      expect(update.directory).toBe("/");
    }
  });
});
