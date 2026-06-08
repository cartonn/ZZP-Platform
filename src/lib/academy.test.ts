import { describe, expect, it } from "vitest";
import {
  canCourseTransition,
  courseProgress,
  visibleAudiencesForRole,
  slugify,
} from "@/lib/academy";

describe("canCourseTransition", () => {
  it("staat publiceren toe (DRAFT→PUBLISHED) en archiveren (PUBLISHED→ARCHIVED)", () => {
    expect(canCourseTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canCourseTransition("PUBLISHED", "ARCHIVED")).toBe(true);
  });
  it("staat geen sprong van concept naar gearchiveerd toe", () => {
    expect(canCourseTransition("DRAFT", "ARCHIVED")).toBe(false);
  });
  it("staat heractiveren van een gearchiveerde cursus toe", () => {
    expect(canCourseTransition("ARCHIVED", "PUBLISHED")).toBe(true);
  });
});

describe("courseProgress", () => {
  it("berekent een afgerond percentage", () => {
    expect(courseProgress(1, 4)).toEqual({ done: 1, total: 4, pct: 25, completed: false });
  });
  it("is voltooid als alle lessen af zijn", () => {
    expect(courseProgress(3, 3)).toEqual({ done: 3, total: 3, pct: 100, completed: true });
  });
  it("deelt niet door nul bij een lege cursus", () => {
    expect(courseProgress(0, 0)).toEqual({ done: 0, total: 0, pct: 0, completed: false });
  });
});

describe("visibleAudiencesForRole", () => {
  it("een ZZP'er ziet algemene + ZZP-cursussen, niet de opdrachtgever-as", () => {
    expect(visibleAudiencesForRole("FREELANCER")).toEqual(["ALL", "FREELANCER"]);
  });
  it("een opdrachtgever ziet algemene + opdrachtgever-cursussen", () => {
    expect(visibleAudiencesForRole("CLIENT")).toEqual(["ALL", "CLIENT"]);
  });
  it("een beheerder ziet alle doelgroepen", () => {
    expect(visibleAudiencesForRole("ADMIN")).toEqual(["ALL", "FREELANCER", "CLIENT"]);
  });
});

describe("slugify", () => {
  it("maakt een URL-veilige slug van een titel", () => {
    expect(slugify("Goed van start als ZZP'er")).toBe("goed-van-start-als-zzp-er");
  });
  it("verwijdert accenten en trimt streepjes", () => {
    expect(slugify("  Privacy & Béscherming!  ")).toBe("privacy-bescherming");
  });
  it("valt terug op 'cursus' als er niets bruikbaars is", () => {
    expect(slugify("!!!")).toBe("cursus");
  });
});
