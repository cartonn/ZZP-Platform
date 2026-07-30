// Unit-tests voor runHealthIncidentRetentionTask — standaard-AAN gedrag (default-venster zonder env),
// dat alleen incidenten mét een echt bron-IP voorbij het venster worden geredigeerd, dat verse
// incidenten en niet-IP-incidenten ongemoeid blijven, idempotentie, en het redactie-auditrecord.
// Prisma-laag in-memory gemockt (emuleert de contains/NOT-query); klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AUDIT_PII_REDACTED } from "@/lib/account-anonymization";

interface IncidentRow {
  id: string;
  createdAt: Date;
  evidence: string | null;
  summary: string;
  dedupeKey: string;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

interface NotificationRow {
  id: string;
  type: string;
  body: string;
}

const store = {
  incidents: [] as IncidentRow[],
  auditLogs: [] as AuditRow[],
  notifications: [] as NotificationRow[],
};
let idSeq = 0;

// Vorm van het subset van Prisma-filters dat de taak gebruikt.
interface EvidenceContains {
  evidence?: { contains?: string };
}
interface IncidentWhere {
  createdAt?: { lt: Date };
  AND?: Array<EvidenceContains & { NOT?: EvidenceContains }>;
}

// Emuleert het subset van Prisma-filters dat de taak gebruikt: createdAt.lt + AND[] met
// { evidence: { contains } } en { NOT: { evidence: { contains } } }.
function matches(row: IncidentRow, where: IncidentWhere): boolean {
  if (where.createdAt?.lt && !(row.createdAt < where.createdAt.lt)) return false;
  for (const clause of where.AND ?? []) {
    if (clause.NOT) {
      const sub = clause.NOT.evidence?.contains;
      if (sub !== undefined && (row.evidence ?? "").includes(sub)) return false;
    } else {
      const sub = clause.evidence?.contains;
      if (sub !== undefined && !(row.evidence ?? "").includes(sub)) return false;
    }
  }
  return true;
}

vi.mock("@/lib/db", () => ({
  prisma: {
    healthIncident: {
      findMany: vi.fn(async (args: { where: IncidentWhere; take: number }) =>
        store.incidents
          .filter((r) => matches(r, args.where))
          .slice(0, args.take)
          .map((r) => ({
            id: r.id,
            evidence: r.evidence,
            summary: r.summary,
            dedupeKey: r.dedupeKey,
          })),
      ),
      update: vi.fn(
        async (args: {
          where: { id: string };
          data: { evidence: string; summary: string; dedupeKey: string };
        }) => {
          const row = store.incidents.find((r) => r.id === args.where.id);
          if (row) {
            row.evidence = args.data.evidence;
            row.summary = args.data.summary;
            row.dedupeKey = args.data.dedupeKey;
          }
          return row;
        },
      ),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
        const row: AuditRow = { id: `audit-${idSeq++}`, createdAt: new Date(), ...args.data };
        store.auditLogs.push(row);
        return row;
      }),
      updateMany: vi.fn(
        async (args: {
          where: { action: string; entityId: string };
          data: { entityId: string };
        }) => {
          let count = 0;
          for (const r of store.auditLogs) {
            if (r.action === args.where.action && r.entityId === args.where.entityId) {
              r.entityId = args.data.entityId;
              count++;
            }
          }
          return { count };
        },
      ),
    },
    notification: {
      updateMany: vi.fn(
        async (args: { where: { type: string; body: string }; data: { body: string } }) => {
          let count = 0;
          for (const r of store.notifications) {
            if (r.type === args.where.type && r.body === args.where.body) {
              r.body = args.data.body;
              count++;
            }
          }
          return { count };
        },
      ),
    },
  },
}));

import {
  runHealthIncidentRetentionTask,
  prunableHealthIncidentIpWhere,
} from "@/lib/health-incident-retention-task";
import { IP_EVIDENCE_MARKER, UNKNOWN_IP } from "@/lib/health-incident-retention";

const NOW = new Date("2026-07-23T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function summaryFor(ip: string): string {
  return `12 mislukte inlogpogingen vanaf IP ${ip} in het laatste uur.`;
}
function dedupeKeyFor(ip: string): string {
  return `auth-login-burst-${ip}-w`;
}

