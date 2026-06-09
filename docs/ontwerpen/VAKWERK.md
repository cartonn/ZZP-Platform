# Vakwerk — ontwerptaal voor het ZZP-Platform

**Bekijk:** open `vakwerk.html` (drie schermen, licht & donker, wissel bovenaan).

Vakwerk is een ontwerpvoorstel dat verder gaat dan de vijf eerdere look-&-feels
(`index.html`). Die verkenden thema's op één scherm; Vakwerk is één samenhangende
taal over de échte kernschermen van het product, gebouwd op wat het platform
inmiddels ís: verificatie, uitlegbare matching, de volgende-actie-engine en de
cascade (contract → uren → akkoord → factuur → betaald).

---

## Uitgangspunt

Het product verkoopt **vertrouwen**. De concurrentie (Pidz, Maqqie, Jellow…)
oogt óf corporate-bleek óf gig-economy-schreeuwerig. Vakwerk kiest de derde weg:
de Nederlandse ontwerptraditie — grid, typografie, helderheid (Total Design,
Crouwel) — toegepast op een SaaS-werkplek. Kalm gezag, geen decoratie.

Drie regels:

1. **Het zegel draagt het merk.** Verificatie is de kerndifferentiatie, dus het
   "zegel" (cirkel + vinkje, zegelgroen) is hét visuele anker — in het logo, op
   avatars, bij elk geverifieerd certificaat. Eén consistent vertrouwensteken.
2. **Cijfers zijn typografie.** Tarieven, matchscores, uren, btw — dit platform
   is vol getallen. Alle cijfers in JetBrains Mono (tabular). Dat geeft de
   datavlakken een precisie die geen concurrent heeft.
3. **Eerlijkheid is premium.** De matchmeter toont ook de mínpunten ("− beschikbaar
   vanaf week 25"). Uitlegbaarheid als zichtbaar designelement, geen black box.

---

## Tokens

| Token                           | Licht                             | Donker                | Gebruik                           |
| ------------------------------- | --------------------------------- | --------------------- | --------------------------------- |
| `--paper`                       | `#F6F5F0`                         | `#0F1014`             | canvas (warm papier / nacht)      |
| `--surface`                     | `#FFFFFF`                         | `#16171D`             | kaarten ("vellen")                |
| `--ink` / `--ink-2` / `--ink-3` | `#16181D` / `#5D6170` / `#9094A3` | omgekeerd             | tekst-hiërarchie                  |
| `--line` / `--line-soft`        | `#E6E4DB` / `#EEECE4`             | `#272932` / `#21232B` | hairlines                         |
| `--brand`                       | `#2333D0` (klein-blauw)           | `#8A96FF`             | acties, match, actief             |
| `--seal`                        | `#0E7A4D` (zegelgroen)            | `#41C188`             | geverifieerd — exclusief hiervoor |
| `--warn`                        | `#9A6A08`                         | `#DCAA3E`             | verloopt / wacht                  |
| `--danger`                      | `#C03434`                         | `#E36C6C`             | afgewezen / te laat               |
| `--banner-bg/fg`                | inkt op papier                    | papier op inkt        | de "aan zet"-banier (klapt om)    |

Radius 12px (kaarten) / 8px (klein). Schaduw vrijwel afwezig: `0 1px 2px 4%` —
diepte komt uit hairlines en contrast, niet uit blur.

**Typografie:** Schibsted Grotesk (koppen, 700/800, krappe tracking) ·
Inter (UI) · JetBrains Mono (alle cijfers, `tnum`).

---

## Signatuurcomponenten

- **Het zegel** — cirkel met dubbele ring + vinkje. Varianten: merk-blauw (logo),
  zegelgroen (geverifieerd), amber-uitroepteken (verloopt). Hoek-overlay op avatars.
- **De matchmeter** — 10 segmenten + percentage in mono, met redenen als
  `+`/`−`-regels eronder. Verklaarbare matching letterlijk in beeld.
- **De cascade-stappen** — horizontale stepper Contract → Uren → Akkoord →
  Factuur → Betaald; groen = klaar, blauw omringd = nu, met "wie is aan zet".
- **De aan-zet-banier** — het enige hoge-contrast-element per scherm (inkt op
  papier; klapt om in donkere modus). Eén banier, één boodschap, één knop.
- **De actie-wachtrij** — dashboard opent niet met statistieken maar met de
  volgende-actie-engine: actie 1 als held-kaart (toon = urgentie), 2 en 3 als rij.
- **Het weekrooster** — zeven kolommen, diensten als merk-getinte blokken.
- **Sparkline** — inline SVG bij omzet; eerste echte datavisualisatie van het platform.

## Schermen in `vakwerk.html`

1. **Dashboard (ZZP'er)** — "wat nu?": actie-wachtrij, weekrooster, KPI's met
   sparkline + delta's, nieuwe matches met meter, dossierstatus, btw-positie.
2. **Match & profiel (opdrachtgever)** — zegel op avatar, certificaten met
   verificatiebron (DUO / BIG / ADMIN) als mono-tag, matchpaneel 92% mét minpunt,
   vertrouwenspaneel (iDIN, Wet DBA, verzekering).
3. **Samenwerking (cascade)** — stepper, aan-zet-banier, uren-tabel met
   ORT-toeslag, concept-factuurpreview ("volgt automatisch"), afspraken, verloop-feed.

---

## Implementatie in het platform (volgorde)

1. **Fonts** via `next/font` (Schibsted Grotesk, Inter, JetBrains Mono) →
   `--font-sans`, `--font-display`, `--font-mono`; `.num`-utility vervangt losse
   `tabular-nums`.
2. **Tokens** als nieuw palet in `globals.css` (zelfde HSL-mechaniek als nu;
   licht + donker uit dezelfde set). Vakwerk vervangt de drie bestaande paletten
   als standaard — drie keuzepaletten is een demo-feature, één sterke identiteit
   is een merk.
3. **Primitives uitbreiden:** `Seal` (3 varianten), `MatchMeter`, `CascadeStepper`,
   `TurnBanner` ("aan zet"), `Sparkline`, en een echte `Table`-set (vervangt de
   handgerolde tabellen).
4. **Dashboard herordenen** rond de bestaande next-actions-engine (de data is er
   al — alleen de presentatie wordt held-kaart + rij i.p.v. lijst).
5. **Samenwerkingsdetail** krijgt de stepper + banier bovenaan (de cascade-events
   zijn er al; dit is puur presentatie van `cascadeWork`).

Geen nieuwe dependencies behalve fonts; sparklines zijn handgeschreven SVG.
