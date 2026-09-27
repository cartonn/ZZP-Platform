# Preserve Cormorant assets during builds

Scope claimed before implementation on main `9d0efc188c5782f4e484f6340c188e73981b2338`.

Repeated CI build failures in the Google Cormorant loader occur before browser tests
(PR #1525 postmerge shard 2 is the latest example). The Docker builder also compiles
this route before runtime source cleanup. Bundle the exact five font files recovered
from the successful preceding build, preserving all twenty faces, unicode ranges,
fallback metrics and Latin-only preload. No other family or design changes.

Boundaries: ontwerp layout and route-local stylesheet, five public font assets with
license/provenance, focused regression coverage and progress documentation.
Local validation passes; independent review and GitHub checks are pending. No merge or release claimed.

## Implementation

Draft #1526 claimed in `5df51a13` before changes. Route-local CSS now exposes the
same twenty normal faces and fallback metrics, with a Latin-only CORS preload.
Five recovered WOFF2 files are byte-identical to the previous successful build.
Pinned OFL license and explicit provenance limitations accompany the assets.

Eight focused tests pass: the compiled face declarations match the prior emitted
CSS after URL relocation and equivalent zero-percentage formatting; asset hashes,
WOFF2 signatures, rendered preload/scope, and license hash are checked. An isolated
PostCSS/cssnano compilation and local asset-resolution probe also passes with all
network access denied by the OS. This does not establish an offline full build:
other existing font families still fetch during compilation. No local server or
browser was started. Lint and typecheck pass; 9,145 full-suite tests pass (3 existing skips; 862 suites
pass, 2 skipped). Full formatting passes. Initial sandbox build cannot resolve
remaining Google font hosts; the subsequent network-enabled production build passes.
Independent review and GitHub checks remain separate gates.

The full Next compilation emits `1072afe2ea3a877a.css`: all 21 face declarations
match the previous emitted CSS after only relocating asset URLs and canonicalizing
`0.00%` to `0%`. The resulting SHA256 is
`810ff881114371f593241c50ac61ba01f9cebcafd5d92f7643464585d96710fb`.
No screenshot/pixel-equivalence claim is made; the original binary data and loading
properties are retained. All production build stages completed successfully.