function ipIncident(id: string, ip: string, ageDays: number): void {
  store.incidents.push({
    id,
    createdAt: new Date(NOW.getTime() - ageDays * DAY),
    evidence: JSON.stringify({ ip, count: 12, window: "w" }),
    summary: summaryFor(ip),
    dedupeKey: dedupeKeyFor(ip),
  });
}

// Seedt een incident mét zijn afgeleide kopieën: de HEALTH_INCIDENT_OPENED-auditregel (entityId ==
// dedupeKey) en een admin-notificatie (body == summary) — beide dragen dus óók het IP.
function ipIncidentWithDerived(id: string, ip: string, ageDays: number): void {
  ipIncident(id, ip, ageDays);
  store.auditLogs.push({
    id: `audit-open-${id}`,
    action: "HEALTH_INCIDENT_OPENED",
    entityType: "HealthIncident",
    entityId: dedupeKeyFor(ip),
    createdAt: new Date(NOW.getTime() - ageDays * DAY),
  });
  store.notifications.push({ id: `notif-${id}`, type: "HEALTH_INCIDENT", body: summaryFor(ip) });
}

beforeEach(() => {
  store.incidents = [];
  store.auditLogs = [];
  store.notifications = [];
  idSeq = 0;
  delete process.env.HEALTH_INCIDENT_IP_RETENTION_DAYS;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.HEALTH_INCIDENT_IP_RETENTION_DAYS;
});

