import Link from "next/link";
import { Clock } from "lucide-react";
import { type ApplicationWait } from "@/lib/application-wait";
import { type Translator } from "@/lib/i18n/server";

// Fase-bewuste duiding voor een reactie die langer dan gebruikelijk onbeslist ligt. Eerlijk en
// constructief: benoemt de wachttijd en wijst naar de logische volgende stap (andere opdrachten),
// nooit alarmerend. Server-gerenderd; `t` valt terug op de NL-brontekst.
function waitLead(wait: ApplicationWait, t: Translator): string {
  const days = `${wait.daysWaiting} ${wait.daysWaiting === 1 ? t("dag") : t("dagen")}`;
  switch (wait.stage) {
    case "NEW":
      return `${t("Nog niet bekeken na")} ${days}`;
    case "VIEWED":
      return `${days} ${t("in behandeling")}`;
    case "SHORTLIST":
      return `${days} ${t("op de shortlist")}`;
  }
}

/**
 * Toont een subtiel wachttijd-signaal onder een reactiekaart, uitsluitend wanneer de reactie aandacht
 * vraagt (langer dan gebruikelijk onbeslist). Bij een verse reactie rendert dit niets — de kaart blijft
 * rustig. De ZZP'er ziet zo in één oogopslag welke reactie blijft liggen en kan meteen verder kijken.
 */
export function WaitSignal({ wait, t }: { wait: ApplicationWait; t: Translator }) {
  if (!wait.attention) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-warning">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{waitLead(wait, t)}</span>
      <span className="text-muted-foreground">·</span>
      <Link
        href="/opdrachten"
        className="focus-ring rounded-sm font-medium underline-offset-2 hover:underline"
      >
        {t("Bekijk andere opdrachten")}
      </Link>
    </p>
  );
}
