# Consequente Handslag-interacties

Eigenaaraanleiding: ook kaarten, rijen, tabs en navigatie moeten passende hover-
en aanraakfeedback hebben. Basis is de live V5-identiteit op `535df3f`.

De gedeelde workspace-stijl geeft echte links, knoppen, tabs en uitklapbare koppen
zichtbare druk- en focusstanden. Statische kaarten en goedkeuringszegels blijven
inhoudelijk ongewijzigd. Hover vereist een geschikte pointer. Een kleine passieve
pointerlistener wist uitsluitend de visuele drukstand bij bewegen, scrollen,
annuleren, loslaten, routewisseling of focusverlies; native scroll, zoom en
activering worden niet onderschept. Mobiele menu-overlays delen dezelfde laag.
Ruime klikvlakken en leesbare invoer gelden ook voor grotere aanraakschermen.

PR #1485. Mobiele navigatie sluit ook bij selectie van de huidige pagina;
de geselecteerde navigatie behoudt haar kleuren tijdens hover en indrukken.
Een zichtbare binnenrand blijft ook boven ondoorzichtige inhoud van klikbare kaarten staan.

Validatie: lint, types, alle 8.755 bestaande tests (2 bestaande skips), volledige
opmaakcontrole en definitieve productiebuild slagen. De eerste beperkte build kon
bestaande Google-lettertypen niet bereiken; de netwerktoegankelijke herbouw slaagt.
Onafhankelijke inhoudsreview vindt na twee navigatiecorrecties geen verdere blocker.
Gerichte Chromium/WebKit-browserproeven, de zes GitHub-poorten en uitrol volgen;
de eerste browserstart liep vast in de sandbox en is geen producttestbewijs.
