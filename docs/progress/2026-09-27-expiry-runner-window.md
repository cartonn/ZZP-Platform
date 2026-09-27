# Expiry runner candidate window — 27 September 2026

## Claim and evidence

The 16:22 UTC audit reproduced a delayed reminder in Europe/Amsterdam: at
2026-03-10T12:00:00Z, a verified credential expiring exactly 720 hours later is
accepted by the planner but excluded by the runner's local-calendar query bound
(719 hours across spring DST). One hour later it becomes eligible; this is not
permanent notification loss or evidence of a production incident.

Scope: exact-duration upper bound in `src/lib/expiry-task.ts`, expiry-aware
regressions in its existing test harness, and these progress documents. Preserve
candidate cap/order, transaction guards, replacement suppression, expired status
transitions and reminder deduplication. No scheduler, schema, UI or review controls.
PR #1524 corrected a read helper; this separate runner query was unchanged.

## Validation plan

Run actual task regressions in Europe/Amsterdam and UTC for both DST directions,
exact boundaries, later eligibility and deduplication. Run full lint, types, unit
suite, production build and formatting; independent review and actual CI follow.

## Implementation and focused evidence

Draft #1525 claimed on scope-only commit `cedff326`, before implementation.
The candidate query now uses 30 × 86,400,000 milliseconds, matching the planner.
The existing mocked task suite now honors the expiresAt query filter and adds ten
cases across explicitly set/restored Amsterdam and UTC zones. Offset assertions
ensure the DST cases actually exercise a changed offset, also on UTC CI hosts.
Spring/autumn/summer exact-boundary reminders and one-millisecond-later eligibility
check actual notifications, reminder markers and repeated-run suppression.

With old source restored temporarily, a UTC-launched regression run reports two
spring failures and 20 passing cases. Fixed focused suites: 32 passing tests in
both Amsterdam-launched and UTC-launched processes. Existing expired transitions
and replacement coverage remain in the same harness. This is a mocked Prisma
functional test, not a database concurrency or candidate-cap proof.

Full lint and types pass. Full suite: 861 suites passed, two skipped;
9,137 tests passed, three skipped. Full formatting passed. Sandbox build could not
resolve existing Google Fonts imports; network-enabled build passed.
Independent review and actual CI still follow.
No merge or live claim.
