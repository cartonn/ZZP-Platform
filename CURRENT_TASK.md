# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 5 — Admin-verificatiequeue + expiry (kerndifferentiatie demo-klaar)

### Doel
Admins beoordelen ingediende certificaten (goedkeuren/afwijzen met verplichte reden) en
verlopen credentials worden server-side EXPIRED. Hierna is de hele keten demo-klaar:
opdracht → reactie → verificatie → compliance.

### Context uit Sessie 0-4 (staat al)
- Modellen `Credential`, `CredentialVerification` (decision + reason), `VerificationRequest`
  (PENDING/RESOLVED), `Notification`.
- `src/lib/credentials.ts` (getest): `statusForDecision(current, decision, reason)` dwingt
  af dat REJECTED een reden heeft en valideert de overgang; `expiryTransition` geeft
  VERIFIED→EXPIRED. **Gebruik deze; geen losse status-updates.**
- ZZP-kant dient in via `SUBMITTED` + maakt een `VerificationRequest` (zie certificaten/actions).
- Mutatieketen via authz (`requireRole("ADMIN")`) + `src/lib/audit.ts`. Notificaties: `Notification`.
- Compliance/publiek profiel lezen al VERIFIED+niet-verlopen (matching.ts, zzp/[id]).

### Stappen
1. **Verificatiequeue (`/admin/verificaties`):** lijst van openstaande aanvragen (SUBMITTED /
   PENDING request), met credential-info + bewijsstuk-download (admin mag via document-route).
2. **Goedkeuren:** status → VERIFIED, `verifiedAt`, `CredentialVerification`-record,
   `VerificationRequest` → RESOLVED, audit, notificatie naar ZZP'er. Via `statusForDecision`.
3. **Afwijzen:** status → REJECTED, **reden verplicht** (server-side afgedwongen), record +
   `rejectionReason`, request RESOLVED, audit, notificatie + herstelactie voor de ZZP'er.
4. **Expiry:** server-side route/actie die VERIFIED-credentials met verstreken `expiresAt`
   naar EXPIRED zet via `expiryTransition` (alleen VERIFIED kan verlopen) + audit.
   Geen cron-infra (mens/infra); lever een idempotente actie/route die dit uitvoert.
5. **Tests:** beslis-logica (bestaat deels), reden-verplichting, queue-filtering,
   expiry-transitie; e2e: admin keurt goed/af, ZZP'er ziet de uitkomst.

### Definition of Done (deze sessie)
- [ ] Admin-queue toont openstaande aanvragen + bewijsstuk
- [ ] Goedkeuren/afwijzen via statusForDecision (reden verplicht bij afwijzen) + audit + notificatie
- [ ] Expiry-actie zet verlopen VERIFIED → EXPIRED (idempotent, server-side)
- [ ] Publiek profiel/compliance reflecteren VERIFIED-uitkomst end-to-end
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 6

### Niet nu doen
Geen berichten/samenwerkingen/facturen/abonnementen-UI (latere sessies). Geen echte
e-mailverzending (alleen in-app `Notification`). Geen productie-infra/cron.

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
