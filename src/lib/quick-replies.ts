import { type UserRole } from "@/lib/enums";

/**
 * Snelle antwoorden: gecureerde, deterministische standaardzinnen die de berichten-composer
 * prefillen zodat ZZP'er, opdrachtgever en bemiddelaar sneller kunnen reageren. Puur
 * presentationeel — dit is een invulhulp, geen mutatie: de gekozen zin gaat door dezelfde
 * `sendMessage`-actie (auth → participant-check → validatie) als elk handmatig bericht.
 * Rol- en context-bewust (opener vs. vervolg, wel/niet aan een opdracht gekoppeld), nooit
 * afhankelijk van de inhoud van de tegenpartij.
 */

export interface QuickReply {
  /** Stabiele sleutel (React-key + testanker). */
  id: string;
  /** Korte chip-tekst (knop-label). */
  label: string;
  /** Volledige zin die in de composer wordt geplaatst. */
  text: string;
}

export interface QuickReplyContext {
  /** Rol van de kijker (bepaalt de toon en de standaardzinnen). */
  role: UserRole;
  /** Is dit gesprek aan een opdracht gekoppeld? Voegt een opdracht-refererende opener toe. */
  hasJob: boolean;
  /** Nog geen berichten in de thread → opener; anders vervolgantwoord. */
  isOpener: boolean;
}

/** Maximaal aantal chips (rustig houden — Linear/Stripe-minimalisme, geen muur van knoppen). */
export const QUICK_REPLY_MAX = 4;

const OPENERS: Record<UserRole, QuickReply[]> = {
  FREELANCER: [
    {
      id: "fl-open-interest",
      label: "Interesse tonen",
      text: "Bedankt voor je bericht — ik ben geïnteresseerd. Wanneer zou je willen starten?",
    },
    {
      id: "fl-open-available",
      label: "Beschikbaar",
      text: "Ik ben beschikbaar. Zullen we kort afstemmen?",
    },
    {
      id: "fl-open-details",
      label: "Meer info vragen",
      text: "Kun je me wat meer vertellen over de opdracht en het rooster?",
    },
    {
      id: "fl-open-rate",
      label: "Tarief bespreken",
      text: "Ik hoor graag de details; dan bevestig ik mijn beschikbaarheid en tarief.",
    },
  ],
  CLIENT: [
    {
      id: "cl-open-thanks",
      label: "Reactie bedanken",
      text: "Bedankt voor je reactie! Ben je beschikbaar om kort kennis te maken?",
    },
    {
      id: "cl-open-start",
      label: "Startdatum vragen",
      text: "Leuk dat je interesse hebt. Wanneer zou je kunnen starten?",
    },
    {
      id: "cl-open-confirm",
      label: "Gegevens bevestigen",
      text: "Kun je je beschikbaarheid en tarief bevestigen?",
    },
    {
      id: "cl-open-fit",
      label: "Toelichting vragen",
      text: "Kun je kort toelichten waarom deze opdracht bij je past?",
    },
  ],
  FRANCHISER: [
    {
      id: "fr-open-match",
      label: "Opdracht aanbieden",
      text: "Bedankt voor je bericht. Ik heb een passende opdracht — heb je interesse?",
    },
    {
      id: "fr-open-available",
      label: "Beschikbaarheid vragen",
      text: "Ben je de komende periode beschikbaar voor nieuwe opdrachten?",
    },
    {
      id: "fr-open-docs",
      label: "Gegevens bevestigen",
      text: "Kun je je actuele beschikbaarheid en certificaten bevestigen?",
    },
    {
      id: "fr-open-intro",
      label: "Kennismaken",
      text: "Ik help je graag aan passend werk. Zullen we kort kennismaken?",
    },
  ],
  ADMIN: [
    {
      id: "ad-open-look",
      label: "In behandeling",
      text: "Bedankt voor je bericht. Ik kijk ernaar en kom er zo snel mogelijk op terug.",
    },
    {
      id: "ad-open-info",
      label: "Meer info vragen",
      text: "Kun je wat meer details delen zodat ik je goed kan helpen?",
    },
  ],
};

