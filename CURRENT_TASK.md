# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 8 — Admin-paneel afronden (gebruikers, opdrachten, audit log)

### Doel
Beheerders kunnen gebruikers beheren (rol/status), alle opdrachten overzien/modereren, en het
auditlogboek doorzoeken. Read-heavy + enkele gevoelige mutaties (gebruiker schorsen).

### Context uit Sessie 0-7 (staat al)
- Modellen `User` (role, status), `AuditLog` (actorId, action, entityType, entityId, metadata, createdAt),
  `Job`, `Application`, etc. Enums: `USER_ROLES`, user `status` (ACTIVE/…; check enums/schema).
- `requireRole("ADMIN")` + route-gate `/admin/*` (auth.config) staan al. Patroon: `/admin/verificaties`.
- nav ADMIN: "Gebruikers" `/admin/gebruikers`, "Opdrachten" `/admin/opdrachten`, "Audit log"
  `/admin/audit` staan op enabled:false.
- Audit-helper `auditData`/`audit`. Notificaties beschikbaar.

### Stappen
1. **Gebruikers (`/admin/gebruikers`):** lijst + zoeken/filteren op rol/status; detail of inline
   acties: status wijzigen (bv. ACTIEF ↔ geschorst) met audit + (optioneel) notificatie. ADMIN mag
   zichzelf niet degraderen/schorsen (server-side guard). Geen wachtwoordreset (infra/mens).
2. **Opdrachten (`/admin/opdrachten`):** alle opdrachten overzien (alle statussen, alle bedrijven),
   zoeken/filteren; moderatie-actie (bv. een opdracht sluiten) via de bestaande job-transitiemap.
3. **Audit log (`/admin/audit`):** doorzoekbaar/gefilterd overzicht (op actie/entityType/actor),
   paginatie. Read-only. Metadata leesbaar tonen.
4. **Tests:** admin-guards (non-admin geweerd — bestaat al als patroon), gebruiker-status-mutatie
   met self-guard, audit-filter/paginatie-logica (pure helper); e2e: admin schorst een gebruiker
   en ziet de auditregel.

### Definition of Done (deze sessie)
- [ ] Gebruikersbeheer met status-mutatie (self-guard) + audit
- [ ] Opdracht-moderatie-overzicht (alle opdrachten) met actie via transitiemap
- [ ] Doorzoekbaar audit log met paginatie (read-only)
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 9

### Niet nu doen
Geen wachtwoordreset/e-mail (infra/mens). Geen bulk-acties of exports. Polish/perf is Sessie 9.

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
