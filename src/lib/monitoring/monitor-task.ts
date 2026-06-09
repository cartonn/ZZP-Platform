// Platform-bewaking runner: scant de recente audit-log op auth-anomalieën, persisteert
// bevindingen als HealthIncident (idempotent via dedupeKey) en waarschuwt admins bij nieuwe
// CRITICAL-incidenten. Autonome acties zijn bewust veilig en omkeerbaar (incident openen +
// notificeren + auditen). Code-/CVE-herstel gebeurt buiten dit pad (PR/issue via workflow);
// nooit een automatische productie-deploy (CLAUDE.md). Geen "AI" in teksten.

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { detectAuthAnomalies, type AuditRow, type Finding } from "@/lib/monitoring/detectors";

export interface MonitorRunResult {
  scanned: number;
  findings: number;
  newIncidents: number;
  adminsNotified: number;
}

const SCAN_WINDOW_MS = 60 * 60 * 1000; // laatste uur

/**
 * Voert één bewakingsronde uit.
 * @param opts.now Referentietijd (default nu).
 */
export async function runMonitorTask(opts: { now?: Date } = {}): Promise<MonitorRunResult> {
  const now = opts.now ?? new Date();
  const since = new Date(now.getTime() - SCAN_WINDOW_MS);

  const rows = (await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      action: {
        in: ["USER_LOGIN_FAILED", "AUTH_RATE_LIMITED", "PASSWORD_RESET_REQUESTED", "ROLE_CHANGED"],
      },
    },
    select: { action: true, actorId: true, ipAddress: true, metadata: true, createdAt: true },
  })) as AuditRow[];

  const findings = detectAuthAnomalies(rows, now);

  let newIncidents = 0;
  let adminsNotified = 0;

  for (const f of findings) {
    const created = await persistFinding(f, now);
    if (!created) continue; // al bekend in dit venster — idempotent
    newIncidents++;

    await audit({
      actorId: null,
      action: "HEALTH_INCIDENT_OPENED",
      entityType: "HealthIncident",
      entityId: f.dedupeKey,
      metadata: { source: f.source, severity: f.severity, code: f.code },
    });

    if (f.severity === "CRITICAL") {
      adminsNotified += await notifyAdmins(f);
    }
  }

  return { scanned: rows.length, findings: findings.length, newIncidents, adminsNotified };
}

/** Persisteert een finding als incident; geeft false als het er al was (idempotent). */
async function persistFinding(f: Finding, now: Date): Promise<boolean> {
  const existing = await prisma.healthIncident.findUnique({ where: { dedupeKey: f.dedupeKey } });
  if (existing) return false;
  // Onderdruk een nieuw incident als er bínnen het rollende scanvenster al één met dezelfde groupKey
  // is. Anders vuurt dezelfde burst dubbel zodra hij de UTC-uurgrens kruist (de dedupeKey krijgt dan
  // een ander uur-suffix terwijl de events nog in het venster zitten) — inclusief een dubbele
  // admin-notificatie bij CRITICAL.
  const recent = await prisma.healthIncident.findFirst({
    where: {
      dedupeKey: { startsWith: f.groupKey },
      createdAt: { gte: new Date(now.getTime() - SCAN_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) return false;
  try {
    await prisma.healthIncident.create({
      data: {
        source: f.source,
        severity: f.severity,
        code: f.code,
        status: "OPEN",
        summary: f.summary,
        evidence: JSON.stringify(f.evidence),
        dedupeKey: f.dedupeKey,
      },
    });
    return true;
  } catch {
    // Race: een gelijktijdige run schreef hetzelfde dedupeKey al weg (unique constraint).
    return false;
  }
}

/** Waarschuwt alle admins via de bestaande Notification-laag. */
async function notifyAdmins(f: Finding): Promise<number> {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return 0;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "HEALTH_INCIDENT",
      title: "Platform-bewaking: kritiek signaal",
      body: f.summary,
      link: "/admin/bewaking",
    })),
  });
  return admins.length;
}
