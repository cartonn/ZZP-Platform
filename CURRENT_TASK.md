# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 10 — Productie-voorbereiding (code-kant)

### Doel
De codebasis productieklaar maken voor zover dat code is — niet de infra zelf. Infra (echte
Postgres/S3/mailprovider/domein/secrets/backups) en de security-/AVG-review zijn mensenwerk.

### Context / kaders (CLAUDE.md)
- Provider-switch is al voorbereid (SQLite lokaal, Postgres prod via env). Storage-abstractie
  bestaat; de S3-driver is bewust nog niet geïmplementeerd (`src/lib/services/storage.ts`).
- Auth.js JWT-strategie; bekende trade-off: schorsing werkt pas na JWT-refresh (Sessie 8).
- Geen geheimen in git; uploads nooit op publiek pad.

### Stappen (code-kant; hou diffs behapbaar)
1. **S3-storage-driver implementeren** achter de bestaande `StorageDriver`-interface (AWS SDK of
   S3-compatible), geactiveerd via `STORAGE_DRIVER=s3` + env. Lokaal blijft default. Unit-test de
   key/validatie-logica; de echte bucket is infra/mens.
2. **Security headers** (CSP waar haalbaar, `X-Content-Type-Options`, `Referrer-Policy`,
   `X-Frame-Options`/frame-ancestors) via `next.config` headers of middleware.
3. **Env-validatie**: één plek die vereiste env-vars valideert bij boot (bv. `src/lib/env.ts` met
   Zod) en duidelijk faalt als iets ontbreekt in productie.
4. **Robuustheid**: globale `error.tsx`/`not-found.tsx` (nette UI), health-check route
   (`/api/health`), en documenteer de Postgres-switch + benodigde env in een `.env.example`/README-sectie.
5. **Optioneel**: eenvoudige rate-limiting op auth/mutaties (in-memory of doc-only als infra nodig is).

### Definition of Done (deze sessie)
- [ ] S3-driver geïmplementeerd (achter de abstractie, env-geschakeld) + tests voor de pure logica
- [ ] Security headers actief; env-validatie aanwezig; health-check + nette error/not-found UI
- [ ] `.env.example` + korte deploy/Postgres-sectie gedocumenteerd
- [ ] typecheck + lint + test + build groen; e2e groen + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij. Laatste codesessie: markeer wat nog mensenwerk is.

### Niet nu doen
Geen echte infra opzetten (bucket/DB/mail/domein/secrets). Geen betaalprovider. De finale
security-/AVG-review vóór livegang met echte documenten blijft expliciet mensenwerk.

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
