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

Status: claimed before implementation; tests, independent review and CI pending.
