# DBA detail threshold parity

Claim: the 04:22 UTC build audit on 30 September reproduced a disagreement after
an administrator saves valid duration thresholds of 3/9 months. An April 15
assessment of a January 1 collaboration is VERHOOGD in the configured monitor
and overview, but LAAG on the detail page, which omits those thresholds. The
same omission suppresses the March 15 forecast. Synthetic evidence is recorded
in the coordinator audit; no production configuration was changed.

Scope: load existing server configuration once after detail authorization and
pass it to both existing assessment and forecast functions. Preserve all labels,
disclaimers, status and ownership gates, revenue semantics and V5 design.
Files: collaboration detail page and a focused regression test, plus progress.
No threshold values, integrations or legal policy changes.

Implementation: one configuration read after authorization supplies both duration
assessment and forecast. Actual async page tests retain the real configuration
loader and DBA engines with a synthetic database fixture. They cover a saved
3/9-month signal, the upcoming 3-month crossing, missing-row defaults, and
nonparticipant denial before the configuration read. Full suite: 9,195 tests
passed, three existing skips; 870 suites passed and two skipped. Lint passed.
Independent review, GitHub CI and production verification remain separate gates.
