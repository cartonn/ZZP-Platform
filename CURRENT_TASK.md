# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 3 — Reacties & kandidatenflow

### Doel
ZZP'ers reageren op opdrachten met een server-berekende matchscore + compliance-snapshot;
opdrachtgevers beheren kandidaten per opdracht. Feature-gating (max reacties per plan).

### Context uit Sessie 0-2 (staat al)
- Modellen `Application` (uniek [jobId, freelancerId], status, matchScore, complianceSnapshot,
  note), `Job`, `FreelancerProfile`, `Plan`, `Subscription`.
- `src/lib/matching.ts` (getest): `computeMatchScore` + `computeCompliance` — gebruik dit
  server-side bij het aanmaken van een reactie en sla de snapshot op.
- Enums: `APPLICATION_STATUSES` (NEW/VIEWED/SHORTLIST/REJECTED/ACCEPTED). Maak een
  expliciete overgangsmap (vgl. JOB_TRANSITIONS) + assert.
- Mutatieketen via authz + audit. Patronen: `src/app/(protected)/opdrachten/*`.
- Plannen zijn geseed (FREE/PRO/BUSINESS met maxApplications). Gating server-side.

### Stappen
1. **Reageren (FREELANCER):** motivatie, tariefvoorstel, beschikbaarheid, optionele bijlage.
   Server berekent matchscore + compliance-snapshot (matching.ts) bij aanmaken en slaat op.
   Eén reactie per opdracht (unieke constraint). Alleen op PUBLISHED opdrachten.
2. **Feature-gating:** max reacties per plan, server-side afgedwongen (FREE-limiet).
3. **Kandidatenoverzicht (CLIENT) per opdracht:** statussen (NEW/VIEWED/SHORTLIST/REJECTED/
   ACCEPTED) via expliciete overgangsmap, interne notities, compliance-overzicht per kandidaat.
4. **"Mijn reacties" (FREELANCER):** overzicht van eigen reacties + status.
5. **Tests:** applicatie-validatie, statusovergangen, gating-grens, matchscore-snapshot.

### Definition of Done (deze sessie)
- [ ] FREELANCER kan reageren; matchscore + compliance server-berekend en opgeslagen
- [ ] Gating: reactielimiet per plan server-side afgedwongen
- [ ] CLIENT kandidatenoverzicht met statusbeheer + notities + compliance
- [ ] FREELANCER "Mijn reacties"-overzicht
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 4

### Niet nu doen
Geen documenten/credentials-upload-UI (Sessie 4), geen verificatiequeue (Sessie 5),
geen berichten/samenwerkingen/facturen (later). Echte bijlage-opslag mag de bestaande
storage-abstractie gebruiken, maar de volledige document-UI is Sessie 4.

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
