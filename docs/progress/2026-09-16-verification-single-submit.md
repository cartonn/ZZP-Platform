# Bewijsstukgoedkeuring na één gewone klik

Claim vóór implementatie, basis `fbf2492faadbee6c6cfa345f85aeb5c18e1241fe`.
Bron: CURRENT_TASK, open programma punt 5 (React-#329): bouw de bestaande
herklik-/reloadvangnetten per browserproef af na de React-reparatie.

Afgebakend tot de goedkeuringshandeling in `e2e/verification.spec.ts`.
Die gebruikt nog `clickUntilGone`, dat na een wachtperiode `window.stop()` en
reload kan uitvoeren en opnieuw kan klikken. Daarmee bewijst groen nog niet
dat één normale goedkeuring de actuele wachtrij bijwerkt.

Beoogd: na de bestaande document/checklistcontroles één klik op Goedkeuren;
wachten op het verdwijnen van de eigen wachtrijkaart en geen documentnavigatie
tijdens die handeling. De bestaande afwijzing, uitkomst bij de zelfstandige,
oranje goedkeuringszegel en retentieproef blijven behouden. Geen productcode,
gedeelde helpers, tijdlimieten of overige journeys wijzigen.

Open PRs, recente merges en de echte proef gecontroleerd: geen overlappende claim.
Echte browseruitvoering volgt via CI; geen lokale browser/server. Volledige lokale
checks, verse onafhankelijke review en native GitHub-review zijn nog vereist.
