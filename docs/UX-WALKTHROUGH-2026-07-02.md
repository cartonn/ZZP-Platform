# UX-walkthrough 2026-07-02 — verwarpunten & verbeterbacklog

> Methode: geautomatiseerde walkthrough (Playwright, 1440×900) op de live test-omgeving met de
> vier demo-accounts (zzp@, opdrachtgever@, franchise@, admin@); alle nav-routes per rol +
> detailpagina's bezocht (83 full-page screenshots, 0 console-errors). Beoordeling door vier
> onafhankelijke persona-reviews (kritische zorg-ZZP'er, zorgplanner gewend aan Pidz/Zorgwerk,
> bureau-bemiddelaar, compliance-beheerder) + eigen inspectie van de kernflows.
> Benchmarks: Pidz/Temper (flow), Linear/Stripe (UI).

**Oordeel:** de basis is sterk — geen kapotte pagina's, elke rol heeft een logisch dashboard met
acties-lijst, de flows werken. De verwarring zit in drie structurele patronen: navigatie die je
moet raden (iconen zonder labels), meerdere waarheden voor dezelfde status, en systeemtaal in
plaats van gebruikerstaal.

## Bugs (direct te fixen, geen UX-mening)

- [ ] **Dubbele tellers** op ≥3 schermen: "3 3 aanvragen" (admin/verificaties), "13 13
      samenwerkingen" (admin/samenwerkingen), "0/3 3 lessen" (academie) — count-rendering
      dedupliceren.
- [ ] **Date-inputs en-US**: mm/dd/yyyy in nieuwe-opdracht, samenwerking-voorstellen,
      certificaat-upload én lead-opvolging (bemiddelaar) — nl-locale afdwingen (dd-mm-jjjj).
- [ ] **Status-mismatch admin/opdrachten**: rij "Frontend Developer (concept)" draagt badge
      "Gesloten".
- [ ] **"-100%"-trend** op Inzicht wanneer de lopende maand nog leeg is — trend onderdrukken
      zonder data.
- [ ] **Openstaand-tegenspraak**: Inzicht (ZZP) toont "Platformabonnement openstaand € 48,40",
      Financiën zegt "€ 0,00" en biedt geen betaalactie; admin/financien-header "€ 0,00" boven
      een lijst met € 496 openstaand — per scherm één consistente definitie + betaalactie.

## Rode draden (prioriteitsvolgorde)

1. **Zijbalk: labels + groepen + tellers** (alle rollen, hoog). 14–16 naamloze iconen, deels
   bijna identiek; geen wachtrij-tellers. → Permanente tekstlabels, sectiekoppen (admin:
   Wachtrijen/Beheer/Inzicht), badge-tellers ("Verificaties · 3").
2. **Eén bron van waarheid per status** (alle rollen, hoog). "100% profiel" naast "Nog niet
   inzetbaar" + "documenten 0%" (zzp); "Stap 2 van 6" vs 4-staps-balk (samenwerkingen);
   compliance-zegel "0/1 diensten" naast weekstrip "2 diensten"; "100% in één keer akkoord"
   naast "Te weinig gegevens". → Eén inzetbaarheids-indicator; één stappenreeks; oordelen
   verbergen zonder data.
3. **Terminologie-woordenboek** (alle rollen, hoog). "Diensten" = shifts én urenstaten-pagina;
   "Prestaties"→"Uren goedkeuren"; "werkproces"→"samenwerking"; Financiën vs "Administratie";
   Freelancers/Kandidaten/professionals → "ZZP'ers vinden" + "Reacties"; verzekering uploaden
   heet "Nieuw certificaat" met VOG-placeholders → "Document toevoegen" + type-afhankelijke
   placeholders.
4. **Matching-vertrouwen** (zzp+client, hoog). Zorg-vacatures op 85–97% voor
   IT-profielen/bedrijven; "Soortgelijke opdrachten" zijn profielmatches; groene ring bij 55%
   naast waarschuwingen; skills-picker ongesorteerd en dubbel. → Branche zwaarder wegen of
   default filteren; herlabelen; ringkleur aan score koppelen; skills groeperen + zoeken.
