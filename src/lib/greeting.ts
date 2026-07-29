// Dagstart-signatuur van het dashboard (UITROLPLAN §2: cluster "Dashboard" = _de dagstart_):
// een dagdeel-groet met voornaam i.p.v. een kale naamregel. Pure functies, server-side
// aangeroepen; het uur wordt expliciet in Europe/Amsterdam bepaald zodat de groet klopt
// ongeacht de servertijdzone (prod draait op UTC).

export type DayPartGreeting = "Goedemorgen" | "Goedemiddag" | "Goedenavond";

/** Het uur (0–23) in Europe/Amsterdam voor een gegeven moment. */
export function amsterdamHour(now: Date): number {
  const hour = new Intl.DateTimeFormat("nl-NL", {
    hour: "numeric",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  }).format(now);
  return Number.parseInt(hour, 10) % 24;
}

/** Dagdeel-groet: ochtend tot 12u, middag tot 18u, daarna avond (ook voor de kleine uurtjes). */
export function dayPartGreeting(hour: number): DayPartGreeting {
  if (hour >= 6 && hour < 12) return "Goedemorgen";
  if (hour >= 12 && hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

/** Voornaam uit een volledige naam; null bij een lege/ontbrekende naam. */
export function firstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

/**
 * De dashboard-kop: "Goedemorgen, Sanne" — of de kale terugvalnaam als er geen naam is.
 * De groet zelf wordt door de aanroeper vertaald (t()), zodat de taalkeuze meebeweegt.
 */
export function dashboardGreeting(
  greeting: string,
  fullName: string | null | undefined,
  fallback: string,
): string {
  const name = firstName(fullName);
  return name ? `${greeting}, ${name}` : fallback;
}
