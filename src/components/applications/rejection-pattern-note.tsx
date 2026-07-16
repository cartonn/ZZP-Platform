import { Lightbulb } from "lucide-react";
import { type RejectionPattern } from "@/lib/rejection-pattern";
import { type Translator } from "@/lib/i18n/server";

/**
 * Één actiegericht patroon-inzicht boven de reactielijst: welke afwijzingsreden komt het vaakst
 * terug, en wat kan de ZZP'er eraan doen? Tilt de losse per-reactie-feedback naar een leerbaar
 * signaal zonder te ontmoedigen. Rendert niets zonder betekenisvol patroon (`pattern === null`) —
 * dan blijft het scherm rustig. Server-gerenderd; `t` valt terug op de NL-brontekst. Toont
 * uitsluitend een geaggregeerd oordeel over de eigen reacties — nooit een individuele opdrachtgever.
 */
export function RejectionPatternNote({
  pattern,
  t,
}: {
  pattern: RejectionPattern | null;
  t: Translator;
}) {
  if (!pattern) return null;

  const timesLabel = `${pattern.count}× ${t("genoemd")}`;

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t("Terugkerende reden bij je afwijzingen:")} {t(pattern.label)}{" "}
            <span className="font-normal text-muted-foreground">({timesLabel})</span>
          </p>
          <p className="text-xs text-muted-foreground">{t(pattern.advice)}</p>
        </div>
      </div>
    </div>
  );
}
