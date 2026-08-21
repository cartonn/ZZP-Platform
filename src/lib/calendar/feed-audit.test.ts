// Regressietest: de publieke, niet-intrekbare agenda-feed (`/api/agenda/feed.ics`) serveert derde-
// partij-PII (namen van tegenpartijen in het rooster) op een bearer-token, maar liet — als enige
// gevoelige weergaveroute — GEEN auditspoor na (AVG art. 5(2) verantwoordingsplicht / OWASP A09).
// Een gelekt/gescraped token was daardoor forensisch onzichtbaar. `auditAgendaFeedView` dicht dat,
// gede-dupliceerd per (gebruiker, bron-IP, kalenderdag) zodat de periodieke poll-ruis van externe
// agenda-apps de trail niet overspoelt. Deze test bewijst: (1) een eerste weergave schrijft de regel
// mét IP + user-agent; (2) een tweede weergave binnen de dag vanaf dezelfde bron dedupt (geen tweede
// regel); (3) het dedup-venster is (action, entityType, entityId, ipAddress, createdAt ≥ dagstart);
// (4) een ontbrekend IP dedupt correct op de IS-NULL-bucket. Zonder de helper bestaat de module niet
// → rood.

import { describe, it, expect, vi, beforeEach } from "vitest";

interface FindArgs {
  where: {
    action?: unknown;
    entityType?: unknown;
    entityId?: unknown;
    ipAddress?: unknown;
    createdAt?: { gte?: Date };
  };
  select?: unknown;
}

const findFirstMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<{ id: string } | null>>(async () => null),
);
const auditMock = vi.hoisted(() =>
  vi.fn<(entry: Record<string, unknown>) => Promise<void>>(async () => {}),
);

vi.mock("@/lib/db", () => ({
  prisma: { auditLog: { findFirst: findFirstMock } },
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));

import { auditAgendaFeedView, startOfUtcDay, AGENDA_FEED_VIEWED } from "./feed-audit";

const NOW = new Date("2026-08-21T14:30:00Z");

beforeEach(() => {
  findFirstMock.mockReset();
  findFirstMock.mockResolvedValue(null);
  auditMock.mockClear();
});

describe("auditAgendaFeedView — geded-upliceerde forensische trail voor de publieke agenda-feed", () => {
  it("eerste weergave (geen bestaande regel vandaag) → schrijft AGENDA_FEED_VIEWED mét IP + user-agent", async () => {
    await auditAgendaFeedView({
      userId: "user-1",
      ipAddress: "203.0.113.9",
      userAgent: "Google-Calendar",
      now: NOW,
    });
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock.mock.calls[0]?.[0]).toEqual({
      actorId: null,
      action: AGENDA_FEED_VIEWED,
      entityType: "User",
      entityId: "user-1",
      ipAddress: "203.0.113.9",
      userAgent: "Google-Calendar",
    });
  });

  it("tweede poll dezelfde dag vanaf dezelfde bron → dedupt, geen tweede regel", async () => {
    findFirstMock.mockResolvedValue({ id: "audit-1" });
    await auditAgendaFeedView({
      userId: "user-1",
      ipAddress: "203.0.113.9",
      userAgent: "Google-Calendar",
      now: NOW,
    });
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("dedup-venster = (action, entityType, entityId, ipAddress, createdAt ≥ dagstart)", async () => {
    await auditAgendaFeedView({
      userId: "user-42",
      ipAddress: "198.51.100.7",
      userAgent: "Apple/iCal",
      now: NOW,
    });
    const where = findFirstMock.mock.calls[0]?.[0]?.where;
    expect(where?.action).toBe(AGENDA_FEED_VIEWED);
    expect(where?.entityType).toBe("User");
    expect(where?.entityId).toBe("user-42");
    expect(where?.ipAddress).toBe("198.51.100.7");
    expect(where?.createdAt?.gte).toEqual(startOfUtcDay(NOW));
    expect(startOfUtcDay(NOW)).toEqual(new Date("2026-08-21T00:00:00Z"));
  });

  it("ontbrekend IP → dedupt op de IS-NULL-bucket (geen ruis-explosie zonder IP)", async () => {
    await auditAgendaFeedView({
      userId: "user-1",
      ipAddress: null,
      userAgent: null,
      now: NOW,
    });
    expect(findFirstMock.mock.calls[0]?.[0]?.where?.ipAddress).toBeNull();
    expect(auditMock.mock.calls[0]?.[0]).toMatchObject({ ipAddress: null, userAgent: null });
  });
});
