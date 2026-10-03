# Urgentie-ordening van de admin-verificatiewachtrij (2026-10-03)

## Probleem

De admin-verificatiewachtrij (`/admin/verificaties`, status SUBMITTED) was strikt FIFO: oudste
indientijd eerst (`orderBy: submittedAt asc nulls last, updatedAt asc`). Alle triage-signalen
bestonden al — maar uitsluitend als per-rij badges, nooit als sorteersleutel:

- **blokkeert een lopende inzet** (`verification-placement-impact.ts`) — hoogste urgentie, een live
  compliance-gat op een draaiende inzet;
- **reeds verlopen** / **binnenkort verlopen** (`verification-expiry.ts`) — goedkeuren levert een direct
  ongeldige credential op;
- **te lang wachtend** (`verification-queue.ts`, ≥ 5 dagen);
- **open-opdracht-vraag** (`verification-impact.ts`);
- **herindiening na afwijzing** (`verification-resubmission.ts`).

Gevolg: de dringendste beoordeling (bv. een certificaat dat een lopende inzet blokkeert) kon diep onder
een stapel verse, triviale inzendingen verdwijnen. De admin moest scrollen om te vinden wat écht eerst
moet — tegen de noord-ster ("toon alleen wat telt en wat actie vraagt") in.

## Oplossing

Een pure, deterministische prioriteitsmodule `src/lib/verification-queue-order.ts`:

- `verificationQueuePriority(signals)` fuseert de reeds berekende signalen tot één score. De gewichten
  staan in **gescheiden grootteordes** (1.000.000 / 100.000 / 10.000 / 1.000 / 300 / 100 / 10), zodat een
  hogere tier altijd elke combinatie van lagere tiers verslaat. De vraag-as is bewust **vlak** (hoog vanaf
  3 vragende opdrachten, enig daaronder), nooit op aantal geschaald — zo kan een grote vraagtelling nooit
  een echte compliance-/kwaliteitstier overstijgen.
- Expiry is één as met twee standen: reeds-verlopen sluit binnenkort-verlopen uit (tel één keer, verlopen
  wint). Wachttijd is een onafhankelijke as en telt altijd mee.
- `compareVerificationQueuePriority` / `orderVerificationQueue` sorteren urgentst-eerst met **FIFO als
  tie-break**: de oude DB-ordening exact gespiegeld (`submittedAt` asc, legacy-nulls achteraan, dan
  `updatedAt` asc, dan `id` voor volledige stabiliteit).

Eigenschap: zonder enig signaal is elke score 0 → de volgorde is **identiek** aan de oude pure FIFO. De
ordening tilt uitsluitend urgente items omhoog; de eerlijkheidsgarantie blijft intact.

De pagina berekent de signalen al (placement-impact-map, vraag-map, expiry, wachttijd, herindiening) uit
**reeds-geladen data** — geen extra query, geen schemawijziging. Een subtiele kop-hint "· urgentst eerst"
maakt de ordening zichtbaar (geen stille herordening).

## Bestanden

- `src/lib/verification-queue-order.ts` — nieuwe pure module (score + comparator + `orderVerificationQueue`).
- `src/lib/verification-queue-order.test.ts` — 13 gevallen: scoring per signaal, vlakke vraagbanden,
  expiry-XOR, strikte tier-dominantie, comparator (prioriteit desc, FIFO-tie-break met nulls-last,
  updatedAt/id-stabiliteit), en integratie (blokkerend item stijgt naar top; geen-signaal = pure FIFO;
  volledige urgentieladder; invoer niet gemuteerd).
- `src/app/(protected)/admin/verificaties/page.tsx` — ordent `visible` vóór render; kop-hint toegevoegd.

## Validatie

- Gericht: 13/13 groen.
- `npm run typecheck` groen; `npm run lint` groen; `npm run test` 9.257 groen (3 bestaande skips);
  `npx prettier --write .` toegepast; productiebuild groen.
- E2e draait in CI (Playwright `--project=ci`). Onafhankelijke review + CI-poort volgen.
