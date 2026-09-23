# Open Sans source

`open-sans-latin.woff2` is the locally hosted Open Sans font used by the Handslag
V5 platform. A separate read-only comparison on 11 September 2026 at 10:02:50 UTC
confirmed that it is byte-for-byte identical to the
[official Google Fonts download](https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2).

- Font size: 42,964 bytes.
- Font SHA-256: `441af0def989ebfdbd6ad85ffaed85e967ab21a05f1dd342f16259464a206dd0`.
- Included license: [SIL Open Font License](OFL.txt), 4,389 bytes.
- License SHA-256: `fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602`.
- License matches [the pinned upstream copy](https://github.com/google/fonts/blob/8e44913e4ff26fc997e6856c1ec40ff4791c98c5/ofl/opensans/OFL.txt).

The font is bundled at build time through `next/font/local`; visitors do not
request this typeface from Google. These hashes record source identity, not an
independent approval of the application.

## JetBrains Mono source

`jetbrains-mono-latin.woff2` is the Latin normal variable JetBrains Mono font used for
platform figures through `--font-mono`. It was downloaded without modification
on 23 September 2026 from the
[official Google Fonts asset](https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwE.woff2),
identified by the Latin face in the
[Google Fonts stylesheet](https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap).

- License upstream revision: `19371302b95d218af43299bce79ddbddd0bc364d`.
- Font size: 40,404 bytes.
- Font SHA-256: `18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e`.
- Included license: [SIL Open Font License](jetbrains-mono-OFL.txt), 4,399 bytes.
- License SHA-256: `a76abf002c49097d146e86740a3105a5d00450b1592e820a1109a8c5680cd697`.
- License source: [the same upstream revision](https://github.com/JetBrains/JetBrainsMono/blob/19371302b95d218af43299bce79ddbddd0bc364d/OFL.txt).

The bundled Next.js font parser identifies the asset as `JetBrains Mono`,
`Regular`, with a `wght` axis of 100–800 and default 400. The root layout retains
normal style, variable weights 100–800, swap display and preload. Open Sans is
unchanged. The font contains 394 glyphs covering 230 code points, including digits, the euro
sign and common Dutch accented letters. Its character set and default glyph
outlines/advance widths match the previously generated Latin asset inspected
locally (40,480 bytes); the files are not byte-for-byte identical. The 40,404-byte
WOFF2 replaces the initial 300,144-byte full TTF to avoid increasing the root
preload size. Other script subsets are not bundled by this root declaration.

Next.js 15.5.24 computes Arial fallback metrics from the local asset. These differ
from its Google-font metrics: ascent 77.57% versus 75.79%, descent 22.82% versus
22.29%, and size-adjust 131.49% versus 134.59%; line-gap remains 0%. The previous
values were also checked against an existing generated stylesheet. This change
preserves the loaded font family and weight range, but does not claim identical
layout while fallback text is displayed.

The root font no longer requires a Google Fonts request during builds. Legacy
`ontwerp` and `ontwerp-lab` layouts still use Google font loading, so this bounded
change does not make the complete application build independent of Google Fonts.
