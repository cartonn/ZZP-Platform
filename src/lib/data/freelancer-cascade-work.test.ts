// Regressietests voor de gedeelde FREELANCER cascade-"aan zet"-telling (persona-sweep run 82).
//
// Defect (HIGH, DOEL 1b — "signaal op één oppervlak"): de `/samenwerkingen`-nav-badge las de cascade-
// taken uit één gecombineerde `collaboration.findMany({ orderBy: { updatedAt: "desc" }, take: 50 })`,
// terwijl /acties (pending-tasks.ts `freelancerTasks`) al aparte, status-gefilterde, `createdAt asc`-
// queries per taaksoort draaide. `Collaboration.updatedAt` bumpt niet bij een prestatie indienen of een
// factuur (goed)keuren, dus voor een ACTIVE-samenwerking stond het venster bevroren op het teken-moment:
// bij >50 gelijktijdige PROPOSED+ACTIVE-samenwerkingen viel een ouder-getekende met openstaand geld-/
// prestatiewerk buiten `updatedAt desc, take: 50` en verdween de actie PERMANENT uit de badge (niet
// self-healing), terwijl /acties + de dashboard-rail 'm wél toonden. Twee inner-caps verergerden het:
// `invoices: { take: 5 }` zónder orderBy (ondertelling + flicker) en de prestatie-fase uit alléén de
// meest-recente prestatie (miste een oudere REJECTED onder een nieuwere). Deze telling spiegelt exact de
// vier /acties-emitters en heelt alle drie.

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@prisma/client";

type CollabFindManyArgs = {
  where?: { status?: unknown };
  orderBy?: unknown;
  take?: number;
  select?: { invoices?: unknown; performances?: unknown };
};

let proposedRows: Array<{ job: { credentialRequirements: { credentialType: string }[] } }> = [];
let submitRows: Array<{ performances: { status: string }[] }> = [];
let rejectedPerfCount = 0;
let openInvoiceCount = 0;
let credRows: Array<{ type: string; status: string; expiresAt: Date | null }> = [];
let collabFindManyCalls: CollabFindManyArgs[] = [];
let perfCountArgs: unknown = null;
let invoiceCountArgs: unknown = null;

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findMany: vi.fn(async (args: CollabFindManyArgs) => {
        collabFindManyCalls.push(args);
        // De helper draait twee collaboration.findMany's: de PROPOSED-teken-query en de ACTIVE-indien-
        // query. Route op de where.status die de gedeelde WHERE-builder zet.
        return args.where?.status === "PROPOSED" ? proposedRows : submitRows;
      }),
    },
    performance: {
      count: vi.fn(async (args: unknown) => {
        perfCountArgs = args;
        return rejectedPerfCount;
      }),
    },
    invoice: {
      count: vi.fn(async (args: unknown) => {
        invoiceCountArgs = args;
        return openInvoiceCount;
      }),
    },
    credential: {
      findMany: vi.fn(async () => credRows),
    },
  },
}));

import {
  FREELANCER_CASCADE_SCAN_LIMIT,
  credentialCollabWhere,
  getFreelancerCascadeWorkCount,
  openInvoiceWhere,
  proposedCollabWhere,
  rejectedPerfWhere,
  submitCollabWhere,
} from "./freelancer-cascade-work";

const NOW = new Date("2026-08-18T12:00:00.000Z");

beforeEach(() => {
  proposedRows = [];
  submitRows = [];
  rejectedPerfCount = 0;
  openInvoiceCount = 0;
  credRows = [];
  collabFindManyCalls = [];
  perfCountArgs = null;
  invoiceCountArgs = null;
});

