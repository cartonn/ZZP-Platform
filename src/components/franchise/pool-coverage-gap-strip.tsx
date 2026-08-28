import { ShieldAlert, ScrollText, Wrench } from "lucide-react";
import {
  poolCoverageGapHeadline,
  type CoverageGap,
  type PoolCoverageGap,
} from "@/lib/franchise/pool-coverage-gap";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { plural } from "@/lib/plural";

/** Aantal gaten dat we tonen; de rest telt de restregel. Houdt de strip compact (rust boven ruis). */
const MAX_ROWS = 6;

function ratioLabel(gap: CoverageGap): string {
  if (gap.qualifiedInPool === 0) {
    return `${plural(gap.openDienstCount, "open dienst", "open diensten")} · niemand in je pool`;
  }
  return `${plural(gap.openDienstCount, "open dienst", "open diensten")} · ${plural(
    gap.qualifiedInPool,
    "vakmens",
    "vakmensen",
  )} in je pool`;
}

/**
 * Pool-dekkingsgat voor de bemiddelaar boven het ZZP'er-roster. Antwoordt op "waar moet ik op werven?"
 * met de gevraagde certificaten/vaardigheden die de open diensten van de tenant vereisen maar die de
 * pool (nog) niet dekt. Presentationeel — al het telwerk gebeurt server-side in `computePoolCoverageGap`.
 * Rendert niets wanneer de pool alle vraag dekt: de bemiddelaar hoeft dan niets te zien (DESIGN.md).
 */
export function PoolCoverageGapStrip({ result }: { result: PoolCoverageGap }) {
  if (result.gaps.length === 0) return null;

  const headline = poolCoverageGapHeadline(result);
  const rows = result.gaps.slice(0, MAX_ROWS);
  const overflow = result.gaps.length - rows.length;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start gap-2">
        <ShieldAlert
          className={`mt-0.5 size-4 shrink-0 ${result.criticalCount > 0 ? "text-danger" : "text-warning"}`}
          aria-hidden
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Pool-dekking</p>
          {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((gap) => {
          const Icon = gap.kind === "credential" ? ScrollText : Wrench;
          return (
            <li
              key={`${gap.kind}:${gap.key}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{gap.label}</span>
              </span>
              <Badge
                variant={gap.severity === "none" ? "danger" : "warning"}
                className="shrink-0 whitespace-nowrap"
              >
                {ratioLabel(gap)}
              </Badge>
            </li>
          );
        })}
      </ul>
      {overflow > 0 && (
        <p className="text-xs text-muted-foreground">
          {`+${plural(overflow, "ander gevraagd item", "andere gevraagde items")} met te weinig dekking`}
        </p>
      )}
    </Card>
  );
}
