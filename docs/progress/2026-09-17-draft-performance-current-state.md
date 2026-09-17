# Actuele voorwaarden bij conceptprestaties — 17 september 2026

Securityronde 14:00 UTC, basis `c67eefd806197a6d40e7d1c4565160d48d5ec80b`.
De persona-controle van 13:00 meldde de lees/write-opening als onbevestigde kandidaat.
Dedup van recente PR's en securityhistorie vond geen herstel voor deze create-grens;
de eerdere gewone dispuutguard en geparkeerde draft-auditomissie zijn andere scope.
Draftclaim #1513 ging vooraf aan productherstel.

`logAndSubmitPerformanceAction` autoriseert, parseert en roept `createPerformance`
aan. Dat commando las eigenaar/status en daarna dispuut, maar deed de create buiten
een transactie. De tijdelijke databaseproef onderschept de echte guardlees, commit
vervolgens een gewijzigde samenwerking en laat het commando met het oude snapshot
doorlopen. Vier scenario's (dispuut, geannuleerd, afgerond, andere ZZP'er) schrijven
vóór herstel toch een DRAFT; de normale eigenaar/ACTIVE-proef slaagt. Geen
productie-incident, ongeoorloofde factuur of geldbeweging aangetoond.

Het commando behoudt voorafmeldingen en bestaande anti-oracle/rolchecks. Een
conditionele `collaboration.updateMany` op id, ACTIVE, geen dispuut en huidige
ZZP-eigenaar verkrijgt de parentwrite binnen dezelfde transactie als de create.
ADMIN behoudt bestaande bevoegdheid, maar status/dispuut gelden ook voor ADMIN.
Een niet-matchende write geeft een gecontroleerde vernieuwmelding en creëert niets.
De no-op ACTIVE-write ververst de gewone `updatedAt` bij succesvolle vastlegging;
een mislukte create rolt ook deze parentwrite terug. Geen nieuw event-/auditbeleid.

Acht echte tijdelijke SQLite-gevallen bewaken de vier stale snapshots, gewone uren,
admin-oplevering, nieuw dispuut bij admin en rollback na een createfout. De bestaande
mocktest krijgt de transactiegrens; eerdere asserties blijven. Alle 320 gerichte
cascadetests slagen. Dit bewijst de gecontroleerde interleaving en transactionele
rollback op SQLite, geen volledige gelijktijdige PostgreSQL-lockmatrix. Bestaande
CI/PostgreSQL- en onafhankelijke reviewpoorten blijven verplicht en afzonderlijk.

De parallelle read-only autorisatie/privacy-controle las tenantfilters, privédocumenten,
tekenbewijs/erasure en exportminimalisatie; 307 bestaande tests slagen binnen die
scope. Sommige zijn echte SQLite, andere mocks; geen algemene platformvrijgave.
Volledige lokale controles, onafhankelijke review, actuele CI en release volgen.
