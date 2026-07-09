// Vindbaarheid-signaal voor de ZZP'er: "kan een opdrachtgever mij überhaupt vinden?" — de meest
// impactvolle, vaak onbekende vraag (de privé-profiel-val). Dit is GEEN nieuwe domeinlogica: het
// spiegelt exact de server-filters die opdrachtgever-gerichte vind-oppervlakken al hanteren
// (`discoverableFreelancerWhere`: profiel PUBLIC + account ACTIVE) plus de twee surfacing-filters die
// bepalen of je daarna daadwerkelijk in zoek/suggesties bovenkomt: minstens één vaardigheid (skill-
// filter + opdracht-suggesties) en een gedeelde beschikbaarheid ("Alleen beschikbaar"-filter + sortering).
// Pure functies, server-side gevoed (CLAUDE.md regel 1): de client toont, beslist nooit.

export type FindabilityLevel = "hidden" | "limited" | "visible";

export interface FindabilityInput {
  /** Profiel-zichtbaarheid staat op PUBLIC (harde discoverability-eis). */
  isPublic: boolean;
  /** Minstens één vaardigheid in het profiel (nodig om te matchen/bovenkomen in skill-zoek). */
  hasSkills: boolean;
  /** Een bruikbaar beschikbaarheidssignaal (venster of scalair AVAILABLE/LIMITED). */
  hasAvailability: boolean;
}

export interface FindabilityFactor {
  key: "visibility" | "skills" | "availability";
  label: string;
  done: boolean;
  /** Wat te doen als deze factor nog niet op orde is (mensentaal). */
  hint: string;
  /** Doorklik naar de plek waar je dit oplost. */
  href: string;
}

export interface FindabilitySummary {
  level: FindabilityLevel;
  /** Kan een opdrachtgever dit profiel überhaupt vinden (de harde PUBLIC-eis). */
  discoverable: boolean;
  /** Kop in mensentaal, afgestemd op het niveau. */
  headline: string;
  /** De eerste onvervulde factor als blokkade-tekst, of null wanneer alles op orde is. */
  blocker: string | null;
  /** Doorklik naar de eerste fix, of null wanneer alles op orde is. */
  href: string | null;
  /** Alle factoren in prioriteitsvolgorde (voor de checklist in de kaart). */
  factors: FindabilityFactor[];
}

// De factoren in prioriteitsvolgorde: zichtbaarheid is de harde poort (zonder PUBLIC vind niemand je),
// daarna de surfacing-factoren. `#zichtbaarheid` en het skills-blok staan in hetzelfde formulier op de
// profiel-bewerken-pagina; beschikbaarheid heeft een eigen scherm.
function buildFactors(input: FindabilityInput): FindabilityFactor[] {
  return [
    {
      key: "visibility",
      label: "Profiel openbaar",
      done: input.isPublic,
      hint: "Zet je profiel op openbaar zodat opdrachtgevers je kunnen vinden.",
      href: "#zichtbaarheid",
    },
    {
      key: "skills",
      label: "Vaardigheden toegevoegd",
      done: input.hasSkills,
      hint: "Voeg minstens één vaardigheid toe zodat je bij passende opdrachten bovenkomt.",
      href: "#vaardigheden",
    },
    {
      key: "availability",
      label: "Beschikbaarheid gedeeld",
      done: input.hasAvailability,
      hint: "Geef je beschikbaarheid aan zodat je meetelt bij het filter 'alleen beschikbaar'.",
      href: "/beschikbaarheid",
    },
  ];
}

const HEADLINE: Record<FindabilityLevel, string> = {
  hidden: "Opdrachtgevers kunnen je nu niet vinden",
  limited: "Je bent vindbaar, maar niet optimaal",
  visible: "Je bent goed vindbaar voor opdrachtgevers",
};

/**
 * Vat de vindbaarheid van een ZZP-profiel samen. `discoverable` volgt de harde PUBLIC-eis (spiegelt
 * `discoverableFreelancerWhere`); daarbovenop bepalen skills en beschikbaarheid of je daadwerkelijk
 * bovenkomt. Niveaus: `hidden` (niet vindbaar), `limited` (vindbaar maar een surfacing-factor ontbreekt),
 * `visible` (alles op orde). De eerste onvervulde factor wordt de `blocker` + `href`.
 */
export function summarizeFindability(input: FindabilityInput): FindabilitySummary {
  const factors = buildFactors(input);
  const discoverable = input.isPublic;
  const firstOpen = factors.find((f) => !f.done) ?? null;

  const level: FindabilityLevel = !discoverable ? "hidden" : firstOpen ? "limited" : "visible";

  return {
    level,
    discoverable,
    headline: HEADLINE[level],
    blocker: firstOpen ? firstOpen.hint : null,
    href: firstOpen ? firstOpen.href : null,
    factors,
  };
}
