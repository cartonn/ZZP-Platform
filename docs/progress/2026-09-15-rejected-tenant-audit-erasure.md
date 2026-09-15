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
