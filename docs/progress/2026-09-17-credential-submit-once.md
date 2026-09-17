# Verificatie aanvragen na één klik

Claim vóór implementatie, basis `6f79fae2d5726f078b40f62240bab7620adeec7c`.
Bron: CURRENT_TASK, open programma punt 5 (React-#329): verwijder per browserproef
het herklik-/herlaadvangnet na de React-reparatie.

Scope: uitsluitend `addAndSubmitCredential` in `e2e/verification.spec.ts` plus
voortgangsdocumentatie. Deze helper gebruikt nog `clickUntil`; na drie seconden
kan die de pagina stoppen, herladen en opnieuw klikken. Daardoor bewijst groen
niet dat één verificatieaanvraag de zichtbare certificaatstatus bijwerkt.

Beoogd: na bestaande hydratatie één klik op Verificatie aanvragen, wachten op
In beoordeling binnen dezelfde kaart en geen hoofddocumentnavigatie tijdens de
handeling. De geldige VOG/diploma-journey en verlopen-bewijsstukproef blijven
behouden. Geen productcode, gedeelde helpers of tijdlimieten wijzigen.

Open PRs en recente merges gecontroleerd; geen overlappende claim. #1504 betrof
alleen de admin-goedkeuring. Browserbewijs volgt via echte CI, zonder lokale
browser/server. Volledige lokale checks en beide onafhankelijke reviews volgen.
