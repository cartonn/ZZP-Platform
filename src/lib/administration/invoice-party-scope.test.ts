import { describe, expect, it } from "vitest";
import {
  clientReceivedInvoiceWhere,
  freelancerIssuedInvoiceWhere,
  isClientReceivedInvoice,
  isFreelancerIssuedInvoice,
} from "./invoice-party-scope";

describe("freelancerIssuedInvoiceWhere", () => {
  it("matcht cascade-facturen op issuerUserId én legacy-facturen via de samenwerking", () => {
    expect(freelancerIssuedInvoiceWhere("u1")).toEqual({
      OR: [
        { issuerUserId: "u1" },
        { issuerKey: null, collaboration: { is: { freelancer: { is: { userId: "u1" } } } } },
      ],
    });
  });
});

describe("clientReceivedInvoiceWhere", () => {
  it("matcht cascade-facturen op counterpartyUserId én legacy-facturen via de samenwerking", () => {
    expect(clientReceivedInvoiceWhere("c1")).toEqual({
      OR: [
        { counterpartyUserId: "c1" },
        { issuerKey: null, collaboration: { is: { company: { is: { userId: "c1" } } } } },
      ],
    });
  });
});

describe("isFreelancerIssuedInvoice", () => {
  it("telt een cascade-factuur van de ZZP'er mee (issuerUserId-match)", () => {
    expect(
      isFreelancerIssuedInvoice(
        { issuerUserId: "u1", issuerKey: "u1", collaborationFreelancerUserId: "u1" },
        "u1",
      ),
    ).toBe(true);
  });

  it("telt een legacy-factuur van de ZZP'er mee (geen issuerKey, samenwerkings-match)", () => {
    expect(
      isFreelancerIssuedInvoice(
        { issuerUserId: null, issuerKey: null, collaborationFreelancerUserId: "u1" },
        "u1",
      ),
    ).toBe(true);
  });

  it("telt een platform-fee NIET als eigen omzet (issuerKey PLATFORM sluit de legacy-tak uit)", () => {
    expect(
      isFreelancerIssuedInvoice(
        { issuerUserId: null, issuerKey: "PLATFORM", collaborationFreelancerUserId: "u1" },
        "u1",
      ),
    ).toBe(false);
  });

  it("telt de factuur van een andere ZZP'er niet mee", () => {
    expect(
      isFreelancerIssuedInvoice(
        { issuerUserId: "u2", issuerKey: null, collaborationFreelancerUserId: "u2" },
        "u1",
      ),
    ).toBe(false);
  });
});

describe("isClientReceivedInvoice", () => {
  it("telt een cascade-factuur voor de opdrachtgever mee (counterpartyUserId-match)", () => {
    expect(
      isClientReceivedInvoice(
        { counterpartyUserId: "c1", issuerKey: "u1", collaborationCompanyUserId: "c1" },
        "c1",
      ),
    ).toBe(true);
  });

  it("telt een legacy-factuur voor de opdrachtgever mee (geen issuerKey, samenwerkings-match)", () => {
    expect(
      isClientReceivedInvoice(
        { counterpartyUserId: null, issuerKey: null, collaborationCompanyUserId: "c1" },
        "c1",
      ),
    ).toBe(true);
  });

  it("telt een platform-fee NIET als eigen uitgave (issuerKey PLATFORM sluit de legacy-tak uit)", () => {
    expect(
      isClientReceivedInvoice(
        { counterpartyUserId: null, issuerKey: "PLATFORM", collaborationCompanyUserId: "c1" },
        "c1",
      ),
    ).toBe(false);
  });

  it("telt de uitgave van een andere opdrachtgever niet mee", () => {
    expect(
      isClientReceivedInvoice(
        { counterpartyUserId: "c2", issuerKey: null, collaborationCompanyUserId: "c2" },
        "c1",
      ),
    ).toBe(false);
  });
});
