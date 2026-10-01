# Application decision reminder scan — scope claim

Synthetic SQLite reproduces that 500 non-due VIEWED applications (the previous `SCAN_LIMIT`) push a later eligible day-14 decision reminder out of the single scan, so the client is never nudged and the talent goes cold. The 499-row control still delivers exactly once. A separate case with 501 due applications sharing one `createdAt` proves the page boundary needs the `id` tie-breaker: without it a row is skipped or counted twice.

Scope: stable cursor pagination in `src/lib/application-decision-reminders-task.ts` (ordered `[createdAt asc, id asc]`, plan→dedupe→apply per page, stop on a short page) plus a real-SQLite regression test. Robustness/bug only — no schema, config, planner or UI change. The planner (`application-decision-reminders.ts`), eligibility windows (VIEWED day 14/21, SHORTLIST day 21/28 via `applicationDecisionDays [0,7]`), DomainEvent dedupe keys, `/kandidaten` recipient and atomic event/notification/audit effects are preserved. Mirrors the invoice/performance/dispute/submission reminder sweep (#1529–1534).

Status: claimed before implementation in an empty commit / draft #1542. Paginated traversal now reaches every open application. Verified red against the old capped code: the 500/501 reachability cases and the shared-`createdAt` boundary case fail, the 499 control passes; all pass after the fix. Independent review and all six protected checks remain required.

Limitations: synthetic SQLite establishes the missing-window regression, not production prevalence or PostgreSQL concurrency. The change bounds application pages; effects stay atomic per reminder and dedupe behavior is unchanged.
