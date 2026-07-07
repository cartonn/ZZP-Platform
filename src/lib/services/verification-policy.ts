// Fail-closed poort tegen "mock-verificatie op echte data" (security-review 2026-07-07, KRITIEK).
//
// De ingebouwde demo-verifiers (`source === "MOCK"` in diploma-/big-/identity-verifier) stempelen een
// FORMAAT-geldige maar mogelijk verzonnen DUO-code, BIG-nummer of juridische naam direct als
// geverifieerd — het hoogste vertrouwenssignaal. Dat signaal opent bovendien de plaatsingspoort:
// `computeCompliance`/`complianceBlocksPlacement` behandelt `Credential.status === "VERIFIED"` als
// grondwaarheid en laat het tekenen van een contract voor een BIG-/diploma-plichtige (zorg)opdracht toe.
// Een neppe-maar-format-geldige credential zou zo een echte plaatsingspoort passeren (Wkkgz-relevant).
//
// Buiten productie (dev/test/e2e) en op een expliciet gemarkeerde demo-dataset (`SEED_DEMO=true`) is de
// demo-verifier prima. Maar op een échte productie-deploy met echte diploma's/VOG mag de mock NOOIT stil
// als "Geverifieerd" gelden: daar is hij standaard GEBLOKKEERD (fail-closed). Een bewuste pilot die tóch
// met de demo-verifier wil draaien, zet `ALLOW_MOCK_VERIFICATION=true` — dan is de keuze zichtbaar en
// geaudit, niet per omissie. De echte koppelingen (`DIPLOMA_VERIFIER=duo` / `BIG_VERIFIER=bigregister` /
// `IDENTITY_VERIFIER=idin`) leveren `source !== "MOCK"` en passeren deze poort altijd.
//
// Pure functies (leunen alleen op de meegegeven env-map) → los unit-getest, geen DB/IO.

type EnvLike = { NODE_ENV?: string; SEED_DEMO?: string; ALLOW_MOCK_VERIFICATION?: string };

/**
 * Mag een demo-/mock-verificatieresultaat een credential/identiteit als geverifieerd stempelen?
 * - Buiten productie (`NODE_ENV !== "production"`): ja (dev/test/e2e).
 * - Productie mét expliciete demo-dataset (`SEED_DEMO=true`): ja (het is aantoonbaar geen echte data).
 * - Productie met expliciete opt-in (`ALLOW_MOCK_VERIFICATION=true`): ja (bewuste pilotkeuze).
 * - Anders (echte productie-data, geen opt-in): NEE — fail closed.
 */
export function isMockVerificationAllowed(env: EnvLike = process.env): boolean {
  if (env.NODE_ENV !== "production") return true;
  if (env.SEED_DEMO === "true") return true;
  return env.ALLOW_MOCK_VERIFICATION === "true";
}

/**
 * Moet dit verificatieresultaat worden geweigerd omdat het een niet-vertrouwde demo-verificatie op
 * echte productie-data is? True → de aanroeper stempelt NIET VERIFIED en geeft de gebruiker de
 * handmatige-controle-route (admin-verificatiequeue). Een echt registerresultaat (`source !== "MOCK"`)
 * wordt nooit geblokkeerd.
 */
export function mockVerificationBlocked(source: string, env: EnvLike = process.env): boolean {
  return source === "MOCK" && !isMockVerificationAllowed(env);
}

/** Nette, niet-lekkende boodschap wanneer de fail-closed poort een demo-verificatie weigert. */
export const MOCK_VERIFICATION_BLOCKED_MESSAGE =
  "Automatische verificatie is momenteel niet beschikbaar. Dien je bewijsstuk in voor handmatige controle door een beheerder.";
