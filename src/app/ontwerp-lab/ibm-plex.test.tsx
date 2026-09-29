import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import postcss from "postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () =>
  Object.fromEntries(
    [
      "Inter",
      "Geist",
      "Sora",
      "Figtree",
      "Fraunces",
      "Manrope",
      "Schibsted_Grotesk",
      "Plus_Jakarta_Sans",
      "Space_Grotesk",
      "DM_Sans",
    ].map((name) => [name, () => ({ variable: "other-font" })]),
  ),
);
import OntwerpLabLayout from "./layout";

const require = createRequire(import.meta.url);
const cssnano = require("next/dist/compiled/cssnano-simple");
const stylesheet = readFileSync(resolve("src/app/ontwerp-lab/ibm-plex.css"), "utf8");
const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
// Frozen from the successful pre-change build, after relocating URLs and canonicalizing 0.00% to 0%.
const previousFacesHash = "4f39b0950dfa29fdce7ddb525225dce22e07a2ccecf8b32faaeeb8d8a2b12c79";
const assets = {
  "26d4368bf94c0ec4-s.p.woff2": "056e4e2459f57a0033c8c9c844ff19d6e42ac8602027803d4345823bcc939818",
  "2801417b65625cf5-s.woff2": "ae1d854fefa1167a79071f1afe01d4d51b60c5840c1be36dd74bd5fe7375b405",
  "28793f5c5e3d822d-s.woff2": "5bac72520e0a9a5669e08b15fa1e15be6f4da74aa0b2d4315a97c11e1465120a",
  "7b19b489dc6743ba-s.woff2": "c01b3de8c8058462caadd044a6b874a9f4d7098d7d71d6c70e6a278096b8640e",
  "b3bf17a9041d9433-s.woff2": "526a4dd36c3af41f73a623e852302d8947d7fd4c00ee3026d82ef1f24a412fcd",
  "c9c3823090ec8b55-s.woff2": "a29d4e6345cdb7e2b6daabf4961a6dcafcbc7ed1eac26186ca4a004cd32d64d8",
};

describe("preserved IBM Plex Sans build assets", () => {
  it("compiles to the previous twenty-four faces and exact fallback declarations", async () => {
    const compiled = await postcss([cssnano({ colormin: false }, postcss)]).process(stylesheet, {
      from: undefined,
    });
    const faces = compiled.css.match(/@font-face\{[^{}]*\}/g) ?? [];
    expect(faces).toHaveLength(25);
    expect(sha256(faces.join("\n"))).toBe(previousFacesHash);
    const referenced = [...compiled.css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
    expect(new Set(referenced)).toEqual(
      new Set(Object.keys(assets).map((name) => `/fonts/ibm-plex-sans/${name}`)),
    );
    expect(compiled.css).toContain('--font-plex:"IBM Plex Sans","IBM Plex Sans Fallback"');
  });

  it.each(Object.entries(assets))(
    "keeps %s byte-identical to the successful build",
    (name, hash) => {
      const bytes = readFileSync(resolve("public/fonts/ibm-plex-sans", name));
      expect(bytes.subarray(0, 4).toString()).toBe("wOF2");
      expect(sha256(bytes)).toBe(hash);
    },
  );

  it("renders only the Latin font preload with matching CORS and variable scope", () => {
    const html = renderToStaticMarkup(
      <OntwerpLabLayout>
        <span>Sample</span>
      </OntwerpLabLayout>,
    );
    const preloads = html.match(/<link[^>]+>/g) ?? [];
    expect(preloads).toHaveLength(1);
    expect(preloads[0]).toContain('href="/fonts/ibm-plex-sans/26d4368bf94c0ec4-s.p.woff2"');
    expect(preloads[0]).toContain('as="font"');
    expect(preloads[0]).toContain('crossorigin="anonymous"');
    expect(html).toContain('class="lab-plex ');
    expect(readFileSync(resolve("src/app/ontwerp-lab/layout.tsx"), "utf8")).not.toContain(
      "IBM_Plex_Sans",
    );
  });

  it("retains the pinned upstream license", () => {
    expect(sha256(readFileSync(resolve("public/fonts/ibm-plex-sans/OFL.txt")))).toBe(
      "7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da",
    );
  });
});
