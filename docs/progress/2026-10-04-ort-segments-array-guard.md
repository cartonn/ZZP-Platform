# parseOrtSegments — array-guard + dedup (4 oktober 2026)

## Probleem

De geld-cascade (uren → ORT → prestatie → factuur) leest de opgeslagen ORT-segmenten terug uit
een JSON-string op `Performance.ortSegments`. Er bestonden **drie** parsers met uiteenlopende
robuustheid:

- `src/lib/cascade/commands-shared.ts` — guardt correct met `Array.isArray(parsed) ? … : null`.
- `src/lib/ort.ts` `parseOrtSegments` (de canonieke lezer voor `/diensten`, `/prestaties`,
  `/samenwerkingen/[id]`, `ort-breakdown.ts`) — deed `JSON.parse(json) as OrtSegment[]` **zonder**
  `Array.isArray`-guard.
- `src/app/(protected)/facturen/[id]/page.tsx` — een eigen, ongeguarde kopie van dezelfde functie
  (drift).

Een JSON-geldige maar semantisch niet-array waarde (`"{}"`, `"5"`, `"\"x\""`, `"null"`, `"true"`)
passeerde de parse en kwam als niet-array terug onder de `OrtSegment[]`-contractbelofte. `.length`
op een object is `undefined` (niet `0`), en `.map`/`for…of`/spread op een niet-array werpt. De
lezers overleefden dit deels per toeval (`.length`-vergelijkingen worden `false`, `computeOrt`
wordt per rij in een try/catch gevangen), maar de parser loog over zijn eigen type en elke nieuwe
of direct-itererende lezer kon de factuur-/samenwerkingspagina laten crashen.

## Fix

- `src/lib/ort.ts` `parseOrtSegments`: `Array.isArray`-guard toegevoegd → `[]` bij een niet-array,
  gelijk aan de guard die de cascade al hanteert. De functie geeft nu altijd een echte array terug,
  veilig voor `.map`/spread/`for…of`.
- **Element-validatie bewust niet toegevoegd.** Eén corrupt segment moet `computeOrt` laten
  weigeren (fail-closed → de lezer valt per rij terug op de basis `uren × tarief`), niet
  stilzwijgend worden weggefilterd tot een afwijkend subtotaal.
- `src/app/(protected)/facturen/[id]/page.tsx`: de lokale duplicaat verwijderd en de canonieke
  `parseOrtSegments` uit `@/lib/ort` geïmporteerd (drift weg, single source of truth).

## Bewijs

- Gerichte tests `src/lib/ort.test.ts`: niet-array JSON (`"{}"`, object-literal, `"5"`, `'"EVENING"'`,
  `"true"`, `"null"`) → `[]`; teruggegeven waarde is altijd `Array.isArray`. 32 tests groen.
- Geen gedragswijziging voor geldige invoer (bestaande round-trip-test blijft groen).
- Lint, build en de volledige suite groen; `prettier --write` gedraaid.
