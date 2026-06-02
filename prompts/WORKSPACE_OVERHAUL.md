# WORKSPACE_OVERHAUL — werkplek/dashboards naar een rustig "command center"

> Gefaseerde, gegate opdracht voor de 24/7-routine en sessies. Lees CLAUDE.md, CURRENT_TASK.md,
> PROGRESS.md en DESIGN.md eerst. Definition of Done per fase: typecheck + lint + test + build groen,
> geen "AI" in de UI, NL-taal, server-side waarheid, loading/error/empty-states. **HERGEBRUIK de
> bestaande engines — verzin geen tweede.** Geen scope erbij die hier niet staat.

## Probleem

- Het dashboard plet alle signalen tot één platte "Vraagt aandacht"-lijst en gooit `tone`/`priority`
  uit de next-action-engine weg; het toont niet **wát er loopt en hoe ver**.
- Een ZZP'er ziet bij inlog niet zijn lopende samenwerking(en) en hun voortgang in de cascade. Hij
  kan tegelijk bij meerdere opdrachtgevers werken (ma+di bij A, wo bij B, vr bij C) — moet kunnen + overzichtelijk.
- Zonder lopende samenwerking moet hij automatisch matches mét uitleg + actie zien.
- Zijbalk onlogisch: "Dashboard" en "Administratie" lijken op elkaar (zelfde icoon, onduidelijke scheiding).
- Opdrachtgever en admin: idem — bij inlog eerst lopend werk, anders matches/wachtrij + wat actie vraagt.

## Doel — één informatiehiërarchie voor alle drie rollen

1. **WAT LOOPT ER NU** — lopende samenwerkingen met fase/voortgang in de cascade + eerstvolgende stap.
   ZZP'er met meerdere: een "deze week"-overzicht + per samenwerking een fase-kaart met primaire actie.
2. **WAT VRAAGT AANDACHT** — gerangschikte next-actions met `tone` zichtbaar (badges/kaarten):
   bijna-vervallen VOG/legitimatie, berichten die wachten op antwoord, concept-facturen in te dienen,
   te keuren prestaties/facturen, afgewezen certificaten, enz.
3. **WAT KAN IK OPPAKKEN** — matches uit de matching-engine mét `reasons` + actie; prominent bij weinig
   lopend werk, compacter bij veel.
4. **AAN DE SLAG** — onboarding-checklist alleen voor nieuwe accounts (bestaat al).

## Hergebruik (uitbreiden, niet vervangen)

- `next-actions.ts`: freelancer/client/adminNextActions, rankNextActions, NextAction{id,title,href,tone,priority}, banden `P`.
- `cascade/next-actions.ts`: cascadeFreelancerActions/cascadeClientActions (al gewired in dashboardData).
- `recommendations.ts`: recommendedJobs, topMatches, MATCH_MIN_SCORE, JobMatch. `matching.ts`: computeMatchScore (reasons/compliance/availability).
- `collaborations.ts` (COLLABORATION_TRANSITIONS, status, contractStatus), Performance.status, Invoice.lifecycleStatus, ORT.
- `collaboration-alerts.ts`, `availability.ts` (currentOrNextAvailable/summarizeAvailability/upcomingWindows), `messaging.ts`.
- Dataverzameling: `src/app/(protected)/dashboard/page.tsx` → `dashboardData()`.

## Nieuwe PURE helpers (geen I/O, unit-getest)

- **A) Cascade-fase per samenwerking** (`src/lib/cascade/stage.ts`): leidt uit (contractStatus, laatste
  Performance-status, Invoice.lifecycleStatus, dispute) af: huidige menselijke fase, voortgang (stap N/M in
  contract→uren indienen→goedkeuring→factuur indienen→goedkeuring→betaald), wie "aan zet" is (viewer-perspectief),
  en de primaire CTA (deep-link /samenwerkingen/[id]). Zelfde drempels/strings-bron als next-actions. **Kernstuk.**
