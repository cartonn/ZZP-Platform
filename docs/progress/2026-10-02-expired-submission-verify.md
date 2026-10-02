# Eerlijke weigering bij verifiëren van een reeds verlopen inzending (2026-10-02)

**Rol & waarde:** ADMIN (verificatie-beoordelaar), indirect de ZZP'er. Kern-scope:
certificaat-verificatie (CLAUDE.md §Verificatieflow).

## Probleem (bewezen in code vóór herstel)

Een inzending met een `expiresAt` in het verleden is een **bereikbare** staat: `credentialSchema`
(`src/lib/validation.ts`) accepteert een vervaldatum in het verleden — de enige refine is
`expiresAt >= issuedAt`. Zo'n SUBMITTED-credential komt dus normaal in de wachtrij
`/admin/verificaties`.

De wachtrij toont al een rood **"Reeds verlopen"**-badge (page.tsx, via
`submittedExpiryLabel`), maar twee oppervlakken liepen niet mee:

1. **Server — misleidende melding.** `verifyCredential`
   (`src/app/(protected)/admin/verificaties/actions.ts`) filtert een verlopen credential uit de
   transactionele `updateMany`-`WHERE` (`OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]`).
   Bij `res.count === 0` gooit hij de generieke melding _"Deze aanvraag is al beoordeeld of
   intussen gewijzigd. Open de aanvraag opnieuw."_ — feitelijk onjuist voor de verlopen-staat. De
   beoordelaar kan "iemand anders besliste zojuist" niet onderscheiden van "dit document is
   verlopen en kan nooit worden goedgekeurd".
2. **UI — knop blijft actief.** `CredentialReviewForm` kreeg `expiresAt` niet, dus "Goedkeuren"
   was niet uitgeschakeld voor een verlopen inzending; de beoordelaar liep in een dead-end.

## Fix

1. **Server pre-check** in `verifyCredential`: vóór de transactie weigeren met een accurate,
   afwijzing-sturende melding wanneer `classifySubmittedExpiry(credential.expiresAt, now) ===
"expired"`. `from` is daar altijd `SUBMITTED` (anders gooit `statusForDecision` eerder). De
   bestaande transactionele race-guard (`gt: now`) blijft staan voor de smalle race waarin het
   bewijsstuk pas ná de lezing verloopt.
2. **Gedeelde wording** in `src/lib/verification-expiry.ts`: `expiredSubmissionMessage(type)` —
   VOG-bewust (herbeoordelingsdatum i.p.v. echte vervaldatum). Eén bron voor zowel de
   server-weigering als de UI-uitleg.
3. **UI**: `CredentialReviewForm` krijgt een `expired`-prop; "Goedkeuren" is dan uitgeschakeld
   (Afwijzen blijft actief) met een inline uitleg — spiegelt het bestaande `!documentId`-patroon en
   de badge. `page.tsx` geeft `expired` door via dezelfde `classifySubmittedExpiry`.

Hergebruikt de bestaande `classifySubmittedExpiry` — geen nieuwe rekenlogica, geen schemawijziging.

## Tests

- `src/lib/verification-expiry.test.ts`: `expiredSubmissionMessage` voor VOG (herbeoordelingsdatum,
  "verstreken") en niet-VOG ("verlopen", "wijs het af", "vernieuwd document"); nooit de generieke
  "al beoordeeld"-tekst.
- `src/app/(protected)/admin/verificaties/actions-state.test.ts`: een verlopen SUBMITTED-inzending
  (niet-VOG én VOG) levert de accurate melding, niet de race-melding, en raakt `$transaction` niet
  aan. De bestaande race-test (count 0 → "al beoordeeld") blijft groen.

## Poorten

Typecheck, lint (geen waarschuwingen), gerichte tests en de volledige unit-suite groen; prettier
schoon; productiebuild groen. Onafhankelijke review en de zes CI-poorten volgen op de PR.
