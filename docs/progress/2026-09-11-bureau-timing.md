# Bureau-aanmelding: timingregressie — 11 september 2026

Claim uit de geplande securityronde, basis e62a7114d4d35f6ead68fb3c7aecad42d2f3fea2.
De cleanup na de eerdere securityfix combineerde een onvoorwaardelijke bcrypt-hash met
nog een bcrypt-vergelijking uitsluitend voor bestaande e-mail/KvK. Dezelfde generieke
bevestiging kost daardoor op die tak twee dure bcrypt-rondes in plaats van één.

Onafhankelijke synthetische uitvoering van de huidige actie met echte bcrypt cost10:
na twee warmups tien metingen per tak; mediaan nieuw 56,37 ms (hash1/compare0), bestaand
113,09 ms (hash1/compare1). Geen productiegegevens of externe/database-mutaties; dit is
bewijs van de codepad-asymmetrie, geen meting van productienetwerklatentie.

Scope: herstel gelijke dure wachtwoordbewerking in src/app/register/actions.ts, gerichte
regressies in de bestaande registratie-tests, auditbacklog en dit bewijs. Behoud rate limits,
generieke respons, servervalidatie, unieke indexen, privégegevens en audit. Implementatie,
volledige checks, onafhankelijke review en merge zijn nog niet uitgevoerd.

## Implementatie na de draftclaim #1480

De extra `bcrypt.compare` is uitsluitend uit de bestaand-tak van `registerBureau`
verwijderd. De onvoorwaardelijke cost-10-hash vóór de lookups blijft voor ieder bureau-pad
bestaan. Gewone registratie behoudt haar equalizer; de generieke bureaurespons,
rate-limit, schemavalidatie, unieke indexen en tenantaanmaak/audit blijven ongewijzigd.

De bestaande tests voor bureau-aanmelding waren alleen op aanwezigheid van de hash gericht;
een andere test eiste zelfs de extra compare. Ze controleren nu de totale bcrypt-kosten,
gelijke bevestiging en uitsluitend nieuwe tenantaanmaak voor alle drie bestaanssituaties.
Rood→groen: vóór de bronfix vier gerichte asserties rood, na de fix elf tests in de twee
registratiesuites groen. De nieuwe gevallen gebruiken uitsluitend synthetische gegevens.

Volledige `env -u RUST_LOG npm run check` en formatting lopen nog. De implementerende
uitvoerder geeft geen eigen reviewgoedkeuring; een nieuwe onafhankelijke beoordeling en
de zes vereiste GitHub-poorten blijven nodig vóór merge.

## Afzonderlijke open privacybevinding

De audit vond ook dat de nieuwe REJECTED-tenant-erasure auditkopieën van KvK/slug en een
admin-afwijsreden kan bewaren. De echte scrubhelper en de selectievoorwaarden zijn met
synthetische metadata gecontroleerd; er is geen volledige database-erasure uitgevoerd.
Concrete bronnen en een aparte fixrichting staan bovenaan SECURITY-PRIVACY-BACKLOG.md.
Dit blijft OPEN en wordt niet gecombineerd met de timingcorrectie. De audit is begrensd;
243 groene bestaande tests vormen geen algemene security-/privacy-cleanclaim.

## Integratie en volledige controle

Root heeft de schone hoofdversie407c32fcc28046ef6c3123652997ca00fb067d44 geïntegreerd na
merge van de afzonderlijke monitorreparatie. De volledige gecombineerde testsuite slaagt:
8.684 tests,2 bestaande skips. Lint/typecontrole en productiebuild zijn groen. De eerdere
font-fetchfout was een lokale netwerkfout; dezelfde build slaagde met de reeds toegestane
netwerktoegang, zonder wijziging van fonts of dependencies. De aparte sterke abonnementsreview
van de securitydiff vond geen concrete regressie. Verplichte GitHub-review/CI en merge volgen;
het open tenant-auditpunt is niet door deze timingfix opgelost.
