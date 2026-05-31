# MASTER PROMPT — ZZP Platform: Dynamische Workflow & Volledige Overhaul

> **Model:** draai deze opdracht met **Claude Opus 4.8** (`claude-opus-4-8`). Dit is een lange, meerdaagse opdracht — kies het sterkste model.
> **Doel van dit bestand:** één bron van waarheid die Claude Code over meerdere sessies aanstuurt om het hele ZZP Platform te verbouwen tot een coherent, event-driven systeem waarin elke rol-actie logische vervolgacties bij andere rollen triggert, met de complete facturatie- en administratiecascade.

---

## 0. HOE JE DEZE OPDRACHT UITVOERT (lees dit eerst, elke sessie opnieuw)

Je bent een senior full-stack engineer + product designer. Je werkt **gefaseerd**, niet alles tegelijk. Je verliest geen context omdat je dit protocol volgt:

1. **Sessiestart:** lees `CURRENT_TASK.md`, `ARCHITECTURE.md`, `DECISIONS.md` (maak ze aan als ze ontbreken). Vat in 5 regels samen waar je staat en wat de volgende fase is.
2. **Eén fase per keer.** Begin geen nieuwe fase voor de vorige zijn _Definition of Done_ (DoD) haalt én jij het hebt afgevinkt in `CURRENT_TASK.md`.
3. **Quality gate:** aan het einde van elke fase: tests draaien, build draaien, kort verslag schrijven, `DECISIONS.md` bijwerken met gemaakte keuzes en afwijkingen.
4. **Stop-and-confirm:** als een keuze de architectuur, het datamodel of de business-logica fundamenteel raakt en er meerdere redelijke opties zijn → **stop, beschrijf de opties met jouw aanbeveling, vraag bevestiging.** Ga niet 4 uur de verkeerde kant op.
5. **Werk diep, niet breed.** Liever één rol-flow volledig kloppend (UI + API + events + administratie + tests) dan tien half af.
6. **Geen scope-creep, wél diepgang:** alles in dit document is in scope. Verzin geen features die hier niet staan zonder te vragen.
7. **Commit-discipline:** kleine, logische commits met duidelijke messages. Nooit een fase afsluiten met een rode build of falende tests.

**Belangrijk:** dit is een ZZP-marktplaats/platform (freelancers ⇄ opdrachtgevers, platform als spil). Het is **niet** ReOS en bevat geen re-integratielogica. Negeer aannames uit andere projecten.

---

## 0A. VASTGELEGDE BESLUITEN (hard — hier wijk je niet van af zonder te vragen)

Deze keuzes zijn gemaakt door de oprichters en zijn bindend. Ze bepalen de hele financiële en juridische laag. Maak hier geen eigen aannames over.

### Besluit 1 — Geldstroom: ALTIJD direct opdrachtgever → ZZP'er

