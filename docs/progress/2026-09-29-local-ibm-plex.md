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
