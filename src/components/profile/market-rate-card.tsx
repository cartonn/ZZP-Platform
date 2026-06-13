import { type MarketRateInsight } from "@/lib/market-rate";
import { MARKET_RATE_MIN_SAMPLE } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";

function formatEuro(value: number): string {
  return `€ ${value.toLocaleString("nl-NL")}`;
}

export function MarketRateCard({ insight }: { insight: MarketRateInsight }) {
  const { scope, sampleSize, median, p25, p75, position, ownRate } = insight;

  const scopeLabel =
    scope === "industry" ? "Vergelijkbare functies" : scope === "platform" ? "Platformbreed" : null;

  let positionBadge: { text: string; className: string } | null = null;
  let positionExplanation: string | null = null;

  if (!ownRate || ownRate <= 0 || position === "unknown") {
    positionExplanation = "Stel je uurtarief in om je positie te zien.";
  } else if (position === "below") {
    positionBadge = {
      text: "Onder de middenmoot",
      className:
        "inline-block rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning",
    };
    positionExplanation = "Je vraagt minder dan het merendeel — er is ruimte om te verhogen.";
  } else if (position === "within") {
    positionBadge = {
      text: "Binnen de middenmoot",
      className:
        "inline-block rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success",
    };
    positionExplanation = "Je tarief ligt in lijn met vergelijkbare ZZP'ers.";
  } else if (position === "above") {
    positionBadge = {
      text: "Boven de middenmoot",
      className:
        "inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
    };
    positionExplanation = "Je vraagt meer dan het merendeel — zorg dat je profiel dat onderbouwt.";
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          Jouw tarief vs. de markt
        </h2>

        {scope === "none" ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Nog niet genoeg vergelijkbare profielen voor een marktbeeld.
            </p>
            <p className="text-xs text-muted-foreground">
              Dit verschijnt zodra er meer ZZP&apos;ers met een tarief zijn ingesteld
              {sampleSize < MARKET_RATE_MIN_SAMPLE
                ? ` (${sampleSize} van ${MARKET_RATE_MIN_SAMPLE} nodig).`
                : "."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Mediaan groot, mono */}
            {median !== null && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mediaan
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                  {formatEuro(median)}/u
                </p>
              </div>
            )}

            {/* Bandbreedte */}
            {p25 !== null && p75 !== null && (
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                Middenmoot{" "}
                <span className="font-medium text-foreground">
                  {formatEuro(p25)}–{formatEuro(p75)}/u
                </span>
              </p>
            )}

            {/* Scope-label en sample */}
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

            {/* Eigen tarief */}
            {ownRate && ownRate > 0 && (
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                Jouw tarief:{" "}
                <span className="font-medium text-foreground">{formatEuro(ownRate)}/u</span>
              </p>
            )}

            {/* Positie */}
            {(positionBadge || positionExplanation) && (
              <div className="space-y-1 border-t border-border pt-3">
                {positionBadge && (
                  <span className={positionBadge.className}>{positionBadge.text}</span>
                )}
                {positionExplanation && (
                  <p className="text-xs text-muted-foreground">{positionExplanation}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground">
          Indicatief, geanonimiseerd op basis van ingestelde uurtarieven.
        </p>
      </CardContent>
    </Card>
  );
}
