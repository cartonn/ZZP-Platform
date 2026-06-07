import { ShieldCheck, Check, ArrowRight } from "lucide-react";
import { type TrustResult, TRUST_LEVELS } from "@/lib/trust";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<(typeof TRUST_LEVELS)[number], string> = {
  BASIS: "Basis",
  DEELS: "Deels",
  VOLLEDIG: "Volledig",
};

/**
 * Maakt het (al berekende) vertrouwensniveau verklaarbaar: welke signalen tellen mee (✓) en — voor de
 * ZZP'er zelf — welke stap het niveau verhoogt (→). Toont nooit een black box; de regels zijn zichtbaar.
 * `self`: toon de verbeterstappen (missing). Voor kijkers laten we alleen de positieve onderbouwing zien.
 */
export function TrustExplanation({ trust, self = false }: { trust: TrustResult; self?: boolean }) {
  const stepIndex = TRUST_LEVELS.indexOf(trust.level);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-medium">
          Vertrouwensniveau: <span className="text-foreground">{trust.label}</span>
        </h2>
      </div>

      {/* Drie-stappen-voortgang: Basis → Deels → Volledig. */}
      <div className="mt-3 flex items-center gap-1.5" aria-hidden>
        {TRUST_LEVELS.map((lvl, i) => (
          <span
            key={lvl}
            className={cn("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        {TRUST_LEVELS.map((lvl) => (
          <span key={lvl} className={cn(lvl === trust.level && "font-medium text-foreground")}>
            {STEP_LABEL[lvl]}
          </span>
        ))}
      </div>

      {trust.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {trust.reasons.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm">
              <Check className="size-3.5 shrink-0 text-success" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      )}

      {self && trust.missing.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {trust.missing.length === 1 ? "Volgende stap" : "Volgende stappen"}
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {trust.missing.map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {self && trust.missing.length === 0 && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
          Je profiel is volledig geverifieerd — het sterkste signaal naar opdrachtgevers.
        </p>
      )}
    </section>
  );
}
