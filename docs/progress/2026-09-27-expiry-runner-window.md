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

Status: scope claimed before implementation; no implementation or validation claim.
