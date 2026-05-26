# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 2 — Opdrachten CRUD + zoeken/filteren

### Doel
Opdrachtgevers beheren opdrachten (concept → publiceren → sluiten); ZZP'ers vinden ze
via zoeken/filteren. Alle statusovergangen en filters server-side.

### Context uit Sessie 0/1 (staat al)
- Modellen `Job`, `JobSkill`, `JobCredentialRequirement`, `Company`, `Skill`, `Industry`.
- Mutatieketen via `src/lib/authz.ts` (`requireRole("CLIENT")`, `assertOwnership`) + `audit`.
- Patroon voor server actions + Zod + controlled forms: zie `src/app/(protected)/bedrijf/*`.
- Enums in `src/lib/enums.ts`: `JOB_STATUSES` (DRAFT/PUBLISHED/CLOSED), `WORK_MODES`.
- Role-aware nav: zet `Opdrachten`/`Mijn opdrachten` op `enabled` in `src/lib/nav.ts`.

### Stappen
1. **Job aanmaken/bewerken (CLIENT):** alle velden uit het model. Concept opslaan,
   publiceren, sluiten — via een expliciete statusovergangsmap (vgl. `CREDENTIAL_TRANSITIONS`),
   server-side afgedwongen. Ownership op de eigen Company.
2. **Skills & credentials koppelen:** vereiste/gewenste skills (JobSkill.required) en
   vereiste/gewenste credential-types (JobCredentialRequirement).
3. **Opdrachtenoverzicht (ZZP-kant):** zoeken (debounced), filters (branche, skills, tarief,
   locatie, werkmodus, startdatum, vereiste certificaten), sorteren, paginatie. Alleen
   PUBLISHED opdrachten zichtbaar; filterlogica server-side.
4. **Opdracht-detailpagina** (publiek/voor ingelogde ZZP'ers) + **beheeroverzicht (CLIENT)**.
5. **Tests:** job-validatie (Zod), statusovergangen (pure functie + assert), filterlogica.

### Definition of Done (deze sessie)
- [ ] CLIENT kan job aanmaken/bewerken/publiceren/sluiten (overgangen server-side afgedwongen)
- [ ] Skills + credential-eisen koppelbaar
- [ ] ZZP-overzicht met zoeken/filteren/sorteren/paginatie (alleen PUBLISHED)
- [ ] Opdracht-detail + CLIENT-beheeroverzicht
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 3

### Niet nu doen
Geen reacties/kandidatenflow (Sessie 3), geen documenten/credentials-upload (Sessie 4),
geen berichten/facturen/admin (later).

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)
```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```
Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.
