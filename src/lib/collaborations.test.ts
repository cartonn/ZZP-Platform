import { describe, expect, it } from "vitest";
import {
  assertCollaborationTransition,
  canTransitionCollaboration,
  CollaborationTransitionError,
} from "@/lib/collaborations";

describe("samenwerking-statusovergangen", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransitionCollaboration("PROPOSED", "ACTIVE")).toBe(true);
    expect(canTransitionCollaboration("PROPOSED", "CANCELLED")).toBe(true);
    expect(canTransitionCollaboration("ACTIVE", "COMPLETED")).toBe(true);
    expect(canTransitionCollaboration("ACTIVE", "CANCELLED")).toBe(true);
  });

  it("weigert ongeldige en terminale overgangen", () => {
    expect(canTransitionCollaboration("PROPOSED", "COMPLETED")).toBe(false);
    expect(canTransitionCollaboration("COMPLETED", "ACTIVE")).toBe(false);
    expect(canTransitionCollaboration("CANCELLED", "ACTIVE")).toBe(false);
    expect(() => assertCollaborationTransition("COMPLETED", "ACTIVE")).toThrow(
      CollaborationTransitionError,
    );
  });
});
