# Zelf-verificatie (DUO/BIG) weigert een al verlopen certificaat — 6 oktober 2026 (#1574)

## Defect

Het zelf-verificatiepad voor certificaten (`verifyCredentialViaDuo` / `verifyCredentialViaBig` in
`src/app/(protected)/certificaten/actions.ts`) zette een bewijsstuk op `VERIFIED` zonder te controleren
of `expiresAt` al verstreken was. Het admin-beslispad doet dat wél, op twee plekken:

- `src/app/(protected)/admin/verificaties/actions.ts` — de transactionele `updateMany`-WHERE draagt
  `OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]`.
- `src/lib/credential-review.ts` — weigert met "Dit bewijsstuk is verlopen. Vraag eerst een geldig
  document." zodra `expiresAt <= now`.

De regel staat expliciet in `src/lib/verification-expiry.ts`: een reeds verlopen inzending goedkeuren is
"verspilde beoordeling en een compliance-gat … Het correcte antwoord is afwijzen."

`expiresAt` is vrije invoer op het certificaatformulier en staat los van de externe DUO/BIG-respons (die
valideert het register/de code, niet de zelf-ingevoerde vervaldatum). Daardoor kon een ZZP'er met een
geldig BIG-nummer / geldige DUO-code en een al verstreken `expiresAt` een VERIFIED-maar-verlopen
certificaat minten — direct ongeldig (`isExpired`) en door de eerstvolgende `runExpiryTask` naar `EXPIRED`
geklapt. Ook kon `EXPIRED → (zelf-verifieer) → VERIFIED` met een ongewijzigde, verstreken `expiresAt` de
"vernieuw met een nieuwe vervaldatum"-flow kortsluiten.

## Fix

Defense-in-depth, dezelfde regel als het admin-pad:

1. **Snapshot-guard in beide callers** (na de bestaande type-/status-checks, vóór de externe call): een al
   verlopen bewijsstuk geeft meteen de nette gebruikersfout en verbruikt geen rate-limited netwerkpoging.
   Gedeelde helper `isCredentialAlreadyExpired` (null/undefined-veilig, zelfde grens `<= now` als `isExpired`).
2. **Transactionele write gehard**: `applyExternalVerification` draagt nu dezelfde
   `OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]`-clausule naast de bestaande `id + status`-guard,
   zodat een expiry die tussen snapshot en write verstrijkt (TOCTOU-race) 0 rijen matcht →
   `StaleCredentialError` → rollback (geen VERIFIED-verlopen rij).

Geen schemawijziging; geen gedragswijziging voor bewijsstukken zonder vervaldatum of met een toekomstige
vervaldatum.

## Tests

- Nieuw: `src/app/(protected)/certificaten/verify-expired-guard.test.ts` — BIG en DUO met een verstreken
  `expiresAt` → fout `/verlopen/i`, geen `$transaction`/verificatie-record/audit; positieve controles met
  een toekomstige vervaldatum (write draagt de expiry-OR-clausule) en zonder vervaldatum.
- Aangepast: `verify-toctou.test.ts` — de twee `where`-asserties gebruiken nu `objectContaining` zodat de
  bijkomende expiry-OR-clausule de compound-guard-intentie niet breekt.

## Validatie

`npm run typecheck`, `npm run lint`, `npm run test` (9248 geslaagd, 3 bestaande skips) en
`npx prettier --check .` groen; productiebuild groen. Onafhankelijke review en CI-poort volgen.
