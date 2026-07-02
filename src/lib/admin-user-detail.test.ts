import { describe, expect, it } from "vitest";
import { userDossierAuditWhere } from "@/lib/admin-user-detail";

describe("userDossierAuditWhere", () => {
  it("scoopt op auditregels die de gebruiker schreef (actor) én die de gebruiker betreffen (subject)", () => {
    const where = userDossierAuditWhere("u1");
    expect(where).toEqual({
      OR: [{ actorId: "u1" }, { entityType: "User", entityId: "u1" }],
    });
  });

  it("gebruikt de meegegeven userId in beide takken", () => {
    const where = userDossierAuditWhere("abc");
    expect(where.OR[0]).toEqual({ actorId: "abc" });
    expect(where.OR[1]).toEqual({ entityType: "User", entityId: "abc" });
  });
});
