// Tweezijdige beoordelingen na een voltooide samenwerking. Deterministisch en uitlegbaar.
// Opdrachtgever beoordeelt de ZZP'er; ZZP'er beoordeelt de opdrachtgever.
// Pure functies, geen I/O, server-side waarheid. Getest in reviews.test.ts.

import { z } from "zod";

// Richtingen: wie beoordeelt wie
export const REVIEW_DIRECTIONS = ["CLIENT_ON_FREELANCER", "FREELANCER_ON_CLIENT"] as const;
export type ReviewDirection = (typeof REVIEW_DIRECTIONS)[number];

// Statussen van het double-blind reveal-model (simultane onthulling). PENDING_REVEAL = ingediend en
// gelockt, maar onzichtbaar voor de tegenpartij; PUBLISHED = onthuld (beide ingediend óf venster dicht).
export const REVIEW_STATUSES = ["PENDING_REVEAL", "PUBLISHED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// Standaard blinde venster in dagen na afronding. Overschrijfbaar via env REVIEW_BLIND_DAYS (config.ts).
export const DEFAULT_REVIEW_BLIND_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

// Sluitmoment van het blinde venster: anker (afrondingsmoment van de samenwerking) + blinde dagen.
// Bij óf beide ingediend óf dit moment publiceren de beoordeling(en) — wat eerder komt.
export function reviewWindowCloses(completionAnchor: Date, blindDays: number): Date {
  return new Date(completionAnchor.getTime() + blindDays * DAY_MS);
}

// Of het venster op `now` (nog) open is. Ná sluiting kan niemand meer beoordelen — dat is precies de
// hendel die vergelding voorkomt: wie de gepubliceerde beoordeling ziet, kan zelf niet meer indienen.
export function reviewWindowOpen(windowCloses: Date, now: Date): boolean {
  return now.getTime() <= windowCloses.getTime();
}

// Tweede indiening → directe wederzijdse onthulling (beide beoordelingen worden PUBLISHED).
export function isMutualReveal(counterpartHasSubmitted: boolean): boolean {
  return counterpartHasSubmitted;
}

// Cron-beslisregel: een nog-niet-onthulde beoordeling waarvan het venster verstreken is, publiceert
// (ook eenzijdig — die ene beoordeling wordt dan gewoon zichtbaar).
export function isRevealDue(status: string, revealDeadline: Date, now: Date): boolean {
  return status === "PENDING_REVEAL" && revealDeadline.getTime() <= now.getTime();
}

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const REVIEW_COMMENT_MAX = 1000;

// Zod-schema voor het beoordelingsformulier. rating wordt geforceerd naar een int 1..5;
// comment is optioneel, getrimd, max REVIEW_COMMENT_MAX tekens; lege string => undefined.
export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX)
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

// Richting o.b.v. de rol van de auteur. "CLIENT" beoordeelt de ZZP'er, "FREELANCER" de opdrachtgever.
export function reviewDirection(authorRole: "FREELANCER" | "CLIENT"): ReviewDirection {
  return authorRole === "CLIENT" ? "CLIENT_ON_FREELANCER" : "FREELANCER_ON_CLIENT";
}

export interface CanLeaveReviewInput {
  collaborationStatus: string; // CollaborationStatus: PROPOSED | ACTIVE | COMPLETED | CANCELLED
  isParticipant: boolean;
  alreadyReviewed: boolean;
  windowClosed?: boolean; // double-blind: ná venstersluiting kan niet meer beoordeeld worden
}

// true alleen als de samenwerking COMPLETED is, de viewer deelnemer is, nog niet beoordeeld heeft
// én het blinde venster nog open is. Het venster-slot voorkomt het retaliatielek: kon je ná sluiting
// (= ná publicatie) nog beoordelen, dan zou je de beoordeling van de ander al gezien kunnen hebben.
export function canLeaveReview(input: CanLeaveReviewInput): boolean {
  return (
    input.collaborationStatus === "COMPLETED" &&
    input.isParticipant &&
    !input.alreadyReviewed &&
    !input.windowClosed
  );
}

export interface ReviewAggregate {
  count: number;
  average: number; // 0 als count 0; anders afgerond op 1 decimaal (Math.round(x*10)/10)
  distribution: Record<1 | 2 | 3 | 4 | 5, number>; // aantal per sterwaarde; alle 5 sleutels altijd aanwezig
}

// Aggregatie over ruwe rijen. Ratings buiten 1..5 worden genegeerd in distribution maar
// average wordt berekend over alle geldige (1..5) ratings. Lege invoer => count 0, average 0,
// distribution met alle waarden 0.
export function aggregateReviews(rows: { rating: number }[]): ReviewAggregate {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const valid = rows.filter((r) => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);

  for (const row of valid) {
    distribution[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }

  const count = valid.length;
  if (count === 0) {
    return { count: 0, average: 0, distribution };
  }

  const sum = valid.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / count) * 10) / 10;

  return { count, average, distribution };
}

// NL-notatie met komma en 1 decimaal, bv. 4.7 => "4,7", 5 => "5,0". Gebruik toLocaleString("nl-NL", ...).
export function formatRating(average: number): string {
  return average.toLocaleString("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
