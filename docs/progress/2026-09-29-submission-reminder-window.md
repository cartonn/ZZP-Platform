# Open-hours submission reminder scan — scope claim

Synthetic SQLite reproduces that 1,000 silent ACTIVE/SIGNED collaborations exclude a later eligible day-7 submission reminder. The 999-row control delivers exactly once. The coordinator independently reproduced the boundary on main `83f13af64c5f71dab8be774330dae46ebbe100ba`.

Scope: stable bounded ID traversal in `src/lib/performance-submission-reminders-task.ts`, real SQLite regression coverage and existing mock compatibility. Preserve selector, latest approved HOURS anchor, open-submission suppression, configured stages, dedupe keys, actual freelancer recipient and atomic event/notification/audit effects. No new functionality, schema or UI change. Independent review and all protected checks remain required.

Status: claimed before implementation. Validation and release are pending.
