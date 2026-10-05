# 2026-10-05 — DBA-omzetconcentratie: geen vals ">80%"-signaal door afronding

## Probleem

`revenueConcentrationPct` (`src/lib/dba-monitor.ts`) rondde het omzetaandeel met
`Math.round` af. Een werkelijk aandeel in **[79,5%, 80%)** rondde daardoor naar `80`
en vuurde het VERHOOGD-signaal `revenue-concentration` via de `>= drempel`-vergelijking
in `assessCollaborationDba`. De bijbehorende boodschap luidde bovendien letterlijk
"Meer dan 80% van de omzet …", terwijl de vergelijking `>=` is (exact 80% hoort erbij).

Dit signaal voedt niet alleen de bemiddelaars-cockpit en het overzicht
(`dba-overview.ts`), maar ook het **DBA-auditdossier** (`dba-audit.ts`) — het
onderbouwingsdocument voor een mogelijk Belastingdienst-bedrijfsbezoek. Een vals-positief
of een feitelijk onjuiste "meer dan"-formulering in dat dossier overdrijft het risico.

## Repro (vóór de fix)

- `revenueConcentrationPct({ a: 795, b: 205 }, "a")` → `Math.round(79.5)` → **80** → signaal vuurt.
- Werkelijk aandeel 79,5% < drempel 80%, dus er had **geen** signaal mogen zijn.

## Fix

- `Math.round` → `Math.floor` in `revenueConcentrationPct`. Voor hele drempels geldt
  `floor(x) >= T ⟺ x >= T` (de drempel is `.int()`-gevalideerd, zie
  `admin/configuratie/actions.ts`), dus de beslissing is nu exact gelijk aan de echte
  verhouding — geen opwaartse afrondingsband meer. Het aandeel wordt nergens los als
  percentage getoond; het is uitsluitend beslis-invoer voor `assessCollaborationDba`.
- Boodschap "Meer dan ${drempel}% …" → "${drempel}% of meer …", consistent met `>=`.

## Bewijs

- Nieuwe grensdekking in `dba-monitor.test.ts`: 79,5% en 79,9% → 79 (geen signaal),
  exact 80% en 80,9% → 80 (signaal), en een integratiegeval dat bevestigt dat 79,5%
  geen `revenue-concentration`-signaal oplevert. Plus een boodschaptest ("80% of meer",
  niet "Meer dan"). Gericht: 16 tests groen.
- Volledige poort (lint, types, unit, build, prettier) groen; onafhankelijke review en CI volgen.
