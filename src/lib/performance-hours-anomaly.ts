// Urenstaat-uitschieter-signaal voor de OPDRACHTGEVER bij het goedkeuren van uren (`/prestaties`).
//
// Waarom: het uurtarief van een urenstaat staat server-side vast (bij het indienen wordt
// `rateCents = col.rate * 100` vastgeklonken; de ZZP'er voert het tarief nooit vrij in). Het AANTAL
// UREN is daarmee de enige vrij-in te voeren waarde die de opdrachtgever bij het goedkeuren afstempelt
// — óók via het één-klik bulk-goedkeurpaneel. Een urenstaat die opvallend hoger is dan wat deze ZZP'er
// op dezelfde samenwerking normaal indient, is stil overbetalingsrisico. Dit is geen blokkade of
// beschuldiging: het is een rustige "controleer even"-attentie zodat een uitschieter niet blind wordt
// goedgekeurd.
//
// Zuiver en deterministisch (geen klok, geen DB, geen neveneffecten): werkt op de reeds geladen
// prestatie-rijen (`getPrestatiesForClient`). Server-side is de waarheid: dit signaal beslist niets —
// goedkeuren loopt onveranderd door `approvePerformance` (auth→rol→ownership→transitie→audit).

/** Vanaf hoeveel GOEDGEKEURDE urenstaten in één samenwerking een betrouwbare baseline ontstaat. */
export const HOURS_ANOMALY_MIN_SAMPLE = 3;

/** Een ingediende urenstaat is pas een uitschieter vanaf dit percentage boven de mediaan. */
export const HOURS_ANOMALY_THRESHOLD_PCT = 30;

/**
 * Naast het percentage ook minstens dit aantal uren boven de mediaan — voorkomt ruis op kleine weken
 * (bijv. 4 u → 6 u is +50% maar amper een halve dag; dat is geen aandachtssignaal waard).
 */
export const HOURS_ANOMALY_MIN_EXCESS_HOURS = 8;

/** Minimale prestatie-vorm die dit signaal nodig heeft (subset van `PrestatieOverzicht`). */
export interface PerformanceHoursRow {
  id: string;
  collaborationId: string;
  type: "HOURS" | "MILESTONE";
  status: string;
  hours: number | null;
}

/** Eén gedetecteerde uitschieter, per ingediende urenstaat. */
export interface HoursAnomaly {
  performanceId: string;
  /** Uren van de ingediende urenstaat. */
  hours: number;
  /** Mediaan van de eerder goedgekeurde urenstaten op dezelfde samenwerking. */
  baselineHours: number;
  /** Afgerond percentage boven de mediaan (bijv. 41 voor 41% meer). */
  deltaPct: number;
  /** Aantal goedgekeurde urenstaten waarop de baseline rust. */
  sampleSize: number;
}

/**
 * Mediaan van een niet-lege lijst getallen. Robuuster dan het gemiddelde tegen enkele uitschieters in
 * de historie zelf. Bij een even aantal het gemiddelde van de twee middelste waarden.
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const hi = sorted[mid] ?? 0;
  if (sorted.length % 2 !== 0) return hi;
  const lo = sorted[mid - 1] ?? hi;
  return (lo + hi) / 2;
}

/**
 * Bepaalt per samenwerking een baseline uit de GOEDGEKEURDE urenstaten (de door de opdrachtgever
 * geaccepteerde historie = betrouwbare grond) en markeert elke nog INGEDIENDE (`SUBMITTED`) urenstaat
 * die de mediaan met ≥ `HOURS_ANOMALY_THRESHOLD_PCT`% én ≥ `HOURS_ANOMALY_MIN_EXCESS_HOURS` uur
 * overstijgt. Alleen HOURS-prestaties met een bekend urenaantal doen mee; MILESTONE-opleveringen en
 * urenstaten zonder uren worden genegeerd. Een baseline-mediaan van 0 levert geen signaal (geen
 * zinvolle verhouding). Retourneert een map op prestatie-id zodat de UI per rij en per bulk-groep kan
 * opzoeken of er een uitschieter is.
 */
export function detectHoursAnomalies(
  rows: readonly PerformanceHoursRow[],
): Map<string, HoursAnomaly> {
  // Baseline-uren per samenwerking uit de goedgekeurde HOURS-urenstaten.
  const approvedByCollab = new Map<string, number[]>();
  for (const r of rows) {
    if (r.type !== "HOURS" || r.status !== "APPROVED" || r.hours == null) continue;
    const list = approvedByCollab.get(r.collaborationId);
    if (list) list.push(r.hours);
    else approvedByCollab.set(r.collaborationId, [r.hours]);
  }

  const anomalies = new Map<string, HoursAnomaly>();
  for (const r of rows) {
    if (r.type !== "HOURS" || r.status !== "SUBMITTED" || r.hours == null) continue;
    const sample = approvedByCollab.get(r.collaborationId);
    if (!sample || sample.length < HOURS_ANOMALY_MIN_SAMPLE) continue;

    const baseline = median(sample);
    if (baseline <= 0) continue;

    const excessHours = r.hours - baseline;
    const overThreshold = r.hours >= baseline * (1 + HOURS_ANOMALY_THRESHOLD_PCT / 100);
    if (overThreshold && excessHours >= HOURS_ANOMALY_MIN_EXCESS_HOURS) {
      anomalies.set(r.id, {
        performanceId: r.id,
        hours: r.hours,
        baselineHours: baseline,
        deltaPct: Math.round((r.hours / baseline - 1) * 100),
        sampleSize: sample.length,
      });
    }
  }

  return anomalies;
}

/** Compacte uren-weergave voor de UI: hele getallen zonder decimaal, anders max. 1 decimaal (nl-NL). */
export function formatHoursNl(hours: number): string {
  return Number.isInteger(hours)
    ? hours.toLocaleString("nl-NL")
    : hours.toLocaleString("nl-NL", { maximumFractionDigits: 1 });
}
