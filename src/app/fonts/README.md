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