const FOLLOWUPS: Record<UserRole, QuickReply[]> = {
  FREELANCER: [
    {
      id: "fl-fu-works",
      label: "Akkoord",
      text: "Dat werkt voor mij. Ik hoor graag de vervolgstappen.",
    },
    {
      id: "fl-fu-avail",
      label: "Beschikbaarheid delen",
      text: "Ik stuur mijn beschikbaarheid door.",
    },
    {
      id: "fl-fu-soon",
      label: "Kom erop terug",
      text: "Bedankt, ik laat het je zo snel mogelijk weten.",
    },
    { id: "fl-fu-thanks", label: "Bedanken", text: "Bedankt voor de update!" },
  ],
  CLIENT: [
    {
      id: "cl-fu-plan",
      label: "Kennismaking plannen",
      text: "Top, dan plannen we een kennismaking.",
    },
    {
      id: "cl-fu-consider",
      label: "In overweging",
      text: "We nemen je reactie in overweging en laten snel iets weten.",
    },
    { id: "cl-fu-proceed", label: "Doorgaan", text: "Bedankt, we gaan hiermee verder." },
    { id: "cl-fu-thanks", label: "Bedanken", text: "Bedankt voor je bericht!" },
  ],
  FRANCHISER: [
    {
      id: "fr-fu-link",
      label: "Koppelen",
      text: "Ik koppel je aan de opdrachtgever en houd je op de hoogte.",
    },
    {
      id: "fr-fu-details",
      label: "Details sturen",
      text: "Ik stuur je zo de details van de plaatsing.",
    },
    { id: "fr-fu-soon", label: "Kom erop terug", text: "Ik kom hier snel op terug." },
    { id: "fr-fu-thanks", label: "Bedanken", text: "Bedankt voor je inzet!" },
  ],
  ADMIN: [
    {
      id: "ad-fu-resolved",
      label: "Opgelost",
      text: "Dit is opgelost — laat het gerust weten als er nog iets is.",
    },
    { id: "ad-fu-info", label: "Meer info vragen", text: "Kun je hier wat meer over vertellen?" },
    { id: "ad-fu-thanks", label: "Bedanken", text: "Bedankt, fijne dag!" },
  ],
};

/** Opdracht-refererende opener per rol (alleen bij een aan een opdracht gekoppeld gesprek). */
const JOB_OPENER: Partial<Record<UserRole, QuickReply>> = {
  FREELANCER: {
    id: "fl-open-job",
    label: "Reageren op opdracht",
    text: "Ik heb je bericht over deze opdracht gezien en ben geïnteresseerd.",
  },
  CLIENT: {
    id: "cl-open-job",
    label: "Reactie op opdracht",
    text: "Bedankt voor je reactie op deze opdracht! Ben je beschikbaar om kennis te maken?",
  },
  FRANCHISER: {
    id: "fr-open-job",
    label: "Opdracht aanbieden",
    text: "Ik heb een passende opdracht voor je — heb je interesse?",
  },
};

/**
 * Levert de gecureerde snelle antwoorden voor de gegeven context, gededupliceerd op id en
 * begrensd tot {@link QUICK_REPLY_MAX}. Deterministisch: dezelfde context → dezelfde volgorde.
 */
export function quickReplies(context: QuickReplyContext): QuickReply[] {
  const base = context.isOpener ? OPENERS[context.role] : FOLLOWUPS[context.role];
  const jobOpener = context.isOpener && context.hasJob ? JOB_OPENER[context.role] : undefined;
  const ordered = jobOpener ? [jobOpener, ...base] : base;

  const seen = new Set<string>();
  const result: QuickReply[] = [];
  for (const reply of ordered) {
    if (seen.has(reply.id)) continue;
    seen.add(reply.id);
    result.push(reply);
    if (result.length >= QUICK_REPLY_MAX) break;
  }
  return result;
}
