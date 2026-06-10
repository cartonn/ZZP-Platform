# PRIJSADVIES — verdienmodel ZZP Platform

> Vastgesteld na concurrentie-onderzoek juni 2026 (verdienmodellen + jaaromzetten, zie de
> onderzoekssamenvatting onderaan). Status: **advies — activeren van billing is een
> eigenaarsbesluit** (billing staat bewust UIT; de modellen bestaan al in code:
> `ZzpMembershipCharge`, `CollaborationFee`, `TenantSubscription`).
> Eigenaarsbesluit verwerkt: **factoring is geen harde nee** — Besluit 1 ("geld loopt nooit
> via het platform") wordt voor de uitbetalings-optie heroverwogen; vastleggen als ADR zodra
> de partnerkeuze (bv. Finqle-achtig) gemaakt is.

## De vier prijslijnen

| #   | Wie betaalt                              | Prijs                                        | Eenheid                                                                                  | Benchmark                                                                                                                       |
| --- | ---------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **ZZP'er**                               | **€24,95/mnd excl. btw**                     | alleen in maanden met goedgekeurde uren (no work = no pay)                               | PIDZ €56,94 incl./mnd → wij ±2× goedkoper, alles inbegrepen (facturatie, dossier + verloopbewaking, DBA-dossier, btw-overzicht) |
| 2   | **Opdrachtgever**                        | **€1,75/goedgekeurd uur excl. btw**          | per uur, automatisch via de cascade                                                      | Zorgwerk €3, Temper €4,40–4,90, YoungOnes €4,75, HeadFirst 2,5% + €0,50 → wij ±½ tot ⅓                                          |
| 3   | **Franchisenemer/tenant**                | **€12,50/actieve zzp'er/mnd + €1.500 setup** | per actieve flexwerker per maand (zelfde "actief"-definitie als lijn 1)                  | Bendy €16 + €2.500 → onderboden                                                                                                 |
| 4   | **ZZP'er (optioneel): "Direct betaald"** | **2,5% van het factuurbedrag**               | opt-in per factuur; uitbetaling direct na goedkeuring i.p.v. wachten op de opdrachtgever | Temper DirectPay 2,9% (via Finqle) → onderboden                                                                                 |

**Lijn 4 (factoring)** vergt: een factoringpartner of eigen werkkapitaal + debiteurenrisico-beleid,
KYC/uitbetaalrails en een ADR die Besluit 1 herziet. Tot die er zijn blijft lijn 4 "gepland";
de transparantie-kant (betaalstatus + betaalgedrag-score) staat hier los van en is al in aanbouw.

## Principes

1. **Radicale transparantie** — beide partijen zien dezelfde bedragen; de fee staat als aparte
   regel op de factuur die beide kanten zien (klacht #1 bij alle concurrenten: verborgen marges).
2. **No work = no pay** aan beide kanten — verlaagt de instapdrempel in een markt die krimpt
   (zorg-zzp -16% in 2025).
3. **Geen marge óp het tarief van de ZZP'er** — de fee is een dienstvergoeding, geen afroming;
   adverteerbaar verschil met PIDZ/Zorgwerk.
4. **Omzet schaalt met waarde** — ±80% van de omzet beweegt mee met gewerkte uren, zoals de hele markt.

## Omzetscenario's

Aannames (expliciet): 65% van de geregistreerde zzp'ers heeft in een gegeven maand goedgekeurde
uren; een actieve zzp'er werkt gem. 65 uur/mnd via het platform (gevoeligheid 40–90).

### Direct model (lijn 1 + 2)

| Geregistreerde zzp'ers | Jaaromzet  | waarvan abo | waarvan uurfee |
| ---------------------- | ---------- | ----------- | -------------- |
| 200                    | €216.000   | €39.000     | €177.000       |
| 500                    | €541.000   | €97.000     | €444.000       |
| 1.000                  | €1.082.000 | €195.000    | €887.000       |
| 3.000                  | €3.246.000 | €584.000    | €2.662.000     |

≈ **€1.082 per geregistreerde zzp'er per jaar** (€741 bij 40 u/mnd; €1.423 bij 90 u/mnd).
Marktanker: PIDZ realiseert werkelijk ≈ €1.718/zzp'er/jaar (€14,6 mio omzet 2024 / 8.500+
zzp'ers) — wij prijzen bewust ±45% onder de markt als verstoorder.

### Factoring-opbrengst (lijn 4, indicatief)

Bij gem. tarief €48/uur, 65 u/mnd en 40% opt-in: ±€243 extra per geregistreerde zzp'er per jaar
→ +€49.000 (200) · +€122.000 (500) · +€243.000 (1.000) · +€729.000 (3.000). Hier staat
financieringskost + debiteurenrisico tegenover; netto marge afhankelijk van partnerdeal.

### Franchise/SaaS-model (lijn 3)

€19.500 (200) · €48.750 (500) · €97.500 (1.000) · €292.500 (3.000) per jaar, + setups.
Tweede motor naast het directe model; de tenant zet zelf zijn marges richting instellingen.

### Gemengd voorbeeld (⅔ direct, ⅓ via tenants, zonder factoring)

1.000 zzp'ers ≈ €754.000/jaar · 3.000 zzp'ers ≈ €2,26 mio/jaar.

## Onderzoekssamenvatting verdienmodellen concurrenten (geverifieerd juni 2026)

| Platform          | Wie betaalt                    | Eenheid/bedrag                                 | Jaaromzet (recentst publiek)                        |
| ----------------- | ------------------------------ | ---------------------------------------------- | --------------------------------------------------- |
| PIDZ              | zzp'er + instelling            | €56,94/mnd (actieve maanden) + 3–15% marge/uur | €14,6 mio (2024, Almunda-jaarverslag)               |
| Zorgwerk          | beide                          | €3/uur + €3/uur                                | niet publiek                                        |
| Temper            | opdrachtgever (+zzp DirectPay) | €4,40–4,90/uur + 2,9%                          | niet publiek (pre-COVID ±€7,5 mio)                  |
| YoungOnes         | opdrachtgever                  | €4,75/uur                                      | €128 mio (2023, CEO; verm. incl. doorstroom)        |
| Striive/HeadFirst | beide                          | €4,50/uur zzp; 2,5% + €0,50/uur                | gross billings €2,64 mrd; netto ±€70–121 mio (2024) |
| Maqqie            | opdrachtgever                  | 7%/opdracht; payroll 1,49×                     | €50 mio (2023)                                      |
| Bendy             | bureau                         | €16/actieve flexwerker/mnd + €2.500 setup      | niet publiek                                        |
| FleGo             | bureau                         | per geaccordeerd uur (maatwerk)                | niet publiek                                        |
| Jellow            | opdrachtgever                  | maandabonnement (bedrag n.b.)                  | niet publiek                                        |
| Freelance.nl      | zzp'er                         | €149/jaar                                      | niet publiek                                        |

PIDZ-franchisemodel: 13 vestigingen, franchisenemer verdient de uurmarge (±€3–5/uur);
instapkosten niet publiek (sector-schatting €2.500–15.000 + royalty 4–10%).
