# Samenwerkingsdetail na eigen handtekening — 15 september 05:00 UTC

Claim vóór implementatie: persona-controle op `e9d6fe38` bevestigt dat het detail
na de eerste handtekening nog een tekenactie toont. De server bewaart dan terecht
PROPOSED/DRAFT tot de andere partij tekent. Lijst/dashboard en contractkaart kennen
de eigen handtekening, maar de statusregel en Aan-zet-items krijgen die niet mee.

Bron: `samenwerkingen/[id]/page.tsx` regels 309/335 versus 686/700;
`cascade/turn-items.ts:63` en `collaboration-status-line.ts`. Het bestaande
`cascadeStage` ondersteunt `viewerHasSigned` al. Dit is nieuwe detailpariteit na #1486,
geen nieuwe tekenmethode of wijziging van juridische/gegevensbewaarregels.

Scope: hergebruik de geladen serverhandtekening voor de detailaanwijzingen;
eigen ondertekenaar wacht, de andere partij houdt zijn tekenactie. Bewaar
certificaatblokkades, geschilbevriezing en terminale statussen. Voeg gerichte
regressies en checks aan de bestaande mobiele tweepartijenproef toe.
Geen productieprobes; controles, onafhankelijke review en echte CI volgen.
