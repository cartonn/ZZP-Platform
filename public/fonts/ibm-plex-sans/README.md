# IBM Plex Sans — preserved build assets

These six unmodified WOFF2 files were recovered from the successful local build
for PR #1531 (`70de1dac`, Next 15.5.24), `.next/static/media`. The emitted
stylesheet was `7d380c4de552db6b.css`. They preserve the actual existing build output;
no equivalence to a new upstream download or screenshot is claimed. The exact
historical Google download URLs and revision have not been established.

Normal style, four exposed weights (400/500/600/700), six unicode subsets,
Arial fallback metrics and Latin-only preload are retained. The 24 font faces
and one fallback declaration match the prior emitted CSS after relocating only
asset URLs and canonicalizing `0.00%` to `0%`. Their canonical SHA256 is
`4f39b0950dfa29fdce7ddb525225dce22e07a2ccecf8b32faaeeb8d8a2b12c79`.

| File                       | SHA256                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| 26d4368bf94c0ec4-s.p.woff2 | `056e4e2459f57a0033c8c9c844ff19d6e42ac8602027803d4345823bcc939818` |
| 2801417b65625cf5-s.woff2   | `ae1d854fefa1167a79071f1afe01d4d51b60c5840c1be36dd74bd5fe7375b405` |
| 28793f5c5e3d822d-s.woff2   | `5bac72520e0a9a5669e08b15fa1e15be6f4da74aa0b2d4315a97c11e1465120a` |
| 7b19b489dc6743ba-s.woff2   | `c01b3de8c8058462caadd044a6b874a9f4d7098d7d71d6c70e6a278096b8640e` |
| b3bf17a9041d9433-s.woff2   | `526a4dd36c3af41f73a623e852302d8947d7fd4c00ee3026d82ef1f24a412fcd` |
| c9c3823090ec8b55-s.woff2   | `a29d4e6345cdb7e2b6daabf4961a6dcafcbc7ed1eac26186ca4a004cd32d64d8` |

## License

Original IBM copyright and SIL Open Font License 1.1 are retained in `OFL.txt`,
pinned from https://raw.githubusercontent.com/google/fonts/6a386aadc0a33dd3d810b833d9c5105345cbb0e6/ofl/ibmplexsans/OFL.txt.
License SHA256: `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da`.
Files have not been modified or renamed internally.

Only IBM Plex Sans no longer needs a build-time font request. Other historical
fonts still use the Google loader; this is not an offline full application build.
