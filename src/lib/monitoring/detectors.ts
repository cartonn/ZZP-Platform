// Platform-bewaking — pure, deterministische detectoren. Geen model/heuristiek-blackbox:
// vaste drempels op telbare gebeurtenissen. In → Findings uit, volledig testbaar.
// De runner (monitor-task.ts) persisteert Findings als HealthIncident (dedupeKey = idempotent).

import { type IncidentSource, type IncidentSeverity } from "@/lib/enums";

export interface Finding {
  source: IncidentSource;
  severity: IncidentSeverity;
  /** Stabiele machine-code, bv. LOGIN_BURST. */
  code: string;
  /** Mensleesbare samenvatting (NL). */
  summary: string;
  /** Onderbouwing (wordt als JSON-string opgeslagen). */
  evidence: Record<string, unknown>;
  /** Idempotentie-anker (incl. tijdvenster): harde unieke sleutel per incident-record. */
  dedupeKey: string;
  /**
   * Tijdloos voorvoegsel van de dedupeKey (bv. `auth-login-burst-<ip>-`). De runner onderdrukt een
   * nieuw incident als er bínnen het rollende scanvenster al één met deze groupKey is — zo vuurt
   * dezelfde burst niet dubbel zodra hij de UTC-uurgrens kruist (rollend venster vs. uur-suffix).
   */
  groupKey: string;
}

/** Minimale vorm van een auditregel die de detectoren nodig hebben. */
export interface AuditRow {
  action: string;
  actorId: string | null;
  ipAddress: string | null;
  metadata: string | null; // JSON-string
  createdAt: Date;
}

/** Drempels (configureerbaar; bewust conservatief). */
export const THRESHOLDS = {
  loginBurstPerIp: 5, //        ≥5 mislukte logins van één IP in het venster → WARN
  loginBurstCritical: 15, //    ≥15 → CRITICAL
  passwordResetFlood: 5, //     ≥5 reset-aanvragen van één IP → WARN
  roleChangeBurst: 3, //        ≥3 rolwijzigingen in het venster → WARN
} as const;

/** Dag-uur-sleutel (UTC) voor stabiele dedupe per tijdvenster. */
function hourKey(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}-${String(d.getUTCHours()).padStart(2, "0")}`;
}

function count<T>(items: readonly T[], key: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/**
 * Detecteert auth-anomalieën in recente auditregels: brute-force-bursts (mislukte logins /
 * rate-limit-hits per IP), wachtwoord-reset-floods en bursts van rolwijzigingen.
 */
export function detectAuthAnomalies(rows: readonly AuditRow[], now: Date): Finding[] {
  const findings: Finding[] = [];
  const window = hourKey(now);

  // Mislukte logins + rate-limit-hits per IP.
  const failed = rows.filter(
    (r) => r.action === "USER_LOGIN_FAILED" || r.action === "AUTH_RATE_LIMITED",
  );
  for (const [ip, n] of count(failed, (r) => r.ipAddress ?? "onbekend")) {
    if (n >= THRESHOLDS.loginBurstPerIp) {
      const critical = n >= THRESHOLDS.loginBurstCritical;
      const groupKey = `auth-login-burst-${ip}-`;
      findings.push({
        source: "AUTH",
        severity: critical ? "CRITICAL" : "WARN",
        code: "LOGIN_BURST",
        summary: `${n} mislukte inlogpogingen vanaf IP ${ip} in het laatste uur.`,
        evidence: { ip, count: n, window },
        dedupeKey: `${groupKey}${window}`,
        groupKey,
      });
    }
  }

  // Wachtwoord-reset-floods per IP.
  const resets = rows.filter((r) => r.action === "PASSWORD_RESET_REQUESTED");
  for (const [ip, n] of count(resets, (r) => r.ipAddress ?? "onbekend")) {
    if (n >= THRESHOLDS.passwordResetFlood) {
      const groupKey = `auth-reset-flood-${ip}-`;
      findings.push({
        source: "AUTH",
        severity: "WARN",
        code: "PASSWORD_RESET_FLOOD",
        summary: `${n} wachtwoord-resetaanvragen vanaf IP ${ip} in het laatste uur.`,
        evidence: { ip, count: n, window },
        dedupeKey: `${groupKey}${window}`,
        groupKey,
      });
    }
  }

  // Burst van rolwijzigingen (privilege-escalatie-signaal).
  const roleChanges = rows.filter((r) => r.action === "ROLE_CHANGED");
  if (roleChanges.length >= THRESHOLDS.roleChangeBurst) {
    const groupKey = `auth-role-burst-`;
    findings.push({
      source: "AUTH",
      severity: "WARN",
      code: "ROLE_CHANGE_BURST",
      summary: `${roleChanges.length} rolwijzigingen in het laatste uur — controleer of dit klopt.`,
      evidence: { count: roleChanges.length, window },
      dedupeKey: `${groupKey}${window}`,
      groupKey,
    });
  }

  return findings;
}

/** Vorm van één npm-audit-kwetsbaarheid (zoals `npm audit --json` levert). */
export interface NpmVuln {
  name: string;
  severity: "low" | "moderate" | "high" | "critical";
}

/** Classificeert npm-audit-bevindingen: high/critical → Finding (CVE-bron). */
export function classifyCves(vulns: readonly NpmVuln[], dateKey: string): Finding[] {
  const relevant = vulns.filter((v) => v.severity === "high" || v.severity === "critical");
  return relevant.map((v) => {
    const groupKey = `cve-${v.name}-${v.severity}-`;
    return {
      source: "CVE" as const,
      severity: v.severity === "critical" ? ("CRITICAL" as const) : ("WARN" as const),
      code: "DEPENDENCY_CVE",
      summary: `Kwetsbaarheid (${v.severity}) in dependency ${v.name}.`,
      evidence: { package: v.name, severity: v.severity },
      dedupeKey: `${groupKey}${dateKey}`,
      groupKey,
    };
  });
}

/** Hoogste severity in een set findings (voor een samenvattend signaal). */
export function highestSeverity(findings: readonly Finding[]): IncidentSeverity | null {
  if (findings.some((f) => f.severity === "CRITICAL")) return "CRITICAL";
  if (findings.some((f) => f.severity === "WARN")) return "WARN";
  if (findings.length > 0) return "INFO";
  return null;
}
