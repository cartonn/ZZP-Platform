import { MARKET_RATE_MIN_SAMPLE } from "@/lib/config";
import { ratePosition, type MarketBand } from "@/lib/market-rate";

function formatEuro(value: number): string {
  return `€ ${value.toLocaleString("nl-NL")}`;
}

/**
 * Toont de geanonimiseerde marktband voor de gekozen functie naast het tarief dat de
 * opdrachtgever instelt. Presentationeel — de band is server-side berekend; deze
 * component vergelijkt alleen het ingevulde minimumtarief met de band (afgeleid signaal,
 * geen beslissing).
 */
export function JobRateBandCard({
  band,
  rateMin,
}: {
  band: MarketBand;
  /** Het ingevulde minimumtarief in euro, of null wanneer leeg. */
  rateMin: number | null;
}) {
  const { scope, sampleSize, median, p25, p75 } = band;

  const scopeLabel =
    scope === "industry" ? "Vergelijkbare functies" : scope === "platform" ? "Platformbreed" : null;

  const position = ratePosition(p25, p75, rateMin);

  let assessment: { text: string; className: string } | null = null;
  if (scope !== "none") {
    if (position === "below") {
      assessment = {
        text: "Je minimumtarief ligt onder de middenmoot. Een hoger tarief vergroot de kans op goede reacties.",
        className: "text-warning",
      };
    } else if (position === "within") {
      assessment = {
        text: "Je tarief ligt in lijn met de markt voor deze functie.",
        className: "text-success",
      };
    } else if (position === "above") {
      assessment = {
        text: "Je tarief ligt boven de middenmoot — aantrekkelijk voor ZZP'ers.",
        className: "text-muted-foreground",
      };
    } else {
      assessment = {
        text: "Vul een minimumtarief in om te zien hoe je aanbod zich tot de markt verhoudt.",
        className: "text-muted-foreground",
      };
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Markttarief voor deze functie
      </p>

      {scope === "none" ? (
        <p className="text-sm text-muted-foreground">
          Nog niet genoeg vergelijkbare profielen voor een marktbeeld
          {sampleSize < MARKET_RATE_MIN_SAMPLE
            ? ` (${sampleSize} van ${MARKET_RATE_MIN_SAMPLE} nodig).`
            : "."}
        </p>
      ) : (
        <div className="space-y-2">
          {median !== null && (
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
              {formatEuro(median)}/u
              <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                mediaan
              </span>
            </p>
          )}
          {p25 !== null && p75 !== null && (
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              Middenmoot{" "}
              <span className="font-medium text-foreground">
                {formatEuro(p25)}–{formatEuro(p75)}/u
              </span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {scopeLabel && (
              <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {scopeLabel}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Op basis van {sampleSize} profiel{sampleSize !== 1 ? "en" : ""}
            </span>
          </div>
          {assessment && <p className={`text-xs ${assessment.className}`}>{assessment.text}</p>}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Indicatief, geanonimiseerd op basis van ingestelde uurtarieven van ZZP&apos;ers.
      </p>
    </div>
  );
}
