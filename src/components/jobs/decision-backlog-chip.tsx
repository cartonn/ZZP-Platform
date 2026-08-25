import { LevelChip } from "@/components/jobs/signal-chips";
import { type JobDecisionChip } from "@/lib/candidate-decision";

const TONE_DOT: Record<JobDecisionChip["tone"], string> = {
  warning: "bg-warning",
  muted: "bg-muted-foreground",
};

/**
 * Compacte beslis-achterstand-chip voor de opdracht-kaart in "Mijn opdrachten": dot + kop, kleur
 * volgt de server-side toon (`jobDecisionChip`). Presentationeel — berekent niets en toont nooit
 * kandidaatgegevens. De volledige kandidatenlijst staat op /kandidaten.
 */
export function DecisionBacklogChip({ chip }: { chip: JobDecisionChip }) {
  return <LevelChip dotClass={TONE_DOT[chip.tone]} label={chip.label} />;
}
