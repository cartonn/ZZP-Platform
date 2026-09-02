// Tests voor de facturatie-gereedheid-loader. Borgt (1) dat een ZZP'er zonder uitgeschreven facturen
// geen valse melding krijgt, (2) dat een btw-heffende factuur het btw-id afdwingt, (3) dat een
// btw-verlegd (REVERSE_CHARGE) regime nog steeds als heffend telt, (4) dat uitsluitend vrijgestelde
// (EXEMPT) facturen géén btw-eis geven, (5) dat een leeg/legacy regime niet als heffend telt,
// (6) dat één heffende factuur tussen vrijgestelde het btw-gat triggert, en (7/8) de gelukkige
// route + de eigenaar-gescopete query-vorm.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma: { invoice: { findMany: vi.fn() } } }));

import { prisma } from "@/lib/db";
import { getBillingReadiness } from "./freelancer-billing-readiness";

const findMany = prisma.invoice.findMany as unknown as Mock;

beforeEach(() => vi.clearAllMocks());

describe("getBillingReadiness", () => {
  it("geeft geen melding wanneer er nog geen facturen zijn uitgeschreven", async () => {
    findMany.mockResolvedValue([]);

    const result = await getBillingReadiness({ userId: "u1", btwNumber: null, iban: null });

    expect(result.ready).toBe(true);
    expect(result.gaps).toEqual([]);
  });

  it("meldt zowel het btw-id als de IBAN bij een btw-heffende factuur zonder beide", async () => {
    findMany.mockResolvedValue([{ vatRegime: "STANDARD_HIGH" }]);

    const result = await getBillingReadiness({ userId: "u1", btwNumber: null, iban: null });

    expect(result.ready).toBe(false);
    const keys = result.gaps.map((g) => g.key);
    expect(keys).toContain("btw");
    expect(keys).toContain("iban");
  });

  it("telt een btw-verlegd (REVERSE_CHARGE) regime als heffend en eist het btw-id", async () => {
    findMany.mockResolvedValue([{ vatRegime: "REVERSE_CHARGE" }]);

    const result = await getBillingReadiness({
      userId: "u1",
      btwNumber: null,
      iban: "NL91ABNA0417164300",
    });

    const keys = result.gaps.map((g) => g.key);
    expect(keys).toContain("btw");
    expect(keys).not.toContain("iban");
  });

  it("eist geen btw-id bij uitsluitend vrijgestelde (EXEMPT) facturen", async () => {
    findMany.mockResolvedValue([{ vatRegime: "EXEMPT" }]);

    const result = await getBillingReadiness({ userId: "u1", btwNumber: null, iban: null });

    const keys = result.gaps.map((g) => g.key);
    expect(keys).not.toContain("btw");
    expect(keys).toContain("iban");
  });

  it("behandelt een leeg/legacy regime niet als heffend", async () => {
    findMany.mockResolvedValue([{ vatRegime: null }]);

    const result = await getBillingReadiness({
      userId: "u1",
      btwNumber: null,
      iban: "NL91ABNA0417164300",
    });

    expect(result.gaps.map((g) => g.key)).not.toContain("btw");
    expect(result.ready).toBe(true);
  });

  it("triggert het btw-gat zodra één van de gemengde regimes heffend is", async () => {
    findMany.mockResolvedValue([{ vatRegime: "EXEMPT" }, { vatRegime: "STANDARD_LOW" }]);

    const result = await getBillingReadiness({
      userId: "u1",
      btwNumber: null,
      iban: "NL91ABNA0417164300",
    });

    expect(result.gaps.map((g) => g.key)).toContain("btw");
  });

  it("is gereed wanneer btw-id en IBAN aanwezig zijn bij een heffende factuur", async () => {
    findMany.mockResolvedValue([{ vatRegime: "STANDARD_HIGH" }]);

    const result = await getBillingReadiness({
      userId: "u1",
      btwNumber: "NL001234567B01",
      iban: "NL91ABNA0417164300",
    });

    expect(result.ready).toBe(true);
    expect(result.gaps).toEqual([]);
  });

  it("scoopt de facturen via zowel de kolom als de altijd-gevulde samenwerkingsrelatie", async () => {
    // Regressie: een legacy loose-factuur (issuerUserId NULL — nooit door de cascade-handler gezet —
    // maar de samenwerking is wél van deze ZZP'er) mag niet uit de scope vallen; anders blijft de
    // art. 35a-melding onterecht weg. Scoping via `collaboration.freelancer.userId` naast de kolom,
    // zelfde patroon als freelancer-stats.ts. De query is bovendien deterministisch begrensd (orderBy).
    findMany.mockResolvedValue([]);

    await getBillingReadiness({ userId: "u1", btwNumber: null, iban: null });

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          issuedAt: { not: null },
          OR: [{ issuerUserId: "u1" }, { collaboration: { freelancer: { userId: "u1" } } }],
        }),
        orderBy: { issuedAt: "desc" },
      }),
    );
  });

  it("triggert het btw-gat op een legacy loose-factuur (issuerUserId null, samenwerking van de ZZP'er)", async () => {
    // De findMany-mock representeert de rijen die de OR-scope oplevert; met de oude kolom-only scope
    // zou deze legacy loose-factuur niet zijn teruggekomen en bleef de melding onterecht weg.
    findMany.mockResolvedValue([{ vatRegime: "STANDARD_HIGH" }]);

    const result = await getBillingReadiness({ userId: "u1", btwNumber: null, iban: null });

    expect(result.ready).toBe(false);
    expect(result.gaps.map((g) => g.key)).toContain("btw");
  });
});
