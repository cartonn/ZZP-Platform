# Cormorant Garamond — preserved build assets

These five unmodified WOFF2 files were recovered from the successful local build
for PR #1525 (`c6f50fe2`, Next 15.5.24), `.next/static/media`. The corresponding
emitted stylesheet was `c51de29492c5119b.css`. They are the existing generated
assets, **not** byte-identical downloads from the current Google Fonts endpoint.
Normal style, four exposed weights (400/500/600/700), five unicode subsets,
Times New Roman fallback metrics and Latin-only preload are preserved.

The upstream family identifies itself as Cormorant Garamond revision 4.001,
normal variable axis 300–700. On 2026-09-27, fontTools 4.66.0 comparison against
Google Fonts v21 found identical glyph order, Unicode maps, outline, variation
and advance tables (glyf/gvar/avar/fvar/HVAR/hmtx), plus GDEF, GSUB, OS/2, STAT,
cmap, gasp, hhea, loca, maxp, name and post. Differences: head checksum,
redundant zero GPOS adjustments and a newly added upstream prep scan-conversion
program. New upstream bytes therefore do not establish pixel equality. Retaining
these exact historical bytes avoids changing that program. The historical
upstream download revision has not been established.

## Asset hashes and comparison sources

| Subset       | File                       | SHA256                                                             | Bytes | Current comparison URL                                                                          |
| ------------ | -------------------------- | ------------------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------- |
| cyrillic-ext | 393d45a2251e223a-s.woff2   | `d04439363ec805132dc6c6e6a925f76efe17646f9811af8e10e218ea3dba5335` | 23408 | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpHtKgS4.woff2 |
| cyrillic     | 8715d2ed531152f4-s.woff2   | `d81372bae1f872f1418c0b7eb412f8a92a156a950fda8d2383701c75d38969df` | 21132 | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYrXtKgS4.woff2 |
| vietnamese   | c48b38fe8bb532f3-s.woff2   | `826f73ca737feec0eb1004808629973d6b611fddc2bd2a689b5fe331f6be6427` | 11264 | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpntKgS4.woff2 |
| latin-ext    | 48410f3df60da620-s.woff2   | `9dc38267bdee93a653200ef3c1e8060e3f1399073432c415c683b419d3b50464` | 33740 | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYp3tKgS4.woff2 |
| latin        | 7b89a4fd5e90ede0-s.p.woff2 | `5d618c462b7a5b74f442e1548880086af71764d9cc7d35c16ab45353da934621` | 37776 | https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2    |

## License

Copyright and SIL Open Font License 1.1 are retained in `OFL.txt`, pinned from
https://raw.githubusercontent.com/google/fonts/6a386aadc0a33dd3d810b833d9c5105345cbb0e6/ofl/cormorantgaramond/OFL.txt.
SHA256: `60700d351cac4650c51f3f9db318d2a420f8b45052dba2715eb5fec41f0f6956`.
The fonts themselves have not been modified or renamed internally.

Only this family no longer requires a build-time network request. Other historical
font families still use the Google loader; this is not an offline application build.
