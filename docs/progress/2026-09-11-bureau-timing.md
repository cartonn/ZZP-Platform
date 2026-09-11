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
