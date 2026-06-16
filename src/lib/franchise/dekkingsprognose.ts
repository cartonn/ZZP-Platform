// Vooruitkijkende dekkingsprognose voor de franchiser: welke aankomende periodes dreigen
// onderbezet? Per-opdrachtgever dekking (fillRate) bestaat al via buildCompanyBreakdown op
// /inzicht; dit is de ontbrekende, op periode vooruitkijkende kant.
//
// Pure functie — geen DB/IO, deterministisch, los unit-getest. De aanroeper levert de
// gepubliceerde diensten met dezelfde "filled" (een ACTIVE samenwerking) / "published"
// definitie als /franchise/diensten; hier bucketen we alleen de onbezette (open) diensten
// naar ISO-week-grenzen (maandag-start). Geen nieuwe drempels: alleen weekgrenzen.

const DAY_MS = 86_400_000;

export type PrognoseBucketKey = "DEZE_WEEK" | "VOLGENDE_WEEK" | "LATER" | "GEEN_DATUM";

/** Eén dienst zoals /franchise/diensten hem al berekent. Alleen PUBLISHED diensten aanleveren. */
export type DekkingsprognoseInput = {
  startDate: Date | null;
  /** Gevuld = er loopt een ACTIVE samenwerking (zelfde definitie als de diensten-lijst). */
  filled: boolean;
};

export type DekkingsprognoseBucket = {
  key: PrognoseBucketKey;
  label: string;
  openCount: number;
};

export type Dekkingsprognose = {
  buckets: DekkingsprognoseBucket[];
  /** Totaal aantal open (onbezette) gepubliceerde diensten. */
  totalOpen: number;
  /**
   * Aantal dagen tot de eerstvolgende open dienst met een startdatum (0 als die nu/in het
   * verleden ligt). null als er geen open dienst met datum is.
   */
  soonestOpenDays: number | null;
};

const BUCKET_LABELS: Record<PrognoseBucketKey, string> = {
  DEZE_WEEK: "Deze week",
  VOLGENDE_WEEK: "Volgende week",
  LATER: "Later",
  GEEN_DATUM: "Geen startdatum",
};

const BUCKET_ORDER: PrognoseBucketKey[] = ["DEZE_WEEK", "VOLGENDE_WEEK", "LATER", "GEEN_DATUM"];

/** Begin (maandag, 00:00 lokaal) van de ISO-week waarin `d` valt. */
function startOfIsoWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // getDay(): 0=zondag..6=zaterdag. ISO-week start op maandag.
  const offset = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

function bucketFor(startDate: Date, now: Date): Exclude<PrognoseBucketKey, "GEEN_DATUM"> {
  const thisWeekStart = startOfIsoWeek(now).getTime();
  const nextWeekStart = thisWeekStart + 7 * DAY_MS;
  const weekAfterStart = nextWeekStart + 7 * DAY_MS;
  const t = startDate.getTime();
  // Een open dienst met een startdatum in het verleden is acuut → telt mee in DEZE_WEEK.
  if (t < nextWeekStart) return "DEZE_WEEK";
  if (t < weekAfterStart) return "VOLGENDE_WEEK";
  return "LATER";
}

/**
 * Bucket de onbezette (PUBLISHED && !filled) diensten naar aankomende periode en lever een
 * forecast. Lege input → totalOpen 0, soonestOpenDays null. Buckets zonder open diensten worden
 * weggelaten zodat de UI alleen toont wat aandacht vraagt.
 */
export function buildDekkingsprognose(
  diensten: DekkingsprognoseInput[],
  now: Date,
): Dekkingsprognose {
  const counts: Record<PrognoseBucketKey, number> = {
    DEZE_WEEK: 0,
    VOLGENDE_WEEK: 0,
    LATER: 0,
    GEEN_DATUM: 0,
  };
  let totalOpen = 0;
  let soonestTime: number | null = null;

  for (const d of diensten) {
    if (d.filled) continue; // alleen onbezette diensten tellen
    totalOpen += 1;
    if (d.startDate == null) {
      counts.GEEN_DATUM += 1;
      continue;
    }
    counts[bucketFor(d.startDate, now)] += 1;
    const t = d.startDate.getTime();
    if (soonestTime == null || t < soonestTime) soonestTime = t;
  }

  const buckets = BUCKET_ORDER.filter((k) => counts[k] > 0).map((key) => ({
    key,
    label: BUCKET_LABELS[key],
    openCount: counts[key],
  }));

  const soonestOpenDays =
    soonestTime == null ? null : Math.max(0, Math.floor((soonestTime - now.getTime()) / DAY_MS));

  return { buckets, totalOpen, soonestOpenDays };
}
