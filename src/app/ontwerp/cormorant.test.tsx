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
      "Geist_Mono",
      "Fraunces",
      "JetBrains_Mono",
      "Plus_Jakarta_Sans",
      "Space_Grotesk",
      "Sora",
      "Manrope",
      "Instrument_Serif",
      "Bricolage_Grotesque",
      "Newsreader",
      "Spline_Sans_Mono",
      "Libre_Franklin",
      "IBM_Plex_Mono",
      "Anton",
      "Architects_Daughter",
      "Special_Elite",
      "Shippori_Mincho",
      "Silkscreen",
      "Baloo_2",
      "Space_Mono",
    ].map((name) => [name, () => ({ variable: "other-font" })]),
  ),
);
import OntwerpLabLayout from "./layout";

const require = createRequire(import.meta.url);
const cssnano = require("next/dist/compiled/cssnano-simple");
const stylesheet = readFileSync(resolve("src/app/ontwerp/cormorant.css"), "utf8");
const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
// Frozen from the successful pre-change build, after relocating URLs and canonicalizing 0.00% to 0%.
const previousFacesHash = "810ff881114371f593241c50ac61ba01f9cebcafd5d92f7643464585d96710fb";
const assets = {
  "393d45a2251e223a-s.woff2": "d04439363ec805132dc6c6e6a925f76efe17646f9811af8e10e218ea3dba5335",
  "8715d2ed531152f4-s.woff2": "d81372bae1f872f1418c0b7eb412f8a92a156a950fda8d2383701c75d38969df",
  "c48b38fe8bb532f3-s.woff2": "826f73ca737feec0eb1004808629973d6b611fddc2bd2a689b5fe331f6be6427",
  "48410f3df60da620-s.woff2": "9dc38267bdee93a653200ef3c1e8060e3f1399073432c415c683b419d3b50464",
  "7b89a4fd5e90ede0-s.p.woff2": "5d618c462b7a5b74f442e1548880086af71764d9cc7d35c16ab45353da934621",
};

describe("preserved Cormorant build assets", () => {
  it("compiles to the previous twenty faces and exact fallback declarations", async () => {
    const compiled = await postcss([cssnano({ colormin: false }, postcss)]).process(stylesheet, {
      from: undefined,
    });
    const faces = compiled.css.match(/@font-face\{[^{}]*\}/g) ?? [];
    expect(faces).toHaveLength(21);
    expect(sha256(faces.join("\n"))).toBe(previousFacesHash);
    const referenced = [...compiled.css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
    expect(new Set(referenced)).toEqual(
      new Set(Object.keys(assets).map((name) => `/fonts/cormorant-garamond/${name}`)),
    );
    expect(compiled.css).toContain(
      '--font-lab-cormorant:"Cormorant Garamond","Cormorant Garamond Fallback"',
    );
  });

  it.each(Object.entries(assets))(
    "keeps %s byte-identical to the successful build",
    (name, hash) => {
      const bytes = readFileSync(resolve("public/fonts/cormorant-garamond", name));
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
    expect(preloads[0]).toContain('href="/fonts/cormorant-garamond/7b89a4fd5e90ede0-s.p.woff2"');
    expect(preloads[0]).toContain('as="font"');
    expect(preloads[0]).toContain('crossorigin="anonymous"');
    expect(html).toContain('class="lab-cormorant ');
    expect(readFileSync(resolve("src/app/ontwerp/layout.tsx"), "utf8")).not.toContain(
      "Cormorant_Garamond",
    );
  });

  it("retains the pinned upstream license", () => {
    expect(sha256(readFileSync(resolve("public/fonts/cormorant-garamond/OFL.txt")))).toBe(
      "60700d351cac4650c51f3f9db318d2a420f8b45052dba2715eb5fec41f0f6956",
    );
  });
});
