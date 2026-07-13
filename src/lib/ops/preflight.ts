// Go-live preflight: een PURE, testbare renderer die de al-berekende configuratie-posture
// (src/lib/system-status.ts → collectSystemStatus) omzet naar een leesbaar CLI-rapport met een
// duidelijk GO/NO-GO-oordeel. Bedoeld voor de operator vóór/tijdens de deploy (bv.
// `railway run npm run preflight`) of als CI-poort — zonder een draaiende server + admin-login.
//
// GEEN geheimen: dit werkt uitsluitend op een `SystemStatus` (driver-MODI + booleans) en de
// envWarnings (variabelen-NAMEN). Er komen nooit sleutelwaarden in het rapport.

import type { StatusLevel, SystemStatus } from "@/lib/system-status";

/** Het eindoordeel van de preflight. */
export type PreflightVerdict =
  | "go" // productie-klaar (of niet-productie, louter informatief) — geen aandachtspunten
  | "attention" // draait, maar met punten die vóór livegang aandacht vragen
  | "invalid"; // env-validatie faalde hard — de app zou niet booten

export interface PreflightReport {
  verdict: PreflightVerdict;
  /** Proces-exitcode: 0 = ok, 1 = aandacht in --strict, 2 = ongeldige configuratie. */
  exitCode: number;
  /** Het volledige rapport als regels (join met "\n" voor stdout). */
  lines: string[];
}

/** Vaste-breedte statustag per niveau (ASCII, leesbaar in CI-logs zonder emoji/kleur). */
export function statusTag(level: StatusLevel): string {
  switch (level) {
    case "ok":
      return "[ ok ]";
    case "attention":
      return "[ !! ]";
    case "fallback":
    default:
      return "[info]";
  }
}

/**
 * Bepaalt het oordeel + exitcode uit een geslaagde env-validatie (SystemStatus). Aandachtspunten
 * zijn `attention`-items óf boot-waarschuwingen (envWarnings). In --strict blokkeren die de poort
 * (exit 1); zonder --strict zijn ze adviserend (exit 0). Een harde validatiefout ("invalid") wordt
 * niet hier bepaald — die komt uit de CLI die `validateEnv()` ving (zie `invalidReport`).
 */
export function decideVerdict(
  status: SystemStatus,
  options: { strict: boolean },
): { verdict: PreflightVerdict; exitCode: number } {
  const hasAttention = status.counts.attention > 0 || status.warnings.length > 0;
  if (!hasAttention) return { verdict: "go", exitCode: 0 };
  return { verdict: "attention", exitCode: options.strict ? 1 : 0 };
}

/** Menselijk leesbare kop-regel voor het oordeel. */
function verdictHeadline(verdict: PreflightVerdict, production: boolean): string {
  switch (verdict) {
    case "go":
      return production
        ? "GO — productie-configuratie is compleet bekabeld."
        : "GO — geen aandachtspunten (niet-productie-omgeving; louter informatief).";
    case "attention":
      return "GO MET AANDACHTSPUNTEN — draait veilig door, maar zie de punten hieronder vóór livegang.";
    case "invalid":
    default:
      return "NO-GO — ongeldige omgevingsvariabelen; de app zou niet booten.";
  }
}

/**
 * Bouwt het volledige preflight-rapport uit een geslaagde env-validatie. Puur en deterministisch
 * (geen I/O, geen klok). De aanroeper voegt eventueel een tijd/commit-kop toe.
 */
export function buildPreflightReport(
  status: SystemStatus,
  options: { strict: boolean },
): PreflightReport {
  const { verdict, exitCode } = decideVerdict(status, options);
  const lines: string[] = [];

  lines.push("ZZP Platform — go-live preflight");
  lines.push(
    `Omgeving: ${status.production ? "productie (NODE_ENV=production)" : "niet-productie"}${
      options.strict ? " · strict" : ""
    }`,
  );
  lines.push("");

  for (const group of status.groups) {
    lines.push(`${group.title}`);
    for (const item of group.items) {
      lines.push(`  ${statusTag(item.level)} ${item.label}: ${item.mode}`);
      // Toon de toelichting alleen waar het telt (aandacht) — houdt het rapport rustig.
      if (item.level === "attention") lines.push(`         → ${item.detail}`);
    }
    lines.push("");
  }

  if (status.warnings.length > 0) {
    lines.push(`Boot-waarschuwingen (${status.warnings.length}):`);
    for (const warning of status.warnings) lines.push(`  - ${warning}`);
    lines.push("");
  }

  lines.push(
    `Samenvatting: ${status.counts.ok} ok · ${status.counts.fallback} fallback · ` +
      `${status.counts.attention} aandacht · ${status.warnings.length} waarschuwing(en)`,
  );
  lines.push(verdictHeadline(verdict, status.production));

  return { verdict, exitCode, lines };
}

/**
 * Rapport voor een HARDE env-validatiefout (validateEnv wierp). De CLI vangt de fout en geeft de
 * boodschap door; hier alleen de nette omlijsting + exitcode 2. Bevat geen sleutelwaarden — de
 * validateEnv-boodschap noemt paden/regels, geen waarden.
 */
export function invalidReport(message: string): PreflightReport {
  const lines = [
    "ZZP Platform — go-live preflight",
    "",
    verdictHeadline("invalid", true),
    "",
    message,
  ];
  return { verdict: "invalid", exitCode: 2, lines };
}
