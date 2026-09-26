# Freelancer credential impact window (#1521)

Build slot 24 September 2026, 20:22 UTC. Base `112a6473`.

Actual isolated SQLite loader reproduction: 200 active collaborations without required
credentials consume the whole window, hiding a later required VOG placement.
`getActiveCollaborationRequirements` returns no rows and `linkExpiryToInzet` reports zero
impacted placements; removing one irrelevant row from ACTIVE reveals it. The certificate
page uses this loader directly and hides the impact card when no rows remain.

The query now filters required-credential placements before its existing 200-row bound
and orders by createdAt/id ascending. Freelancer ownership, ACTIVE status and existing
dispute semantics remain unchanged. No design or placement-policy change.

Two actual SQLite regressions fail before the fix and pass afterward. They cover the
irrelevant-row window, owner/status/optional-requirement boundaries, existing inclusion
of disputed placements, deterministic ordering and the unchanged 200-row cap.
The database uses synthetic data only, is isolated in a temporary directory and removed
after testing. Four focused suites pass with 62 tests, zero skips.

Recovery check 26 September: saved full-suite output confirms 9,092 passing tests
(3 skips), lint/typecheck and full formatting passed. The network-enabled build log
reaches the completed route table after successful compilation. The two SQLite
regressions were rerun successfully during recovery. Independent/native reviews,
GitHub CI on the implementation commit, merge and live verification remain pending.
