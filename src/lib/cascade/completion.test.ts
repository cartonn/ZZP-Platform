import { describe, expect, it } from "vitest";
import {
  isInvoiceSettled,
  hasOpenCollaborationWork,
  completionBlockReason,
  collaborationCompletableGuard,
  SETTLED_INVOICE_LIFECYCLE,
  SETTLED_INVOICE_LEGACY_STATUS,
  type InvoiceStateSnapshot,
  type OpenWorkSnapshot,
} from "@/lib/cascade/completion";

// ─── isInvoiceSettled ────────────────────────────────────────────────────────

describe("isInvoiceSettled — cascade-facturen (lifecycleStatus gezet)", () => {
  it("PAID is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "PAID", status: "SUBMITTED" })).toBe(true);
  });
  it("PROCESSED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "PROCESSED", status: "SUBMITTED" })).toBe(true);
  });
  it("CREDITED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "CREDITED", status: "SUBMITTED" })).toBe(true);
  });
  it("DRAFT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "DRAFT", status: "DRAFT" })).toBe(false);
  });
  it("SUBMITTED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "SUBMITTED", status: "SUBMITTED" })).toBe(false);
  });
  it("APPROVED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "APPROVED", status: "APPROVED" })).toBe(false);
  });
  it("OVERDUE is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "OVERDUE", status: "OVERDUE" })).toBe(false);
  });
  it("REJECTED is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: "REJECTED", status: "REJECTED" })).toBe(false);
  });
});

describe("isInvoiceSettled — legacy-facturen (lifecycleStatus null)", () => {
  it("PAID is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "PAID" })).toBe(true);
  });
  it("CANCELLED is afgewikkeld", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "CANCELLED" })).toBe(true);
  });
  it("SENT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "SENT" })).toBe(false);
  });
  it("DRAFT is openstaand", () => {
    expect(isInvoiceSettled({ lifecycleStatus: null, status: "DRAFT" })).toBe(false);
  });
});

// ─── hasOpenCollaborationWork ────────────────────────────────────────────────

function snapshot(overrides: Partial<OpenWorkSnapshot> = {}): OpenWorkSnapshot {
  return { otherInvoices: [], submittedPerformances: 0, ...overrides };
}

function inv(status: string, lifecycleStatus: string | null = null): InvoiceStateSnapshot {
  return { lifecycleStatus, status };
}

describe("hasOpenCollaborationWork", () => {
  it("lege snapshot → geen openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot())).toBe(false);
  });

  it("één ingediende prestatie → openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot({ submittedPerformances: 1 }))).toBe(true);
  });

  it("meerdere ingediende prestaties → openstaand werk", () => {
    expect(hasOpenCollaborationWork(snapshot({ submittedPerformances: 3 }))).toBe(true);
  });

  it("één niet-afgewikkelde factuur (APPROVED) → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(snapshot({ otherInvoices: [inv("APPROVED", "APPROVED")] })),
    ).toBe(true);
  });

  it("alleen afgewikkelde facturen + 0 prestaties → geen openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID"), inv("SUBMITTED", "PROCESSED")],
          submittedPerformances: 0,
        }),
      ),
    ).toBe(false);
  });

  it("gemengd: één settled + één open factuur → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID"), inv("SUBMITTED", "SUBMITTED")],
        }),
      ),
    ).toBe(true);
  });

  it("legacy-factuur CANCELLED + 0 prestaties → geen openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({ otherInvoices: [inv("CANCELLED", null)], submittedPerformances: 0 }),
      ),
    ).toBe(false);
  });

  it("legacy-factuur SENT + 0 prestaties → openstaand werk", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({ otherInvoices: [inv("SENT", null)], submittedPerformances: 0 }),
      ),
    ).toBe(true);
  });

  it("prestaties én afgewikkelde facturen: prestaties geven de doorslag", () => {
    expect(
      hasOpenCollaborationWork(
        snapshot({
          otherInvoices: [inv("SUBMITTED", "PAID")],
          submittedPerformances: 1,
        }),
      ),
    ).toBe(true);
  });
});

