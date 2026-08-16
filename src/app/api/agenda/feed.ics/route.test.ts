// Regressietest (security-review M-4): de publieke, sessieloze agenda-feed (/api/agenda/feed.ics)
// draagt een bearer-token in de querystring en deed — anders dan de structureel identieke
// vertrouwensdossier-route — GEEN rate-limiting. Zonder rem kan één IP de feed-token-ruimte per
// gebruiker sequentieel aftasten of de feed scrapen. Deze test bewijst:
//   1. bij een 429 van de limiter geeft de route 429 en verifieert géén token en doet géén DB-I/O;
//   2. de rem staat VÓÓR de tokenverificatie (parity met dossierViewRateLimiter);
//   3. bij toestemming loopt de route normaal door naar 200.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const verifyTokenMock = vi.hoisted(() => vi.fn(() => true));
const userFindUniqueMock = vi.hoisted(() =>
  vi.fn(async () => ({ status: "ACTIVE", anonymizedAt: null, role: "FREELANCER" })),
);
const enforceMock = vi.hoisted(() =>
  vi.fn(async (_limiter: unknown, _key: string) => null as NextResponse | null),
);

vi.mock("@/lib/calendar/feed-token", () => ({ verifyAgendaFeedToken: verifyTokenMock }));
vi.mock("@/lib/share-token", () => ({ shareTokenSecret: () => "test-secret-minstens-16-tekens" }));
vi.mock("@/lib/rate-limit", () => ({ agendaFeedRateLimiter: { check: vi.fn() } }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: enforceMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.9", userAgent: "vitest" })),
}));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: userFindUniqueMock } },
}));
vi.mock("@/lib/calendar/user-schedule", () => ({
  loadUserScheduleCollaborations: vi.fn(async () => []),
}));
vi.mock("@/lib/calendar/user-deadlines", () => ({
  loadUserAdministrativeDeadlines: vi.fn(async () => ({
    credentials: [],
    invoices: [],
    vat: [],
    incomeTax: null,
    collaborations: [],
  })),
}));
vi.mock("@/lib/calendar/schedule", () => ({ collaborationScheduleEvents: vi.fn(() => []) }));
vi.mock("@/lib/calendar/ics", () => ({ buildIcsCalendar: vi.fn(() => "BEGIN:VCALENDAR") }));

import { GET } from "./route";

// De route leest via NextRequest.nextUrl.searchParams; voor de unit-test volstaat een object met
// een `nextUrl`-veld dat de searchParams draagt (identiek aan feed-liveness.test.ts).
function feedRequest(u = "user-1", t = "tok") {
  const url = new URL("https://app.example/api/agenda/feed.ics");
  url.searchParams.set("u", u);
  url.searchParams.set("t", t);
  return { nextUrl: url } as never;
}

beforeEach(() => {
  enforceMock.mockReset();
  enforceMock.mockResolvedValue(null);
  verifyTokenMock.mockClear();
  verifyTokenMock.mockReturnValue(true);
  userFindUniqueMock.mockClear();
  userFindUniqueMock.mockResolvedValue({
    status: "ACTIVE",
    anonymizedAt: null,
    role: "FREELANCER",
  });
});

describe("agenda-feed is rate-limited (security-review M-4, parity met dossierViewRateLimiter)", () => {
  it("remt gekeyd op IP én de u-parameter, vóór alles", async () => {
    await GET(feedRequest("user-42"));
    expect(enforceMock).toHaveBeenCalledTimes(1);
    expect(enforceMock.mock.calls[0]?.[1]).toBe("203.0.113.9|user-42");
  });

  it("zonder u-parameter: geen crash, feed-key valt terug op onbekend", async () => {
    const url = new URL("https://app.example/api/agenda/feed.ics");
    await GET({ nextUrl: url } as never);
    expect(enforceMock.mock.calls[0]?.[1]).toBe("203.0.113.9|onbekend");
  });

  it("bij een 429 van de limiter: geen tokenverificatie, geen DB-I/O, geeft 429 door", async () => {
    enforceMock.mockResolvedValue(
      NextResponse.json({ error: "Te veel verzoeken." }, { status: 429 }),
    );
    const res = await GET(feedRequest());
    expect(res.status).toBe(429);
    expect(verifyTokenMock).not.toHaveBeenCalled();
    expect(userFindUniqueMock).not.toHaveBeenCalled();
  });

  it("bij toestemming loopt de route normaal door naar 200", async () => {
    const res = await GET(feedRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/calendar");
  });
});
