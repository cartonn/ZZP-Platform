// CSP-violatie-parser (pure, testbaar). Browsers rapporteren een geblokkeerde bron op twee
// manieren die we allebei ondersteunen:
//   1. Legacy `report-uri` → Content-Type `application/csp-report`, één object
//      `{ "csp-report": { "violated-directive", "blocked-uri", "document-uri", ... } }`.
//   2. Modern Reporting API `report-to`/`Reporting-Endpoints` → Content-Type
//      `application/reports+json`, een ARRAY van `{ "type": "csp-violation", "body": { ... } }`.
//
// PRIVACY (AVG): rapporten kunnen PII lekken (query-strings met deel-tokens in de document-URL,
// referrer, user-agent). We normaliseren daarom AGRESSIEF: document-URL → alleen het pad (geen
// query/fragment), geblokkeerde/bron-URL → alleen de origin, referrer/user-agent/original-policy
// worden weggegooid. De `sample` (mogelijk geïnjecteerde inline-code — juist het signaal dat we
// willen zien) wordt bewaard maar hard afgekapt. Puur: geen I/O, muteert de input niet.

/** Genormaliseerde, PII-arme weergave van één CSP-violatie — veilig om te loggen. */
export interface NormalizedCspViolation {
  /** De overtreden richtlijn, bv. "script-src" (effective- valt terug op violated-directive). */
  directive: string | null;
  /** Origin van de geblokkeerde bron, of een schema-token ("inline"/"eval"/"data"/"blob"). */
  blockedOrigin: string | null;
  /** Pad van het document waar de overtreding plaatsvond (zonder query/fragment). */
  documentPath: string | null;
  /** Origin+pad van het bronbestand (zonder query), indien meegestuurd. */
  sourceFile: string | null;
  lineNumber: number | null;
  disposition: string | null;
  /** Eventueel codefragment (afgekapt op MAX_SAMPLE_LEN); het injectie-signaal. */
  sample: string | null;
}

/** Harde plafonds: nooit meer dan dit verwerken/loggen per verzoek. */
export const MAX_VIOLATIONS_PER_REPORT = 10;
export const MAX_SAMPLE_LEN = 120;

/**
 * Reduceert een URL tot alleen zijn origin (scheme://host[:port]). Speciale CSP-tokens die geen
 * echte URL zijn ("inline", "eval", "self") worden ongewijzigd teruggegeven; `data:`/`blob:` en
 * andere schema-URI's worden tot het schema-token gereduceerd (geen payload lekken). Onparseerbare
 * of lege waarden → null.
 */
export function toBlockedOrigin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  // CSP-keywords/tokens zonder scheme laten we heel (bv. "inline", "eval", "self").
  if (!value.includes(":")) return value.toLowerCase();
  try {
    const url = new URL(value);
    // Opake schema's (data:, blob:, filesystem:, javascript:) hebben geen zinvolle origin:
    // reduceer tot het schema zodat we nooit de payload (bv. een base64-blob) loggen.
    if (!url.host) return url.protocol.replace(/:$/, "");
    return `${url.protocol}//${url.host}`;
  } catch {
    // Geen geldige URL, maar bevat wel ":" — geef het schema-deel terug, nooit de rest.
    const scheme = value.split(":", 1)[0];
    return scheme ? scheme.toLowerCase() : null;
  }
}

/** Reduceert een document-URL tot alleen het pad (dropt query/fragment/host → geen tokens/PII). */
export function toDocumentPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    return new URL(value).pathname || "/";
  } catch {
    // Relatief pad of onparseerbaar: strip zelf query + fragment.
    const withoutHash = value.split("#", 1)[0] ?? "";
    return withoutHash.split("?", 1)[0] || null;
  }
}

/** Bronbestand: origin + pad behouden (nuttig om de dader te vinden), query/fragment strippen. */
export function toSourceFile(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!url.host) return url.protocol.replace(/:$/, "");
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    const withoutHash = value.split("#", 1)[0] ?? "";
    return withoutHash.split("?", 1)[0] || null;
  }
}

function toLine(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

function toSample(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  return value.length > MAX_SAMPLE_LEN ? `${value.slice(0, MAX_SAMPLE_LEN)}…` : value;
}

function nonEmptyString(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/** Normaliseert het legacy `csp-report`-object (report-uri). */
function fromLegacyBody(body: Record<string, unknown>): NormalizedCspViolation {
  return {
    directive:
      nonEmptyString(body["effective-directive"]) ?? nonEmptyString(body["violated-directive"]),
    blockedOrigin: toBlockedOrigin(body["blocked-uri"]),
    documentPath: toDocumentPath(body["document-uri"]),
    sourceFile: toSourceFile(body["source-file"]),
    lineNumber: toLine(body["line-number"]),
    disposition: nonEmptyString(body["disposition"]),
    sample: toSample(body["script-sample"]),
  };
}

/** Normaliseert de moderne Reporting-API `body` (report-to / Reporting-Endpoints). */
function fromModernBody(body: Record<string, unknown>): NormalizedCspViolation {
  return {
    directive:
      nonEmptyString(body["effectiveDirective"]) ?? nonEmptyString(body["violatedDirective"]),
    blockedOrigin: toBlockedOrigin(body["blockedURL"]),
    documentPath: toDocumentPath(body["documentURL"]),
    sourceFile: toSourceFile(body["sourceFile"]),
    lineNumber: toLine(body["lineNumber"]),
    disposition: nonEmptyString(body["disposition"]),
    sample: toSample(body["sample"]),
  };
}

/** Een violatie is de moeite waard om te loggen als er iets betekenisvols in staat. */
function isMeaningful(v: NormalizedCspViolation): boolean {
  return Boolean(v.directive || v.blockedOrigin || v.documentPath);
}

/**
 * Parseert een reeds-gedeserialiseerde payload (JSON-waarde) naar genormaliseerde violaties.
 * Accepteert zowel het legacy-object als de moderne array; onbekende vormen → lege lijst.
 * Nooit meer dan MAX_VIOLATIONS_PER_REPORT.
 */
export function parseCspReport(payload: unknown): NormalizedCspViolation[] {
  const out: NormalizedCspViolation[] = [];

  // Modern: array van reports.
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (out.length >= MAX_VIOLATIONS_PER_REPORT) break;
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      // Alleen csp-violation-reports; andere report-types (deprecation, intervention) negeren.
      if (record.type !== undefined && record.type !== "csp-violation") continue;
      const body = record.body;
      if (body && typeof body === "object") {
        const v = fromModernBody(body as Record<string, unknown>);
        if (isMeaningful(v)) out.push(v);
      }
    }
    return out;
  }

  // Legacy: één object met "csp-report".
  if (payload && typeof payload === "object") {
    const report = (payload as Record<string, unknown>)["csp-report"];
    if (report && typeof report === "object") {
      const v = fromLegacyBody(report as Record<string, unknown>);
      if (isMeaningful(v)) out.push(v);
    }
  }

  return out;
}
