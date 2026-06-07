import { MATCH_COMPONENT_MAX, type MatchResult } from "@/lib/matching";

const ROWS: { key: keyof MatchResult["breakdown"]; label: string }[] = [
  { key: "skills", label: "Vaardigheden" },
  { key: "compliance", label: "Certificaten" },
  { key: "rate", label: "Tarief" },
  { key: "workMode", label: "Werkmodus" },
  { key: "location", label: "Locatie" },
];

/**
 * Maakt de matchscore verklaarbaar: toont per component (vaardigheden, certificaten, tarief,
 * werkmodus, locatie) hoeveel van de maximaal haalbare punten zijn behaald. De som van de
 * componenten is de totaalscore — geen black box, dezelfde server-side weging (MATCH_COMPONENT_MAX).
 */
export function MatchBreakdown({ breakdown }: { breakdown: MatchResult["breakdown"] }) {
  return (
    <dl className="space-y-2">
      {ROWS.map(({ key, label }) => {
        const value = breakdown[key];
        const max = MATCH_COMPONENT_MAX[key];
        const pct = max > 0 ? Math.round((value / max) * 100) : 0;
        return (
          <div key={key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <div className="h-1.5 rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <dd className="text-xs tabular-nums text-muted-foreground">
              {value} / {max}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
