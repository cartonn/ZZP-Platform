# ADR-0006: Pidz-pariteit — activatie-gate, reistijd-matching, franchise-CRM en monetisatie

- **Status:** voorgesteld (eigenaar beslist per deelbesluit)
- **Datum:** 2026-06-07

## Context

Observatie van de Pidz-backoffice (`mijnpidz.nl` / `cloud.pidz.nl`) maakt duidelijk dat Pidz geen
consumenten-marktplaats is maar een **franchise-staffing-OS**: regionale vestigingen ("PIDZ Alkmaar
B.V.", "Drachten", "Zwolle", "Den Haag", "Amsterdam"…) delen één platform. Eén PIDZ-kantoor = onze
**Franchiser/tenant**. Dat valideert onze richting, en legt vier gaten bloot. De backoffice-modules
zijn: Zoek & boek, Beschikbare ZZP'ers, Relaties (CRM), Administratie, Projecten, Documenten, PIDZ
Academie, Statistieken, Systeeminstellingen.

Onze differentiatie blijft: **verklaarbare matching, een rustig command-center, en explainable
compliance** — i.p.v. Pidz' functionele-maar-drukke tabellen en harde rode blokkades.

Al gebouwd als directe opvolging:

- **Blok B — verplichte-documenten-checklist** (PR #195): `MANDATORY_CREDENTIAL_TYPES` + een
  explainable checklist op `/certificaten` (aangeleverd / in beoordeling / verlopen / ontbreekt).

Dit ADR legt de **vier resterende keuzes** vast die productbeslissingen vergen. Per deelbesluit:
opties + advies. Status blijft _voorgesteld_ tot de eigenaar kiest.

---

## Besluit A — Reistijd-matching (geo)

**Keuze:** hoe matchen we op afstand i.p.v. de huidige stad-string-vergelijking
(`locationFit` in `matching.ts`)? Pidz gebruikt een **maximale reistijd in minuten** per ZZP'er.

**Opties**

1. **Grove offline benadering** — geen externe API: een statische NL-tabel (PC4-regio / provincie-
   nabijheid) → score "dichtbij / regio / ver". Gratis, AVG-veilig (geen adres naar derden), maar grof.
2. **Geocoding + routing-API** (Google Distance Matrix / Mapbox / TravelTime) → echte reistijd in
   minuten. Nauwkeurig, maar kost geld + API-keys (mensenwerk) + AVG (adres → externe dienst).
3. **Self-hosted OSRM + Nominatim** (open data) → geen per-call kosten, maar infra-onderhoud.

**Advies:** bouw nu het voorkeursveld `maxTravelMinutes` (FreelancerProfile) + optioneel `postcode`,
en een `travel-distance`-service-abstractie met een **grove offline stub (optie 1)** — net als de
bestaande `storage`/`semantic-matcher`-abstracties. Levert direct een afstandsgevoel zonder externe
afhankelijkheid; de echte routing (optie 2/3) is later een drop-in zodra jij een provider + budget
kiest. Datamodel-wijziging is additief (`prisma db push`, nullable velden, geen dataverlies).

---

## Besluit C — Activatie-gate (boekbaar ja/nee)

**Keuze:** maakt niet-voldoen (verplichte docs ontbreken/verlopen, identiteit ongeverifieerd,
profiel incompleet) een ZZP'er **onboekbaar**, zoals Pidz (auto-inactief, onvindbaar)?

**Opties**

1. **Zacht (huidig):** alleen tonen/waarschuwen; ZZP'er blijft vindbaar en kan reageren. Vriendelijk,
   maar zwak op compliance.
2. **Hard (Pidz):** niet-voldoen → inactief, onvindbaar in zoek & boek, kan niet reageren. Sterk op
   compliance/Wet-DBA/AVG, maar streng en verrassend (rauwe rode muur).
3. **Hybride / explainable (advies):** de ZZP'er blijft zichtbaar maar gemarkeerd
   _"nog niet inzetbaar"_ met exact de ontbrekende punten (de checklist uit blok B + de trust-roadmap),
   en kan **niet reageren op opdrachten met een harde compliance-eis** tot voldaan — met duidelijke
   reden en herstelpad. Zacht waar het kan, hard waar het juridisch moet.

**Advies:** hybride (3). Past bij de noord-ster (explainable, geen black-box-blokkade), is
compliance-sterk, en de bouwstenen liggen er (checklist B, compliance-detail #185/#186, trust-roadmap
#181). **Sub-keuzes voor jou:** welke criteria gaten (verplichte docs geldig, identiteit geverifieerd,
compleetheid-drempel, recente login?) en de exacte `MANDATORY_CREDENTIAL_TYPES`-set.

---

## Besluit D — Franchise-CRM / acquisitie

**Keuze:** bouwen we de pre-sales-pijplijn (leads → koud/warm → klant, met contactgeschiedenis) voor
de Franchiser? Pidz heeft dit als "Relaties / Acquisitie overzicht", per vestiging.

**Opties**

1. **Niet bouwen** — franchisers gebruiken een externe CRM. Minder werk, maar versplintering en geen
   koppeling met onboarding.
2. **CRM-light (advies):** een Leads-module in de franchise-werkplek — lead (organisatie) met status
   (koud / warm / klant / no-deal), contactgeschiedenis (notitie + datum + persoon), tenant-gescoped.
   Naadloos gekoppeld aan de bestaande opdrachtgever-onboarding (lead → "wordt klant" → onboarding-
   wizard). Hergebruikt onze patterns (lijsten, audit, tenancy).
3. **Volledige Pidz-CRM** (pijplijn-bars, e-mailintegratie, statistieken) — groot, later.

**Advies:** CRM-light (2), gefaseerd. Hoge waarde voor de Franchiser-rol en sluit aan op de
onboarding die we al hebben (#163-166).

---

## Besluit E — Tenant-billing / monetisatie

**Keuze:** hoe verdient het platform/de franchise geld, en wie betaalt? Pidz stuurt "Software
facturen" aan de ZZP'er. Dit is de lang-geparkeerde **v2-5 tenant-billing**.

**Opties (prijsmodel)**

1. **Transactie-fee** per gevulde dienst/samenwerking (% of vast bedrag).
2. **Abonnement per ZZP'er** (maandelijkse "software factuur" aan de ZZP'er, zoals Pidz).
3. **Abonnement per vestiging/tenant** (de Franchiser betaalt platformfee, staffel naar omvang).
4. **Hybride** (bv. vestiging-abonnement + lichte transactie-fee).

**Advies:** dit is een **strategische én juridische keuze** (prijs, BTW, facturatie, incasso) — geen
autonome bouwbeslissing. Voorkeur als richting: **3 + 1 hybride** (vestiging-abonnement + lichte
transactie-fee). De technische administratie-/factuur-cascade hebben we al; wat ontbreekt is het
**prijsmodel + de geldstroom-integratie** (Stripe/Mollie) — dat staat in `MENSENWERK.md` als
eigenaar-/juridische verantwoordelijkheid. Pas bouwen na jouw besluit.

---

## Gevolgen

- **A** en **C-hybride** en **D-light** zijn additief en passen in onze architectuur; ze maken de
  Franchiser/tenant-laag substantieel zwaarder (richting "Pidz maar beter") zonder de differentiatie
  op te geven.
- **E** — de **technische kern** is gebouwd (datamodel `TenantSubscription`/`CollaborationFee`,
  config-gedreven fee-berekening incl. btw, read-only `/franchise/facturatie`-overzicht), **standaard
  UIT** met bedragen op 0. Het **prijsmodel + de betaalprovider + de cascade-wiring** blijven
  eigenaar-/juridisch werk (zie `MENSENWERK.md §3b`).
- Geen enkele wijziging is destructief; datamodel-uitbreidingen zijn nullable/additief.

## Status van de blokken

- **A — reistijd-matching:** gebouwd (max. reistijd per ZZP'er weegt mee in de locatie-component).
- **C-hybride — inzetbaarheid-gate:** gebouwd (NON_COMPLIANT blokkeert de plaatsing bij `signContract`).
- **D-light — franchise-CRM (leads):** gebouwd (acquisitie-pijplijn + lead→klant-onboarding).
- **E — tenant-billing:** technische kern gebouwd, facturatie staat uit tot het prijsmodel er is.

## Alternatieven

Per deelbesluit hierboven opgenomen. De overkoepelende afweging — Pidz 1:1 nabouwen vs. selectief
overnemen met onze UX/compliance-differentiatie — valt uit op het laatste: overnemen wát werkt
(activatie-gate, verplichte docs, reistijd, CRM, franchise-billing), uitvoeren zoals wij (rustig,
verklaarbaar, server-side waarheid).