describe("getFreelancerCascadeWorkCount — self-healing, badge↔/acties-pariteit", () => {
  it("telt 0 zonder cascade-werk", async () => {
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(0);
  });

  it("draait GEEN query met orderBy updatedAt desc en GEEN facturen-inner-cap (de gerepareerde bug)", async () => {
    await getFreelancerCascadeWorkCount("u-1", NOW);
    for (const call of collabFindManyCalls) {
      expect(JSON.stringify(call.orderBy)).not.toContain("updatedAt");
      expect(call.orderBy).toEqual({ createdAt: "asc" });
      // De oude badge las per samenwerking de openstaande facturen via een `invoices: { take: 5 }`-
      // sub-select zónder orderBy → niet-deterministische ondertelling. De nieuwe telling gebruikt een
      // aparte, ongewindowde `invoice.count`, dus geen enkele collab-query mag nog facturen sub-selecten.
      expect(call.select?.invoices).toBeUndefined();
    }
  });

  it("telt een niet-geblokkeerde PROPOSED als 1 (contract ondertekenen), een geblokkeerde als 0", async () => {
    proposedRows = [{ job: { credentialRequirements: [] } }];
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(1);

    // Vereist certificaat dat de ZZP'er niet heeft → plaatsing geblokkeerd → /acties onderdrukt de
    // teken-taak → de badge telt 'm ook niet (badge↔lijst-pariteit).
    proposedRows = [{ job: { credentialRequirements: [{ credentialType: "VOG" }] } }];
    credRows = [];
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(0);
  });

  it("telt een ACTIVE zonder/DRAFT-prestatie als indien-taak, maar SUBMITTED/APPROVED niet", async () => {
    submitRows = [{ performances: [] }];
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(1);

    submitRows = [{ performances: [{ status: "DRAFT" }] }];
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(1);

    // Meest recente prestatie SUBMITTED/APPROVED → opdrachtgever is aan zet, geen ZZP-taak.
    submitRows = [{ performances: [{ status: "SUBMITTED" }] }];
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(0);
  });

  it("telt ELKE afgekeurde prestatie en ELKE openstaande factuur apart (niet één-per-samenwerking)", async () => {
    // Kern van de outer-window-fix: prestatie- en factuurwerk tellen per rij via aparte, ongewindowde
    // counts — onafhankelijk van welke samenwerkingen in enig venster vallen. 3 afgekeurde prestaties +
    // 2 openstaande facturen + 1 teken + 1 indien = 7.
    proposedRows = [{ job: { credentialRequirements: [] } }];
    submitRows = [{ performances: [{ status: "DRAFT" }] }];
    rejectedPerfCount = 3;
    openInvoiceCount = 2;
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(7);
  });

  it("capt prestatie-/factuurtellingen op de /acties-take (geen over-telling t.o.v. de lijst)", async () => {
    // /acties toont per taaksoort ten hoogste `MAX` (=50) taken; de badge mag niet méér tellen.
    openInvoiceCount = 80;
    rejectedPerfCount = 60;
    expect(await getFreelancerCascadeWorkCount("u-1", NOW)).toBe(FREELANCER_CASCADE_SCAN_LIMIT * 2);
  });

  it("scoopt de prestatie-/factuurtellingen op de eigenaar + status (WHERE-builders)", async () => {
    await getFreelancerCascadeWorkCount("u-42", NOW);
    expect(perfCountArgs).toEqual({ where: rejectedPerfWhere("u-42") });
    expect(invoiceCountArgs).toEqual({ where: openInvoiceWhere("u-42") });
  });
});

describe("gedeelde WHERE-builders — één bron van waarheid voor /acties én de badge", () => {
  it("proposedCollabWhere: PROPOSED, niet-bevroren, eigenaar-gescoopt", () => {
    expect(proposedCollabWhere("u-1")).toEqual({
      freelancer: { userId: "u-1" },
      status: "PROPOSED",
      disputedAt: null,
    });
  });

  it("submitCollabWhere: ACTIVE zonder/DRAFT-prestatie", () => {
    const where = submitCollabWhere("u-1") as Prisma.CollaborationWhereInput & { OR: unknown[] };
    expect(where.status).toBe("ACTIVE");
    expect(where.disputedAt).toBeNull();
    expect(where.OR).toEqual([
      { performances: { none: {} } },
      { performances: { some: { status: "DRAFT" } } },
    ]);
  });

  it("rejectedPerfWhere: REJECTED-prestatie op een ACTIVE, niet-bevroren samenwerking", () => {
    expect(rejectedPerfWhere("u-1")).toEqual({
      status: "REJECTED",
      collaboration: { freelancer: { userId: "u-1" }, status: "ACTIVE", disputedAt: null },
    });
  });

  it("openInvoiceWhere: openstaande cascade-factuur op een ACTIVE, niet-bevroren samenwerking", () => {
    expect(openInvoiceWhere("u-1")).toEqual({
      lifecycleStatus: { in: ["DRAFT", "REJECTED", "APPROVED", "OVERDUE"] },
      collaboration: { freelancer: { userId: "u-1" }, status: "ACTIVE", disputedAt: null },
    });
  });

  it("credentialCollabWhere: PROPOSED/ACTIVE met een verplicht certificaat-vereiste", () => {
    expect(credentialCollabWhere("u-1")).toEqual({
      freelancer: { userId: "u-1" },
      status: { in: ["PROPOSED", "ACTIVE"] },
      disputedAt: null,
      job: { credentialRequirements: { some: { required: true } } },
    });
  });
});
