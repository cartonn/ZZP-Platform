# Afgewezen bureau: auditkopieën bij bestaande anonimisering

Securityslot 15 september 2026 14:00 UTC, basis `d075613739b0f74605054b8cfbbc6d99b52904a8`.
Claim vóór implementatie: bestaand MIDDEL-item van 11 september in SECURITY-PRIVACY-BACKLOG.
De huidige erasure wist de REJECTED-Tenant-rij, maar behoudt de registratie-slug/KvK
en een door admin geschreven afwijsreden in auditmetadata. De admin/Tenant-rij
zonder e-mail valt buiten de selectie; de generieke scrub matcht alleen naam/e-mail.

Scope: alleen registratie-/afwijsauditmetadata van het bijbehorende afgewezen bureau,
in dezelfde bestaande anonimiseringstransactie. Actor, actie, tijd, statusovergangen
en andere tenants blijven behouden. Geen nieuw bewaarbeleid of publieke-reviewbesluit.
Beoogde bestanden: admin/gebruikers/actions.ts, gerichte erasurehelper en echte
geïsoleerde databaseproeven; voortgang en bestaande securitybacklog.

Dedup: open #1365 bevat de reeds op main aanwezige Tenant-rij-wipe en guard;
de auditkopieën zijn daar niet opgelost. Geen overlappende nieuwe actieve claim.
Bestaand bewijs is brondataflow plus pure helper; volledige databaseproef volgt.
Geen productiegegevens, lokale browser/server of echte provider-/mailaanroepen.

## Bereikbaarheid en reparatie (#1499)

De echte `anonymizeUser`-actie op een unieke tijdelijke SQLite-database bevestigt
de bestaande bevinding: vóór herstel drie falende en drie geslaagde proeven.
De registratie behoudt slug/KvK; de admin-afwijzing behoudt een vrije reden ook
zonder e-mailadres. Geen publieke uitlezing of productie-incident aangetoond.

Selectie toegevoegd voor uitsluitend de eigen REJECTED-Tenant-id en
FRANCHISE_SELF_REGISTERED/FRANCHISE_REJECTED. De helper redact respectievelijk
slug/KvK en reden. De bestaande e-mailredactie en deze redactie worden gecombineerd
in één rij-update binnen dezelfde anonimiseringstransactie. Actie, actor, tijd,
statusovergang en overige metadata blijven behouden; een nieuw geselecteerde
adminbeslissing behoudt diens IP/user-agent. De bestaande generieke PII-regels
blijven gelden wanneer een rij óók via eigenaar/e-mailadres matcht.

Zes databaseproeven groen: kopieën verdwijnen; andere tenants blijven exact gelijk;
PENDING/ACTIVE/SUSPENDED weigeren zonder writes; gecombineerde e-mail/reden-redactie;
SQL-triggerfout bewijst rollback van audit, tenant en account plus geslaagde retry.
Acht gerichte suites: 227 tests geslaagd, inclusief bestaande erasure-, signing-,
tenantscope- en betaalwebhooktests. Onafhankelijke delta-audit: 43 andere pure/mock
tests geslaagd, geen nieuw bevestigd gat in de gewijzigde betaal-/teken-/tenantpaden.
Geen volledige platform- of PostgreSQL-concurrentiegarantie. Malformed historische
audit-JSON blijft, zoals in de bestaande scrub, onaangeroerd; de twee huidige
auditproducenten schrijven JSON-objecten. De openbare individuele-reviewprivacy
blijft een afzonderlijk open eigenaar-/FG-besluit. Volledige checks/review/CI volgen.
