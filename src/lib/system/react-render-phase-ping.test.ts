import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Regressiepoort voor issue #329 (server-action-respons "hangt" in een productiebuild).
//
// Wortel: de React-canary die Next 15.5.x meebundelt (19.2.0-canary-0bdb9206-20250818) laat in
// `pingSuspendedRoot` een ping vallen die tijdens de render-fase binnenkomt terwijl de root al op
// `RootSuspendedWithDelay` staat. Een flight-chunk in `resolved_model`-toestand lost zijn `then()`
// synchroon op, dus die ping komt precies dán. De lane wordt daarna als "suspended + warm" gemarkeerd
// zonder ping-listener en zonder geplande render: `useActionState` blijft eeuwig op pending
// ("Bezig…") en `revalidatePath` bereikt de UI nooit. Upstream is dit in een latere canary
// (19.3.0-canary, meegebundeld met Next 16.3) gerepareerd door de ping in dat pad wél in
// `workInProgressRootPingedLanes` te zetten. Die eenregelige fix is hier als patch teruggezet
// (patches/next+15.5.24.patch, toegepast via patch-package in postinstall).
//
// Deze test bewaakt dat de geïnstalleerde, gebundelde React die fix bevat — ook na een Next-upgrade
// waarbij de patch niet meer past of niet meer nodig is. Zie docs/decisions/0012.

const require = createRequire(import.meta.url);
const compiledReactDom =
  path.dirname(require.resolve("next/package.json")) + "/dist/compiled/react-dom/cjs";

const BUILDS = [
  {
    file: "react-dom-client.production.js",
    // Buggy: `? 0 === (executionContext & 2) && prepareFreshStack(root, 0)` — de ping in de render-fase
    // valt in het niets. Gefixt: de else-tak zet de lane in workInProgressRootPingedLanes.
    fixed:
      /\?\s*0 === \(executionContext & 2\)\s*\?\s*prepareFreshStack\(root, 0\)\s*:\s*\(workInProgressRootPingedLanes \|= pingedLanes\)/,
    buggy: /\?\s*0 === \(executionContext & 2\) && prepareFreshStack\(root, 0\)\s*:/,
  },
  {
    file: "react-dom-client.development.js",
    fixed:
      /\?\s*\(executionContext & RenderContext\) === NoContext\s*\?\s*prepareFreshStack\(root, 0\)\s*:\s*\(workInProgressRootPingedLanes \|= pingedLanes\)/,
    buggy:
      /\?\s*\(executionContext & RenderContext\) === NoContext &&\s*prepareFreshStack\(root, 0\)\s*:/,
  },
];

describe("React-bundel in Next: ping tijdens render-fase gaat niet verloren (#329)", () => {
  for (const build of BUILDS) {
    it(`${build.file} bevat de render-fase-ping-fix in pingSuspendedRoot`, () => {
      const source = readFileSync(path.join(compiledReactDom, build.file), "utf8");
      const start = source.indexOf("function pingSuspendedRoot(");
      expect(
        start,
        "pingSuspendedRoot ontbreekt — React-bundel ingrijpend veranderd; herbeoordeel de patch",
      ).toBeGreaterThan(-1);
      const body = source.slice(start, start + 2500);
      expect(
        body,
        "buggy pad aanwezig: de patch uit patches/ is niet toegepast (draai `npx patch-package`)",
      ).not.toMatch(build.buggy);
      expect(
        body,
        "fix-pad ontbreekt: React-bundel gewijzigd zonder dat de render-fase-ping is geborgd",
      ).toMatch(build.fixed);
    });
  }
});
