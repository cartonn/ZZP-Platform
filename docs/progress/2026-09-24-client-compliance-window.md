# Client dashboard credential alert window

Build slot 24 September 2026 16:22 UTC. Base `2e9a9928`, PR #1520.

Actual DashboardPage and canonical clientCredentialAlerts on isolated SQLite disagreed
for 201 ACTIVE own collaborations: 200 without credential requirements occupied the
dashboard window; the remaining collaboration missing VOG was omitted. Canonical helper
filters required credential jobs before its 200 limit and returned the alert.

Shared `clientCredentialAlertQuery` now supplies the existing canonical filter,
ordering, include and 200-row bound to both loaders. Dashboard fetch remains in its
parallel batch. Company, ACTIVE and undisputed constraints remain unchanged.

An actual-page SQLite regression failed before the fix and passed afterwards. Its 205
synthetic collaborations cover irrelevant rows, oldest-first ordering, foreign company,
disputed and completed exclusions. Canonical loader and dashboard now return the same
two missing-VOG alerts. No production data, browser or local server used.

36 targeted tests pass. Full validation: 9,090 tests passed, three skipped; lint,
types and formatting pass. Sandbox build could not fetch historical lab Google fonts;
the network-enabled build passed. Independent review, CI and release follow separately.
