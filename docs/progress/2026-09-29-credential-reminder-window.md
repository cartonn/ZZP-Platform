# Credential reminder queue reachability

Claim before implementation, 29 September 2026, build slot08:22UTC.
Base224d6504b04a2f99ad623baf2dcaf202fe73fb43.

Actual SQLite runner reproduces a missed certificate reminder behind2000 already-reminded
VERIFIED credentials within30days. Control1999 passes;2000 fails on first and repeated
runs, with no notification or dedup marker for the new candidate. Lead reproduced
one PASS/one FAIL independently. Existing59focusedtests pass.

Scope: stable bounded traversal of expiry candidates, preserving frozen now, exact
window, per-profile coverage, planner, dedup, statusguards and atomic effects per batch.
Files: src/lib/expiry-task.ts and focused runner/window tests; this scope and progress.
No schema, roles, design, legal or external integration change. PR1521 placement
selection and previous date-boundary fixes remain separate.

Validation/review/release pending. A reproduced bug is not a completed fix.
