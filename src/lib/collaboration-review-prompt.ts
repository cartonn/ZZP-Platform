// Next-action-signaal: nodig een partij uit om een afgeronde samenwerking te beoordelen zolang het
// blinde venster nog open is. Puur en deterministisch (geen I/O) — de server-enumerator
// (actions/pending-tasks.ts) levert de primitieven aan, de takenlijst en de detailpagina delen
// exact dezelfde eligibiliteit (`canLeaveReview` + `reviewWindowCloses`) zodat ze nooit tegenspreken.
//
// Waarom: het tweezijdige reputatiesysteem (beoordelingen) raakt alleen gevuld als beide partijen
// daadwerkelijk beoordelen. Zonder een nudge bleef de beoordeling stil op het samenwerkingsdetail
// staan en werd het venster vaak eenzijdig/ongebruikt gesloten. Benchmark: Malt/Temper/Deel vragen
// actief om een beoordeling na afronding — dat maakt vertrouwen zichtbaar voor de volgende match.

import { canLeaveReview, reviewWindowCloses, reviewWindowOpen } from "@/lib/reviews";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewPromptInput {
  /** CollaborationStatus: PROPOSED | ACTIVE | COMPLETED | CANCELLED. Alleen COMPLETED is eligible. */
  collaborationStatus: string;
  /** Afrondingsmoment (fallback createdAt voor legacy-rijen) — anker van het blinde venster. */
  completionAnchor: Date;
  /** Heeft de bekijker (de actor) deze samenwerking al beoordeeld? Uit @@unique([collab, author]). */
  alreadyReviewedByActor: boolean;
  /** Blinde-venster-lengte in dagen (config: reviewBlindDays()). */
  blindDays: number;
  now: Date;
}

export interface ReviewPromptResult {
  /** Hele dagen tot venstersluiting (≥ 0). 0 = sluit vandaag. */
  daysLeft: number;
}

/**
 * Geeft een prompt-resultaat terug als de actor deze samenwerking nog kan/moet beoordelen — precies
 * dezelfde conditie die de detailpagina gebruikt om het `ReviewForm` te tonen (COMPLETED + deelnemer +
 * nog niet beoordeeld + venster open). `null` zodra één daarvan niet geldt, zodat de takenlijst het
 * formulier op detail nooit tegenspreekt. De actor is per query altijd deelnemer (isParticipant=true).
 */
export function reviewPromptForCollaboration(input: ReviewPromptInput): ReviewPromptResult | null {
  const windowCloses = reviewWindowCloses(input.completionAnchor, input.blindDays);
  const windowIsOpen = reviewWindowOpen(windowCloses, input.now);

  const eligible = canLeaveReview({
    collaborationStatus: input.collaborationStatus,
    isParticipant: true,
    alreadyReviewed: input.alreadyReviewedByActor,
    windowClosed: !windowIsOpen,
  });
  if (!eligible) return null;

  const msLeft = windowCloses.getTime() - input.now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));
  return { daysLeft };
}
