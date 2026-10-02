# Opdrachtgever /opdrachten-badge telt overdue-onbezette opdrachten — 2 oktober 2026

## Defect (badge↔lijst-drift, DOEL 1b)

De item-engine (`clientTasks`, `src/lib/actions/pending-tasks.ts`) emitteert voor een
gepubliceerde opdracht met verstreken startdatum en niemand vastgelegd een
`jobStaffingOverdueTask` (prioriteit 51, toon `attention`, deeplink `/opdrachten/{id}`).
Die taak verschijnt op `/acties`, in de dashboard-rail en wordt door de `/acties`-badge
geteld. De `/opdrachten`-nav-badge (`navBadges`, `src/lib/signals.ts`) telde echter
uitsluitend concept-opdrachten (`draftJobs`) plus koud-lopende opdrachten
(`getClientColdJobs`) en raadpleegde `getClientOverdueJobs` niet.

De twee loaders zijn aantoonbaar disjunct: de koud-tak capt op
`_count.applications <= VACANCY_COLD_MAX_APPLICATIONS` (= 2,
`src/lib/data/client-cold-jobs.ts`), terwijl de overdue-tak geen reactieplafond kent
(`src/lib/data/client-overdue-jobs.ts`). Een overdue-onbezette opdracht met ≥ 3 reacties
kan daardoor nooit "koud" zijn → `/acties` toonde een verstreken-planning-taak zonder
bijbehorende `/opdrachten`-badge: het "signaal op één oppervlak"-anti-patroon.

### Repro

Opdrachtgever met 0 concept-opdrachten; 1 PUBLISHED-opdracht met startdatum gisteren,
4 NEW-reacties, geen ACCEPTED-reactie en geen niet-geannuleerde samenwerking.

- `getClientOverdueJobs` → de opdracht (fase "overdue") → `jobStaffingOverdueTask` op
  `/acties` + de rail.
- `getClientColdJobs` → leeg (4 > 2 reacties).
- `navBadges` → `draftJobs = 0`, `coldJobs.length = 0` → **geen `/opdrachten`-badge**.

Verwacht: `/opdrachten`-badge `{ count: 1, tone: "attention" }`, precies zoals de
koud-tak dat al deed.

## Herstel

`src/lib/signals.ts` (CLIENT-tak): `getClientOverdueJobs(userId, now)` toegevoegd aan de
bestaande `Promise.all`, en de `/opdrachten`-badgeberekening telt nu
`overdueJobs.length + coldNotOverdue`. De koud-set wordt ontdubbeld tegen de overdue-set
(`overdueJobIds`), omdat de item-engine een opdracht die zowel overdue als koud is maar
één keer toont (de dominante P=51-taak subsumeert de zachtere koud-nudge) — anders blies
de badge op t.o.v. `pendingTaskCount`. Toon blijft `attention` zodra er een
attention-opdracht is; gedrag ongewijzigd wanneer er geen overdue opdrachten zijn
(`coldNotOverdue == coldJobs.length`). Geen nieuwe query-bron, dezelfde gedeelde loaders
als `/acties`.

## Bewijs

- Nieuwe regressietest `src/lib/signals.badge-gaps-staffing-overdue.test.ts` (5 gevallen):
  overdue zonder concepten/koud → count 1; overdue + concepten → som; overdue + koude
  verschillende opdrachten → som; opdracht die overdue én koud is → één keer geteld
  (ontdubbeling); niets → geen badge.
- Bestaande `src/lib/signals.badge-gaps-cold-jobs.test.ts` blijft groen (het gemockte
  `getClientOverdueJobs` gaf voorheen inert `[]`; nu daadwerkelijk geraadpleegd).
- Lint, typecheck en repositoryformat groen; volledige suite en productiebuild via de
  DoD-gate. Onafhankelijke review en CI-poort volgen.
