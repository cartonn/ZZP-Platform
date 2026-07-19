// Connectiviteitszelftest voor de malware-scanner (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de scanner-MODUS (`clamav`/`noop`), maar bewijst niet dat een geconfigureerde
// clamd-daemon écht bereikbaar is én daadwerkelijk detecteert. Dat onderscheid is hier extra kritisch:
// de upload-keten draait standaard **fail-closed** (upload-scanner.ts) — een stille misconfiguratie (host
// onbereikbaar, of een clamd met een lege/kapotte virusdatabase die alles als "clean" doorlaat) blokkeert
// dan óf elke upload, óf laat besmette bestanden ongemerkt door. Vóór go-live wil een beheerder dit ná het
// opstarten van de daemon kunnen bevestigen: doet de scan het, en herkent hij een bekend virus?
//
// Deze module is de tegenhanger van de betaal-/opslag-/e-mail-/rate-limit-/verificatie-zelftests: puur en
// injecteerbaar (een spec in, een rapport uit; geen I/O-globals, geen klok) zodat het deterministisch te
// testen is. De aanroeper (server-actie) levert een `run()` die de EICAR-testprobe daadwerkelijk door de
// geconfigureerde scanner haalt — een onschadelijk maar universeel herkend testpatroon.
//
// Kernonderscheid: draait de upload-scan nog op de demo (`noop`), dan is er niets externs om te testen en
// meldt de zelftest dat eerlijk (geen vals groen). Een clamd die bereikbaar is maar het EICAR-virus NIET
// herkent, is geen succes: dat wijst op ontbrekende virusdefinities en telt als fout.
//
// Geen secrets in de uitvoer: alleen korte, niet-gevoelige toelichtingen. Voor een onverwachte fout
// uitsluitend de error-NAAM — nooit een rauw bericht dat een host/endpoint zou kunnen bevatten.

import type { UploadScanResult } from "@/lib/services/upload-scanner";

/** Actieve scanner-modus. Alleen `clamav` doet een echte scan; `noop` = niets te testen. */
export type UploadScannerDriverMode = "noop" | "clamav";

/** Te testen scanner. `run` (scant de EICAR-probe) wordt alleen aangeroepen wanneer `active`. */
export interface UploadScannerProbeSpec {
  active: boolean; // UPLOAD_SCANNER=clamav
  driverMode: UploadScannerDriverMode;
  failOpen: boolean; // UPLOAD_SCAN_FAIL_OPEN — puur informatief in het rapport
  run?: () => Promise<UploadScanResult>;
}

/** Uitkomst van de zelftest. */
export interface UploadScannerSelfTestReport {
  ok: boolean;
  active: boolean; // Draait er een echte scanner? Zo niet: niets getest (geen vals groen).
  driverMode: UploadScannerDriverMode;
  failOpen: boolean;
  detail?: string; // Korte, niet-gevoelige toelichting.
}

/**
 * Het standaard EICAR-antivirus-testbestand: een onschadelijk, door élke virusscanner herkend testpatroon
 * (het is geen echt virus). Bewust uit fragmenten samengesteld en pas at-runtime samengevoegd, zodat het
 * bronbestand zelf niet door een on-host scanner wordt gemarkeerd.
 */
export function eicarProbeBuffer(): Buffer {
  const parts = [
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}",
    "$EICAR-STANDARD-",
    "ANTIVIRUS-TEST-FILE!",
    "$H+H*",
  ];
  return Buffer.from(parts.join(""), "ascii");
}

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting: uitsluitend de error-NAAM, nooit een
 * rauw bericht dat een host/endpoint zou kunnen bevatten. Tegenhanger van `safeBillingDetail`, maar hier is
 * er geen aparte connectiviteits-foutklasse, dus altijd de naam.
 */
export function safeUploadScannerDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit. Draait de upload-scan op de demo (`noop`, inactief), dan wordt dat eerlijk als
 * "niets getest" gerapporteerd (ok, met uitleg). Een actieve scanner draait zijn `run()` in try/catch — een
 * netwerk-/time-outfout wordt een veilige `detail`, nooit een throw naar buiten. Een "clean"-verdict op de
 * EICAR-probe is expliciet géén succes: dat verraadt ontbrekende virusdefinities.
 */
export async function runUploadScannerSelfTest(
  spec: UploadScannerProbeSpec,
): Promise<UploadScannerSelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode, failOpen: spec.failOpen };

  if (!spec.active) {
    return { ...base, ok: true, detail: "Geen scanner actief (noop) — er is niets getest." };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar." };
  }

  try {
    const result = await spec.run();
    switch (result.verdict) {
      case "infected":
        return {
          ...base,
          ok: true,
          detail: "Bereikbaar en detecteert — het EICAR-testvirus werd herkend.",
        };
      case "clean":
        return {
          ...base,
          ok: false,
          detail:
            "Bereikbaar, maar het EICAR-testvirus werd NIET herkend — controleer de virusdefinities van de clamd-daemon.",
        };
      case "error":
        return { ...base, ok: false, detail: result.message ?? "Scanner gaf een foutrespons." };
      case "skipped":
        return { ...base, ok: false, detail: "Scan onverwacht overgeslagen." };
      default:
        return { ...base, ok: false, detail: "Onbekende uitkomst." };
    }
  } catch (error) {
    return { ...base, ok: false, detail: safeUploadScannerDetail(error) };
  }
}
