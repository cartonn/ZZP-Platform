# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 1 — Onboarding & profielen (FREELANCER + CLIENT)

### Doel
ZZP'ers en opdrachtgevers kunnen registreren met rolkeuze en hun profiel beheren.
Profiel-compleetheid wordt server-berekend; zichtbaarheidsregels worden gerespecteerd.

### Context uit Sessie 0 (fundament staat)
- Modellen `User`, `FreelancerProfile`, `Company`, `Skill`, `Industry` + join-tabellen bestaan al.
- Gebruik `src/lib/authz.ts` (`requireRole`, `assertOwnership`) voor de mutatieketen
  (auth → rol → ownership → Zod → actie → audit) en `src/lib/audit.ts` voor logging.
- Enums + Zod-schema's staan in `src/lib/enums.ts`. Voeg profiel-specifieke Zod-schema's toe.
- Role-aware nav: zet `enabled: true` voor de nieuwe schermen in `src/lib/nav.ts`.

### Stappen
1. **Registratie met rolkeuze** (FREELANCER/CLIENT). Wachtwoord-hash via bcrypt,
   server-side Zod-validatie, e-mailverificatie vóórbereiden (veld `emailVerified` bestaat).
   Bij registratie meteen een leeg `FreelancerProfile`/`Company` aanmaken.
2. **FreelancerProfile bewerken:** headline, bio, skills, branches, tarief, beschikbaarheid,
   locatie, werkmodus, talen, KvK/BTW optioneel. Skills/branches via de join-tabellen.
3. **Company-profiel bewerken:** naam, logo (storage-abstractie), branche, omschrijving,
   website, locatie.
4. **Profiel-compleetheidsindicator:** server-berekend (pure functie + test), opslaan in
   `FreelancerProfile.completeness`. Progressieve onboarding stuurt op ontbrekende velden.
5. **Publiek ZZP-profiel** (read-only) dat `visibility` respecteert (PRIVATE = niet zichtbaar
   voor anderen; server-side afdwingen, niet client-side verbergen).
6. **Tests:** profiel-validatie (Zod), compleetheidsberekening, zichtbaarheidsregels.

### Definition of Done (deze sessie)
- [ ] Registratie met rolkeuze werkt; profiel/bedrijf wordt aangemaakt
- [ ] Freelancer- en Company-profiel bewerkbaar via beschermde routes (ownership afgedwongen)
- [ ] Compleetheid server-berekend + getoond; publiek profiel respecteert zichtbaarheid
- [ ] `npm run typecheck` + `npm run lint` + `npm run test` + `npm run build` groen
- [ ] Loading/error/empty-states aanwezig; flow doorgeklikt
- [ ] Commit gedaan, PROGRESS.md bijgewerkt, CURRENT_TASK.md naar Sessie 2

### Niet nu doen
Geen opdrachten-CRUD, reacties, documenten/credentials-UI of admin-schermen (latere sessies).
Echte e-mailverzending is mensenwerk/infra — alleen voorbereiden, niet koppelen.

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
