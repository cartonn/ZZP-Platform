# MENSENWERK — wat een mens moet doen vóór livegang

> Dit platform is grotendeels door AI/agents gebouwd én getest. **Alles wat softwarematig kan,
> is gedaan.** Dit bestand bevat **alleen** wat een mens écht moet doen: dingen waarvoor een
> handtekening, een account, een betaalmethode, een geheim (wachtwoord/sleutel), een juridisch
> oordeel of een afspraak met een externe partij nodig is. Een agent mag/kan dat niet voor je doen.
>
> Geschreven voor een **niet-technisch** persoon. Je hoeft niets te programmeren. Per onderdeel:
> **Wat**, **Waarom**, **Stappen**, en **Wat lever je op** (en aan wie). Waar "geef door aan je
> ontwikkelaar/agent" staat, bedoelen we: zet het in de beveiligde instellingen (zie §7), daarna
> regelt de software de rest.

## Gouden regels (lees dit eerst)
1. **Zet geheimen NOOIT in een chat, e-mail, document of in de broncode.** Sleutels/wachtwoorden
   horen alleen in de beveiligde "secrets"-kluis van je hostingplatform (zie §1 en §7).
2. **Eén ding tegelijk, in de volgorde hieronder.** §0 is de snelste route naar een veilige pilot.
3. **Niets met echte, gevoelige documenten (VOG, diploma's, ID) live zetten** vóór de
   securitycheck en privacycheck in §5 zijn afgerond. Dat is een AVG-risico en je
   verantwoordelijkheid.
4. Twijfel je? Laat het bij §5 (juridisch/privacy) en §4 (externe koppelingen) door een
   specialist bevestigen. De rest is vooral "accounts aanmaken en sleutels doorgeven".

---

## §0. Snelste route naar een veilige pilot (volgorde)
Doe het in deze volgorde; elk blok verwijst naar het detail eronder.

1. **Bedrijf op orde** (§6): KvK-inschrijving + zakelijke bankrekening (heb je nodig voor
   betalingen en contracten).
2. **Hosting + database + opslag + domein** (§1): hier draait het platform.
3. **E-mail** (§2): zodat gebruikers meldingen/bevestigingen krijgen.
4. **Juridisch & privacy** (§5): privacyverklaring, verwerkersovereenkomsten, bewaartermijnen,
   security-/privacycheck. **Dit blokkeert livegang met echte gegevens.**
5. **Externe verificatie** (§4): DUO, BIG-register, iDIN — alleen nodig zodra je échte
   diploma-/identiteitscontrole wilt. De pilot kan starten met de ingebouwde demo-verifier.
6. **Betalingen** (§3): pas nodig als je echt geld gaat innen voor abonnementen.
7. **Eerste beheerder + demo-data uit** (§6).

> Een **besloten pilot zonder echte gevoelige documenten** kan na 1–3 + 5. Volledige livegang
> vraagt ook 4 en (bij betaald gebruik) 6.

---

## §1. Hosting, database, opslag, domein, geheimen
**Wat:** de plek waar de website draait, waar gegevens worden bewaard en waar documenten veilig
worden opgeslagen.
**Waarom:** lokaal draait het op een testdatabase; voor echt gebruik heb je een productie-omgeving
nodig met back-ups en beveiligde opslag.

### 1a. Hostingaccount
**Stappen:**
1. Maak een account bij een hostingplatform dat Next.js draait (bijv. **Vercel**) of laat je
   ontwikkelaar/agent een keuze voorstellen.
2. Voeg een betaalmethode toe (zakelijke kaart).
3. Koppel de GitHub-repository `cartonn/zzp-platform` (lees-toegang volstaat).
**Opleveren:** toegang tot het project op het hostingplatform (nodig om secrets te zetten).

### 1b. Database (PostgreSQL)
**Stappen:**
1. Maak een **managed PostgreSQL**-database aan (bijv. Neon, Supabase, of de databasedienst van je
   host). Kies een EU-regio (AVG).
2. Zet **automatische back-ups** aan.
3. Kopieer de **verbindings-URL** (begint met `postgresql://...`). Dit is een geheim.
**Opleveren:** de verbindings-URL → in de secrets als `DATABASE_URL` (§7). Geef je ontwikkela/agent
het seintje "Postgres staat klaar"; die zet de databaseprovider om naar PostgreSQL en draait de
eenmalige migratie.

### 1c. Documentopslag (S3 of S3-compatibel)
**Wat:** veilige, niet-openbare opslag voor geüploade bewijsstukken (VOG, diploma's, verzekering).
**Stappen:**
1. Maak een **opslag-bucket** aan (AWS S3 of een S3-compatibele dienst), in een EU-regio.
2. Zet de bucket op **privé** (niet publiek toegankelijk).
3. Maak een toegangssleutel/IAM-gebruiker met **alleen** lees-/schrijfrechten op die ene bucket.
**Opleveren:** bucketnaam, regio en de sleutels → secrets `STORAGE_DRIVER=s3`,
`STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (§7).

### 1d. Domein + HTTPS
**Stappen:**
1. Koop een domeinnaam (bijv. via je registrar).
2. Wijs het domein naar je host (DNS-instellingen; je host geeft aan wat in te vullen).
3. HTTPS (slotje) regelt de host meestal automatisch.
**Opleveren:** het domein → secret `AUTH_URL=https://jouwdomein.nl`.

### 1e. Geheimen (secrets)
**Stappen:**
1. Genereer een sterk **AUTH_SECRET** (laat je ontwikkelaar/agent dit doen, of gebruik een
   wachtwoordgenerator van minstens 32 tekens).
2. Zet ALLE geheimen in de **secrets/omgevingsvariabelen** van je host (niet in code).
**Opleveren:** zie het volledige overzicht in §7.

---

## §2. E-mail (meldingen en bevestigingen)
**Wat:** het platform verstuurt nu **in-app** meldingen. Voor e-mail (bijv. "je certificaat is
goedgekeurd", wachtwoord/uitnodiging) heb je een mailprovider nodig.
**Waarom:** zonder geverifieerd e-maildomein komen mails in spam of worden ze geweigerd.
**Stappen:**
1. Maak een account bij een transactionele mailprovider (bijv. **Postmark**, **SendGrid**, **Amazon SES**).
2. **Verifieer je domein**: de provider geeft een paar DNS-regels (SPF, DKIM, DMARC). Zet die bij
   je domeinregistrar (§1d). Dit voorkomt dat mail als spam wordt gezien.
3. Maak een **API-sleutel** aan.
**Opleveren:** API-sleutel + afzendadres (bijv. `geen-antwoord@jouwdomein.nl`) → geef door aan je
ontwikkelaar/agent; die koppelt de mailverzending (de in-app meldingen bestaan al).
**Let op:** gebruik **geen** privé-e-mailadres in code/instellingen; gebruik een zakelijk adres.

---

## §3. Betalingen / abonnementen
**Wat:** de abonnementspagina (Gratis/Pro/Business) werkt nu als **demo** (wisselen zonder te
betalen). Voor echt geld innen heb je een betaalprovider nodig.
**Waarom:** betalingen verwerken mag je niet zelf bouwen; dat doet een vergunninghoudende partij.
**Stappen:**
1. Open een zakelijk account bij **Stripe** of **Mollie**.
2. Doorloop de **KYC/verificatie**: bedrijfsgegevens, KvK-nummer, zakelijke bankrekening (§6),
   eventueel ID van de eigenaar. Dit kan enkele dagen duren.
3. Maak de **API-sleutels** aan (test + live) en stel **webhooks** in (je ontwikkelaar/agent geeft
   het webhook-adres).
**Opleveren:** API-sleutels + webhook-secret → geef door aan je ontwikkelaar/agent; die vervangt de
demo-abonnementsflow door echte betalingen.
**Tip:** start de pilot gerust met de demoflow; betalingen kun je later activeren.

---

## §4. Externe verificatiekoppelingen (DUO, BIG, iDIN/eIDAS)
**Wat:** het platform kan diploma's (DUO), zorg-beroepsregistratie (BIG) en identiteit (iDIN/eIDAS)
controleren. De **software staat klaar** achter een nette "koppelingsgrens" en draait nu met een
ingebouwde **demo-verifier**. Voor échte controle moet je per bron toegang regelen.
**Waarom:** dit zijn officiële registers/diensten; toegang vereist een afspraak/contract en
beveiligde sleutels. Een agent kan dat contact en die afspraken niet namens jou aangaan.

> Algemene werkwijze per bron: (1) jij regelt toegang + krijgt sleutels/endpoint, (2) je zet die in
> de secrets, (3) je ontwikkelaar/agent vult die ene koppeling in en zet de bijbehorende schakelaar
> om (`...=duo` / `...=bigregister` / `...=idin`). De rest van het platform verandert niet.

### 4a. DUO — diploma's
**Stappen (niet-technisch):**
1. Oriënteer je op het **DUO-diplomaregister** ("Mijn diploma's"). De gangbare, privacy-vriendelijke
   route: de ZZP'er haalt zelf met DigiD een **gewaarmerkt uittreksel met verificatiecode** op en
   deelt die; jij/het platform controleert die code/handtekening.
2. Neem contact op met **DUO** om de juiste verificatieafspraak/voorwaarden voor organisaties te
   bevestigen en (indien beschikbaar) toegang/endpoint te krijgen.
3. Leg vast hoe lang en waarvoor je deze gegevens bewaart (zie §5).
**Opleveren:** endpoint + eventuele sleutels → secrets `DUO_API_BASE`, `DUO_API_KEY` en zet
`DIPLOMA_VERIFIER=duo`. Je ontwikkelaar/agent werkt de DUO-controle af.

### 4b. BIG-register — zorgberoepen
**Stappen:**
1. Het **BIG-register** (beheerd door **CIBG**) is publiek doorzoekbaar op BIG-nummer + naam en
   heeft een **webservice** voor organisaties.
2. Vraag bij CIBG toegang tot de BIG-webservice aan en regel de bijbehorende voorwaarden/sleutels
   of certificaat.
3. Bepaal of je periodiek wilt hercontroleren (een registratie kan vervallen of geschorst worden).
**Opleveren:** endpoint + sleutels/certificaat → secrets `BIG_API_BASE`, `BIG_API_KEY` en zet
`BIG_VERIFIER=bigregister`.

### 4c. iDIN / eIDAS — identiteit
**Stappen:**
1. **iDIN** (identiteit via je bank) loopt meestal via een **betaaldienstverlener (PSP)** of een
   iDIN-routeringspartij. Sluit daar een contract.
2. Doorloop de onboarding (bedrijfsgegevens, technische afspraken, certificaten/sleutels).
3. (Toekomst) Houd de **EU Digital Identity Wallet (eIDAS 2.0)** in de gaten; die past op dezelfde
   koppelingsgrens.
**Opleveren:** endpoint + sleutels → secrets `IDENTITY_API_BASE`, `IDENTITY_API_KEY` en zet
`IDENTITY_VERIFIER=idin`.

---

## §5. Juridisch & privacy (AVG / Wet DBA / Wkkgz / security)
**Dit blok blokkeert livegang met echte persoonsgegevens. Doe dit serieus en met een specialist.**

### 5a. Privacy (AVG)
**Stappen:**
1. Laat een **privacyverklaring** en (indien nodig) **cookiebeleid** opstellen/controleren door een
   privacyjurist.
2. Stel de **rechtsgrondslagen** en **bewaartermijnen** per soort gegeven vast (er ligt een concept
   "privacy data matrix" klaar als startpunt; laat die bevestigen).
3. Houd een **verwerkingsregister** bij.
4. Sluit een **verwerkersovereenkomst (DPA)** met **elke** leverancier die persoonsgegevens
   verwerkt: hosting, database, opslag, mail, betaalprovider, en de verificatiediensten (§4).
5. Bepaal of een **DPIA** (gegevensbeschermingseffectbeoordeling) nodig is — bij gevoelige
   documenten/zorgcontext vaak wel.
6. Beslis bewust over **identiteitsdocumenten**: bewaar bij voorkeur alleen status/metadata, geen
   volledige ID-scans (dataminimalisatie).
**Opleveren:** ondertekende DPA's, vastgestelde bewaartermijnen, gepubliceerde privacyverklaring.

### 5b. Wet DBA (schijnzelfstandigheid)
**Stappen:**
1. De ingebouwde **DBA-risicocheck** is een **hulpmiddel, geen juridisch advies**. Laat een
   **arbeidsjurist** de gehanteerde signalen, drempels en teksten valideren.
2. Regel goedgekeurde **modelovereenkomst(en)** voor opdrachten met hoog risico.
**Opleveren:** akkoord van de jurist + (optioneel) modelovereenkomst-teksten die we kunnen koppelen.

### 5c. Wkkgz (alleen als je de zorgmarkt op gaat)
**Stappen:** bepaal met een specialist of/welke Wkkgz-verplichtingen gelden (kwaliteit, klachten,
VOG-eisen) en leg dat vast.

### 5d. Security review vóór livegang
**Stappen:**
1. Laat een **securityreview / pentest** uitvoeren voordat er echte gevoelige documenten in staan.
2. Bespreek met de tester de bekende, bewust gemaakte keuzes (staan in `PROGRESS.md`), o.a.:
   - het inlogsysteem onthoudt rol/status tot de sessie ververst (schorsing werkt na verversen) —
     beoordeel of directe uitsluiting nodig is;
   - de beveiligingsheaders staan aan, maar een strenger script-beleid (nonce) kan overwogen worden;
   - rate-limiting op inloggen/acties is nog niet ingebouwd.
**Opleveren:** rapport + akkoord om live te gaan ("GO"), of een lijst met te fixen punten (die de
agent dan oppakt).

---

## §6. Bedrijf & operationeel
### 6a. Bedrijf
**Stappen:** zorg voor **KvK-inschrijving**, een **zakelijke bankrekening** (nodig voor betalingen),
en een **bedrijfsaansprakelijkheids-/beroepsverzekering** voor het platform.

### 6b. Support & incidenten
**Stappen:** richt een **support-mailbox/kanaal** in en benoem wie verantwoordelijk is bij
incidenten (er ligt een incident-logsjabloon klaar als startpunt).

### 6c. Eerste beheerder + demo-data uit
**Stappen:**
1. Na de eerste installatie staan er **demo-accounts** (o.a. een admin). Maak in productie een
   **echte beheerder** aan en **wijzig/verwijder de demo-wachtwoorden**.
2. Zorg dat de productie-database **geen demo-/testgegevens** bevat bij livegang.
**Opleveren:** geef je ontwikkelaar/agent het seintje "productie schoon + echte admin staat klaar".

### 6d. Inhoud & huisstijl (optioneel)
Echte teksten, logo en eventuele huisstijl kun je aanleveren; de agent verwerkt ze.

---

## §7. Overzicht van geheimen/instellingen (geef deze door via de secrets-kluis)
Zet deze in de omgevingsvariabelen van je host — **nooit** in code of chat. (Zie ook `.env.example`.)

| Instelling | Wat het is | Waar haal je het | Wanneer nodig |
|---|---|---|---|
| `DATABASE_URL` | Verbindings-URL productie-database | Databasedienst (§1b) | Altijd (productie) |
| `AUTH_SECRET` | Geheim voor veilige inlogsessies (≥32 tekens) | Zelf genereren (§1e) | Altijd |
| `AUTH_URL` | Je productie-webadres | Je domein (§1d) | Altijd |
| `STORAGE_DRIVER=s3` | Schakelt productie-opslag in | — | Bij echte uploads |
| `STORAGE_S3_BUCKET` / `STORAGE_S3_REGION` | Bucketnaam + regio | Opslagdienst (§1c) | Bij echte uploads |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Opslag-toegangssleutels | Opslagdienst (§1c) | Bij echte uploads |
| Mail-API-sleutel + afzender | Voor e-mailverzending | Mailprovider (§2) | Voor e-mail |
| Betaal-API-sleutels + webhook-secret | Voor abonnementen | Stripe/Mollie (§3) | Voor betalingen |
| `DIPLOMA_VERIFIER=duo` + `DUO_API_BASE`/`DUO_API_KEY` | Echte DUO-controle | DUO (§4a) | Voor echte diplomacontrole |
| `BIG_VERIFIER=bigregister` + `BIG_API_BASE`/`BIG_API_KEY` | Echte BIG-controle | CIBG (§4b) | Voor echte zorgcontrole |
| `IDENTITY_VERIFIER=idin` + `IDENTITY_API_BASE`/`IDENTITY_API_KEY` | Echte identiteitscontrole | PSP/iDIN (§4c) | Voor echte identiteitscontrole |

> Zolang een verificatie-schakelaar **niet** op de echte waarde staat, draait de bijbehorende
> demo-verifier veilig door (handig voor de pilot).

---

## §8. Wat de AI/agents al hebben gedaan (zodat je dit NIET handmatig hoeft)
- De hele applicatie: profielen, opdrachten, reacties met match + compliance, documenten/
  certificaten, admin-verificatie, berichten/notificaties, samenwerkingen, facturen, admin-paneel,
  beschikbaarheid, dashboard.
- **Wet DBA-risicocheck**, **AVG-gegevensrechten** (eigen data downloaden + verwijderverzoek),
  **DUO-/BIG-/identiteitsverificatie** (achter koppelingsgrenzen, met demo-verifier), en een
  zichtbaar **vertrouwensniveau**.
- Beveiliging: rol- en eigendomscontrole server-side, privé-documenten, audit-logboek (incl.
  inlog-events + IP), security-headers, geheimvalidatie bij opstart, een veilige opslag-abstractie
  met productie-driver (S3) klaar.
- Kwaliteit: ruime test-set (unit + browser-e2e), CI + beveiligingsscripts, mobiel + desktop
  gecontroleerd, per onderdeel een onafhankelijke code-review.

**Kortom:** jij regelt accounts, contracten, geheimen en juridische akkoorden (dit document). De
software en koppelingen zijn klaar om die in te pluggen.
