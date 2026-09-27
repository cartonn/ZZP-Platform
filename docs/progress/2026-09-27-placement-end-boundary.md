# Exact placement-end credential boundary

Claim for 27 September 08:22 UTC build slot, base5b889d75.
Real helper/task/dashboard/dossier reproduction: a verified required VOG expires
exactly at placement end in60days. Freelancer gets a renewal task while client
assessment and dossier show no concern. One parity regression fails, three controls
pass. Original1404 used strict expiry before placement end;1472 introduced inclusive
max-cutoff behavior.

Scope: restore strict placement-end boundary beyond the existing inclusive30-day
window, with boundary/multiple-placement regressions. No new policy or design.
Separate from pending1521 database selection and merged1522 wording.
Implementation restores the original strict placement-end comparison while keeping
calendar-window expiry inclusive. Credential selection, permanent coverage and
stable grouping/deduplication are unchanged.

Validation: 12 boundary tests produced three failures before the fix (exact end,
mixed placement grouping, later verified replacement) and all pass afterwards.
The other controls cover one millisecond before/after, inclusive day 30 with a short,
equal or null endpoint, missing endpoint, unverified replacement fallback and
permanent coverage. Four focused suites: 88 tests passed. Full formatting passed.
Full lint and typecheck passed; 9,114 tests passed (3 skipped), across 860 passing
suites (2 skipped). The sandbox build could not fetch existing Google Fonts;
production build with network access passed. Logs: routine-1523-red.log,
routine-1523-focused.log, routine-1523-check.log, routine-1523-format.log and
routine-1523-build-network.log in the coordinator workspace.
Independent/native review, GitHub CI and release remain pending.
