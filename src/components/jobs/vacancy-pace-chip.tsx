import { LevelChip } from "@/components/jobs/signal-chips";
import { type VacancyPerformanceSummary } from "@/lib/job-vacancy-performance";

const TONE_DOT: Record<VacancyPerformanceSummary["tone"], string> = {
  positive: "bg-success",
  neutral: "bg-muted-foreground",
  warning: "bg-warning",
};

/**
 * Compacte vacaturetempo-chip voor de opdracht-kaart in "Mijn opdrachten": dot + kop, kleur volgt
 * de server-side toon (`summarizeVacancyPerformance`). Presentationeel — berekent niets en toont
 * nooit kandidaatgegevens. De volledige uitleg staat op de opdracht-detailpagina.
 */
export function VacancyPaceChip({ summary }: { summary: VacancyPerformanceSummary }) {
  return <LevelChip dotClass={TONE_DOT[summary.tone]} label={summary.headline} />;
}
