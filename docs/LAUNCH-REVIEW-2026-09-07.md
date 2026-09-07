# Handslag — besluit voor de eerste lancering

Beoordeeld op 7 september 2026, op basis van `origin/main` (`090c8359`), de code en
read-only controles van de gekoppelde Railway-omgeving. Dit is een technische en
productmatige beoordeling; ontbrekende operationele controles zijn niet als geslaagd aangemerkt.

## Besluit

**Nog geen open inschrijving voor echte klantdossiers.** De applicatie draait en de database
is gezond, maar de omgeving is expliciet een demo. Eerst de hieronder beschreven
productievoorwaarden afronden, dan een begeleide pilot met één bemiddelingsbureau.

De bestaande kern behouden: dossier → verificatie → opdracht → getekende samenwerking →
goedgekeurde uren → factuur. Een volledige herschrijving vóór lancering vergroot het
regressierisico en lost ontbrekende e-mail, productie-inrichting en klantvalidatie niet op.
Gerichte vereenvoudiging volgt uit gemeten fouten en gebruik van deze keten.

## Gecontroleerde stand

| Onderdeel             | Waarneming                                                                               | Betekenis                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Live code             | `/api/health` en `/api/readiness`: HTTP 200, commit `090c835`, database en schema gezond | De actuele main draaide tijdens deze controle                                                                                           |
| Releasefase           | `DEPLOYMENT_STAGE=demo`, `SEED_DEMO=true`                                                | Dit is nog een demo-omgeving; productiepoort wordt niet als echte productie toegepast                                                   |
| Documentopslag        | `STORAGE_DRIVER=s3`, bucket ingesteld                                                    | Eerdere documentatie met `local` is verouderd; upload/download/herstel moeten nog als keten worden bewezen                              |
| E-mail                | `EMAIL_DRIVER` ontbreekt → standaard `noop`; geen Resend-sleutel                         | Wachtwoordherstel en e-mailmeldingen zijn niet operationeel bewezen                                                                     |
| Rate limiting         | `RATE_LIMIT_STORE=redis`                                                                 | Gedeelde limiter is ingesteld                                                                                                           |
| Verificatieproviders  | DIPLOMA/BIG/IDENTITY-driver niet ingesteld                                               | Geen bewijs dat automatische externe verificatie werkt; organiseer aantoonbare handmatige controle of configureer de benodigde provider |
| Achtergrondtaken      | `CRON_SECRET` aanwezig; Railway heeft een takenservice                                   | Configuratie aanwezig, recente geslaagde taakuitvoering nog apart controleren                                                           |
| Back-ups              | Railway heeft een backupservice en backupbucket                                          | Geen herstelbewijs verkregen tijdens deze review; een bestaande service bewijst geen herstelbaarheid                                    |
| Juridische documenten | Repo bevat concepten en open reviewpunten                                                | Laat de bestaande reviewvoorwaarden afronden vóór echte gevoelige dossiers                                                              |

Er zijn geen secrets in dit document opgenomen. Aanwezige configuratie bewijst geen succesvolle
levering of herstel. Geen productievariabelen, gebruikers of documenten gewijzigd.

## Concrete codeverbeteringen in deze werkbranch

1. **Eenmalige herstelcodes:** een conditionele database-update claimt een herstelcode. Twee
   gelijktijdige loginverzoeken kunnen niet allebei dezelfde code verbruiken.
2. **Verplicht eigen wachtwoord:** een client-update kan de JWT-vlag niet meer uitzetten. De
   actuele databasevlag blokkeert normale lees- en mutatiepaden; alleen de wachtwoordpagina en
   bijbehorende actie krijgen de gevalideerde identiteit om het wachtwoord te wijzigen.
3. **Registratie:** account, rolprofiel en audit worden atomair opgeslagen. Een dubbele
   registratie na de eerste controle wordt een begrijpelijke veldmelding; de verliezende
   aanvraag logt niet in op het al bestaande account.
4. **Opnieuw inloggen:** een ingetrokken sessie mag het inlogformulier niet overslaan en
   vervolgens op een foutpagina eindigen.

Regressietests dekken deze fouten, waaronder gelijktijdig gebruik van één herstelcode,
vervalste sessieclaims, geblokkeerde accounts/tenants en een mislukte audittransactie.
Lokaal zijn 8.389 tests geslaagd (2 bestaande skips), evenals typecheck, lint, productiebuild,
formatting en vier browsercontroles op de productiebuild. Die browsercontroles omvatten ook de
poging om de verplichte wachtwoordwijziging via een sessie-update te omzeilen. De onafhankelijke
code-review gaf PASS. De uiteindelijke CI-uitkomsten staan bij de pull request.

## Volgorde naar een eerste betalende klant

1. **Productie-inrichting afronden.** Gebruik een omgeving met eigen accounts en echte
   instellingen. Schakel demo-seeding uit; beoordeel bestaande demodata voordat iemand die
   verwijdert. Laat `npm run preflight -- --strict` onder de echte productieconfiguratie slagen.
2. **Herstel en bereikbaarheid bewijzen.** Test registratie, opnieuw inloggen, wachtwoordherstel
   via een daadwerkelijk ontvangen e-mail, private documenttoegang, achtergronduitvoering en
   herstel van een back-up naar een afzonderlijke database. Controleer ook geweigerde toegang.
3. **Eén bureau begeleiden.** Voorstel: één bureau, één opdrachtgever en vijf tot tien
   zelfstandigen. Loop met hen een echte volledige werkcyclus door. Pas echte gevoelige
   documenten gebruiken zodra de bestaande voorwaarden voor productie zijn afgerond.
4. **Meet de uitkomst.** Tijd tot een compleet dossier, tijd tot de eerste ingevulde opdracht,
   tijd tussen ingediende en goedgekeurde uren, aantal factuurcorrecties en supportvragen per
   samenwerking. Gebruik die eerste pilot om doelen vast te stellen; er is hier nog geen
   klantbewijs voor omzet-, conversie- of tevredenheidsclaims.
5. **Breid pas uit na een herhaalbare cyclus.** Los de grootste waargenomen vertraging op,
   onboard het volgende bureau en meet opnieuw. Nieuwe academie-, fiscale of andere nevenfuncties
   hebben voor deze lancering geen prioriteit.

## Architectuurkeuze

Behoud de modulaire monoliet, de bestaande autorisatiehelpers en de transactionele werkstroom.
De eerste verbeteringen horen bij grenzen waar fouten geld of vertrouwen kosten: authenticatie,
tenantscheiding, documenttoegang, statustransities en facturatie. Extra infrastructuur of een nieuw
framework vraagt eerst meetbaar bewijs dat de huidige vorm een probleem vormt.

De lokale oorspronkelijke checkout en diens onopgeslagen wijzigingen zijn behouden.
Deze review wijzigt geen juridische voorwaarden, prijzen, productiegegevens of providers.
