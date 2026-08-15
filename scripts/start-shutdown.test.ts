import { describe, it, expect, afterEach } from "vitest";
import { spawn } from "node:child_process";
import { readFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Integratietest voor de kern van het drain-mechanisme: een AFSLUITSIGNAAL (SIGUSR2) moet
// daadwerkelijk het proces bereiken dat de handler registreert. Dit gebruikt een ECHTE
// `child_process.spawn` + een ECHT OS-signaal (geen nep-`on()`), precies het integratiepad dat de
// unit-tests van `registerDrainSignal` bewust niet raken.
//
// Achtergrond (waarom `start.mjs` Next direct spawnt i.p.v. via npx): de npm/npx-wrapper heeft geen
// SIGUSR2-handler en wordt door Node's default-dispositie beëindigd i.p.v. het signaal door te sturen.
// Een DIRECT ge-spawnd node-proces met een geregistreerde handler ontvangt SIGUSR2 wél. Deze test
// borgt die eigenschap zodat een regressie (terug naar een wrapper die het signaal opslokt) opvalt.

const tmpFiles: string[] = [];

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    try {
      rmSync(f, { force: true });
    } catch {
      // opruimen mag de test niet laten falen
    }
  }
});

/**
 * Spawnt een node-kind dat op SIGUSR2 een vlagbestand schrijft en met code 0 afsluit; ontvangt het
 * binnen het venster géén signaal, dan sluit het met code 1. Zodra het kind "READY" print sturen we
 * het SIGUSR2 — exact zoals `start.mjs` `server.kill("SIGUSR2")` naar het (direct ge-spawnde) Next-
 * proces stuurt. Resolvet met { code, drained }.
 */
function spawnDirectAndSignal(): Promise<{ code: number | null; drained: boolean }> {
  const flag = join(mkdtempSync(join(tmpdir(), "drain-")), "flag.txt");
  tmpFiles.push(flag);
  const script = `
    const fs = require('node:fs');
    process.on('SIGUSR2', () => { fs.writeFileSync(${JSON.stringify(flag)}, 'draining'); process.exit(0); });
    setTimeout(() => process.exit(1), 8000);
    console.log('READY');
  `;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["-e", script], { stdio: ["ignore", "pipe", "ignore"] });
    let signalled = false;
    child.stdout.on("data", (chunk: Buffer) => {
      if (!signalled && chunk.toString().includes("READY")) {
        signalled = true;
        child.kill("SIGUSR2");
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      resolve({ code, drained: existsSync(flag) && readFileSync(flag, "utf8") === "draining" });
    });
  });
}

describe("drain-signaal-levering (echte spawn + echt SIGUSR2)", () => {
  it("een DIRECT ge-spawnd node-kind ontvangt SIGUSR2 en flipt zijn drain-vlag", async () => {
    const { code, drained } = await spawnDirectAndSignal();
    expect(drained).toBe(true);
    expect(code).toBe(0);
  }, 15000);
});

describe("start.mjs spawnt Next direct (regressie-guard tegen de npx-wrapper)", () => {
  const src = readFileSync(join(process.cwd(), "scripts/start.mjs"), "utf8");

  it("spawnt de Next-server via het node-binary op de resolved next-bin, niet via npx", () => {
    expect(src).toContain("spawn(process.execPath, [nextBin");
    expect(src).toContain('require.resolve("next/dist/bin/next")');
  });

  it("spawnt de Next-server niet via npx (de wrapper slokt SIGUSR2 op)", () => {
    // De prisma-seed mag wél via npx (kortlevend, geen signaal-afhankelijkheid); alleen de
    // langlopende Next-server die drain-signalen moet ontvangen mag niet achter de npx-wrapper zitten.
    expect(src).not.toMatch(/spawn\(\s*["']npx["']\s*,\s*\[\s*["']next["']/);
  });
});
