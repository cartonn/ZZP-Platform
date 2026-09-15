# Wacht op bevestigde berichtverzending in de samenwerkingsproef

Claim vóór implementatie, bouwronde 15 september 12:22 UTC.
Basis: `ad63fb2af04bb5709c0bb96ce950ce3653db5b69`.

Bron: CI-run 34962603065 faalt tweemaal op `e2e/collaboration.spec.ts:74`:
de ontvanger ziet nog geen ongelezen-badge. Dezelfde proef slaagt later wel.
De proef controleert na Verzenden alleen een tekstfragment dat ook nog in het
invulveld staat. Dat is geen bewijs dat de server de verzending heeft afgerond.
De composer heeft al een aparte succesmelding na de geslaagde serveractie.

Begrensd herstel: wacht in deze ene gebruikersproef op die verzendbevestiging vóór
het wisselen naar de ontvanger. Behoud controles op berichtinhoud, ongelezen-badge,
antwoorden en de volledige samenwerking. Geen extra retries, skips, herlaadlus of
langere timeout. Geen wijziging van productiegedrag of echte berichten versturen.
De precieze oorzaak van een productieprobleem is hiermee niet aangetoond.
