# Factuurherinneringen voorbij de eerste querybatch

Claim: afzonderlijke echte SQLite-proeven op main `38289525` bewijzen dat 500 oude,
reeds geëscaleerde SUBMITTED-facturen een nieuwe dag-3-herinnering blokkeren;
499 oude facturen werkt wel. De coördinator heeft dit onafhankelijk gereproduceerd.

Scope: uitsluitend `invoice-approval-reminders-task.ts`, bijbehorende gerichte tests
en deze voortgang. Begrensde stabiele paginering moet bestaande plannerregels,
geschil-/annuleringsbewaking, losstaande facturen, deduplicatie en transacties behouden.
Geen nieuwe termijnen, geldstromen of wijziging van factuurbedragen/status.
Implementatie, volledige controles en onafhankelijke review volgen.
