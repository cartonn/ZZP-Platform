// Regressietest (persona-sweep DOEL 2, robuustheid: "verboden/stale sessie → nette afhandeling,
// nooit een ongevangen crash"). Sluitstuk op de download-route-harding (#1067, export-auth-error.test.ts).
//
// Twee server-actions riepen requireActor() ONgevangen aan: diensten/importeer/actions.ts en
// prestaties/actions.ts. Een mid-sessie geschorst of geanonimiseerd account houdt een geldige JWT (de
// middleware laat door op de stale "ACTIVE"-claim), maar requireActor() leest vers uit de DB en werpt
// een AuthorizationError (401/403). Bij een server-action is de faalmodus geen HTTP-500 maar een
// ongevangen throw die de client-error-boundary (volledige crash-pagina) triggert i.p.v. een nette
// inline-melding in het formulier. Deze test faalt (throw i.p.v. een net resultaat) zonder de guard en
// bewaakt de parity met de sibling-routes/-commando's.

import { describe, it, expect, vi } from "vitest";
import { AuthorizationError } from "@/lib/authz";

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireActor: vi.fn(async () => {
      throw new AuthorizationError("Account is niet actief.", 403);
    }),
  };
});

// De data-/cascade-afhankelijkheden worden nooit bereikt (requireActor werpt ervóór), maar de
// action-modules importeren ze op module-load — mock ze weg zodat de import geen neveneffect heeft.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/cascade/commands", () => ({
  createPerformance: vi.fn(),
  submitPerformance: vi.fn(),
  approvePerformance: vi.fn(),
}));
vi.mock("@/lib/diensten", () => ({ parseCsvShifts: vi.fn() }));
vi.mock("@/lib/shift", () => ({ segmentShifts: vi.fn(), dutchHolidays: vi.fn() }));
vi.mock("@/lib/ort", () => ({ resolveOrtRates: vi.fn() }));

import { importDienstenAction } from "./diensten/importeer/actions";
import { approveSubmittedPerformancesAction } from "./prestaties/actions";

describe("Server-actions — AuthorizationError geeft een net resultaat, geen ongevangen throw", () => {
  it("importDienstenAction vangt de 403 af tot een net ImportResult", async () => {
    const res = await importDienstenAction(null, new FormData());
    expect(res).toEqual({ imported: 0, skipped: 0, errors: ["Account is niet actief."] });
  });

  it("approveSubmittedPerformancesAction vangt de 403 af tot een net BulkApproveResult", async () => {
    const res = await approveSubmittedPerformancesAction("col-1");
    expect(res).toEqual({ approved: 0, failed: 0, error: "Account is niet actief." });
  });
});
