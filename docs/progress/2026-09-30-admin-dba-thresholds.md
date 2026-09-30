# Beheerfilters en badges volgen ingestelde DBA-drempels

Bouwronde 30 september 2026, 20:22 UTC. Claim vóór implementatie.

Bron: echte SQLite-query en serverrender met uitsluitend synthetische data op
main a558c010. Opgeslagen 3/9-maandsgrenzen geven na drie maanden VERHOOGD,
maar het beheeroverzicht plaatst de samenwerking onder LAAG, verbergt de badge
en toont bij VERHOOGD een lege lijst. De ADMIN-rolcontrole gaat aan het panel vooraf.

Scope: één bestaande configuratielezing in het geautoriseerde panel; dezelfde
drempels voeden SQL-selectie/tellingen en badgebeoordeling. Bestandsgrenzen:
src/components/admin/samenwerkingen-panel.tsx, src/lib/data/admin-collaborations.ts,
gerichte bestaande of naastgelegen regressietests en voortgangsdocumentatie.
Behoud datumgrenzen, paginering, zoekescaping, statussen en huidige signalen.

Status: geclaimd; implementatie, validatie, onafhankelijke review, CI en release volgen.
