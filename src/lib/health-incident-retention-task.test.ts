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
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

const store = { incidents: [] as IncidentRow[], auditLogs: [] as AuditRow[] };
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
          .map((r) => ({ id: r.id, evidence: r.evidence, summary: r.summary })),
      ),
      update: vi.fn(
        async (args: { where: { id: string }; data: { evidence: string; summary: string } }) => {
          const row = store.incidents.find((r) => r.id === args.where.id);
          if (row) {
            row.evidence = args.data.evidence;
            row.summary = args.data.summary;
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
    },
  },
}));

import { runHealthIncidentRetentionTask } from "@/lib/health-incident-retention-task";

const NOW = new Date("2026-07-23T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function ipIncident(id: string, ip: string, ageDays: number): void {
  store.incidents.push({
    id,
    createdAt: new Date(NOW.getTime() - ageDays * DAY),
    evidence: JSON.stringify({ ip, count: 12, window: "w" }),
    summary: `12 mislukte inlogpogingen vanaf IP ${ip} in het laatste uur.`,
  });
}

beforeEach(() => {
  store.incidents = [];
  store.auditLogs = [];
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
    });
    store.incidents.push({
      id: "unknown",
      createdAt: new Date(NOW.getTime() - 200 * DAY),
      evidence: JSON.stringify({ ip: "onbekend", count: 4, window: "w" }),
      summary: "4 mislukte inlogpogingen vanaf IP onbekend in het laatste uur.",
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