- **Er loopt nooit geld via het platform.** De opdrachtgever betaalt rechtstreeks aan de ZZP'er.
- Het platform **registreert hooguit de betaalstatus** (ZZP'er of opdrachtgever markeert een factuur als betaald). Het platform initieert, houdt of verwerkt géén betalingen.
- **Reden (bewust vermeden):** derdengeldenvraagstukken, KYC, anti-witwascontroles, compliance-last, juridische aansprakelijkheid en veel extra ontwikkelwerk.
- **Gevolg voor de architectuur:** geen escrow, geen payment-processor-integratie voor de transactie zelf, geen derdengeldrekening. Wel: een lichtgewicht betaalstatus-tracking en herinneringen.

### Besluit 2 — DBA / schijnzelfstandigheid: platform MONITORT en SIGNALEERT, adviseert NIET juridisch

- Het platform positioneert zich als **ondersteunend risicobeoordelings- en monitoringsinstrument**: signaleren, waarschuwen, documenteren, monitoren, audittrail vastleggen.
- Het platform **geeft geen juridisch advies** en **garandeert nooit** dat een opdracht "DBA-proof" is. Vermijd elke formulering die een juridische garantie of advies impliceert.
- **Altijd met disclaimer** bij elk signaal (zie §6 voor de exacte rol-invulling). De eindverantwoordelijkheid ligt bij opdrachtgever en ZZP'er.

### Besluit 3 — Verplichte goedkeuringsstap vóór facturatie (beide tariefvormen)

- Vóór er een factuur wordt gegenereerd, keurt de **opdrachtgever** eerst de geleverde prestatie goed:
  - bij **uurtarief:** goedkeuring van de geregistreerde **uren**;
  - bij **milestone / fixed price:** goedkeuring van de **oplevering / milestone**.
- Dit is een aparte, verplichte stap (eigen event — zie Event B). Pas ná goedkeuring volgt de concept-factuur.

### Besluit 4 — Platformfee: OPEN PUNT (nog af te stemmen met Davud)

- **Nog niet definitief.** Waarschijnlijke richting: een **percentage van de opdrachtwaarde**, mogelijk (deels) betaald door de **opdrachtgever**.
- Bouw dit als **configureerbaar keuzeblok**, zodat de architectuur er niet op vastzit. Default: fee = 0% / uit, met duidelijke uitbreidpunten.
- **Let op:** omdat er geen geld via het platform loopt (Besluit 1), kan het platform de fee NIET inhouden op een transactie. Een fee wordt dus **apart gefactureerd** door het platform aan de betreffende partij (los van de geldstroom tussen opdrachtgever en ZZP'er). Houd deze twee stromen strikt gescheiden.

---

## 0B. OPENSTAANDE BESLISSINGEN (nog niet beslist — bouw flexibel, vraag bij twijfel)

Houd deze lijst bij in `DECISIONS.md` onder "Open". Bouw zó dat een latere keuze geen herbouw vereist. Maak hier zelf **geen** definitieve keuze: implementeer het configureerbaar/uitgeschakeld en ga door.

1. **Platformfee — detail (overleg Davud).** Wel/geen fee, hoogte (% van opdrachtwaarde of vast), wie betaalt (waarschijnlijk opdrachtgever), en triggermoment (na betaling vs. bij contract). → Event F als feature-flag, default UIT.
2. **Betaalstatus-verificatie.** Start met zelfrapportage (ZZP'er bevestigt ontvangst; default). Open: of beide partijen moeten bevestigen, en of er ooit een read-only banksignaal (PSD2-aggregator, alléén mutaties lezen, geen geldverwerking) bijkomt. → Bouw bevestigingslogica configureerbaar; geen bankkoppeling nu.
3. **DBA-drempelwaarden & teksten.** De maanden-grenzen (6/12), omzetpercentage (80%) en signaalteksten kunnen nog wijzigen. → Maak ze configureerbaar (config-bestand), niet hardcoded.
4. **Modelovereenkomst-afhandeling.** Nu: dossieritem/vinkje, geen oordeel. Open of er later sjablonen of een lichte wizard bijkomen. → Nu alleen registreren + documenteren.

---

## 1. MISSIE

Bouw het platform om naar een **dynamisch, event-driven systeem** waarin:

- **Elke rol een logisch, samenhangend werkproces heeft** — geen losse CRUD-schermen, maar een doordachte flow waarin de gebruiker altijd weet wat de volgende stap is en wie er aan zet is.
- **Elke actie van een rol automatisch logische vervolgacties triggert bij andere rollen.** Het systeem is een ketting van oorzaak en gevolg: een handeling op de ene plek genereert taken, notificaties, statuswijzigingen, administratie-items en (waar van toepassing) financiële registraties op andere plekken.
- **De facturatie- en administratiecascade volledig geautomatiseerd loopt** (zie §4 — dit is het hart van de opdracht), binnen de kaders van §0A.
- **UX, UI en design op productieniveau zijn:** strak, rustig, consistent, dark-first, met heldere statussen en duidelijke "aan zet"-signalering per rol.

Het resultaat moet voelen als één levend systeem, niet als een verzameling formulieren.

---

## 2. ROLLEN — coherentie-eis

Werk per rol een **complete, logische workspace** uit. Voor elke rol geldt: het dashboard toont altijd (a) waar de rol nu aan zet is, (b) wat er op de rol wacht, (c) wat er financieel/administratief openstaat.

| Rol                                                                                                         | Kern                                      | Belangrijkste acties die cascades starten                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ZZP'er** (opdrachtnemer)                                                                                  | Voert werk uit, factureert                | Uren/milestone vastleggen, werk/uren ter goedkeuring aanbieden, concept-factuur goedkeuren & indienen, betaling markeren als ontvangen                                 |
| **Opdrachtgever**                                                                                           | Huurt in, keurt goed, betaalt             | Opdracht plaatsen, contract tekenen, **uren/oplevering goedkeuren**, factuur goedkeuren, rechtstreeks betalen, betaling markeren                                       |
| **Platform / Admin**                                                                                        | Spil, bemiddeling, compliance, monitoring | Matching faciliteren, contract/compliance bewaken, **DBA-risico monitoren & signaleren**, betaalstatus volgen, (optioneel) platformfee factureren, disputen afhandelen |
| **Finance / Boekhouding** (rol-view bij ZZP'er én opdrachtgever; platform heeft eigen lichte administratie) | Boekt, bewaakt BTW & termijnen            | Administratie-items genereren, BTW-overzichten, betalingsherinneringen, jaaroverzichten                                                                                |

> **Coherentie-eis (hard):** voor _elke_ actie die een rol kan doen, beschrijf en implementeer je expliciet welke vervolgactie(s) bij welke andere rol(len) ontstaan. Geen enkele knop is een doodlopend einde. Documenteer dit in `WORKFLOW_MAP.md` als event → effect-tabel.

---

## 3. KERNARCHITECTUUR — event-driven

Bouw een **centrale event-bus / domain-event laag**. Elke betekenisvolle handeling publiceert een event; handlers reageren met vervolgacties. Dit is wat het systeem "dynamisch" maakt.

Eisen aan de event-laag:

1. **Domain events** met een vaste vorm: `{ id, type, actor_role, actor_id, subject (bv. contract/factuur/urenstaat), payload, timestamp, correlation_id }`.
2. **Idempotentie:** een event tweemaal verwerken mag nooit dubbele administratie-items of dubbele facturen opleveren. Gebruik event-id's + verwerkt-markeringen.
3. **Audit log:** elk event en elke afgeleide actie is onveranderlijk gelogd (wie, wat, wanneer, gevolg). Dit is óók een administratie- én DBA-monitoring-vereiste.
4. **State machines:** modelleer de levenscyclus van de centrale objecten als expliciete toestandsmachines met toegestane overgangen:
   - **Opdracht:** `concept → gepubliceerd → gematcht → gecontracteerd → in_uitvoering → opgeleverd → afgerond → gearchiveerd`
   - **Contract:** `concept → ter_ondertekening → getekend → actief → beëindigd`
   - **Urenstaat / Oplevering:** `concept → ingediend_ter_goedkeuring → goedgekeurd` (+ zijpad: `afgekeurd`)
   - **Factuur:** `concept → ingediend → goedgekeurd → betaald → verwerkt` (+ zijpaden: `afgekeurd`, `gecrediteerd`, `te_laat`)
   - **Betaling (registratie):** `verwacht → gemarkeerd_betaald → bevestigd` (+ zijpad: `te_laat`). Let op: dit is alléén statusregistratie; het platform verwerkt geen geld (zie §0A Besluit 1).
5. **Notificatie- & taakgeneratie:** events produceren (a) in-app notificaties, (b) takenlijst-items voor de juiste rol, (c) optioneel e-mail/reminders.
6. **Reminder-engine:** tijdgestuurde events (bv. "uren nog niet ingediend", "concept-factuur 3 dagen niet ingediend", "betaaltermijn over 5 dagen", "betaaltermijn verstreken", en de DBA-duursignalen uit §6).
7. **Administratiemotor:** events die financiële/administratieve gevolgen hebben genereren administratie-items bij de juiste partij(en) — zie §4 en §5.

> Niets in de UI wijzigt domeinstatus zónder via een event te lopen. De UI is een view op de state machines + de cascade.

---

## 4. DE VOLLEDIGE FACTURATIE- & ADMINISTRATIECASCADE (het hart)

Dit is het centrale scenario. Implementeer het end-to-end. Houd je strikt aan §0A: **geld loopt direct opdrachtgever → ZZP'er**, het platform registreert alleen status. Elke stap triggert vervolgacties bij andere rollen en genereert administratie-items op de juiste plekken (ZZP'er, opdrachtgever, en — alleen voor de fee — platform).

### Event A — Contract getekend

Trigger: opdrachtgever én ZZP'er hebben getekend.
Vervolgacties:

- Systeem leidt uit het contract het **factuurschema** af (fixed price → milestones; uurtarief → periodiek/op goedkeuring; inclusief tarief, BTW-percentage, betaaltermijn, eventuele fee-afspraak).
- **ZZP'er:** opdracht in "Lopende opdrachten"; urenregistratie/milestone-tracking geactiveerd.
- **Opdrachtgever:** opdracht in "Actieve inhuur".
- **Platform:** actief contractdossier; **DBA-monitoring gestart** (zie §6); bewaarplicht-timer; compliance-checklist (KvK, btw-nummer, modelovereenkomst-vinkje als dossieritem, niet als advies).
- **Administratie-item:** contractdossier vastgelegd in audit log.

### Event B — Prestatie ter goedkeuring ingediend, en goedgekeurd (VERPLICHTE STAP — beide tariefvormen)

Dit is twee gekoppelde momenten. **Zonder goedkeuring geen factuur.**

**B1 — ZZP'er dient prestatie in ter goedkeuring**
Trigger: ZZP'er biedt de geleverde prestatie aan:

- bij **uurtarief:** ingediende **urenstaat** (periode + uren + omschrijving);
- bij **milestone/fixed price:** **oplevering/milestone** als gereed gemeld.
  Vervolgacties:
- Urenstaat/Oplevering: `concept → ingediend_ter_goedkeuring`.
- **Opdrachtgever:** notificatie + **verplichte goedkeurtaak** "uren/oplevering beoordelen".
- **Platform:** teller "openstaande goedkeuringen" +1; DBA-monitor leest mee (duur, patroon).

**B2 — Opdrachtgever keurt uren/oplevering goed**
Trigger: opdrachtgever accordeert (of keurt af → zijpad).
Vervolgacties bij goedkeuring:

- Urenstaat/Oplevering: `ingediend_ter_goedkeuring → goedgekeurd`.
- Systeem **genereert automatisch een CONCEPT-factuur** voor de ZZP'er op basis van de goedgekeurde prestatie en het contract (bedrag = goedgekeurde uren × tarief óf milestonebedrag; + BTW; correct factuuradres opdrachtgever; verwijzing naar contract/opdracht/urenstaat).
- **ZZP'er:** notificatie "concept-factuur klaar — controleren & indienen" + taak in actielijst.
- **Reminder-cascade (ZZP'er):** dag 0 notificatie → dag 3 herinnering → dag 7 dringende herinnering → daarna escalatie-flag naar platform. (Tijden configureerbaar.)
- **Platform:** teller "openstaande concept-facturen" +1.
  Zijpad — **afgekeurd:** Urenstaat/Oplevering `→ afgekeurd` met reden → terug naar ZZP'er als taak → ZZP'er past aan en dient opnieuw in (terug naar B1). Audit houdt de keten vast. Géén factuur tot goedkeuring.

### Event C — ZZP'er keurt concept-factuur goed en dient in

Trigger: ZZP'er bevestigt de concept-factuur.
Vervolgacties:

- Factuurstatus: `concept → ingediend`.
- **Factuurnummer** toegekend uit de **eigen, doorlopende reeks van de ZZP'er** (niet de platformreeks!) — wettelijk vereist. PDF gegenereerd.
- Factuur loopt door naar de **opdrachtgever ter goedkeuring** (status-overgang + taak).
- **Administratie ZZP'er:** factuur op "Uitstaand / Debiteuren"; te dragen **BTW (omzetbelasting)** geregistreerd; omzet als _nog te realiseren_ gemarkeerd.
- **Reminder-cascade B2 stopt** voor deze factuur.

### Event D — Opdrachtgever keurt factuur goed

Trigger: opdrachtgever accordeert.
Vervolgacties:

- Factuurstatus: `ingediend → goedgekeurd`. **Betaaltermijn-timer** start (uit contract).
- **Administratie opdrachtgever:** crediteurenpost aangemaakt; kosten geboekt; **BTW als voorbelasting** (terugvorderbaar) geregistreerd.
- **ZZP'er:** notificatie "factuur goedgekeurd — betaling verwacht binnen X dagen. Betaling verloopt rechtstreeks." (incl. betaalgegevens ZZP'er die op de factuur staan).
- **Platform:** registreert betaling als `verwacht`; start betaalstatus-monitoring (geen geldstroom).
- **Reminder-cascade (opdrachtgever):** termijn-5 dagen, termijn-1 dag, op de vervaldag.
  Zijpad — **afgekeurd:** factuur `→ afgekeurd` met reden → terug naar ZZP'er → corrigeren → opnieuw indienen (terug naar Event C). Audit houdt de keten vast.

### Event E — Betaling vindt rechtstreeks plaats en wordt geregistreerd (GEEN geld via platform)

Trigger: de opdrachtgever betaalt **rechtstreeks** de ZZP'er (buiten het platform om), en dit wordt in het platform **gemarkeerd**:

- de **opdrachtgever** markeert "betaald", en/of
- de **ZZP'er** markeert "ontvangen".
  (Configureerbaar: bevestiging nodig van beide partijen, of één partij volstaat. Default: ZZP'er bevestigt ontvangst → status `bevestigd`.)
  Vervolgacties:
- Factuurstatus: `goedgekeurd → betaald`. Betaling-registratie: `gemarkeerd_betaald → bevestigd`.
- **Administratie ZZP'er:** debiteurenpost afgeboekt; **omzet gerealiseerd**; ontvangst geregistreerd.
- **Administratie opdrachtgever:** crediteurenpost afgeboekt; betaling vastgelegd.
- **Platform:** registreert betaalstatus; opdracht kan door naar `afgerond → gearchiveerd`. **Indien fee actief (zie Event F):** trigger fee-facturatie.
- Notificaties naar alle partijen.
- **Belangrijk:** het platform raakt het geld niet aan — dit event is puur statusregistratie + afgeleide administratie bij de twee partijen.

### Event F — (OPTIONEEL / CONFIGUREERBAAR) Platform factureert zijn fee

> Status: **open punt, default UIT** (zie §0A Besluit 4). Bouw als configureerbare module met een feature-flag en duidelijke uitbreidpunten. Implementeer de mechaniek, zet hem standaard uit.
> Trigger (indien geactiveerd): fee verschuldigd, bv. na bevestigde betaling (Event E) of na contractondertekening — beide als configuratie-optie.
> Vervolgacties:

- Platform genereert een **eigen, aparte factuur** (servicekosten) aan de geconfigureerde partij (waarschijnlijk opdrachtgever; configureerbaar), met **BTW over de fee**. Fee = configureerbaar **percentage van de opdrachtwaarde** (of vast bedrag).
- Deze factuur staat **los van de geldstroom opdrachtgever → ZZP'er** en wordt apart voldaan. Het platform int niets in op de hoofdtransactie.
- **Administratie platform:** omzet (fee) + af te dragen BTW geboekt (eigen, lichte administratie).
- **Administratie betrokken partij:** kostenpost + voorbelasting geboekt.
- Betaalstatus van de fee-factuur volgt dezelfde lichte registratie-logica als Event E.

### Zijpaden (verplicht implementeren — dit maakt het systeem echt dynamisch)

- **Uren/oplevering afgekeurd:** zie Event B-zijpad.
- **Factuur afgekeurd:** zie Event D-zijpad.
- **Betaling te laat:** termijn verstreken → `factuur: te_laat` + betaling `te_laat` → herinnering 1 → herinnering 2 → aanmaning (sjabloon voor ZZP'er) → escalatie-flag naar platform. Elk een eigen administratie-item. (Platform int niet; biedt alleen signalering en sjablonen.)
- **Correctie/creditfactuur:** ZZP'er crediteert → tegenboekingen bij ZZP'er én opdrachtgever; BTW gecorrigeerd; nieuwe factuur indien nodig.
- **Dispuut/escalatie:** platform krijgt taak, kan bemiddelen; statussen bevriezen tot opgelost.
- **DBA-signalen:** zie §6 — lopen mee gedurende de hele looptijd, niet alleen bij facturatie.
- **Periodieke afgeleide administratie:** uit alle facturen rollen automatisch op: **BTW-kwartaaloverzicht** (per partij), **debiteuren-/crediteurenoverzicht**, **jaaroverzicht/IB-voorbereiding** voor de ZZP'er. (Niet-bindende suggesties zoals BTW-/oudedagsreservering mogen.)

> **Eis:** elk genoemd event en zijpad is geïmplementeerd als handler, getest met unit-/integratietests, en zichtbaar in de UI van de juiste rol. De administratie bij ZZP'er en opdrachtgever (en, indien fee actief, platform) moet voor elke financiële stap kloppen en herleidbaar zijn.

---

## 5. ADMINISTRATIE- & FINANCIËLE LAAG

- **Perspectieven op dezelfde transactie:** debiteur (ZZP'er) en crediteur (opdrachtgever) op de hoofdfactuur; platform alleen op de eigen fee-factuur (indien actief). Eén bron, juiste views per partij.
- **Geen geldverwerking door het platform.** Alleen betaalstatus-registratie (zie §0A Besluit 1).
- **BTW correct:** af te dragen omzetbelasting bij de uitschrijver, voorbelasting bij de ontvanger, BTW over platformfee apart. Houd rekening met verschillende tarieven en BTW-vrijgesteld/verlegd als configuratie-optie.
- **Factuurnummering:** doorlopend en uniek **per uitschrijvende partij** (ZZP'er heeft eigen reeks; platform-fee heeft eigen reeks). Geen gaten.
- **Onveranderlijkheid:** ingediende/verzonden facturen wijzig je niet — alleen crediteren + nieuwe factuur.
- **Exporteerbaarheid:** overzichten exporteerbaar (CSV/PDF) voor de boekhouder; auditspoor compleet.
- **Herleidbaarheid:** vanaf elke boeking terug te klikken naar event → factuur → goedgekeurde urenstaat/oplevering → contract → opdracht.

---

## 6. DBA-MONITORING & RISICOSIGNALERING (juridisch voorzichtig — geen advies)

> **Positionering (hard, zie §0A Besluit 2):** het platform is een **ondersteunend risicobeoordelings- en monitoringsinstrument**. Het **signaleert, waarschuwt, documenteert, monitort en legt een audittrail vast**. Het **adviseert niet juridisch** en **garandeert nooit** dat een opdracht aan de wet voldoet of "DBA-proof" is. De eindverantwoordelijkheid ligt bij opdrachtgever en ZZP'er.

**Risiconiveaus** (toon als label op opdracht/contract): `Laag risico` · `Verhoogd risico` · `Hoog risico`. Elk signaal en niveau wordt **altijd vergezeld van een disclaimer** (zie onder).

**Statische checks (bij contract/onboarding, als dossieritems — geen oordeel, slechts registratie):**

- KvK-inschrijving
- btw-nummer
- meerdere opdrachtgevers
- vervangingsmogelijkheid
- ondernemersrisico
- modelovereenkomst aanwezig

**Automatische, tijd- en patroongedreven signalen (lopen gedurende de hele looptijd):**

- opdracht loopt langer dan **6 maanden** → signaal
- opdracht loopt langer dan **12 maanden** → sterker signaal
- meer dan **80% van de omzet** van de ZZP'er bij **één opdrachtgever**
- **zelfde functie** als werknemers in dienst
- **vaste roosterstructuur**
- kenmerken van **leiding en toezicht**

**Voorbeeld-signaaltekst (toon, met disclaimer):**

> "Let op: deze opdracht loopt inmiddels 11 maanden. Langdurige inzet kan een verhoogd risico op schijnzelfstandigheid opleveren. Overweeg een interne beoordeling. Dit is een signaal ter informatie en geen juridisch advies; het platform beoordeelt niet of aan de wet wordt voldaan."

**Eisen:**

- Elk signaal genereert een notificatie/taak bij **zowel ZZP'er als opdrachtgever** (en is zichtbaar voor platform/admin), en wordt **gedocumenteerd in het audittrail**.
- De drempelwaarden en teksten zijn **configureerbaar**.
- Nergens in copy of UI staat een formulering die juridisch advies of een garantie impliceert. Bouw dit ook in als reviewpunt in Fase 4/5.

---

## 7. UX / UI / DESIGN-EISEN

- **Dark-first**, rustig, hoog contrast waar het moet; consistente design tokens (kleur, spacing, radius, typografie) — leg ze vast in een design-systeem/`DESIGN.md` en gebruik ze overal.
- **"Aan zet"-principe:** elke rol ziet bovenaan glashelder wat er nú van hém/haar wordt verwacht (bv. opdrachtgever: "2 urenstaten wachten op je goedkeuring"). Geen zoeken.
- **Statushelderheid:** consistente status-badges over alle objecten (opdracht/contract/urenstaat/factuur/betaling) met dezelfde kleurtaal.
- **Cascade zichtbaar maken:** waar logisch, toon de keten ("deze factuur volgt uit goedgekeurde urenstaat Y / contract X"; "na goedkeuring → rechtstreekse betaling → registratie").
- **Betaling rechtstreeks duidelijk maken:** UI communiceert helder dat betaling buiten het platform om gaat en dat het platform alleen status bijhoudt.
- **DBA-signalen rustig en niet-alarmerend** tonen, altijd met disclaimer; nooit als juridisch oordeel.
- **Lege staten, laad-staten, foutstaten** overal verzorgd.
- **Toegankelijkheid:** toetsenbordbediening, focus-states, voldoende contrast, schermlezer-labels.
- **Responsief:** desktop primair, maar mobiel bruikbaar voor goedkeur-/betaalmarkering-/opleveracties.
- **Microcopy in correct, zakelijk Nederlands.**
- **Consistentie boven originaliteit:** dezelfde patronen voor dezelfde handelingen door het hele platform.

---

## 8. WERKFASEN met Quality Gates

Werk deze fasen in volgorde af. Elke fase eindigt met DoD + verslag in `CURRENT_TASK.md`.

**Fase 0 — Inventarisatie & fundering**
Breng de bestaande codebase, datamodellen, rollen en schermen in kaart. Schrijf `ARCHITECTURE.md` (huidig + doel) en `WORKFLOW_MAP.md` (lege event→effect-tabel). Identificeer wat hergebruikt kan worden en wat moet wijken. Leg §0A-besluiten vast in `DECISIONS.md`.
_DoD:_ documenten staan er; gap-analyse helder; geen code gewijzigd zonder noodzaak.

**Fase 1 — Event-bus, state machines, audit log**
Implementeer de event-laag, de state machines (§3), idempotentie en het onveranderlijke audit log. Volledig getest los van UI.
_DoD:_ events publiceren/consumeren werkt; ongeldige statusovergangen worden geweigerd; tests groen.

**Fase 2 — Datamodel administratie & administratiemotor**
Modelleer urenstaten/opleveringen, facturen, administratie-items (ZZP'er debiteur, opdrachtgever crediteur), BTW, factuurnummering per partij, betaalstatus-registratie. Bouw de administratiemotor die op events boekt.
_DoD:_ een proeftransactie genereert correcte administratie bij ZZP'er én opdrachtgever; BTW klopt; nummering uniek; geen geldverwerking aanwezig.

**Fase 3 — De hoofdcascade (Events A–E)**
Implementeer de volledige cascade end-to-end: contract → verplichte goedkeuring uren/oplevering → concept-factuur → indienen → goedkeuren → rechtstreekse betaling + statusregistratie. Inclusief reminders. Event F (fee) als uitgeschakelde module meebouwen.
_DoD:_ van contract-getekend t/m betaalregistratie verloopt de keten automatisch; beide administraties kloppen; integratietest dekt het hele pad; goedkeuringsstap werkt voor zowel uurtarief als milestone/fixed price.

**Fase 4 — Zijpaden & DBA-monitoring**
Uren/oplevering afkeuren, factuur afkeuren, te late betaling/aanmaningen, creditfacturen, disputen/escalatie, periodieke overzichten, én de volledige DBA-monitoring & signalering (§6) met disclaimers.
_DoD:_ elk zijpad getest en zichtbaar in de juiste rol-UI; DBA-signalen vuren op de drempels; geen enkele copy impliceert juridisch advies/garantie.

**Fase 5 — Rol-workspaces & UX/UI**
Bouw/verbouw per rol de samenhangende workspace volgens §2 en §7, bovenop de cascade. "Aan zet"-dashboards, statushelderheid, cascade-zichtbaarheid, rechtstreekse-betaling-communicatie.
_DoD:_ elke rol kan zijn volledige flow lopen; design tokens consistent; toegankelijkheid gecheckt.

**Fase 6 — Notificaties, reminders, exports**
In-app + e-mail notificaties, tijdgestuurde reminders (incl. DBA-duursignalen), boekhoud-exports (CSV/PDF), BTW-/jaaroverzichten.
_DoD:_ reminders vuren op tijd; exports kloppen met de administratie.

**Fase 7 — Hardening & end-to-end**
Edge cases, idempotentie onder dubbele events, performance, volledige E2E-test die meerdere rollen door de hele levenscyclus stuurt (beide tariefvormen). Polish van UX-details. Eventueel: fee-module (Event F) activeren zodra Davud-besluit binnen is.
_DoD:_ E2E groen; geen openstaande TODO's in de happy path; verslag van bekende beperkingen.

---

## 9. DEFINITION OF DONE (overall)

- Elke rol heeft een coherente workspace; geen doodlopende knoppen.
- Elke beschreven actie triggert de juiste vervolgacties bij andere rollen (verifieerbaar via `WORKFLOW_MAP.md` + tests).
- De volledige cascade (A–E) + verplichte goedkeuringsstap (B) + zijpaden werken end-to-end, voor zowel uurtarief als milestone/fixed price.
- Geld loopt nooit via het platform; betaalstatus wordt correct geregistreerd.
- Elke financiële stap levert correcte, herleidbare administratie bij ZZP'er en opdrachtgever (en platform bij actieve fee).
- BTW, factuurnummering (per partij) en onveranderlijkheid zijn juist.
- DBA-monitoring signaleert correct, altijd met disclaimer, zonder juridisch advies of garantie.
- Fee-module (Event F) bestaat als configureerbare, standaard-uitgeschakelde module.
- UX/UI/design op productieniveau, consistent en toegankelijk.
- Tests (unit + integratie + E2E) groen; build groen; documentatie (`ARCHITECTURE.md`, `DECISIONS.md`, `WORKFLOW_MAP.md`, `DESIGN.md`, `CURRENT_TASK.md`) bijgewerkt.

---

## 10. ANTI-PATRONEN (niet doen)

- **Geen geld via het platform.** Geen escrow, geen payment-verwerking, geen derdengelden. Alleen statusregistratie.
- **Geen juridisch advies of DBA-garantie** in copy of logica. Alleen signaleren/documenteren met disclaimer.
- **Geen factuur zonder goedgekeurde uren/oplevering** (verplichte stap B, beide tariefvormen).
- Geen losse CRUD-schermen die geen cascade triggeren.
- Geen statuswijziging buiten de state machine / event-laag om.
- Geen dubbele administratie-items of dubbele facturen bij herhaalde events.
- Geen platform-brede factuurnummering (nummering hoort per uitschrijver).
- Geen mock-financiën: administratie moet echt kloppen, niet "voor de show".
- Niet stilletjes grote architectuurkeuzes maken — gebruik stop-and-confirm.
- Geen hele codebase tegelijk verbouwen — volg de fasen.

---

## 11. STARTOPDRACHT — zo ga je nu aan de slag

### Gebruik (in Claude Code)

Plaats dit bestand in de repo, bv. `prompts/PLATFORM_OVERHAUL.md`. Start een sessie met **Claude Opus 4.8** en geef als eerste bericht:

> Lees `prompts/PLATFORM_OVERHAUL.md` volledig. Dit is je opdracht en bindende werkinstructie. Voer **Fase 0** uit zoals beschreven in §11 en stop daarna voor mijn akkoord.

### Concrete eerste handelingen (Fase 0 — doe dit nu, in deze volgorde)

1. **Lees deze hele opdracht.** Vat in max. 8 regels samen: het doel, de 4 vastgelegde besluiten (§0A), de open punten (§0B) en de fasering.
2. **Verken de repo.** Breng in kaart: stack/frameworks, mappenstructuur, datamodel/migraties, bestaande rollen, bestaande schermen, bestaande API-endpoints, teststatus. Raak nog geen functionele code aan.
3. **Maak/actualiseer de werkdocumenten** in de repo-root (of `docs/`):
   - `CURRENT_TASK.md` — waar je staat, huidige fase, volgende stap, openstaande vragen. (Werk dit bij aan het eind van elke sessie.)
   - `ARCHITECTURE.md` — huidige situatie + doelarchitectuur (event-bus, state machines uit §3).
   - `DECISIONS.md` — neem §0A over als "Vastgelegd" en §0B als "Open". Voeg datum + onderbouwing toe bij elke nieuwe keuze.
   - `WORKFLOW_MAP.md` — tabel met kolommen: `Event | Actor (rol) | Trigger | Gevolg bij rol X | Gevolg bij rol Y | Administratie-item(s) | Status-overgang(en)`. Vul alvast Events A–F + zijpaden uit §4 in als skelet.
   - `DESIGN.md` — eerste opzet design tokens / UX-principes uit §7 (mag in Fase 5 verder ingevuld).
4. **Schrijf een gap-analyse** in `CURRENT_TASK.md`: wat is herbruikbaar, wat moet wijken, wat ontbreekt volledig, en de grootste risico's.
5. **Stel Fase 1 voor.** Beschrijf concreet hoe je de event-bus, de state machines en het audit log gaat bouwen, met de architectuurkeuzes waarop je bevestiging wilt (bv. in-process event-bus vs. tabel-gebaseerde outbox; hoe idempotentie te garanderen; waar de state machines leven). Geef per keuze jouw aanbeveling.

### Stopconditie Fase 0 (DoD)

- De vijf documenten bestaan en zijn ingevuld zoals hierboven.
- De gap-analyse is helder.
- Er is een concreet Fase 1-voorstel met expliciete keuzevragen.
- **Geen functionele code gewijzigd.**
- **STOP en wacht op mijn akkoord** voordat je Fase 1 implementeert.

### Daarna

Werk de fasen 1 t/m 7 (§8) één voor één af. Aan het eind van **elke** fase: tests + build draaien, kort verslag in `CURRENT_TASK.md`, `DECISIONS.md` bijwerken, en — bij fundamentele keuzes — stop-and-confirm (§0 punt 4). Begin nooit een nieuwe fase voordat de vorige zijn DoD haalt.
