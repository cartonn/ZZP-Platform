# DECISIONS.md — Besluitenregister (ZZP Platform overhaul)

> Bron: `prompts/PLATFORM_OVERHAUL.md` §0A (vastgelegd) en §0B (open). Voeg bij elke nieuwe
> keuze datum + onderbouwing toe. ADR's met architecturale diepgang staan in `docs/decisions/`.

---

## Vastgelegd (hard — niet van afwijken zonder te vragen)

### Besluit 1 — Geldstroom: ALTIJD direct opdrachtgever → ZZP'er

Er loopt **nooit** geld via het platform. Het platform registreert hooguit de **betaalstatus**.
Geen escrow, geen payment-processor, geen derdengelden, geen KYC/AML-last.
_Architectuurgevolg:_ lichtgewicht betaalstatus-registratie + herinneringen; geen transactie-laag.

### Besluit 2 — DBA: platform MONITORT en SIGNALEERT, adviseert NIET juridisch

Ondersteunend risicobeoordelings-/monitoringsinstrument: signaleren, waarschuwen, documenteren,
audittrail. **Geen juridisch advies, geen "DBA-proof"-garantie.** Elk signaal met disclaimer.
Eindverantwoordelijkheid bij opdrachtgever en ZZP'er.

### Besluit 3 — Verplichte goedkeuringsstap vóór facturatie (beide tariefvormen)

Opdrachtgever keurt eerst de prestatie goed (uurtarief → uren; fixed price → milestone/oplevering).
Aparte verplichte stap (Event B). **Pas ná goedkeuring** een concept-factuur.

### Besluit 4 — Platformfee: OPEN, maar mechaniek configureerbaar, default UIT

Waarschijnlijk % van opdrachtwaarde, mogelijk door opdrachtgever betaald. Omdat er geen geld via
het platform loopt, wordt een fee **apart gefactureerd** (eigen reeks), strikt gescheiden van de
hoofdgeldstroom. Bouw als feature-flag (Event F), default 0% / uit.

---

## Open (nog niet beslist — flexibel bouwen, niet zelf vastleggen)

1. **Platformfee — detail** (overleg Davud): wel/geen fee, hoogte, wie betaalt, triggermoment.
   → Event F als feature-flag, default UIT.
2. **Betaalstatus-verificatie:** start met zelfrapportage (ZZP'er bevestigt ontvangst = default).
   Open: bevestiging door beide partijen; ooit read-only PSD2-signaal. → Bevestigingslogica
   configureerbaar; **geen bankkoppeling nu.**
3. **DBA-drempelwaarden & teksten** (6/12 mnd, 80% omzet, signaalteksten) → **configureerbaar**
   in een config-bestand, niet hardcoded.
4. **Modelovereenkomst-afhandeling:** nu dossieritem/vinkje, geen oordeel. Sjablonen/wizard later.
5. **Thema dark-first vs. light** (overhaul §7 vs. bestaand `design.md`): fundamentele
   richtingskeuze die het hele platform raakt → **stop-and-confirm vóór Fase 5**. Tot dan: geen
   visuele ombouw; tokens zijn semantisch zodat een latere omslag geen componenten raakt.

---

## Sessie-besluiten (deze overhaul)

### 2026-05-29 — Branch voor deze sessie

Deze sessie ontwikkelt op **`claude/modest-babbage-08jYa`** (harness-instructie). De docs noemen
elders `claude/dazzling-carson-v9Qwk` als auto-deploybranch; daar wordt **niet** zonder
toestemming naar gepusht.

### 2026-05-29 — Event-laag: in-process bus + persistente append-only event store

_Keuze:_ in-process event-bus (`event-bus.ts`) met een **persistente event store** (`DomainEvent`-
tabel) i.p.v. een externe queue/broker. _Onderbouwing:_ single-process Next.js op Railway; geen
extra infra; de plan/apply + `$transaction`-aanpak die al in de codebase zit geeft atomaire
gevolgen. Een tabel-gebaseerde "outbox" geeft replay + audit zonder broker.

### 2026-05-29 — Idempotentie op twee niveaus

_Publicatie-dedup_ via optionele unieke `dedupeKey` op `DomainEvent`; _handler-dedup_ via
`EventHandlerRun(eventId, handler)`-marker (uniek). _Onderbouwing:_ §3 overhaul eist dat een event
tweemaal verwerken nooit dubbele facturen/administratie-items oplevert.

### 2026-05-29 — State machines via generieke helper, bestaande maps blijven

_Keuze:_ `defineStateMachine()` generaliseert het bestaande `assertTransition`-patroon; de nieuwe
lifecycles (Opdracht/Contract/Urenstaat/Factuur/Betaling) komen in `lifecycles.ts`. De werkende
korte enums migreren pas in Fase 2/3 (additief in Fase 1, geen breuk).
