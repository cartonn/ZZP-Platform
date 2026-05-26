# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 6 — Berichten, notificaties, samenwerkingen

### Doel
Opdrachtgevers en ZZP'ers communiceren in-app (na een match), zien hun notificaties, en
kunnen een samenwerking vastleggen met een expliciete statusflow.

### Context uit Sessie 0-5 (staat al)
- Modellen `Conversation`, `Message`, `Notification`, `Collaboration` (PROPOSED/ACTIVE/
  COMPLETED/CANCELLED — `COLLABORATION_STATUSES` in enums).
- Notificaties worden al aangemaakt (verificatiebeslissingen); er is nog GEEN UI om ze te
  zien. `Notification`: userId, type, title, body?, link?, readAt?.
- Mutatieketen via authz + audit; statusovergangen via expliciete map (vgl. JOB_/APPLICATION_
  /CREDENTIAL_TRANSITIONS) — maak `COLLABORATION_TRANSITIONS` + assert in een `src/lib/*.ts`.
- Patronen: server actions + Zod + role-aware pages; nav-items "Berichten" (beide rollen)
  staan op enabled:false in `src/lib/nav.ts`.

### Stappen
1. **Berichten:** een `Conversation` tussen een CLIENT en een FREELANCER (1-op-1, eventueel
   gekoppeld aan een opdracht/reactie). Berichtenlijst + detailthread; bericht versturen
   (Zod, ownership: alleen de twee deelnemers). Geen realtime — server-render + revalidate.
   Start een gesprek vanuit een kandidaat (SHORTLIST/ACCEPTED) of geaccepteerde reactie.
2. **Notificaties:** notificatiecentrum (lijst + ongelezen-badge in de shell), markeer als
   gelezen (per item + alles). Maak notificaties aan bij relevante events (nieuw bericht,
   reactie geaccepteerd/afgewezen) — server-side, naast de bestaande verificatie-notificaties.
3. **Samenwerkingen:** `Collaboration` met expliciete statusovergangen (voorstellen → actief →
   afgerond/geannuleerd), ownership server-side, audit.
4. **Tests:** collaboration-statusovergangen (pure functie + assert), bericht-validatie,
   ownership op conversatie-toegang; e2e: client en freelancer wisselen berichten uit.

### Definition of Done (deze sessie)
- [ ] 1-op-1 berichten met thread + versturen (alleen deelnemers, server-side)
- [ ] Notificatiecentrum met ongelezen-badge + markeer-als-gelezen
- [ ] Samenwerking met expliciete statusflow (assert) + audit
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 7

### Niet nu doen
Geen facturatie/billing (Sessie 7), geen admin-gebruikersbeheer (Sessie 8). Geen echte
e-mail/push — alleen in-app `Notification`. Geen websockets/realtime.

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
