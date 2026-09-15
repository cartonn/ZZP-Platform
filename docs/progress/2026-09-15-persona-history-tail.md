## 2026-09-09 — persona-sweep run 9: CLIENT signable-PROPOSED-badge ordende anders dan /acties (outer-window-drift, DOEL 1b)

**Wat:** kritische-gebruiker-sweep over de vier rollen (orchestrator Opus 4.8 + 3 parallelle adversariële
Opus-audits: next-action/badge · IDOR/authz/cross-tenant · malicieuze invoer/geld/robuustheid). DOEL 2
schoon (0 bereikbare authz/IDOR/tenant-gaten; 0 nieuwe invoer/geld-gaten — de delta #1440–#1449 dichtte de
geld/parse-vein). Eén DOEL-1b-defect gefixt, één LOW-robustness-item geparkeerd (zie
`docs/PERSONA-SWEEP-BACKLOG.md` run 9).

De CLIENT /samenwerkingen-nav-badge telt de onderteken-bare PROPOSED-samenwerkingen via
`countClientSignableProposals` (`signals.ts`). Die query ordende `updatedAt desc`, terwijl de list-bron
`proposedCollabs` (`pending-tasks.ts:1149`) in run 81 bewust naar `createdAt asc` is omgezet:
`Collaboration.updatedAt` staat voor een PROPOSED-rij effectief bevroren op het aanmaakmoment, dus
`updatedAt desc` capte de NIEUWSTE voorstellen en liet de OUDSTE — de langst-wachtende hires die om
ondertekening vragen — buiten het (op `CASCADE_SCAN_LIMIT`=50) gecapte venster vallen. Met de list op de
oudste 50 en de badge op de nieuwste 50 divergeren de subsets bij >50 gelijktijdige PROPOSED-samenwerkingen
voor één opdrachtgever → de badge undercountte precies de gestrande, oudste teken-taken die /acties toont.
Exact de outer-window-blindheid die de list-kant al dichtte, achtergebleven in de badge; de badge-doc-comment
claimde bovendien ten onrechte pariteit ("op dezelfde rijen redeneren").

**Aanpak (hergebruik, geen duplicatie):** de badge-query ordent nu identiek `createdAt asc` als de
list-bron → beide oppervlakken redeneren op dezelfde (oudste-eerst) rijen; kan structureel niet meer
driften. **Bestanden:** `src/lib/signals.ts` (+ doc-comment die de gedeelde ordening + de run-81-reden
uitlegt), `src/lib/signals.badge-signable-proposals-order.test.ts` (+1 test, rood→groen bewezen:
`updatedAt desc` → assertion faalt, `createdAt asc` → groen). **Checks:** typecheck ✓ · lint ✓ · unit
(8509 passed, 2 skipped) ✓ · prettier ✓ · build (offline font-stub) exit 0 · CI-poort verifiëren (PR volgt).
