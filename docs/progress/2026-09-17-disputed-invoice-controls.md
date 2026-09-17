# Factuurknoppen volgen het dispuut

Persona-ronde 17 september 05:00 UTC; claim vóór implementatie.
Basis `b6fea77c7fbcc213c0337cd0b4781fbb538aa8c1`.

Bron: onafhankelijke FREELANCER/CLIENT-broncontrole. Het factuurdetail berekent
`canSend`, `canCancel` en `canPay` zonder de geladen `disputedAt`. Daardoor staan
Versturen/Annuleren/Markeer als betaald naast In dispuut, terwijl de bestaande
serveracties alle drie weigeren. Een partij kan een dispuut openen op een ACTIVE
samenwerking met een losse factuur; #1506 bewaakt de write al. Dit is misleidende
bediening, geen gevonden mutatie- of autorisatiebypass.

Scope: de drie knoppredicaten op `facturen/[id]/page.tsx`, gerichte renderproeven
naast de pagina en voortgang. Bewaar serverguards, documenten, bedragen, vormgeving
en overige factuurhandelingen. Geen betaalintegratie, fiscale of juridische wijziging.
Validatie en onafhankelijke review volgen.
