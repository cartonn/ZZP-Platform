# Kandidaten-shortlist: één normale klik zonder herlaad-vangnet

Claim vóór implementatie; basis4dd0b6728f3f556c9f7adebe389b794bca209ec6.
Bron: CURRENT_TASK, technische schuld punt5: na React-reparatie#329 moeten de
herklik/window.stop/reload-omwegen per bestaande browserproef worden verwijderd.

Afgebakend: alleen het shortlistmoment in e2e/applications.spec.ts. Deze proef
gebruikt nog clickUntilGone, dat tussen herhaalde klikken documentnavigaties kan
forceren. Daardoor bewijst groen niet dat één normale handeling de serverstatus
in de huidige pagina verwerkt. De bestaande mutatie revalideert /kandidaten en
hoeft geen volledige documentnavigatie uit te voeren.

Beoogd: één klik; wachten op de echte Shortlist-status in de eigen kandidatenrij;
geen documentnavigatie tijdens die handeling. Behoud de bestaande registratie-,
publicatie-,reactie-,compliance-,badge- en notitietests. Geen wijziging van het
product, gedeelde helpers, time-outs, authenticatie of overige journeys.

Dedup: openPRs en actuele code gecontroleerd; geen bestaande claim voor dit
shortlistmoment. De gedeelde helper blijft voor andere proeven staan. Echte
productiebuild-browsercontrole via CI; geen lokale browser/serverstart.
Volledige lokale checks en aparte onafhankelijke/native reviews volgen.
