# ADR-0010: Semantische matching — deterministische lokale embedder, pgvector geparkeerd

- **Status:** geaccepteerd
- **Datum:** 2026-07-03

## Context

Matching scoort nu op skills, compliance, tarief, werkmodus, locatie en branche. Twee profielen
kunnen op die harde velden identiek scoren terwijl hun bio/headline inhoudelijk sterk (of juist niet)
aansluit bij de opdrachtomschrijving. We willen die inhoudelijke aansluiting als een kleine,
_uitlegbare_ scorecomponent meenemen — zonder een zwarte doos en zonder externe afhankelijkheden.

De fundering staat er al:

- `src/lib/semantic.ts` — deterministische embedder via **feature-hashing** (FNV-1a, dimensie 96,
  L2-genormaliseerd, NL-stopwoordenfilter) + cosinusgelijkenis → `textRelatedness(a, b)` in `[0,1]`.
- `src/lib/services/semantic-matcher.ts` — service-grens met een `SEMANTIC_MATCHER`-driver
  (`local` | `pgvector`). De lokale matcher werkt altijd; de `PgVectorSemanticMatcher`-stub faalt
  helder zolang de DB-kant niet geprovisioneerd is.

## Besluit

We houden de **deterministische lokale embedder** als bron van inhoudelijke gelijkenis en gebruiken
`textRelatedness` als één kleine scorecomponent (`semantic`, ≤ 5 punten van de 100). We bouwen **nu
geen** pgvector, vector-kolom of embedding-cache: dat breekt het gedeelde SQLite+Postgres-schema
(native vector-types bestaan niet in SQLite; architectuurregel 6 wil één schema op beide) en lost een
schaalprobleem op dat er niet is — met `SCAN_LIMIT` (≈200 kandidaten) en dimensie 96 is scoren
in-memory sub-milliseconde. We gebruiken **geen externe embeddings-API**: die is niet-deterministisch
en vereist secrets (secrets = eigenaar, geen agent-werk).

### Trigger om pgvector wél te bouwen

Bouw de `PgVectorSemanticMatcher` (achter de bestaande `SEMANTIC_MATCHER=pgvector`-driver) pas zodra
een van deze grenzen wordt overschreden:

- **> ~50.000** doorzoekbare (discoverable) profielen, óf
- **scoring-latency > ~50 ms p95** op het matching-pad.

Dan is de meerkost gerechtvaardigd: pgvector-extensie + embedding-kolom + ANN-index, met vooraf
berekende embeddings. Die DB-provisioning (extensie, kolom, index, backfill) is **mensenwerk**.

## Gevolgen

**Voordelen**

- Uitlegbare matching blijft deterministisch en server-side (CLAUDE.md regel 1), zonder secrets of
  netwerk-afhankelijkheden.
- Eén schema draait op SQLite én Postgres; geen migratie-/provisioning-schuld nu.
- De opschaalroute is expliciet en al voorbereid (service-grens + driver + stub), dus later inschakelen
  is een lokale wijziging, geen herontwerp.

**Kosten / grenzen**

- Feature-hashing is grover dan een getrainde embedder: het vangt term-overlap, geen diepe semantiek.
  Voldoende voor een _kleine_ scorecomponent, niet voor primaire ranking.
- Bij groei moet iemand de trigger bewaken; de grenzen hierboven zijn de afspraak.

## Alternatieven

1. **Nu al pgvector + vector-kolom.** Breekt het gedeelde SQLite-schema en lost een niet-bestaand
   schaalprobleem op. Geparkeerd achter de trigger hierboven.
2. **Externe embeddings-API (OpenAI e.d.).** Niet-deterministisch en secret-afhankelijk; verworpen.
3. **Semantiek helemaal weglaten.** Laat een echte, uitlegbare kwaliteitsdimensie liggen die met de
   bestaande fundering vrijwel gratis is; verworpen.
