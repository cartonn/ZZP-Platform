# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 4 — Documenten + credentials (ZZP-kant)

### Doel
ZZP'ers beheren documenten en credentials veilig: uploaden, metadata, verificatie
aanvragen, status volgen, zichtbaarheid beheren, document vervangen, historie.

### Context uit Sessie 0-3 (staat al)
- Modellen `Document`, `Credential`, `CredentialVerification`, `VerificationRequest`.
- Storage-abstractie `src/lib/services/storage.ts` (getest): `validateUpload`,
  `generateStorageKey`, `getStorage()` (local/S3). Bewijs van werking: bedrijfslogo +
  `src/app/api/media/[...key]/route.ts` (auth-gated). Documenten zijn PRIVÉ → ownership-route.
- Credential-logica `src/lib/credentials.ts` (getest): `assertTransition` op
  `CREDENTIAL_TRANSITIONS`, `statusForDecision`, expiry-helpers. Gebruik dit; geen losse updates.
- Mutatieketen via authz + audit. Compliance gebruikt VERIFIED+niet-verlopen (matching.ts).

### Stappen
1. **Documenten-upload-UI** op de storage-abstractie: type/grootte-validatie, ownership,
   download via een signed/auth-gated route (alleen eigenaar + admin). Nooit publiek pad.
2. **Credentials (FREELANCER):** uploaden (type, titel, uitgever, datums, document),
   metadata bewerken, **verificatie aanvragen** (status DRAFT → SUBMITTED via assertTransition),
   status volgen, zichtbaarheid (PUBLIC/PRIVATE), document vervangen (terug naar SUBMITTED),
   verificatiehistorie tonen.
3. **Koppeling:** credentials voeden de compliance-snapshot (Sessie 3) en het publieke profiel.
4. **Tests:** upload-validatie (bestaat), ownership-checks op document-download,
   credential-statusovergangen vanuit de UI-actie.

### Definition of Done (deze sessie)
- [ ] Document upload + ownership-gecontroleerde download (privé)
- [ ] Credentials CRUD + verificatie aanvragen (DRAFT→SUBMITTED) + zichtbaarheid + historie
- [ ] Statusovergangen uitsluitend via assertTransition; verplichte velden server-side
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 5

### Niet nu doen
Geen admin-verificatiequeue / goedkeuren-afwijzen (dat is Sessie 5). Alleen de ZZP-kant:
indienen en status volgen. Geen berichten/samenwerkingen/facturen.

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
