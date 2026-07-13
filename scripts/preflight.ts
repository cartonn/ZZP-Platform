// Go-live preflight-CLI: `npm run preflight` (via tsx).
//
// Draait de al-gevalideerde runtime-env-validatie (src/lib/env.ts → validateEnv) plus de
// configuratie-posture (src/lib/system-status.ts → collectSystemStatus) BUITEN de app, zodat de
// operator vóór/tijdens de deploy (bv. `railway run npm run preflight`) of in CI een duidelijk
// GO/NO-GO-oordeel krijgt — zonder een draaiende server + admin-login. Hergebruikt de bestaande
// geteste logica (geen nieuwe bron van waarheid) en toont nooit sleutelwaarden.
//
// Vlaggen:
//   --strict   aandachtspunten/boot-waarschuwingen laten de preflight falen (exit 1). Zonder
//              --strict zijn ze adviserend (exit 0). Handig als go-live-poort in CI.
//   --json     geef een machineleesbaar JSON-rapport i.p.v. tekst.
//
// Exitcodes: 0 = ok · 1 = aandacht in --strict · 2 = ongeldige/ontbrekende basisconfig.

import { validateEnv } from "../src/lib/env";
import { collectSystemStatus } from "../src/lib/system-status";
import { buildPreflightReport, decideVerdict, invalidReport } from "../src/lib/ops/preflight";

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const json = argv.includes("--json");

  // validateEnv() werpt bij een harde fout (ontbrekende/zwakke basisconfig of een half-geactiveerde
  // integratie). Dat is precies wat de boot zou tegenhouden — hier vangen we het als NO-GO i.p.v. te
  // crashen, zodat de operator een net rapport ziet.
  let status: ReturnType<typeof collectSystemStatus>;
  try {
    // validateEnv logt zijn eigen boot-waarschuwingen naar stderr; in --json onderdrukken we die
    // ruis zodat stdout puur JSON blijft.
    const restore = json ? silenceConsoleWarn() : null;
    const env = validateEnv();
    restore?.();
    status = collectSystemStatus(env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const report = invalidReport(message);
    if (json) {
      process.stdout.write(
        JSON.stringify({ verdict: report.verdict, exitCode: report.exitCode, message }, null, 2) +
          "\n",
      );
    } else {
      process.stderr.write(report.lines.join("\n") + "\n");
    }
    process.exit(report.exitCode);
    return;
  }

  if (json) {
    const { verdict, exitCode } = decideVerdict(status, { strict });
    process.stdout.write(
      JSON.stringify(
        {
          verdict,
          exitCode,
          production: status.production,
          strict,
          counts: status.counts,
          warnings: status.warnings,
          groups: status.groups,
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(exitCode);
    return;
  }

  const report = buildPreflightReport(status, { strict });
  process.stdout.write(report.lines.join("\n") + "\n");
  process.exit(report.exitCode);
}

/** Dempt console.warn tijdelijk (voor --json, zodat validateEnv's boot-waarschuwingen stdout/stderr niet vervuilen). Geeft een restore-functie terug. */
function silenceConsoleWarn(): () => void {
  const original = console.warn;
  console.warn = () => {};
  return () => {
    console.warn = original;
  };
}

main();
