import Link from "next/link";
import { Users } from "lucide-react";
import { type ApplicationCompetitionNote } from "@/lib/application-competition";
import { type Translator } from "@/lib/i18n/server";

/**
 * Subtiele concurrentie-context onder een nog-openstaande reactiekaart: hoeveel andere kandidaten
 * concurreren met de ZZP'er op deze opdracht, en wat dat betekent voor de keuze "blijven wachten of
 * breder kijken". Rendert niets zonder note (reeds besliste reactie). Toont uitsluitend het
 * geaggregeerde aantal — nooit de identiteit of reactie van een andere ZZP'er. Bij veel concurrentie
 * wijst de tip rustig naar andere opdrachten (dezelfde constructieve richting als het wacht-signaal).
 */
export function ApplicationCompetitionNote({
  note,
  t,
}: {
  note: ApplicationCompetitionNote;
  t: Translator;
}) {
  const tone =
    note.tone === "caution"
      ? "text-warning"
      : note.tone === "positive"
        ? "text-success"
        : "text-muted-foreground";

  return (
    <p className={`mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs ${tone}`}>
      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-medium">{t(note.label)}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{t(note.hint)}</span>
      {note.tone === "caution" && (
        <>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/opdrachten"
            className="focus-ring rounded-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            {t("Bekijk andere opdrachten")}
          </Link>
        </>
      )}
    </p>
  );
}
