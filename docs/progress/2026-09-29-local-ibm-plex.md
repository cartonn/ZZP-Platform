# Build reliability: existing IBM Plex Sans

Claim before implementation, build slot12:22UTC, base117a012d.
Production deployment52f855b1 failed in next/font Google loader (null reading1).
Complete filtered webpack error identifies IBM_Plex_Sans in ontwerp-lab/layout.tsx,
normal weights400/500/600/700, latin preload, variable--font-plex. A retry succeeded,
so production is healthy; the external font dependency remains a proven build risk.

Scope: bundle the existing font locally with source/license provenance and preserve
weights, faces, subset preload, fallback metrics and CSS variable behavior. Match
existing successful emitted font/CSS evidence where available. No redesign, new
lab feature, other fonts or deployment configuration change.

Required: targeted typography/loader verification, full checks and independent review
plus all six genuine GitHub gates. Implementation/review/release not yet complete.

## Implementation

Draft #1532 claimed in `51f2c0bc` before implementation. Six unmodified WOFF2
files recovered from the successful #1531 local build (`70de1dac`) replace only
the IBM Plex Sans Google loader. Route-scoped CSS retains 24 normal faces,
weights 400/500/600/700, six subsets, exact Arial fallback metrics, the --font-plex
variable and Latin-only CORS preload. The pinned original IBM OFL and provenance
limitations accompany the assets. No historical upstream URL or pixel-equivalence
claim is made.

Nine focused tests compare canonicalized emitted faces against the old build,
binary hashes/signatures, rendered scope/preload and the license hash. The entire
suite passes: 9,180 tests, 3 existing skips; 867 suites pass, 2 skipped. Lint passes.
Production build, full formatting and separate typecheck pass. Independent
review, GitHub checks, merge and live verification remain separate gates.

The actual Next build emits `4e1b141c09e08cd9.css`; all 25 font-face declarations
match the previous emitted CSS after only URL relocation and equivalent zero
percentage formatting. SHA256:
`4f39b0950dfa29fdce7ddb525225dce22e07a2ccecf8b32faaeeb8d8a2b12c79`.
No local server or browser was started. Other unchanged Google fonts retried after
TLS fetch interruptions during the successful build; this is not an offline build.
