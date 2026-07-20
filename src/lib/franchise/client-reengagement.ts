// Re-engagement-hint per klant voor de bemiddelaar (franchiser) op de klant-detailpagina
// (`/franchise/opdrachtgevers/[id]`). De relatiegezondheid (`classifyClientHealth`) staat al op de
// klantenlijst, maar verdween zodra de bemiddelaar op één klant doorklikte — precies het scherm waar
// hij besluit wat hij met die relatie doet. Deze pure helper vertaalt dezelfde gezondheidsstatus naar
// één verklarende regel + een concrete volgende stap ("stilgevallen → benader / stel een dienst voor"),
// zodat het detail dezelfde vraag beantwoordt als de rest van het platform: wat is de status, en wat
// moet ik nu doen? Geen I/O, `now` geïnjecteerd → deterministisch en los getest (CLAUDE.md regel 1:
// de server bepaalt de waarheid, de client toont enkel de afleiding).

import { plural } from "@/lib/plural";
import {
  classifyClientHealth,
  wholeDaysBetween,
  type ClientActivityInput,
  type ClientHealth,
} from "./client-health";

export interface ClientReengagement {
  status: ClientHealth;
  tone: "success" | "warning" | "muted";
  /** Verklarende regel: hoe staat deze relatie ervoor? */
  headline: string;
  /** Concrete volgende stap; `null` wanneer er niets te doen valt (actieve klant). */
  suggestion: string | null;
  /** Dagen sinds de laatste opdracht/plaatsing (of, bij nooit-plaatsen, de aanmelding). */
  daysIdle: number;
}

/**
 * Bouwt de re-engagement-hint uit dezelfde `ClientActivityInput` + `classifyClientHealth` als de lijst,
 * zodat lijst en detail nooit een andere status tonen. `now` wordt geïnjecteerd (puur/testbaar).
 */
export function clientReengagement(input: ClientActivityInput, now: Date): ClientReengagement {
  const status = classifyClientHealth(input, now);
  const reference = input.lastActivityAt ?? input.createdAt;
  const daysIdle = wholeDaysBetween(reference, now);

  switch (status) {
    case "active": {
      const parts: string[] = [];
      if (input.publishedJobCount > 0) {
        parts.push(plural(input.publishedJobCount, "open opdracht", "open opdrachten"));
      }
      if (input.activeCollaborationCount > 0) {
        parts.push(
          plural(input.activeCollaborationCount, "lopende plaatsing", "lopende plaatsingen"),
        );
      }
      return {
        status,
        tone: "success",
        headline: parts.length > 0 ? `Plaatst nu werk — ${parts.join(" · ")}.` : "Plaatst nu werk.",
        suggestion: null,
        daysIdle,
      };
    }
    case "attention":
      return {
        status,
        tone: "warning",
        headline: `Stilgevallen — ${plural(daysIdle, "dag", "dagen")} geen nieuwe opdracht of plaatsing.`,
        suggestion: "Neem contact op of stel een nieuwe dienst voor om de relatie warm te houden.",
        daysIdle,
      };
    case "quiet":
      return {
        status,
        tone: "muted",
        headline: input.lastActivityAt
          ? `Rustig — ${plural(daysIdle, "dag", "dagen")} geen nieuwe opdracht of plaatsing.`
          : "Recent aangemeld, plaatst nog niets.",
        suggestion: "Nog geen actie nodig; stel gerust een eerste dienst voor als het past.",
        daysIdle,
      };
  }
}
