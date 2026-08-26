import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { type FreelancerComplianceSignal } from "@/lib/job-dba-freelancer";
import { rechtsvermoedenHint } from "@/lib/rechtsvermoeden";

/**
 * ZZP'er-gericht blok voor Wet-DBA-risico + rechtsvermoeden-drempel op de opdracht-detailpagina.
 * Spiegelbeeld van het owner-only blok, maar met tekst gericht op de ZZP'er. Puur presentationeel;
 * de aanroeper bepaalt met `buildFreelancerComplianceSignal` of er iets te tonen valt.
 */
export function FreelancerComplianceBlock({ signal }: { signal: FreelancerComplianceSignal }) {
  if (!signal.dbaLevel && !signal.rateBelowThreshold) return null;

  return (
    <section className="space-y-2 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Zelfstandigheid & Wet DBA
        </h2>
        {signal.dbaLevel && <DbaRiskBadge level={signal.dbaLevel} />}
      </div>

      {signal.dbaLevel && signal.dbaMessage && (
        <p className="text-xs text-muted-foreground">{signal.dbaMessage}</p>
      )}

      {signal.rateBelowThreshold && (
        <div className="space-y-1.5 rounded-md border border-warning/40 bg-warning/5 p-3">
          <p className="text-xs font-medium text-warning">Rechtsvermoeden werknemerschap</p>
          <p className="text-xs text-muted-foreground">{rechtsvermoedenHint()}</p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70">Hulpmiddel, geen juridisch advies.</p>
    </section>
  );
}
