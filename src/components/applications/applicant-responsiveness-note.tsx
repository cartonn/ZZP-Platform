import { MailCheck } from "lucide-react";
import { type ClientResponsiveness } from "@/lib/client-responsiveness";
import { describeApplicantResponsiveness } from "@/lib/client-responsiveness";

/**
 * Subtiele context onder een nog-openstaande reactiekaart: pakt deze opdrachtgever reacties doorgaans
 * op, of blijft er veel liggen? Helpt de ZZP'er beslissen om door te wachten of verder te kijken.
 * Rendert niets bij een neutraal of te-dun signaal (dan voegt een boodschap niets toe). Toont
 * uitsluitend het geaggregeerde signaal — nooit een reactie van een andere ZZP'er.
 */
export function ApplicantResponsivenessNote({
  responsiveness,
}: {
  responsiveness: ClientResponsiveness;
}) {
  const note = describeApplicantResponsiveness(responsiveness);
  if (!note) return null;

  const tone = note.tone === "good" ? "text-muted-foreground" : "text-warning";
  return (
    <p className={`mt-2 flex items-center gap-x-1.5 text-xs ${tone}`}>
      <MailCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{note.label}</span>
    </p>
  );
}
