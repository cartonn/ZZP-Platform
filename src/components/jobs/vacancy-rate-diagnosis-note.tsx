import { Wallet } from "lucide-react";
import { type VacancyRateDiagnosis } from "@/lib/vacancy-rate-diagnosis";

/**
 * Compacte tarief-diagnose-notitie onder de vacaturetempo-chip in "Mijn opdrachten": legt bij een
 * koud lopende opdracht uit dát — en met hoeveel — de geboden bovengrens onder het markttarief ligt.
 * Presentationeel: berekent niets (server-side `diagnoseVacancyRate` is de waarheid) en toont alleen
 * geaggregeerde marktstatistiek, nooit een individueel tarief van een ZZP'er.
 */
export function VacancyRateDiagnosisNote({ diagnosis }: { diagnosis: VacancyRateDiagnosis }) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-warning">
      <Wallet className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{diagnosis.hint}</span>
    </div>
  );
}
