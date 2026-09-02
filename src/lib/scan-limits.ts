/**
 * Expliciete bovengrenzen voor lijst-queries die anders met de tenant meegroeien.
 *
 * Achtergrond: een `findMany` zonder `take` laadt bij een grote opdrachtgever/ZZP'er de héle
 * tabel in het geheugen van de server — een latente productie-storing die pas zichtbaar wordt
 * wanneer er echte volumes op staan. De vangrail in `src/lib/unbounded-queries.test.ts` dwingt
 * daarom af dat elke lijst óf pagineert, óf een expliciete `take` heeft, óf een gemotiveerde
 * `unbounded-allow`-marker draagt.
 *
 * Deze constanten zijn die expliciete grenzen. Ze staan bewust op één plek zodat "hoeveel rijen
 * mag dit scherm maximaal aanraken" een leesbare, herzienbare keuze is en geen los getal in de
 * code. Ze zijn ruim gekozen: onder de grens verandert er functioneel niets, boven de grens
 * blijft het scherm werken in plaats van de server om te trekken.
 *
 * Onderscheid met `src/lib/pagination.ts`: dáár staat de paginagrootte van een lijst die de
 * gebruiker met "Meer laden" verder kan doorbladeren. Hier staan de caps van scans die de
 * gebruiker niet doorbladert (aggregaties, strips, panelen).
 */

/** Reacties die de kandidaten-signalen (reactiebereidheid, beslis-achterstand) mogen scannen. */
export const CANDIDATE_SIGNAL_SCAN_LIMIT = 500;

/** Reacties die het "reageerde ook op"-signaal voor de zichtbare kandidaten mag scannen. */
export const CANDIDATE_MULTI_APPLY_SCAN_LIMIT = 300;

/** Opdrachten die de "kandidaten vergelijken"-instap toont (drukste opdrachten eerst). */
export const CANDIDATE_COMPARE_JOBS_LIMIT = 12;

/** Rijen die een admin-breed paneel (platform-administratie, tenants) per keer toont. */
export const ADMIN_PANEL_SCAN_LIMIT = 500;

/** Grootboekregels die een eigenaar-gescoopt administratiepaneel per keer verwerkt. */
export const OWNER_LEDGER_SCAN_LIMIT = 5000;

/** Facturen die een eigenaar-gescoopt facturen-/openstaand-paneel per keer verwerkt. */
export const OWNER_INVOICE_SCAN_LIMIT = 500;
