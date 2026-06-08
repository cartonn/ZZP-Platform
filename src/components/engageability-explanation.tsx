import { Check, AlertTriangle, X } from "lucide-react";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { type EngageabilityResult } from "@/lib/engageability";

/**
 * Verklaart de inzetbaarheidsstatus: wat blokkeert (verplichte docs), wat aandacht vraagt en wat in
 * orde is. Verklaarbaar i.p.v. een kale kleur (noord-ster). `self` past de copy aan voor de ZZP'er
 * zelf ("je …") versus de franchise-oversight ("…").
 */
export function EngageabilityExplanation({
  result,
  self = false,
}: {
  result: EngageabilityResult;
  self?: boolean;
}) {
  const { blockers, attention, reasons } = result;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <EngageabilityBadge status={result.status} />
        {result.status === "ACTIEF" && (
          <span className="text-xs text-muted-foreground">
            {self ? "Je bent inzetbaar voor opdrachten." : "Inzetbaar voor opdrachten."}
          </span>
        )}
      </div>

      {blockers.length > 0 && (
        <ul className="space-y-1">
          {blockers.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-danger">
              <X className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {attention.length > 0 && (
        <ul className="space-y-1">
          {attention.map((a) => (
            <li key={a} className="flex items-start gap-2 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}

      {reasons.length > 0 && (
        <ul className="space-y-1">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
