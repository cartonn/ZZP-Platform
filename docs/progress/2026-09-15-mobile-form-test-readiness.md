# Mobiele formulierproef — 15 september 04:22 UTC

Claim vóór implementatie: herstel de te vroege veldcontrole in
`e2e/handslag-interactions.spec.ts`. De echte CI-run 34921495473, job 104230458877,
faalde op regel 153: de onmiddellijke `editables.count()` gaf nul na navigatie naar
het gestreamde profielformulier; dezelfde proef slaagde op retry. De huidige main
bevat die onmiddellijke controle nog. PR's en recente geschiedenis tonen geen fix.

Scope: laat de bestaande mobiele proef wachten op een zichtbaar formulierveld vóór
de veldtelling en lettergroottemeting. Behoud de responsiviteits-, aanraak-, dock-
en lettergroottecontroles. Geen productcode, time-outs, retries of loginwijziging.
De afzonderlijke sidebar-rail-flake valt buiten deze claim. Validatie/review volgen.
