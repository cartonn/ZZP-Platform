# Credential reminder queue reachability

Claimed before implementation on 29 September 2026, build slot 08:22 UTC, PR #1531.
Base: `224d6504b04a2f99ad623baf2dcaf202fe73fb43`.

An actual SQLite runner reproduction missed a certificate reminder behind 2,000
already-reminded VERIFIED credentials within 30 days. The 1,999 control passed;
2,000 failed on first and repeated runs, with no notification or dedup marker for
the new candidate. The lead independently reproduced one PASS and one FAIL.

The runner now traverses pages of at most 2,000 candidates in stable expiry/id
order. All pages share a frozen reference time and exact reminder window. It
continues after a page that produces no effects. Full per-profile VERIFIED
coverage, including permanent/later coverage outside the window, remains loaded
for each page. Planner, deduplication and guarded status transitions are unchanged.

Effects are atomic **per page**, not across the whole run. If a later page fails,
earlier committed pages remain; a later run retries using the existing status and
reminder markers. Total runtime depends on the queue size. This is not a database
snapshot across pages and does not introduce new concurrency guarantees.

Six real SQLite cases cover 1,999/2,000/4,001 already-reminded rows, equal expiry
timestamps, a fully coverage-suppressed page with profile isolation, and 2,001
expiry transitions without offset skips. Repeated runs verify idempotence. With
three existing expiry suites: 51 tests pass. Full suite: 9,171 tests pass, three
existing skips; 866 suites pass and two skip. Types, lint and formatting pass.
The initial strict typecheck found a test environment-object annotation issue,
corrected to NodeJS.ProcessEnv; no runtime change. The sandbox build could not
download existing design-lab fonts; the network-enabled production build passed.

No schema, role, design, legal or external integration changes. PR #1521 placement
selection and previous date-boundary fixes remain separate. No production writes,
browser run or PostgreSQL concurrency stress test. Independent review, GitHub
checks, merge and release remain separate gates.
