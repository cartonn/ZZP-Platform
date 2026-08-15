// Navigatiecommando's voor de globale snelzoeker (⌘K) — pure kern.
// Naast het zoeken naar entiteiten (opdrachten/facturen/…) laat de snelzoeker de gebruiker ook
// direct naar een pagina springen ("Ga naar Facturen"). De kandidaten zijn de rol-gescopte
// nav-items (server-side bepaald via navForRole); deze module filtert + rankt ze deterministisch
// tegen de zoekterm. De client toont alleen wat de server-nav toestaat — geen client-side
// zichtbaarheidsbeslissing.

import { normalizeSearchQuery, scoreField } from "./search";

/** Het minimale vorm-contract van een nav-item dat we nodig hebben (subset van {@link NavItem}). */
export interface NavCommandSource {
  label: string;
  href: string;
  section?: string;
  enabled: boolean;
}

export interface NavCommand {
  label: string;
  href: string;
  section?: string;
  /** Relevantiescore (zie {@link scoreField}); hoger = relevanter. */
  score: number;
}

/** Standaard maximum aantal navigatiecommando's dat de snelzoeker toont. */
export const DEFAULT_NAV_COMMAND_LIMIT = 6;

/**
 * Bouwt de gerankte navigatiecommando's voor de snelzoeker.
 *
 * - Alleen ingeschakelde items (`enabled`) doen mee — nooit een dode/placeholder-link.
 * - Scoort op zowel het label als de sectiekop (typ "zakelijk" → alle zakelijke pagina's),
 *   waarbij het label zwaarder weegt dan de sectie zodat een directe labelmatch bovenaan staat.
 * - Deterministische orde: score hoog→laag, dan de bronvolgorde (de nav-volgorde is de
 *   werkstroom-volgorde), dan alfabetisch (NL) als vangnet. Dezelfde invoer → dezelfde uitvoer.
 * - Een lege/te korte zoekterm levert géén commando's (de snelzoeker toont dan zijn eigen hint).
 */
export function buildNavCommands(
  items: readonly NavCommandSource[],
  rawQuery: string,
  limit: number = DEFAULT_NAV_COMMAND_LIMIT,
): NavCommand[] {
  const normalized = normalizeSearchQuery(rawQuery);
  if (!normalized) return [];

  const scored: Array<{ command: NavCommand; order: number }> = [];
  items.forEach((item, order) => {
    if (!item.enabled) return;
    const labelScore = scoreField(item.label, normalized);
    // De sectiekop weegt lichter: een sectiematch mag nooit een directe labelmatch verslaan.
    const sectionScore = item.section ? Math.min(scoreField(item.section, normalized), 1) : 0;
    const score = Math.max(labelScore, sectionScore);
    if (score <= 0) return;
    scored.push({
      command: { label: item.label, href: item.href, section: item.section, score },
      order,
    });
  });

  scored.sort((a, b) => {
    if (b.command.score !== a.command.score) return b.command.score - a.command.score;
    if (a.order !== b.order) return a.order - b.order;
    return a.command.label.localeCompare(b.command.label, "nl");
  });

  return scored.slice(0, Math.max(0, limit)).map((s) => s.command);
}