// ─── completionBlockReason ───────────────────────────────────────────────────

describe("completionBlockReason", () => {
  it("geen open werk → null (afronden mag)", () => {
    expect(completionBlockReason(snapshot())).toBeNull();
  });

  it("alleen afgewikkelde facturen → null", () => {
    expect(
      completionBlockReason(snapshot({ otherInvoices: [inv("SUBMITTED", "PAID")] })),
    ).toBeNull();
  });

  it("één open factuur → enkelvoud-reden over geld", () => {
    expect(completionBlockReason(snapshot({ otherInvoices: [inv("APPROVED", "APPROVED")] }))).toBe(
      "Er staat nog 1 factuur open voor deze samenwerking. Markeer die als betaald of crediteer 'm eerst.",
    );
  });

  it("twee open facturen → meervoud-reden over geld", () => {
    expect(
      completionBlockReason(
        snapshot({ otherInvoices: [inv("APPROVED", "APPROVED"), inv("SENT", null)] }),
      ),
    ).toBe(
      "Er staan nog 2 facturen open voor deze samenwerking. Markeer die als betaald of crediteer ze eerst.",
    );
  });

  it("geld weegt zwaarder: open factuur + prestatie → reden over de factuur", () => {
    expect(
      completionBlockReason(
        snapshot({ otherInvoices: [inv("APPROVED", "APPROVED")], submittedPerformances: 2 }),
      ),
    ).toContain("factuur open");
  });

  it("één ingediende prestatie zonder open factuur → enkelvoud-reden over prestatie", () => {
    expect(completionBlockReason(snapshot({ submittedPerformances: 1 }))).toBe(
      "Er wacht nog 1 ingediende urenstaat of oplevering op goedkeuring. Beoordeel die eerst voordat je de samenwerking afrondt.",
    );
  });

  it("meerdere ingediende prestaties zonder open factuur → meervoud-reden", () => {
    expect(completionBlockReason(snapshot({ submittedPerformances: 3 }))).toBe(
      "Er wachten nog 3 ingediende urenstaten of opleveringen op goedkeuring. Beoordeel die eerst voordat je de samenwerking afrondt.",
    );
  });
});

// ─── collaborationCompletableGuard ────────────────────────────────────────────

describe("collaborationCompletableGuard — write-time eligibility guard (Event E race)", () => {
  it("weigert afronding zolang er een SUBMITTED-prestatie is (relationele none)", () => {
    const guard = collaborationCompletableGuard("inv-huidig");
    expect(guard.performances).toEqual({ none: { status: "SUBMITTED" } });
  });

  it("sluit de zojuist betaalde factuur uit én toetst op niet-afgewikkelde andere facturen", () => {
    const guard = collaborationCompletableGuard("inv-huidig") as {
      invoices: { none: { id: { not: string }; OR: unknown[] } };
    };
    expect(guard.invoices.none.id).toEqual({ not: "inv-huidig" });
    expect(guard.invoices.none.OR).toEqual([
      { lifecycleStatus: { notIn: [...SETTLED_INVOICE_LIFECYCLE] } },
      { lifecycleStatus: null, status: { notIn: [...SETTLED_INVOICE_LEGACY_STATUS] } },
    ]);
  });

  it("gebruikt dezelfde afgewikkeld-sets als isInvoiceSettled (één bron van waarheid)", () => {
    // De guard mag alleen niet-afgewikkelde facturen als 'open' tellen; de sets komen 1:1 uit
    // completion.ts, zodat guard en isInvoiceSettled nooit uit elkaar lopen.
    expect(SETTLED_INVOICE_LIFECYCLE).toEqual(["PAID", "PROCESSED", "CREDITED"]);
    expect(SETTLED_INVOICE_LEGACY_STATUS).toEqual(["PAID", "CANCELLED"]);
  });
});