5. **Beslisschermen zonder (juiste) actie** (client+admin, middel). Vergelijk-scherm eindigt
   zonder keuze-knop; "mist VOG"-waarschuwing zonder actie naast prominente
   afrond/annuleer-knoppen; samenwerking-detail opent met "No-show melden"; urenstaten-pagina
   heeft Export/Import maar geen "Urenstaat indienen"; admin-rijen alleen destructief
   (Sluiten/Schorsen) zonder detail-doorklik; lege wachtrijen zonder historie ("wie staat op 2
   van 3 no-shows?").
6. **Formulier-verrassingen** (client+zzp, middel). DBA-check toont "Laag risico" vóór enige
   input en gebruikt juristentaal; default "Geen modelovereenkomst" ondanks login-belofte;
   concept-vs-publiceren pas in kleine tekst na de knop. → Oordeel pas na input, checkboxes in
   mensentaal, modelovereenkomst default, knop splitsen "Opslaan als concept"/"Opslaan &
   publiceren".
7. **Admin-wachtrijen niet op tempo te bedienen** (middel). Bewijsstuk = download i.p.v. inline
   preview; permanente lege afwijs-textarea per kaart; geen wachttijd/oudste-eerst; support =
   ±10 volledig uitgeklapte tickets zonder filter; acties-centrum toont alleen verificaties. →
   Inline preview, reden-veld pas bij Afwijzen, "X dagen in wachtrij" met kleur ≥5d, compacte
   support-lijst met filters, actiecentrum voeden met álle wachtrijen.

## Rode draad 8 — de bemiddelaar kan niet actief bemiddelen (hoog)

Het kernvak van een bureau ontbreekt als werkwoord in de UI:

- [ ] **"ZZP'er voordragen/koppelen" ontbreekt op een open dienst** — een dienst staat 27 dagen
      open ("nog geen reacties") terwijl er 2 beschikbare roster-ZZP'ers zijn; de bemiddelaar kan
      alleen wachten. → Voordraag-actie op dienst-detail met inline compliance-check.
- [ ] **Geen fee/marge-inzicht**: Inzicht toont "Betaalde omzet € 0,00 · bemiddeling" zonder
      onderscheid doorgezet volume vs bureaufee; fee-percentage nergens instelbaar. → Splits
      Inzicht en voeg fee-instelling toe aan Instellingen.
- [ ] **Zelf geen gesprek kunnen starten** (berichten-lege-staat: "een opdrachtgever start een
      gesprek…") — haaks op hoe een bureau werkt. → "Nieuw gesprek" richting eigen roster en
      opdrachtgevers.
- [ ] **Lead → opdrachtgever-conversie ontbreekt**: een lead met status "Klant" is een dood
      eind. → Actie "Maak opdrachtgever aan" die de gegevens meeneemt.
- [ ] **Instellingen zijn speelgoed**: alleen naam + hex-kleurveld + cryptische
      platform-openstellen-toggle; zakelijke instellingen (fee, standaardeisen, regio) ontbreken.

Versterkt bovendien bestaande draden: next-actions zegt "Niets dat nu aandacht vraagt. Goed
bezig." naast 0/2 identiteit-geverifieerd én een 27-dagen-open dienst (draad 2); dashboard
"Beschikbaar" (groen) vs ZZP'ers-pagina "Nog niet inzetbaar" (rood) voor dezelfde personen
(draad 2); "Vulgraad 0%" + "dreigt onvervuld" naast "Deze week is alles gedekt"
(draad 2, dekkingsprognose-presentatie); "Inzetvorm nog niet beoordeeld"-waarschuwing zonder
actieknop, "VOG ontbreekt +1" zonder herinner-actie, leads zonder dagen-stil-signaal (draad 5);
"Shift-overnames" (half Engels) + drie regels beleidsproza die uitleggen wat goedkeuren níet
doet (draad 3).

## Kleinere punten (per rol)

- **ZZP**: login-pagina legt boven de vouw niet uit wat het platform is; bel-teller "7" vs
  1 open actie; opdrachtenlijst en filterchips niet op profielbranche gefilterd.
- **Opdrachtgever**: kandidatenpagina = eindeloze scroll met alles uitgeklapt incl.
  geaccepteerden (→ compacte rijen, geaccepteerden naar Samenwerkingen); "Vervullingsgraad 22%"
  zonder context/tooltip; vergelijkingstabel toont "Deels"/"—" zonder uitleg.
- **Admin**: gebruikersrijen alleen "Schorsen", geen dossier-doorklik; ORT-jargon op
  samenwerkingsdetail zonder "wat wordt van mij verwacht"-regel.
- **Bemiddelaar**: ZZP'ers-lijst verbergt ontbrekende items achter "+1" zonder ze uit te
  schrijven; "Bemiddeling bewerken" hex-veld zonder kleurkiezer; shift-overname-flow mist
  2-stappen-schema (1. keur aanvraag, 2. plaats overnemer).

Volledig rapport (Artifact): zie sessie 2-7-2026; screenshots in de sessie-scratchpad.
