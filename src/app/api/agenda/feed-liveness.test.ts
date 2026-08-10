// Regressietest voor de liveness-poort op de publieke, abonneerbare agenda-feed
// (GET /api/agenda/feed.ics). Het feed-token is een deterministische, per-gebruiker onveranderlijke
// HMAC — een geldig token blijft dus geldig ná schorsing of anonimisering (AVG art. 17). De
// sessie-export (/api/agenda) snijdt zo'n account live af via currentActor(); deze publieke feed
// deed dat NIET en bleef het werkrooster (met de NAAM van de tegenpartij = derde-partij-PII) op een
// publieke bearer-URL serveren voor een geschorst/gewist account.
//
// OWASP A01 (broken access control: liveness/schorsing niet afgedwongen op deze surface) +
// CLAUDE.md regel 1 (server-side status is de waarheid) + AVG art. 17 (erasure moet toegang snijden).
//
// De test bewaakt dat:
//   1. een ACTIEVE gebruiker met geldig token 200 krijgt en het rooster wél wordt geladen,
//   2. een GESCHORSTE gebruiker met geldig token 404 krijgt en het rooster NIET wordt geladen,
//   3. een GEANONIMISEERDE gebruiker (anonymizedAt gezet) met geldig token 404 krijgt en het
//      rooster NIET wordt geladen,
//   4. een ongeldig token 404 geeft zonder ook maar een user-/rooster-query (token-poort intact).
// Cases 2 en 3 falen zonder de liveness-poort (rood→groen).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { agendaFeedToken } from "@/lib/calendar/feed-token";

const SECRET = "test-secret-minstens-16-tekens";
const USER_ID = "user-1";
const VALID_TOKEN = agendaFeedToken(USER_ID, SECRET);

const store = {
  user: null as { status: string; anonymizedAt: Date | null; role: string } | null,
};

const findUniqueMock = vi.hoisted(() => vi.fn());
const findManyMock = vi.hoisted(() => vi.fn(async () => [] as unknown[]));

vi.mock("@/lib/share-token", () => ({ shareTokenSecret: () => SECRET }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    collaboration: { findMany: findManyMock },
  },
}));
// De administratieve-deadline-loader wordt gemockt: deze test bewaakt uitsluitend de liveness-poort
// (dat het rooster wél/niet wordt geladen). De deadline-inhoud is elders getest.
vi.mock("@/lib/calendar/user-deadlines", () => ({
  loadUserAdministrativeDeadlines: vi.fn(async () => ({
    credentials: [],
    invoices: [],
    vat: [],
    incomeTax: null,
  })),
}));

import { GET } from "./feed.ics/route";

function request(u: string | null, t: string | null): Request {
  const url = new URL("https://app.example/api/agenda/feed.ics");
  if (u !== null) url.searchParams.set("u", u);
  if (t !== null) url.searchParams.set("t", t);
  // De route leest via NextRequest.nextUrl.searchParams; een gewone Request met dezelfde URL
  // wordt door Next in de handler naar NextRequest gepromoveerd. Voor de unit-test volstaat een
  // object met een `nextUrl`-veld dat de searchParams draagt.
  return { nextUrl: url } as unknown as Request;
}

describe("GET /api/agenda/feed.ics — liveness-poort", () => {
  beforeEach(() => {
    store.user = { status: "ACTIVE", anonymizedAt: null, role: "FREELANCER" };
    findUniqueMock.mockReset();
    findUniqueMock.mockImplementation(async () => store.user);
    findManyMock.mockClear();
  });

  it("actieve gebruiker + geldig token → 200 en rooster geladen", async () => {
    const res = await GET(request(USER_ID, VALID_TOKEN) as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/calendar");
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });

  it("geschorste gebruiker + geldig token → 404 en géén rooster geladen", async () => {
    store.user = { status: "SUSPENDED", anonymizedAt: null, role: "FREELANCER" };
    const res = await GET(request(USER_ID, VALID_TOKEN) as never);
    expect(res.status).toBe(404);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("geanonimiseerde gebruiker (anonymizedAt gezet) + geldig token → 404 en géén rooster", async () => {
    // anonymizeUser zet status=SUSPENDED én anonymizedAt; ook een ACTIVE-status met anonymizedAt
    // moet worden geweigerd (spiegelt currentActor()).
    store.user = {
      status: "ACTIVE",
      anonymizedAt: new Date("2026-01-01T00:00:00Z"),
      role: "FREELANCER",
    };
    const res = await GET(request(USER_ID, VALID_TOKEN) as never);
    expect(res.status).toBe(404);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("onbekende gebruiker (geen rij) + geldig token → 404", async () => {
    store.user = null;
    const res = await GET(request(USER_ID, VALID_TOKEN) as never);
    expect(res.status).toBe(404);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("ongeldig token → 404 zonder user- of rooster-query (token-poort vóór DB-I/O)", async () => {
    const res = await GET(request(USER_ID, "0".repeat(32)) as never);
    expect(res.status).toBe(404);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
