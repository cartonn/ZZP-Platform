# Preserve Cormorant assets during builds

Scope claimed before implementation on main `9d0efc188c5782f4e484f6340c188e73981b2338`.

Repeated CI build failures in the Google Cormorant loader occur before browser tests
(PR #1525 postmerge shard 2 is the latest example). The Docker builder also compiles
this route before runtime source cleanup. Bundle the exact five font files recovered
from the successful preceding build, preserving all twenty faces, unicode ranges,
fallback metrics and Latin-only preload. No other family or design changes.

Boundaries: ontwerp layout and route-local stylesheet, five public font assets with
license/provenance, focused regression coverage and progress documentation.
Validation and independent review are pending. No merge or release claimed.