- **B) Weekoverzicht** ("deze week") voor een ZZP'er met meerdere actieve samenwerkingen — uit actieve
  Collaboration-rijen + AvailabilityWindows. Additief/deterministisch: geen per-dag-data → groepeer per
  opdrachtgever met periode + uren/week. Echte "ma bij A, wo bij B" vereist eerst een ADR + minimale additieve
  schema-uitbreiding (optioneel weekdagen-/schema-veld op Collaboration) — niet stilzwijgend oprekken.
- **C) Extra next-action-inputs**: (1) berichten die op antwoord wachten (messaging.ts), (2) identiteit/legitimatie
  bijna verlopen (naast VOG/cert-expiry). Behoud tone/priority; geen losse status buiten de engine.

## UI / Design (Linear-stijl, conform DESIGN.md)

Next-actions als kaarten/rijen waarvan de stijl door `tone` bepaald wordt (attention=warning-accent,
info=neutraal, success=bevestigend), met statuschip, korte titel, teller, één primaire actie + deep-link;
behoud de ranking. Lopende samenwerkingen als kaarten met fase-chip + voortgang (A) + "aan zet"-CTA; bij
meerdere het weekoverzicht (B) bovenaan. Matches: kaart met score-/compliance-/availability-badge + top-reasons

- actie; prominent bij weinig lopend werk. Compact, hoge dichtheid, geen kaart-in-kaart/gradients; loading/error/empty overal.

## Per rol

- **FREELANCER**: zone1 = lopende samenwerking(en) + weekoverzicht; geen werk → matches prominent. zone2 =
  aandacht (VOG/legitimatie bijna verlopen, afgewezen cert, berichten te beantwoorden, concept-factuur indienen,
  goedgekeurde factuur → betaling markeren).
- **CLIENT**: zone1 = lopende samenwerkingen + wie aan zet (te keuren prestaties/facturen, compliance-alerts);
  geen samenwerkingen → suggested freelancers/matches + "plaats opdracht". zone2 = nieuwe reacties, concept-opdrachten, over-vervaldatum facturen.
- **ADMIN**: zone1 = operationele wachtrij (verificaties, disputen, PENDING-gebruikers, AVG-verzoeken) met tellers;
  zone2 = kerncijfers/health (sluit aan op /admin/statistieken). Geen "matches" voor admin.

## Zijbalk (nav.ts) logisch maken

Maak Dashboard (command center) ≠ Administratie (boekhouding: facturen, grootboek/BTW, exports, jaaroverzicht)
expliciet: andere iconen, gegroepeerd (Werk · Administratie · Account) per rol via navForRole. Geen dode links;
bestaande routes behouden. (NB: secties bestaan al sinds de sidebar-grouping-ronde — verfijn iconen + Administratie-scheiding.)

## Fasering (kleine gegate increments — DoD per fase)

1. Pure helpers + unit-tests: cascade-fase (A), weekoverzicht-logica (B), extra next-action-inputs (C).
2. FREELANCER-dashboard → drie zones; tone/voortgang tonen.
3. CLIENT-dashboard idem.
4. ADMIN-dashboard idem (werkwachtrij + health).
5. Zijbalk-iconen/Administratie-scheiding verfijnen.
6. Weekoverzicht-UI (+ indien nodig ADR + additieve schema-uitbreiding uit B).

Tests naast de code; per fase de gate groen; commit + PROGRESS/CURRENT_TASK bijwerken. E2e alleen interactief.
Stop na 2 mislukte herstelpogingen en meld de blocker. Push naar de aangewezen branch; niet zelf mergen.

## Acceptatie

- ZZP'er met 1+ actieve samenwerking ziet bij inlog die samenwerking(en) + fase/voortgang + eerstvolgende stap;
  bij meerdere een kloppend weekoverzicht. Zonder samenwerking: matches met uitleg + actie.
- Aandacht-items met juiste tone als badges/kaarten in engine-volgorde; bijna-verlopen VOG/legitimatie, te
  beantwoorden berichten, in te dienen facturen verschijnen correct.
- Opdrachtgever + admin volgen dezelfde logica (lopend werk eerst, anders matches/wachtrij + aandacht).
- Dashboard en Administratie duidelijk onderscheiden; nav per rol logisch gegroepeerd.
- Cascade-, next-action- en matching-engine hergebruikt (niet gedupliceerd); de flow voelt als één logisch verloop.
