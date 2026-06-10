# GAPS — gaten-backlog van de zelf-test-lus

Bijgehouden door de persona-sweep (zie `LOOP.md`). Fix-agents werken deze van boven naar beneden af;
gefixte items krijgen `[x]` + PR-nummer. "Productkeuzes" worden NIET gefixt zonder eigenaar-besluit.

## Iteratie 0 — 2026-06-09 (kalibratie)

53 screenshots over 4 persona's → 29 ruwe bevindingen → **16 bevestigd**, 3 productkeuzes, 8 dropped.

### Bevestigd (te fixen)

- [x] **HOOG · BUG** (#226) — Vertrouwensniveau "Volledig geverifieerd" negeerde ontbrekende verplichte
      documenten (`src/lib/trust.ts`). → trust weegt nu VOG+verzekering mee op alle 5 surfaces.
- [x] **HOOG · BUG** (#227) — Afgeronde + betaalde samenwerking toonde nog actieve "Akkoord geven" op de
      modelovereenkomst. → `canSign`/`canChooseType` alleen bij PROPOSED/ACTIVE.
- [x] **HOOG · UX** (#227) — Tegenstrijdige ongelabelde badges op ZZP-detail. → gelabeld als
      "Inzetbaarheid" / "Beschikbaarheid".
- [x] **MIDDEN · COPY** (#229) — Abonnementspagina lekt "Dit is een demo zonder echte betaling"
      (`abonnement/page.tsx`). → demo-tekst weg / neutraal herschrijven.
- [x] **MIDDEN · UX** (#229) — Audit-log toont rauwe JSON met centen + e-mail (`admin/audit/page.tsx`). →
      nette NL key/value + geformatteerde bedragen.
- [x] (#233) **LAAG · COPY** — Engelse native file-knop "Choose File / No file chosen" (bedrijf/documenten/
      certificaten/import). → eigen NL "Bestand kiezen".
- [x] (#231) **LAAG · COPY** — "Pdf"-knoplabel i.p.v. "PDF" (`admin/facturatie/page.tsx`).
- [~] (bewust laag) Native datumvelden: rechter stelde zelf vast dat lang="nl" al gezet is; placeholder volgt de browser-UI-taal. Niet gefixt — zeer lage waarde.
- [x] (#232) **LAAG · UX** — Leads-KPI "Open leads 2" vs 3 zichtbare leads zonder uitleg (subtekst/filter).
- [x] (#231) **LAAG · UX** — "Inzetbaar 0 van 2"-tegel op franchise-inzicht niet klikbaar, geen reden/vervolg.
- [x] (#231) **LAAG · UX** — Factuurlijst toont totaal incl. btw zonder "(incl. btw)"-label.
- [x] (#232) **LAAG · UX** — "Genereer facturen" geeft geen zichtbare terugkoppeling.
- [x] (#231) **LAAG · UX** — Verzekering-herstelactie is onopvallende tekstlink i.p.v. knop.
- [x] (#236) **LAAG · UX** — ZZP'er-toevoegformulier permanent uitgeklapt boven roster (vs. opdrachtgevers via knop).
- [x] (geverifieerd) "Reageren"-knop: geen bug — de testopdracht had al een reactie; de reageer-flow is gedekt door e2e (onboarding/applications) + de abuse-suite.
- [x] **HOOG → harness-artefact** — Zwevend 'N'-element over de sidebar = Next.js **dev-indicator**;
      alleen in `npm run dev`. Opgelost door de sweep tegen een productie-build te draaien
      (`playwright.personas.config.ts`). Geen app-fix.

### Productkeuzes (eigenaar-besluit — niet auto-fixen)

- [x] (#234, primaire accounts) Seed-/demodata is IT/developer i.p.v. zorg (positionering). Verrijken met zorgcontext = keuze.
- [x] (#235) Franchise-diensten-overzicht is read-only zonder doorklik naar dienst-detail.
- [x] (#232) Statistieken: subgroep-percentages tellen niet zichtbaar tot 100% (admins niet apart getoond).

## Iteratie 1 — 2026-06-09 (adversariële code-flow-sweep)

6 hunters (freelancer/client/franchiser/admin/geld-cascade/authz-tenancy) → 17 bevindingen, **17 bevestigd**
na adversariële verificatie (confidence ≥ 0,6). **Alle 17 gefixt** (#245–#254), elk op groene CI.

### HOOG

- [x] (#245) **GELD** — CLIENT-dashboard "Openstaand" (`client-stats.ts`) telt op `status IN (SENT,OVERDUE)`; cascade-facturen blijven `status='DRAFT'` → toont €0. Cascade-bewuste `outstandingInvoiceWhere` toegepast.
- [x] (#246) **DEADEND** — Franchiser-cockpit linkt dienst naar `/opdrachten/[id]` i.p.v. `/franchise/diensten/[id]` → kale/404-pagina buiten de franchise.
- [x] (#248) **GELD** — Factuur opnieuw indienen na afkeuring kent NIEUW factuurnummer toe → gat in gatenvrije reeks. `submitInvoice` behoudt nu het bestaande nummer bij heraanbieding.
- [x] (#248) **GELD** — Factuur opnieuw indienen dubbel-boekt omzet/debiteuren/BTW. `resubmit`-vlag onderdrukt de grootboekboekingen bij heraanbieding.
- [x] (#247) **AUTHZ** — Publieke `/zzp/[id]` lekte tenant-roster-PII cross-tenant + onauthenticated. `tenantEntityVisibleTo`-guard toegevoegd (AVG).

### MIDDEN

- [x] (#245) **GELD** — ZZP'er-facturen "Openstaand"-kaart altijd €0 voor cascade-facturen. Zelfde root cause als #245-HOOG.
- [x] (#245) **GELD** — CLIENT-facturen "Openstaand" negeert cascade-facturen. Zelfde root cause.
- [x] (#249) **BUG** — Tarieffilter verbergt opdrachten met onbekende grens. Null-tolerante AND-clausules.
- [x] (#250) **DEADEND** — "Factuur opstellen"-knop liep dood zodra er een prestatie was. Gedeelde `invoiceableCollaborationsWhere`.
- [x] (#251) **COPY** — "Betaling ontvangen"-knop ook bij de betalende opdrachtgever. Rol-afhankelijk label.
- [x] (#251) **BUG** — Opdrachtgever kon ACTIVE-samenwerking annuleren met onbetaalde factuur. Annuleer-rem op openstaande factuur.
- [x] (#252) **GELD** — Franchise-facturatie-disclaimer verdween juist wanneer hij nodig was. Altijd zichtbaar zolang incasso niet gekoppeld is.
- [x] (#252) **UX** — `removeDepartment` verweesde PUBLISHED-diensten ("spookdiensten"). Verweesde diensten nu apart getoond in de cockpit.
- [x] (#254) **DEADEND** — `/admin/gebruikers` beloofde "rol"-beheer zonder rolwijziging. Copy eerlijk gemaakt (rolwijziging = security-gevoelige feature, bewust geparkeerd).

### LAAG

- [x] (#253) **COPY** — `/admin/audit` toonde rauwe action-enums. Nu via `auditActionLabel()`.
- [x] (#253) **COPY** — Audit-metadata toonde rauwe enum-waarden (from/to). NL-vertaling + `from`-sleutel toegevoegd.
- [x] (#254) **BUG** — Factuurstatusovergang zonder concurrency-guard. Atomische `updateMany` + count-check, zoals verificaties.

**Resterend (bewust, geen auto-fix):** rolwijziging in `/admin/gebruikers` (security-gevoelig + tenant-implicaties — eigenaar-keuze; de `ROLE_CHANGED`-audit/monitoring staat klaar). Confirm-dialog vóór destructieve acties (afdeling verwijderen) = bredere UX-verbetering.

## Iteratie 2 — 2026-06-09 (code-flow-sweep, ongedekte gebieden)

6 hunters (onboarding/documenten-credentials/berichten-tickets/notificaties/ideeën-leads/matching-search)
→ 16 bevindingen, **16 bevestigd**, **alle 16 gefixt** (#256–#266), elk op groene CI.

### HOOG

- [x] (#256) **BUG** — Login + wachtwoord-reset misten `.toLowerCase()` op e-mail (registratie normaliseert wél) → hoofdletter-lockout in productie (Postgres, hoofdlettergevoelig). Beide schema's normaliseren nu.
- [x] (#257) **BUG** — Bewerken van een GEVERIFIEERD certificaat (datums/type) zonder nieuw bewijs hield status VERIFIED → expiry-bypass + omkatten. Verificatie-relevante wijziging reset nu naar SUBMITTED.
- [x] (#259) **BUG** — "Gelezen"-knop genest in de notificatie-`<Link>` (ongeldige HTML, klik navigeerde weg) + doorklikken markeerde niet als gelezen. `openNotification` (mark+navigate) + sibling-knop.
- [x] (#258) **AUTHZ** — Overflow-suggesties + `startConversationWithFreelancer` doorbraken de tenant-grens (cross-tenant PII + contactopname). Suggesties tenant-scoped + `visibleFreelancersWhere`-check.

### MIDDEN

- [x] (#260) **DEADEND** — Geschorst account mid-sessie → doodlopende foutpagina-lus. Middleware → `/geschorst`-pagina.
- [x] (#260) **AUTHZ** — `currentActor()` gaf geschorst account nog een Actor (zoeken bleef werken). Nult nu SUSPENDED.
- [x] (#261) **AUTHZ** — DUO/BIG-zelfverificatie zonder server-side typecontrole → admin-queue omzeilbaar. DUO eist DIPLOMA, BIG eist LICENSE.
- [x] (#262) **DEADEND** — `adminReply` maakte geen notificatie → aanvrager kreeg geen signaal. Notificatie + bel-teller toegevoegd.
- [x] (#262) **BUG** — Admin zag gebruikers-actieknoppen op andermans ticket (faalden + vervuilden audit-log). Acties nu alleen voor de aanvrager; admin alleen-lezen.
- [x] (#266) **UX** — `adminReply` veranderde de status niet → beantwoord ticket bleef in de wachtrij. Nieuwe `AWAITING_USER`-status.
- [x] (#263) **DEADEND** — Lead direct op KLANT zetten was een doodloop (geen opdrachtgever). KLANT alleen via onboarding (dropdown + server-guard).
- [x] (#264) **BUG** — Scalaire `availability` genegeerd in ZZP-zoeken → "Direct beschikbaar"-ZZP'er zonder venster onzichtbaar. Scalar-fallback toegevoegd.

### LAAG

- [x] (#265) **AUTHZ** — Compliance-dossier lekte totaaltal incl. DRAFT/REJECTED-certificaten. Query gefilterd op VERIFIED + EXPIRED.
- [x] (#265) **COPY** — "Certificaat vernieuwt binnenkort" → "verloopt binnenkort".
- [x] (#263) **UX** — Notitie loggen behield verlopen opvolgdatum → lead bleef "te laat". Alleen toekomstige datum voorgevuld.

## Iteratie 3 — 2026-06-09 (code-flow-sweep, nog-ongedekte flows)

6 hunters (job-posting/profiel/academie/billing/admin-import/cross-cutting) → 15 bevindingen,
**15 bevestigd**, **13 gefixt** (#268–#276), 2 bewust geparkeerd. Diminishing returns: hele app gedekt.

### HOOG

- [x] (#268) **AUTHZ** — `saveJob` zette geen `tenantId` → zelf-geplaatste opdracht van een tenant-CLIENT lekte platform-breed (cross-tenant zichtbaar/reageerbaar + PII in suggesties). Denormaliseert nu `company.tenantId`.
- [x] (#269) **BUG** — Beschikbaarheidsvenster "t/m vandaag" verdween de hele laatste dag (einddatum als middernacht-UTC vergeleken). Inclusieve einddatum + UNAVAILABLE-dominantie over overlappend AVAILABLE-venster.
- [x] (#270) **AUTHZ** — DUO/BIG-zelfverificatie zonder rate-limit (brute-force op code/BIG-nummer). `credentialVerifyRateLimiter` (10/uur/ZZP'er).

### MIDDEN

- [x] (#271) **AUTHZ** — Plan-limiet `maxJobs` nergens afgedwongen → gratis opdrachtgever kon onbeperkt publiceren. Handhaving bij PUBLISHED (spiegelt maxApplications).
- [x] (#273) **DEADEND** — Franchiser kon eigen uitgezette dienst niet sluiten/heropenen (alleen CLIENT/admin). Tenant-scoped `setDienstStatus` + knoppen.
- [x] (#272) **GELD** — `setOrtProfileAction` wijzigde factuur-bepalende ORT-toeslagen zonder audit. `COLLABORATION_ORT_SET`-audit toegevoegd.
- [x] (#275) **UX** — Cursus un-publishen/archiveren ontnam cursisten zonder bevestiging toegang. ConfirmButton met waarschuwing.
- [x] (#276) **BUG** — Monitoring vuurde dubbel incident op de UTC-uurgrens (rollend venster vs uur-dedupeKey). Tijdloze `groupKey` + recent-onderdrukking.
- [ ] (geparkeerd — eigenaar/infra) **BUG** — `ROLE_CHANGE_BURST`-detector + `classifyCves` kunnen nooit vuren: rolwijziging-feature is geparkeerd (iter-1) en CVE-ingest vereist eigenaar-infra. Detectoren staan correct gestaged; vuren zodra die landen.

### LAAG

- [x] (#272) **AUTHZ** — Import stuurde temp-wachtwoord óók in de payload bij geslaagde mail. `tempPassword` nu optioneel, alleen bij niet-gemaild.
- [x] (#274) **GELD** — Tarief €0 geaccepteerd ("€ 0/uur"). Indien ingevuld nu minstens €1.
- [x] (#269) **COPY** — Engelse "Invalid date" bij beschikbaarheid → NL-foutboodschap.
- [x] (#274) **BUG** — `SUBSCRIPTION_TRANSITIONS` had CANCELLED terminaal terwijl her-aanmelding het al heractiveert. Map staat CANCELLED→PENDING/ACTIVE nu toe.
- [ ] (geparkeerd — LAAG, geen dataverlies) **UX** — Gearchiveerde cursus niet meer in te zien voor wie 'm voltooide (canView blokkeert niet-PUBLISHED). Voltooiingen blijven bewaard + admin-zichtbaar; schone fix vereist completion-state door meerdere read-paden te rijgen voor marginale waarde.

## Iteratie 4 — 2026-06-09 (presentatie-laag-sweep)

Na 3 logica/authz/geld-sweeps (hele app gedekt, diminishing returns) bewust de **onderbelichte
presentatie-laag** doorgelicht: datum/geld/plurals-formattering, design-tokens, container-breedtes,
focus/feedback. Ruim 20 bevindingen, **alle bevestigde gefixt** (#278–#283) op 1 productkeuze na.
Eén grensgeval (EXPIRED-warning vs factuur-OVERDUE-danger) bewust níét gewijzigd: verdedigbare
cross-domein-semantiek. Gegroepeerd in 6 gegate PR's per thema.

### Loading/skeleton-states (#278)

- [x] (#278) **UX** — Geen `loading.tsx` op `/berichten`, `/admin/facturatie`, `/certificaten` → harde layout-sprong bij navigatie. PageHeader+Dense/Form-skeleton toegevoegd, canonieke breedte.

### Toegankelijkheid (#279)

- [x] (#279) **A11Y** — Zoek-input + trust-select in ZZP-browse zonder toegankelijke naam → `aria-label`.
- [x] (#279) **A11Y** — Thema-knop + 4 reden-velden (dispuut/afkeuring/creditering) misten `focus-ring` + label. Toegevoegd.

### Formattering & copy-consistentie (#280)

- [x] (#280) **DATUM** — `admin/bewaking` toonde `toLocaleString` (UTC op server) → `formatDateTimeNl` (Europe/Amsterdam).
- [x] (#280) **DATUM** — `prestaties` + `diensten` herhaalden eigen `fmtDate`/`fmtPeriod` → centrale `format-date`-helpers.
- [x] (#280) **DATUM** — Dashboard-begroeting miste `Europe/Amsterdam` → kon een dag verspringen op UTC-server.
- [x] (#280) **PLURAL** — `openstaand` "1 dagen te laat" → `plural()` ("1 dag te laat").
- [x] (#280) **PLURAL** — `admin/franchises` kale tellingen (opdrachtgever/ZZP'er/dienst) → `plural()`.
- [x] (#280) **GELD** — `franchise/zzpers` "€{rate}" → "€ {rate}" (canonieke euro-spatie).

### Design-systeem-consistentie (#281, #283)

- [x] (#281) **TOKEN** — `model-agreement-card` rauwe `text-emerald-600` → semantische `text-success`.
- [x] (#281) **BADGE** — Certificaat `SUBMITTED` `default` → `warning` (in-beoordeling = aandacht-status; spiegelt prestaties/samenwerkingen).
- [x] (#281) **PRIMITIVE** — `freelancers` rauwe `<h1 text-2xl>` → canonieke `PageHeader`.
- [x] (#281, #283) **BREEDTE** — Niet-canonieke `max-w-3xl` app-breed → 3 canonieke breedtes (4xl collectie / 2xl form-detail) over ~20 pagina's + bijbehorende loading.tsx. App-breed nu nul `max-w-3xl`.
- [x] (#283) **FOCUS** — Handgerolde `<select>/<input>/<textarea>` (performance-form 11, ort-profile 2, model-agreement 1, diensten-import 2) misten de `focus-ring` van de gedeelde primitives. Toegevoegd.

### Interactie-veiligheid & feedback (#282)

- [x] (#282) **FEEDBACK** — Registratie: "Account aangemaakt, log in" werd in `error` (rood) getoond → eigen `success`-veld (groen) met inloglink.
- [x] (#282) **VEILIGHEID** — `kandidaten` afwijzen was één-klik `danger` (ZZP'er krijgt bericht) → `ConfirmButton`.
- [x] (#282) **FEEDBACK** — `kandidaten` interne-notitie submitte stil → client-form met `useActionState`+`FormStatus` ("Notitie opgeslagen").
- [x] (#282) **VEILIGHEID** — `franchise/opdrachtgevers` afdeling-verwijderen was één-klik → `ConfirmButton` (waarschuwt bij diensten; die overleven via `onDelete: SetNull`).

### Geparkeerd (productkeuze, eigenaar)

- [ ] (geparkeerd — IA/product) **TERMINOLOGIE** — "Diensten"/"Prestaties"/"Opdrachten" overlappen semantisch over rollen (nav.ts). Opschonen = routes/URL's hernoemen → informatie-architectuur-besluit, geen los UI-fixje.

## Iteratie 5 — 2026-06-09 (robuustheid + a11y + doodlopers)

Nieuwe coverage-assen na de logica- (1–3) en presentatie-formattering-sweep (4):
**robuustheid onder edge-content**, **toetsenbord/a11y** en **lege-/doodloop-states**.
3 parallelle hunters → ~20 bevindingen, alle bevestigde gefixt (#285–#287), 1 geparkeerd.
**Geen HOOG/security/logica/geld-bug** in deze ronde — uitsluitend polish, het convergentie-signaal van de lus.

### Robuustheid / overflow (#285)

- [x] (#285) **OVERFLOW** — Gedeelde `PageHeader` (~38 pagina's): titel zonder `break-words`, kop-div zonder `min-w-0` → lange ononderbroken titel duwde de actie weg. Min-w-0 + break-words.
- [x] (#285) **OVERFLOW** — `kandidaten`/`samenwerkingen` (lijst+detail)/`berichten`-index: naam/titel zonder `truncate` naast badges zonder `shrink-0` → badges van de kaart geduwd. Canoniek truncate-patroon.
- [x] (#285) **OVERFLOW** — `zzp/[id]` publiek profiel: naam zonder `break-words` + skill/branche/certificaat-badges zonder `max-w-full break-words`.
- [x] (#285) **OVERFLOW** — `berichten`-thread: een 300-tekens-zonder-spatie-token verbreedde de bubbel → `[overflow-wrap:anywhere]`.
- [x] (#285) **OVERFLOW** — Dashboard-weekchips + `franchise/leads`: lange klant/organisatie-naam capt/truncate i.p.v. overflow.

### Toegankelijkheid (#286)

- [x] (#286) **A11Y** — `berichten`-thread: bericht-`Textarea` had alleen een placeholder (geen toegankelijke naam) → `aria-label="Bericht"`.
- [x] (#286) **A11Y** — `ontzorgd` "Wat nu te doen": urgentie alleen via kleur-dot → `sr-only` "Urgent/Binnenkort/Ter info" (WCAG 1.4.1).
- [x] (#286) **A11Y** — `notificaties`: ongelezen alleen via kleur → `sr-only` "Ongelezen"-marker.
- [x] (#286) **A11Y** — `freelancers`-browse: decoratieve Search/MapPin/Euro/Calendar-iconen → `aria-hidden`.
- [x] (#286) **A11Y** — `performance-form`: herhaalde "Begin/Einde dienst"-labels per dienstrij nu uniek via `aria-label` met rijnummer.

### Lege-/doodloop-states (#287)

- [x] (#287) **DOODLOOP** — `prestaties` (CLIENT-only) + `diensten` (FREELANCER-only): verkeerde-rol-fallback was een kale one-liner zonder uitweg → `PageHeader`+`Card`+`EmptyState` met "Naar dashboard"-actie.
- [x] (#287) **STATE** — Ontbrekende `franchise/samenwerkingen/loading.tsx` → toegevoegd (PageHeaderSkeleton + DenseListSkeleton, max-w-4xl) zoals de zusterroutes.
- [ ] (geparkeerd — LAAG, conf 0.5) **STATE** — `administratie` mapt ADMIN op een FREELANCER-grootboek → alles-nul-maar-gevuld zonder "geen administratie voor deze rol"-melding. Zelden bereikt; fix discutabel.

**Convergentie-observatie:** logica-laag (iter 1–3) én presentatie-laag (iter 4–5) zijn nu tot laag-risico-residu doorgespit. Een volgende ronde langs dezelfde assen zal naar verwachting "schoon" zijn (2 schone rondes = lus klaar volgens LOOP.md).

## Iteratie 6 — 2026-06-10 (volledige vision-persona-ronde + abuse-suite)

Eerste volledige LOOP.md-ronde sinds de pivot: seed → prod-build → 4 persona-reizen (Playwright,
nl-NL-locale) → vision-sweep (4 critici + rechter) → abuse/IDOR-suite. 25 ruwe bevindingen →
**14 bevestigd**, 2 productkeuzes (geparkeerd), 6 dropped. **De lus was NIET schoon:** deze ronde
vond een HOOG demo-coherentie-bug, dus de convergentie-verwachting van iter-5 klopte niet — een
vision-ronde tegen de echte schermen vindt wat de code-flow-sweeps misten.

**Abuse/IDOR-suite:** 8 pass, 4 flaky (eerste poging faalt op het bekende lokale `notFound()`→200-
artefact, slaagt bij retry). Draft-opdracht-guard (`opdrachten/[id]:111` + `canViewJob`) geverifieerd
solide → géén echte IDOR/security-bevinding. CI = waarheid.

### HOOG

- [x] (#289) **BUG** — Vlaggenschip-demo incoherent: zorg-verpleegkundige Sanne was via collab-1/job-16 aan een IT-opdracht "Fullstack Developer" + React-berichten gekoppeld (ondermijnt zorg-benchmark + verklaarbare matching). collab-1 → "Verpleegkundige (detachering)" @ Jansen (met ORT), reacties/threads naar zorg, Anna (frontend) naar job-16/Datic. Sanne's profiel was al correct zorg — alleen de seed-bedrading van haar reis was fout.
- [x] (#292) **BUG** — Abuse-fixtureaccounts (`@test.local`) stapelden op in de admin-gebruikerslijst + tellingen (geen opruiming). Playwright `globalTeardown` ruimt ze nu op (4→0 geverifieerd). Verse seed had er al 0 → accumulatie-artefact, geen productbug.

### MIDDEN

- [x] (#290) **COPY** — Audit log overwegend Engels: `AUDIT_ACTION_LABEL` dekte 9 van ~120 acties (rest viel terug op Engelse fallback) + entityType/rol onvertaald. Map uitgebreid naar ~120 acties + `auditEntityLabel` (User→Gebruiker, …).
- [x] (#289) **BUG** — Tracker "Contract Getekend" sprak modelovereenkomst "nog niet ondertekend" tegen op afgeronde samenwerkingen: de cascade tekende alleen het contract. Seed zet nu beide digitale akkoorden op ACTIVE/COMPLETED-collabs.
- [x] (#292) **COPY** — Native date-inputs toonden "mm/dd/yyyy" in de NL-UI: Playwright-persona-sweep draaide op en-US-default. Locale nl-NL + Europe/Amsterdam toegevoegd (product was al correct voor NL-gebruikers; `<html lang="nl">` stond al).
- [x] (#291) **UX** — "Profiel compleet 100%" botste met "Nog niet inzetbaar / Verzekering ontbreekt". Stat hernoemd naar "Profielvelden" (meet ingevulde velden; inzetbaarheid blijft apart).

### LAAG

- [x] (#291) **UX** — Reactie-statuscopy "Samenwerking gestart" liep achter op de echte status (bv. "Afgerond"). Volgt nu de actuele samenwerkingsstatus.
- [x] (#291) **COPY** — Wizard-sublabel "Overslaan kan" → "Optioneel".
- [x] (#289) **UX** — Concept-opdracht had "(concept)" in titel én Concept-badge (dubbelop). Suffix uit job-7-titel.
- [x] (#291) **UX** — Franchise-facturatie "Actief"-abonnementsbadge botste met "incasso nog niet actief". Badge → "Abonnement: Actief".
- [x] (#293) **UX** — ZZP'ers-lijst toonde "Nog niet inzetbaar" zonder inline reden. Toont nu de belangrijkste blokkade (bv. "Verzekering ontbreekt") op het lijstitem.

### Vals-positieven (bevestigd door rechter, maar al gefixt / werkt-zoals-bedoeld — niet opnieuw flaggen)

- [ ] (vals-positief) **UX** — Notificatiebel "niet klikbaar": is al een `<Link href="/notificaties">` (rechter zag een verouderde screenshot).
- [ ] (vals-positief) **UX** — Logo-upload "native file-input": `/bedrijf` gebruikt al de gestylde `FileInput` (sr-only native + eigen knop).
- [ ] (vals-positief) **UX** — Factuurrij "geen affordance": rij is al een `card-interactive`-`<Link>` met hover, consistent met berichten/leads.

### Geparkeerd (productkeuze, eigenaar)

- [ ] (geparkeerd — prijs/juridiek) **PRODUCTKEUZE** — Twee "abonnementen" naast elkaar (€48,40 platformbijdrage incl. btw vs. €19 plan-tier). Bewuste twee-posten-pricing; bedragen/benaming = eigenaar.
- [ ] (geparkeerd — compliance/juridiek) **PRODUCTKEUZE** — DBA "Verhoogd risico" (>80% omzetconcentratie) op een net gestarte samenwerking. Of er een minimumdrempel moet komen vóór het signaal is een inhoudelijke Wet-DBA-afweging.