describe("runHealthIncidentRetentionTask", () => {
  it("redigeert het bron-IP uit oude incidenten (default-venster AAN zonder env)", async () => {
    ipIncident("old", "203.0.113.7", 120); // ouder dan 90 dagen
    const result = await runHealthIncidentRetentionTask({ now: NOW });

    expect(result.enabled).toBe(true);
    expect(result.redacted).toBe(1);
    expect(result.retentionDays).toBe(90);

    const row = store.incidents.find((r) => r.id === "old")!;
    expect(row.summary).not.toContain("203.0.113.7");
    expect(row.summary).toContain(AUDIT_PII_REDACTED);
    expect(JSON.parse(row.evidence!).ip).toBe(AUDIT_PII_REDACTED);
    // Ook de dedupeKey mag het IP niet meer bevatten (de agent-review-blocker).
    expect(row.dedupeKey).not.toContain("203.0.113.7");
  });

  it("laat NA de sweep GEEN enkele kolom van de rij het IP behouden (blocker-regressie)", async () => {
    ipIncident("old", "203.0.113.7", 120);
    await runHealthIncidentRetentionTask({ now: NOW });

    const row = store.incidents.find((r) => r.id === "old")!;
    const allColumns = `${row.evidence}\n${row.summary}\n${row.dedupeKey}`;
    expect(allColumns).not.toContain("203.0.113.7");
  });

  it("redigeert óók de afgeleide kopieën (auditregel-entityId + notificatie-body)", async () => {
    ipIncidentWithDerived("old", "203.0.113.7", 120);
    await runHealthIncidentRetentionTask({ now: NOW });

    const openAudit = store.auditLogs.find((r) => r.id === "audit-open-old")!;
    expect(openAudit.entityId).not.toContain("203.0.113.7");
    const notif = store.notifications.find((r) => r.id === "notif-old")!;
    expect(notif.body).not.toContain("203.0.113.7");
    expect(notif.body).toContain(AUDIT_PII_REDACTED);
  });

  it("laat verse incidenten (binnen het venster) ongemoeid — IP blijft voor onderzoek", async () => {
    ipIncident("fresh", "198.51.100.9", 10); // binnen 90 dagen
    const result = await runHealthIncidentRetentionTask({ now: NOW });

    expect(result.redacted).toBe(0);
    expect(store.incidents.find((r) => r.id === "fresh")!.summary).toContain("198.51.100.9");
  });

  it("raakt incidenten zonder ip-veld en het 'onbekend'-sentinel niet aan", async () => {
    store.incidents.push({
      id: "role",
      createdAt: new Date(NOW.getTime() - 200 * DAY),
      evidence: JSON.stringify({ count: 6, window: "w" }),
      summary: "6 rolwijzigingen in het laatste uur.",
      dedupeKey: "auth-role-burst-w",
    });
    store.incidents.push({
      id: "unknown",
      createdAt: new Date(NOW.getTime() - 200 * DAY),
      evidence: JSON.stringify({ ip: "onbekend", count: 4, window: "w" }),
      summary: "4 mislukte inlogpogingen vanaf IP onbekend in het laatste uur.",
      dedupeKey: "auth-login-burst-onbekend-w",
    });
    const result = await runHealthIncidentRetentionTask({ now: NOW });

    expect(result.redacted).toBe(0);
    expect(store.incidents.find((r) => r.id === "role")!.summary).toBe(
      "6 rolwijzigingen in het laatste uur.",
    );
    expect(store.incidents.find((r) => r.id === "unknown")!.summary).toContain("onbekend");
  });

  it("is idempotent: een tweede run redigeert niets meer", async () => {
    ipIncident("old", "203.0.113.7", 120);
    await runHealthIncidentRetentionTask({ now: NOW });
    const second = await runHealthIncidentRetentionTask({ now: NOW });

    expect(second.redacted).toBe(0);
  });

  it("schrijft één audit-record (zonder PII) alleen wanneer er is geredigeerd", async () => {
    ipIncident("a", "203.0.113.1", 120);
    ipIncident("b", "203.0.113.2", 130);
    await runHealthIncidentRetentionTask({ now: NOW, actorId: "admin-1" });

    expect(store.auditLogs).toHaveLength(1);
    const audit = store.auditLogs[0]!;
    expect(audit.action).toBe("HEALTH_INCIDENT_IPS_REDACTED");
    expect(audit.entityType).toBe("HealthIncident");
    // Geen PII in het auditrecord.
    expect(JSON.stringify(audit)).not.toContain("203.0.113");
  });

  it("schrijft geen audit-record bij een lege run", async () => {
    ipIncident("fresh", "198.51.100.9", 5);
    await runHealthIncidentRetentionTask({ now: NOW });
    expect(store.auditLogs).toHaveLength(0);
  });

  it("staat uit bij een expliciete 0 (operator-override) — geen redactie", async () => {
    process.env.HEALTH_INCIDENT_IP_RETENTION_DAYS = "0";
    ipIncident("old", "203.0.113.7", 400);
    const result = await runHealthIncidentRetentionTask({ now: NOW });

    expect(result.enabled).toBe(false);
    expect(result.redacted).toBe(0);
    expect(store.incidents.find((r) => r.id === "old")!.summary).toContain("203.0.113.7");
  });

  it("redigeert een grote achterstand in batches (voorbij BATCH_SIZE)", async () => {
    for (let i = 0; i < 550; i++)
      ipIncident(`old-${i}`, `10.0.${Math.floor(i / 256)}.${i % 256}`, 120);
    const result = await runHealthIncidentRetentionTask({ now: NOW });

    expect(result.redacted).toBe(550);
    expect(store.incidents.every((r) => JSON.parse(r.evidence!).ip === AUDIT_PII_REDACTED)).toBe(
      true,
    );
  });
});

// De gedeelde `where`-vorm is de bron van waarheid voor zowel de redactie-taak als de
// /api/metrics-backlog-gauge; drift zou de detector uit de pas laten lopen met het werk dat de taak
// doet. Deze test verankert de vorm (cutoff + IP-marker + de twee redactie-/onbekend-sluitingen).
describe("prunableHealthIncidentIpWhere", () => {
  const cutoff = new Date("2026-04-24T12:00:00.000Z");

  it("selecteert alleen te-oude, IP-dragende, nog-niet-geredigeerde incidenten", () => {
    const where = prunableHealthIncidentIpWhere(cutoff);
    expect(where.createdAt).toEqual({ lt: cutoff });
    expect(where.AND).toEqual([
      { evidence: { contains: IP_EVIDENCE_MARKER } },
      { NOT: { evidence: { contains: `${IP_EVIDENCE_MARKER}${UNKNOWN_IP}"` } } },
      { NOT: { evidence: { contains: AUDIT_PII_REDACTED } } },
    ]);
  });
});
