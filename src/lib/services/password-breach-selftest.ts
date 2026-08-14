// Connectiviteitszelftest voor de gelekt-wachtwoord-controle (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de MODUS van de controle (`hibp`/`noop`), maar bewijst niet dat de
// HIBP "Pwned Passwords"-koppeling écht bereikbaar is én daadwerkelijk detecteert. Dat onderscheid
// is hier extra kritisch: de controle draait bewust **fail-open** (password-breach.ts) — valt HIBP
// stil weg (netwerkfout, time-out, non-200, gewijzigd antwoord-contract), dan laat de caller élk
// gekozen wachtwoord TOE (`skipped: true`) zónder dat iets dat toont. Dat is precies de stille
// faalmodus die de rate-limit-store- en upload-scanner-zelftests ook afvangen ("nodig omdat de
// store fail-open is"). Vóór go-live wil een beheerder ná het zetten van `PASSWORD_BREACH_CHECK=hibp`
// kunnen bevestigen: doet de controle het, en herkent hij een bekend-gelekt wachtwoord?
//
// Deze module is de tegenhanger van de opslag-/mail-/rate-limit-/verificatie-/betaal-/upload-scanner-
// zelftests: puur en injecteerbaar (een spec in, een rapport uit; geen I/O-globals, geen klok) zodat
// het deterministisch te testen is. De aanroeper (server-actie) levert een `run()` die een
// **bekend-gelekt test-wachtwoord** daadwerkelijk door de geconfigureerde controle haalt — het HIBP-
// equivalent van de EICAR-testprobe bij de virusscanner.
//
// Kernonderscheid: draait de controle nog op de demo (`noop`), dan is er niets externs om te testen
// en meldt de zelftest dat eerlijk (geen vals groen). Een HIBP-koppeling die bereikbaar is maar het
// bekend-gelekte test-wachtwoord NIET herkent (`breached: false`), is geen succes: dat wijst op een
// gewijzigd/kapot antwoord-contract en telt als fout. Een `skipped`-uitkomst betekent dat de
// controle fail-open terugviel — bereikbaarheid niet bewezen → fout.
//
// Geen secrets/PII in de uitvoer: alleen korte, niet-gevoelige toelichtingen + de driver-modus. Het
// test-wachtwoord is een publiek, notoir gelekt patroon — geen gebruikersgegeven — en verlaat de
// server sowieso nooit heel (HIBP is k-anoniem: alleen de eerste 5 SHA-1-tekens gaan de deur uit).

import type { PasswordBreachResult } from "@/lib/services/password-breach";

/** Actieve modus van de controle. Alleen `hibp` doet een echte round-trip; `noop` = niets te testen. */
export type PasswordBreachDriverMode = "noop" | "hibp";

/**
 * Een publiek, notoir gelekt wachtwoord dat gegarandeerd in de HIBP "Pwned Passwords"-lijst staat
 * (miljoenen keren). Dient als deterministische, onschadelijke probe — het HIBP-equivalent van de
 * EICAR-testprobe: als de koppeling werkt, MOET dit als gelekt terugkomen. Het is geen echt
 * gebruikerswachtwoord en wordt nergens opgeslagen.
 */
export const BREACH_PROBE_PASSWORD = "password";

/** Te testen controle. `run` (controleert het probe-wachtwoord) wordt alleen aangeroepen wanneer `active`. */
export interface PasswordBreachProbeSpec {
  active: boolean; // PASSWORD_BREACH_CHECK=hibp
  driverMode: PasswordBreachDriverMode;
  run?: () => Promise<PasswordBreachResult>;
}

/** Uitkomst van de zelftest. */
export interface PasswordBreachSelfTestReport {
  ok: boolean;
  active: boolean; // Draait er een echte controle? Zo niet: niets getest (geen vals groen).
  driverMode: PasswordBreachDriverMode;
  detail?: string; // Korte, niet-gevoelige toelichting.
}

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting: uitsluitend de error-NAAM, nooit
 * een rauw bericht dat een host/endpoint zou kunnen bevatten. `HibpPasswordBreachChecker.check` werpt
 * bewust nooit (fail-open → `skipped`), dus dit is een defensief vangnet.
 */
export function safePasswordBreachDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait de controle op de demo (`noop`, inactief), dan wordt dat eerlijk als
 * "niets getest" gerapporteerd (ok, met uitleg). Een actieve controle draait zijn `run()` in try/catch:
 * - `breached: true`  → succes: bereikbaar én het bekend-gelekte test-wachtwoord werd herkend.
 * - `breached: false` → fout: bereikbaar, maar detectie faalde (gewijzigd/kapot antwoord-contract).
 * - `skipped: true`   → fout: de controle viel fail-open terug (netwerk/time-out/ongeldig antwoord);
 *                        bereikbaarheid is niet bewezen en nieuwe wachtwoorden worden nu niet gecheckt.
 */
export async function runPasswordBreachSelfTest(
  spec: PasswordBreachProbeSpec,
): Promise<PasswordBreachSelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode };

  if (!spec.active) {
    return {
      ...base,
      ok: true,
      detail: "Geen gelekt-wachtwoord-controle actief (noop) — er is niets getest.",
    };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar." };
  }

  try {
    const result = await spec.run();
    if (result.skipped) {
      return {
        ...base,
        ok: false,
        detail:
          "Niet bereikbaar — de controle viel fail-open terug (netwerkfout, time-out of ongeldig antwoord). Nieuwe wachtwoorden worden nu NIET tegen datalekken gecontroleerd.",
      };
    }
    if (result.breached) {
      return {
        ...base,
        ok: true,
        detail: "Bereikbaar en detecteert — het bekend-gelekte test-wachtwoord werd herkend.",
      };
    }
    return {
      ...base,
      ok: false,
      detail:
        "Bereikbaar, maar het bekend-gelekte test-wachtwoord werd NIET herkend — controleer de HIBP-koppeling (mogelijk gewijzigd antwoord-contract).",
    };
  } catch (error) {
    return { ...base, ok: false, detail: safePasswordBreachDetail(error) };
  }
}
