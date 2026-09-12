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

Validatie tot nu toe: lint, types en alle 8.755 bestaande tests slagen, 2 bestaande
skips. Eerste build kon bestaande Google-lettertypen niet bereiken binnen de sandbox;
netwerktoegankelijke productiebuild en gerichte browsercontrole volgen.
Onafhankelijke review, zes GitHub-poorten en uitrol moeten nog worden bevestigd.
