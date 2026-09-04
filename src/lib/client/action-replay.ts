/**
 * Zetjes-planner voor de React-reconciler na een interactie (issue #329).
 *
 * ACHTERGROND — gemeten, niet vermoed. In een productiebuild (`next start`) blijft elke
 * `useActionState`-knop na een geslaagde server action eeuwig op "Bezig…" staan. Wat er echt
 * gebeurt (gemeten op /admin/franchises, activatie van een bemiddeling):
 *
 *  1. De POST krijgt binnen ~20 ms status 200 en de mutatie landt server-side.
 *  2. De volledige action-respons (±50 kB flight-payload, mét het actieresultaat én de door
 *     `revalidatePath` verse pagina-boom) komt compleet bij de browser aan; de client-runtime
 *     leest de stream helemaal uit en de stream sluit netjes af (~25 ms).
 *  3. Toch commit React de transitie niet: de knop blijft disabled, de lijst blijft ongewijzigd.
 *  4. Zodra ergens in dezelfde React-root een gewone state-update wordt gepland — óók in een
 *     component buiten de pagina-subtree, bv. in de app-shell — wordt de vastgelopen transitie
 *     alsnog gecommit en klopt het scherm meteen.
 *
 * Het is dus geen netwerk-, middleware-, CSP-, service-worker- of compressieprobleem: de
 * reconciler markeert de boundary als suspended en speelt de update daarna niet meer af. Dit is
 * een bekende regressie in de React-build die Next.js 15.5 meelevert
 * (`19.2.0-canary-0bdb9206-20250818`) — de fout ontstond in de canary-serie van eind juli 2025 en
 * is pas in een latere React-patch verholpen; ook de nieuwste 15.5.x levert nog dezelfde build
 * mee, dus een versiebump binnen de vastgelegde stack lost het niet op.
 *
 * WERKWIJZE. Na elke interactie die een server action kan starten (een form-submit of een klik)
 * plannen we een handvol lichte state-updates. Elk zetje is precies de trigger uit stap 4: staat
 * er een transitie vast, dan commit hij alsnog; is er niets aan de hand, dan is het een
 * re-render van één component die `null` teruggeeft — meetbaar gratis. De reeks stopt na enkele
 * seconden, dus er loopt nooit een permanente timer.
 *
 * Bewust NIET gedaan: de knop client-side "klaar" melden. De serverwaarheid blijft leidend —
 * `pending` blijft staan zolang de action loopt; we forceren alleen dat React het antwoord dat
 * hij al binnen heeft ook echt op het scherm zet.
 */

/** Momenten (ms na de interactie) waarop de reconciler een zetje krijgt. */
export const REPLAY_DELAYS_MS = [120, 400, 900, 1800, 3000] as const;

export type ReplayScheduler = {
  /** Plan een nieuwe reeks zetjes; een lopende reeks wordt eerst afgebroken. */
  trigger: () => void;
  /** Breek alle geplande zetjes af (bij unmount). */
  cancel: () => void;
};

export function createReplayScheduler(
  nudge: () => void,
  delays: readonly number[] = REPLAY_DELAYS_MS,
): ReplayScheduler {
  let timers: ReturnType<typeof setTimeout>[] = [];

  const cancel = () => {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  };

  return {
    trigger() {
      cancel();
      timers = delays.map((ms) => setTimeout(nudge, ms));
    },
    cancel,
  };
}
